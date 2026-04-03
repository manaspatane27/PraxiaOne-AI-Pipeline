"""
Celery tasks for chronic disease management
- Risk calculation
- Alert generation
- Metric indexing
- Timeline updates
"""

from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
import logging
from datetime import timedelta
import json

from .models import (
    ChronicDisease,
    DiseaseMetric,
    RiskAssessment,
    AlertRule,
    CareGoal,
    DiseaseTimeline,
)

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def calculate_disease_risk(self, disease_id):
    """
    Calculate AI risk score for a chronic disease
    Uses latest metrics to generate risk assessment
    """
    try:
        disease = ChronicDisease.objects.get(id=disease_id)
        
        # Get latest metrics for risk calculation
        latest_metrics = DiseaseMetric.objects.filter(
            disease=disease
        ).order_by('-measured_at')[:10]
        
        if not latest_metrics:
            logger.warning(f"No metrics found for disease {disease_id}")
            return {"status": "no_metrics"}
        
        # Calculate risk based on disease type and metrics
        risk_score = _compute_risk_score(disease, latest_metrics)
        risk_level = _determine_risk_level(risk_score)
        
        # Get contributing factors
        contributing_factors = _extract_factors(disease, latest_metrics)
        
        # Create or update risk assessment
        assessment = RiskAssessment.objects.filter(disease=disease).order_by('-created_at').first()
        
        if assessment and (timezone.now() - assessment.created_at).days < 7:
            # Update existing assessment if less than 7 days old
            assessment.risk_score = risk_score
            assessment.risk_level = risk_level
            assessment.contributing_factors = contributing_factors
            assessment.recommendations = _generate_recommendations(disease, risk_level)
            assessment.save()
        else:
            # Create new assessment
            RiskAssessment.objects.create(
                disease=disease,
                risk_score=risk_score,
                risk_level=risk_level,
                contributing_factors=contributing_factors,
                recommendations=_generate_recommendations(disease, risk_level),
            )
        
        # Update disease risk score
        disease.risk_score = risk_score
        disease.save()
        
        logger.info(f"Risk calculated for disease {disease_id}: {risk_score}")
        return {
            "status": "success",
            "disease_id": disease_id,
            "risk_score": risk_score,
            "risk_level": risk_level,
        }
        
    except ChronicDisease.DoesNotExist:
        logger.error(f"Disease {disease_id} not found")
        return {"status": "not_found"}
    except Exception as exc:
        logger.error(f"Error calculating risk: {str(exc)}")
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3)
def check_alert_rules(self, disease_id):
    """
    Check all alert rules for a disease
    Triggers alerts if thresholds exceeded
    """
    try:
        disease = ChronicDisease.objects.get(id=disease_id)
        
        # Get all active alert rules
        alert_rules = AlertRule.objects.filter(
            disease=disease,
            is_active=True
        )
        
        triggered_alerts = []
        
        for rule in alert_rules:
            # Get latest metric for this metric type
            latest_metric = DiseaseMetric.objects.filter(
                disease=disease,
                metric_type=rule.metric_type
            ).order_by('-measured_at').first()
            
            if not latest_metric:
                continue
            
            # Check thresholds
            value = latest_metric.value
            is_triggered = False
            
            if rule.threshold_min is not None and value < rule.threshold_min:
                is_triggered = True
            elif rule.threshold_max is not None and value > rule.threshold_max:
                is_triggered = True
            
            if is_triggered:
                triggered_alerts.append({
                    "rule_id": rule.id,
                    "metric_type": rule.metric_type,
                    "value": value,
                    "threshold_min": rule.threshold_min,
                    "threshold_max": rule.threshold_max,
                    "severity": rule.severity,
                })
                
                # Send alert notification
                _send_alert_notification(disease.user, rule, latest_metric)
                
                # Log timeline event
                DiseaseTimeline.objects.create(
                    disease=disease,
                    event_type='alert',
                    event_title=f"Alert: {rule.alert_type} detected",
                    event_description=f"{rule.metric_type} = {value} (threshold: {rule.threshold_min}-{rule.threshold_max})",
                    impact_level=rule.severity,
                )
        
        logger.info(f"Checked {alert_rules.count()} rules for disease {disease_id}, triggered {len(triggered_alerts)}")
        return {
            "status": "success",
            "disease_id": disease_id,
            "total_rules": alert_rules.count(),
            "triggered_alerts": len(triggered_alerts),
            "alerts": triggered_alerts,
        }
        
    except ChronicDisease.DoesNotExist:
        logger.error(f"Disease {disease_id} not found")
        return {"status": "not_found"}
    except Exception as exc:
        logger.error(f"Error checking alerts: {str(exc)}")
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3)
def update_care_goals_progress(self, disease_id):
    """
    Update care goals progress based on latest metrics
    Mark goals as achieved when thresholds met
    """
    try:
        disease = ChronicDisease.objects.get(id=disease_id)
        
        # Get all active care goals
        care_goals = CareGoal.objects.filter(
            disease=disease,
            status='in_progress'
        )
        
        updated_goals = []
        
        for goal in care_goals:
            # Get latest metric for this goal
            latest_metric = DiseaseMetric.objects.filter(
                disease=disease,
                metric_type=goal.metric_type
            ).order_by('-measured_at').first()
            
            if not latest_metric:
                continue
            
            # Update current value
            goal.current_value = latest_metric.value
            
            # Check if goal is achieved
            if _is_goal_achieved(goal, latest_metric.value):
                goal.status = 'achieved'
                goal.achieved_date = timezone.now()
                
                # Log timeline event
                DiseaseTimeline.objects.create(
                    disease=disease,
                    event_type='achievement',
                    event_title=f"Goal Achieved: {goal.goal_title}",
                    event_description=f"Successfully reached target of {goal.target_value}",
                    impact_level='positive',
                )
            else:
                # Calculate progress percentage
                progress = _calculate_goal_progress(goal, latest_metric.value)
                goal.progress_percentage = progress
            
            goal.save()
            updated_goals.append({
                "goal_id": goal.id,
                "status": goal.status,
                "progress": goal.progress_percentage if goal.status == 'in_progress' else 100,
            })
        
        logger.info(f"Updated {len(updated_goals)} care goals for disease {disease_id}")
        return {
            "status": "success",
            "disease_id": disease_id,
            "updated_goals": updated_goals,
        }
        
    except ChronicDisease.DoesNotExist:
        logger.error(f"Disease {disease_id} not found")
        return {"status": "not_found"}
    except Exception as exc:
        logger.error(f"Error updating care goals: {str(exc)}")
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3)
def index_disease_metrics(self, disease_id):
    """
    Index disease metrics for vector search (Qdrant)
    Enables AI similarity search and insights
    """
    try:
        from praxia_ai.embeddings import get_embedding_model
        from praxia_ai.qdrant_client import get_qdrant_client
        
        disease = ChronicDisease.objects.get(id=disease_id)
        
        # Get all metrics from last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        metrics = DiseaseMetric.objects.filter(
            disease=disease,
            measured_at__gte=thirty_days_ago
        )
        
        if metrics.count() == 0:
            logger.warning(f"No metrics found for indexing for disease {disease_id}")
            return {"status": "no_metrics"}
        
        # Get embedding model
        embedding_model = get_embedding_model()
        qdrant_client = get_qdrant_client()
        
        indexed_count = 0
        
        for metric in metrics:
            # Create text representation of metric
            metric_text = f"{disease.disease_name} {metric.metric_type} {metric.value} {metric.unit} measured at {metric.measured_at}"
            
            # Generate embedding
            embedding = embedding_model.encode(metric_text).tolist()
            
            # Store in Qdrant
            try:
                qdrant_client.upsert(
                    collection_name="praxiaone_health_memory",
                    points=[{
                        "id": hash(f"{disease_id}_{metric.id}") % (10**8),
                        "vector": embedding,
                        "payload": {
                            "disease_id": disease_id,
                            "metric_id": metric.id,
                            "metric_type": metric.metric_type,
                            "value": metric.value,
                            "measured_at": metric.measured_at.isoformat(),
                        }
                    }]
                )
                indexed_count += 1
            except Exception as e:
                logger.warning(f"Failed to index metric {metric.id}: {str(e)}")
        
        logger.info(f"Indexed {indexed_count} metrics for disease {disease_id}")
        return {
            "status": "success",
            "disease_id": disease_id,
            "indexed_count": indexed_count,
        }
        
    except ChronicDisease.DoesNotExist:
        logger.error(f"Disease {disease_id} not found")
        return {"status": "not_found"}
    except Exception as exc:
        logger.error(f"Error indexing metrics: {str(exc)}")
        raise self.retry(exc=exc, countdown=60)


@shared_task
def periodic_risk_calculation():
    """
    Periodic task: Calculate risk for all active diseases
    Runs every 6 hours
    """
    active_diseases = ChronicDisease.objects.filter(is_active=True)
    
    for disease in active_diseases:
        calculate_disease_risk.apply_async(args=[disease.id])
    
    logger.info(f"Queued risk calculations for {active_diseases.count()} diseases")
    return {"status": "queued", "count": active_diseases.count()}


@shared_task
def periodic_alert_check():
    """
    Periodic task: Check alert rules for all active diseases
    Runs every hour
    """
    active_diseases = ChronicDisease.objects.filter(is_active=True)
    
    for disease in active_diseases:
        check_alert_rules.apply_async(args=[disease.id])
    
    logger.info(f"Queued alert checks for {active_diseases.count()} diseases")
    return {"status": "queued", "count": active_diseases.count()}


@shared_task
def periodic_goal_update():
    """
    Periodic task: Update care goals progress
    Runs every 12 hours
    """
    active_diseases = ChronicDisease.objects.filter(is_active=True)
    
    for disease in active_diseases:
        update_care_goals_progress.apply_async(args=[disease.id])
    
    logger.info(f"Queued goal updates for {active_diseases.count()} diseases")
    return {"status": "queued", "count": active_diseases.count()}


# ==================== HELPER FUNCTIONS ====================

def _compute_risk_score(disease, metrics):
    """
    Compute risk score based on disease type and metrics
    Returns float 0-100
    """
    base_score = 20  # Start at 20
    
    # Disease-specific risk calculations
    if disease.disease_type == 'type2_diabetes':
        # HbA1c is the main indicator
        hba1c_metric = next((m for m in metrics if m.metric_type == 'hba1c'), None)
        if hba1c_metric:
            if hba1c_metric.value < 7:
                base_score += 10
            elif hba1c_metric.value < 8:
                base_score += 30
            elif hba1c_metric.value < 9:
                base_score += 45
            else:
                base_score += 65
    
    elif disease.disease_type == 'hypertension':
        # Blood pressure is key
        systolic = next((m for m in metrics if m.metric_type == 'systolic_bp'), None)
        if systolic:
            if systolic.value < 130:
                base_score += 15
            elif systolic.value < 140:
                base_score += 35
            elif systolic.value < 160:
                base_score += 50
            else:
                base_score += 70
    
    elif disease.disease_type == 'coronary_artery_disease':
        # LDL cholesterol focus
        ldl = next((m for m in metrics if m.metric_type == 'ldl_cholesterol'), None)
        if ldl:
            if ldl.value < 100:
                base_score += 15
            elif ldl.value < 130:
                base_score += 40
            elif ldl.value < 160:
                base_score += 55
            else:
                base_score += 75
    
    # Adjust by severity
    severity_multiplier = {
        'mild': 0.8,
        'moderate': 1.0,
        'severe': 1.3,
        'critical': 1.6,
    }
    
    base_score = base_score * severity_multiplier.get(disease.severity, 1.0)
    
    # Cap at 100
    return min(base_score, 100)


def _determine_risk_level(risk_score):
    """Determine risk level from score"""
    if risk_score >= 75:
        return 'critical'
    elif risk_score >= 60:
        return 'high'
    elif risk_score >= 40:
        return 'moderate'
    else:
        return 'low'


def _extract_factors(disease, metrics):
    """Extract contributing risk factors"""
    factors = []
    
    for metric in metrics[:5]:  # Top 5 metrics
        if metric.value > 100:  # Arbitrary threshold
            factors.append(metric.get_metric_display())
    
    if disease.severity in ['severe', 'critical']:
        factors.append(f"High severity ({disease.severity})")
    
    return factors[:5]  # Max 5 factors


def _generate_recommendations(disease, risk_level):
    """Generate AI recommendations based on risk level"""
    recommendations = []
    
    if risk_level == 'critical':
        recommendations.append("Schedule urgent consultation with specialist")
        recommendations.append("Review medications immediately")
        recommendations.append("Implement lifestyle modifications")
    elif risk_level == 'high':
        recommendations.append("Schedule appointment with your physician")
        recommendations.append("Monitor metrics daily")
        recommendations.append("Follow medication plan strictly")
    elif risk_level == 'moderate':
        recommendations.append("Maintain current treatment plan")
        recommendations.append("Monitor metrics weekly")
    else:
        recommendations.append("Continue current healthy habits")
    
    return recommendations


def _is_goal_achieved(goal, current_value):
    """Check if care goal target is achieved"""
    if goal.goal_type == 'reduce':
        return current_value <= goal.target_value
    elif goal.goal_type == 'increase':
        return current_value >= goal.target_value
    else:
        return current_value == goal.target_value


def _calculate_goal_progress(goal, current_value):
    """Calculate progress percentage toward goal"""
    if goal.goal_type == 'reduce':
        total_change = goal.baseline_value - goal.target_value
        current_change = goal.baseline_value - current_value
    else:
        total_change = goal.target_value - goal.baseline_value
        current_change = current_value - goal.baseline_value
    
    if total_change == 0:
        return 100
    
    progress = min((current_change / total_change) * 100, 100)
    return max(progress, 0)


def _send_alert_notification(user, alert_rule, metric):
    """Send alert notification to user"""
    try:
        subject = f"Health Alert: {alert_rule.alert_type}"
        message = f"""
        Your {alert_rule.metric_type} reading of {metric.value} {metric.unit}
        exceeds the safe range.
        
        Threshold: {alert_rule.threshold_min} - {alert_rule.threshold_max} {metric.unit}
        Severity: {alert_rule.severity}
        
        Please consult with your healthcare provider.
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=True,
        )
        logger.info(f"Alert notification sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send alert notification: {str(e)}")
