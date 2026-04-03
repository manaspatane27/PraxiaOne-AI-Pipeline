"use client";

import { useEffect, useMemo, useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Stack,
  Button,
  Chip,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Alert,
} from "@mui/material";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import FavoriteIcon from "@mui/icons-material/Favorite";
import MedicationIcon from "@mui/icons-material/Medication";
import ScienceIcon from "@mui/icons-material/Science";
import InsightsIcon from "@mui/icons-material/Insights";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import Lottie from "lottie-react";
import aiHealth from "@/public/animations/ai-health.json";

import { useRouter } from "next/navigation";
import { requireAuth } from "@/lib/requireAuth";
import { apiFetch } from "@/lib/api";

type ProgressData = {
  target_weight?: number;
  start_weight?: number;
  current_weight?: number;
  progress: number;
  message?: string;
};

function MetricCard({
  title,
  value,
  icon,
  hint,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  hint?: string;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Card
      sx={{
        borderRadius: 0,
        height: "100%",
        overflow: "hidden",
        border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
        boxShadow: isDark ? "0 18px 80px rgba(0,0,0,0.40)" : "0 18px 60px rgba(2,6,23,0.08)",
        background: isDark
          ? `linear-gradient(180deg, ${alpha("#0f172a", 0.78)}, ${alpha("#020617", 0.70)})`
          : `linear-gradient(180deg, ${alpha("#ffffff", 0.82)}, ${alpha("#ffffff", 0.60)})`,
        backdropFilter: "blur(12px)",
      }}
    >
      <CardContent sx={{ p: 2.2 }}>
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 0,
              display: "grid",
              placeItems: "center",
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.16)}, ${alpha(
                theme.palette.secondary.main,
                0.14
              )})`,
              border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
              boxShadow: isDark ? "none" : "inset 0 1px 0 rgba(255,255,255,0.85)",
            }}
          >
            {icon}
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{ color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}
            >
              {title}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 950, mt: 0.2 }}>
              {value}
            </Typography>
          </Box>
        </Stack>

        {hint && (
          <Typography variant="caption" sx={{ display: "block", mt: 1.2, opacity: isDark ? 0.75 : 0.85 }}>
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  requireAuth();
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [notice, setNotice] = useState<string>("");

  const loadProgress = async () => {
    setLoadingProgress(true);
    setNotice("");

    try {
      const json = await apiFetch<ProgressData>("/vitals/progress/", { method: "GET" });
      setProgress(json);
      if (json?.message) setNotice(json.message);
    } catch (e: any) {
      // consent lock comes as 403; show message if present
      try {
        const msg = typeof e?.message === "string" ? e.message : "";
        setNotice(msg || "Unable to load progress (API down or not authorized).");
      } catch {
        setNotice("Unable to load progress.");
      }
      setProgress(null);
    } finally {
      setLoadingProgress(false);
    }
  };

  useEffect(() => {
    loadProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progressValue = useMemo(() => {
    const v = progress?.progress ?? 0;
    return Math.max(0, Math.min(100, Number(Number(v).toFixed(2))));
  }, [progress]);

  const progressBadge = useMemo(() => {
    if (!progress) return "No data";
    if (progressValue >= 100) return "Goal achieved 🎉";
    if (progressValue >= 70) return "Almost there 💪";
    if (progressValue >= 30) return "Good progress ✅";
    return "Getting started 🚀";
  }, [progress, progressValue]);

  const pageBg = useMemo(() => {
    const p = theme.palette.primary.main;
    const s = theme.palette.secondary.main;
    const ok = theme.palette.success.main;

    if (isDark) {
      return (
        `radial-gradient(1200px 650px at 15% 0%, ${alpha(p, 0.18)}, transparent 60%),` +
        `radial-gradient(900px 520px at 85% 20%, ${alpha(s, 0.18)}, transparent 55%),` +
        `radial-gradient(900px 520px at 50% 110%, ${alpha(ok, 0.12)}, transparent 55%),` +
        `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.default} 100%)`
      );
    }

    return (
      `radial-gradient(1200px 650px at 15% 0%, ${alpha(p, 0.10)}, transparent 60%),` +
      `radial-gradient(900px 520px at 85% 20%, ${alpha(s, 0.10)}, transparent 55%),` +
      `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.default} 100%)`
    );
  }, [theme, isDark]);

  const surfaceCard = useMemo(
    () => ({
      borderRadius: 0,
      border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
      boxShadow: isDark ? "0 28px 110px rgba(0,0,0,0.55)" : "0 24px 80px rgba(2,6,23,0.10)",
      overflow: "hidden",
      background: isDark
        ? `linear-gradient(180deg, ${alpha("#0f172a", 0.80)}, ${alpha("#020617", 0.72)})`
        : `linear-gradient(180deg, ${alpha("#ffffff", 0.82)}, ${alpha("#ffffff", 0.58)})`,
      backdropFilter: "blur(12px)",
    }),
    [theme, isDark]
  );

  const pill = useMemo(
    () => ({
      borderRadius: 0,
      fontWeight: 950,
      border: 0,
      background: alpha(theme.palette.primary.main, isDark ? 0.18 : 0.12),
      color: isDark ? alpha("#E2E8F0", 0.92) : theme.palette.text.primary,
    }),
    [theme, isDark]
  );

  return (
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
        minHeight: "calc(100vh - 64px)",
        background: pageBg,
      }}
    >
      <Card sx={{ ...surfaceCard, mb: 3 }}>
        <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            spacing={2}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip icon={<AutoAwesomeIcon />} label="AI-Driven Wellness" sx={pill} />
                <Chip
                  icon={<TrendingUpIcon />}
                  label={progressBadge}
                  sx={{ ...pill, background: alpha(theme.palette.text.primary, isDark ? 0.10 : 0.06) }}
                />
              </Stack>

              <Typography variant="h4" sx={{ fontWeight: 950, mt: 1 }}>
                Dashboard
              </Typography>
              <Typography sx={{ mt: 0.3, color: isDark ? alpha("#E2E8F0", 0.72) : theme.palette.text.secondary }}>
                Your personalized overview — vitals, data sources, and AI insights in one place.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                variant="contained"
                color="success"
                onClick={() => router.push("/data")}
                sx={{ borderRadius: 0, fontWeight: 950, px: 2.2 }}
                endIcon={<ArrowForwardIcon />}
              >
                Connect Data
              </Button>
              <Button variant="outlined" onClick={() => router.push("/vitals")} sx={{ borderRadius: 0, fontWeight: 950, px: 2.2 }}>
                View Vitals
              </Button>
              <Button variant="outlined" onClick={loadProgress} sx={{ borderRadius: 0, fontWeight: 950, px: 2.2 }}>
                Refresh
              </Button>
            </Stack>
          </Stack>

          {notice && (
            <Alert severity="info" sx={{ mt: 2, borderRadius: 0 }}>
              {notice}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={3} alignItems="stretch">
        <Grid size={{ xs: 12, lg: 8 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard title="Vitals Snapshot" value={progress ? "Active" : "—"} icon={<FavoriteIcon color="error" />} hint="Based on latest vitals" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard title="Medications" value="0 Active" icon={<MedicationIcon color="primary" />} hint="Add meds to track" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard title="Lab Results" value="0 Uploaded" icon={<ScienceIcon color="secondary" />} hint="Upload PDF reports" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard title="AI Insights" value="Ready" icon={<InsightsIcon color="success" />} hint="Consent required" />
            </Grid>
          </Grid>

          <Card sx={{ ...surfaceCard, mt: 3 }}>
            <Box sx={{ height: 6, background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})` }} />
            <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1}>
                <Box>
                  <Typography sx={{ fontWeight: 950 }}>Weight Goal Progress</Typography>
                  <Typography variant="body2" sx={{ color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}>
                    Tracks your journey from start to target.
                  </Typography>
                </Box>

                <Chip label={loadingProgress ? "Loading..." : `${progressValue}%`} sx={{ ...pill, background: alpha(theme.palette.primary.main, isDark ? 0.18 : 0.12) }} />
              </Stack>

              <Divider sx={{ my: 2, opacity: isDark ? 0.12 : 0.25 }} />

              {loadingProgress ? (
                <Box>
                  <Skeleton variant="rounded" height={14} />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
                    <Skeleton variant="rounded" height={72} sx={{ flex: 1 }} />
                    <Skeleton variant="rounded" height={72} sx={{ flex: 1 }} />
                    <Skeleton variant="rounded" height={72} sx={{ flex: 1 }} />
                  </Stack>
                </Box>
              ) : (
                <>
                  <LinearProgress
                    variant="determinate"
                    value={progressValue}
                    sx={{
                      height: 14,
                      borderRadius: 0,
                      backgroundColor: alpha(theme.palette.text.primary, isDark ? 0.12 : 0.08),
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 0,
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      },
                    }}
                  />

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
                    <MiniStat title="Start" value={progress?.start_weight ?? 0} />
                    <MiniStat title="Current" value={progress?.current_weight ?? 0} />
                    <MiniStat title="Target" value={progress?.target_weight ?? 0} />
                  </Stack>

                  {progress?.message && (
                    <Typography variant="caption" sx={{ display: "block", mt: 1.5, opacity: 0.80 }}>
                      {progress.message}
                    </Typography>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card sx={{ ...surfaceCard, mt: 3 }}>
            <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
              <Typography sx={{ fontWeight: 950, mb: 0.5 }}>Recent Activity</Typography>
              <Typography variant="body2" sx={{ mb: 2, color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}>
                A quick timeline of what changed recently (placeholder for now).
              </Typography>

              <List disablePadding>
                {[
                  "Vitals progress fetched successfully",
                  "Theme preference saved (Classic/Midnight/Aurora)",
                  "AI Insights module ready (consent gating next)",
                ].map((t, idx) => (
                  <ListItem key={idx} sx={{ px: 0 }}>
                    <ListItemText primary={t} secondary="Today" primaryTypographyProps={{ sx: { fontWeight: 700 } }} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ ...surfaceCard, height: "100%", minHeight: 560, display: "flex", flexDirection: "column" }}>
            <Box sx={{ height: 6, background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})` }} />

            <CardContent sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography sx={{ fontWeight: 950 }}>Praxia AI Assistant</Typography>
                  <Typography variant="body2" sx={{ color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}>
                    Explainable wellness guidance
                  </Typography>
                </Box>

                <Chip icon={<AutoAwesomeIcon />} label="Online" sx={{ ...pill, background: alpha(theme.palette.primary.main, isDark ? 0.18 : 0.12) }} />
              </Stack>

              <Box
                sx={{
                  mt: 2,
                  borderRadius: 0,
                  border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
                  background: isDark
                    ? `radial-gradient(500px 220px at 50% 40%, ${alpha(theme.palette.primary.main, 0.18)}, transparent 60%), ${alpha("#020617", 0.35)}`
                    : `radial-gradient(500px 220px at 50% 40%, ${alpha(theme.palette.primary.main, 0.12)}, transparent 60%), ${alpha("#ffffff", 0.55)}`,
                  p: 1.2,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Lottie animationData={aiHealth} loop autoplay style={{ width: "100%", maxWidth: 380, height: 320 }} />
              </Box>

              <Typography variant="body2" sx={{ mt: 1.5, color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}>
                Next: connect consent + data sources so AI can generate insights only from permitted scopes.
              </Typography>

              <Box sx={{ flex: 1 }} />

              <Stack spacing={1.2} sx={{ mt: 2 }}>
                <Button variant="contained" color="success" sx={{ borderRadius: 0, fontWeight: 950 }} onClick={() => router.push("/insights")}>
                  Open AI Insights
                </Button>
                <Button variant="outlined" sx={{ borderRadius: 0, fontWeight: 950 }} onClick={() => router.push("/consent")}>
                  Manage Consent
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function MiniStat({ title, value }: { title: string; value: number }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        flex: 1,
        p: 2,
        borderRadius: 0,
        border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
        background: isDark ? alpha("#020617", 0.30) : alpha("#ffffff", 0.60),
        boxShadow: isDark ? "none" : "0 16px 50px rgba(2,6,23,0.06)",
        minWidth: 120,
      }}
    >
      <Typography variant="caption" sx={{ color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}>
        {title}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 950, mt: 0.2 }}>
        {value} <span style={{ fontSize: 14, opacity: 0.7, fontWeight: 700 }}>kg</span>
      </Typography>
    </Box>
  );
}
