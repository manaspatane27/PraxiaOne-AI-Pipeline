"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { alpha, useTheme } from "@mui/material/styles";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Button,
  Divider,
  Tabs,
  Tab,
  MenuItem,
  Select,
  FormControl,
  Tooltip,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Avatar,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LockIcon from "@mui/icons-material/Lock";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import StarIcon from "@mui/icons-material/Star";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import SyncProblemRoundedIcon from "@mui/icons-material/SyncProblemRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";

import { apiFetch, logout } from "@/lib/api";

type ProgressData = {
  target_weight: number;
  start_weight: number;
  current_weight: number;
  progress: number;
  message?: string;
};

type RangeKey = 30 | 60;
type TabKey = "activity" | "sleep" | "weight" | "bp";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function formatDateLabel(indexFromStart: number, total: number) {
  const day = indexFromStart + 1;
  if (total <= 14) return `${day}`;
  if (day === 1 || day === total) return `${day}`;
  if (day % 5 === 0) return `${day}`;
  return "";
}

function useSurface() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const border = `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.10)}`;
  const cardBg = isDark
    ? `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.24)}, ${alpha(
        theme.palette.background.paper,
        0.12
      )})`
    : `linear-gradient(180deg, ${alpha("#ffffff", 0.86)}, ${alpha("#ffffff", 0.60)})`;

  const pageBg = isDark
    ? `
      radial-gradient(1200px 680px at 18% 0%, ${alpha(theme.palette.primary.main, 0.22)}, transparent 60%),
      radial-gradient(1000px 600px at 90% 10%, ${alpha(theme.palette.secondary.main, 0.20)}, transparent 58%),
      radial-gradient(900px 520px at 50% 110%, ${alpha(theme.palette.success.main, 0.12)}, transparent 60%),
      linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.default} 100%)
    `
    : `
      radial-gradient(1100px 600px at 15% 0%, ${alpha(theme.palette.primary.main, 0.12)}, transparent 60%),
      radial-gradient(900px 520px at 90% 10%, ${alpha(theme.palette.secondary.main, 0.10)}, transparent 60%),
      linear-gradient(180deg, ${theme.palette.background.default} 0%, ${alpha("#f6fbff", 0.92)} 100%)
    `;

  const glow = isDark
    ? `
      radial-gradient(900px 420px at 12% 10%, ${alpha(theme.palette.primary.main, 0.22)}, transparent 60%),
      radial-gradient(820px 380px at 90% 0%, ${alpha(theme.palette.secondary.main, 0.18)}, transparent 58%)
    `
    : `
      radial-gradient(900px 420px at 12% 10%, ${alpha(theme.palette.primary.main, 0.12)}, transparent 62%),
      radial-gradient(820px 380px at 90% 0%, ${alpha(theme.palette.secondary.main, 0.10)}, transparent 60%)
    `;

  const shadow = isDark ? "0 30px 95px rgba(0,0,0,0.55)" : "0 22px 70px rgba(2,6,23,0.10)";

  return { theme, isDark, border, cardBg, pageBg, glow, shadow };
}

function GlassCard({ children, sx }: { children: React.ReactNode; sx?: any }) {
  const { border, cardBg, glow, shadow } = useSurface();
  return (
    <Card
      sx={{
        borderRadius: 0,
        overflow: "hidden",
        border,
        boxShadow: shadow,
        background: `${glow}, ${cardBg}`,
        backdropFilter: "blur(14px)",
        ...sx,
      }}
    >
      {children}
    </Card>
  );
}

function BarChart({
  values,
  height = 140,
  selectedIndex,
  onSelect,
  valueLabel,
  xLabel,
}: {
  values: number[];
  height?: number;
  selectedIndex: number;
  onSelect: (i: number) => void;
  valueLabel: (v: number) => string;
  xLabel: (i: number) => string;
}) {
  const { theme, isDark } = useSurface();
  const max = Math.max(1, ...values);
  const min = Math.min(...values);

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.8, height, px: 0.5 }}>
        {values.map((v, i) => {
          const h = clamp((v / max) * (height - 16), 8, height - 10);
          const selected = i === selectedIndex;
          return (
            <Tooltip
              key={i}
              title={
                <Box sx={{ p: 0.5 }}>
                  <Typography variant="caption" component="div" sx={{ fontWeight: 900 }}>
                    {xLabel(i)}
                  </Typography>
                  <Typography variant="caption" component="div" sx={{ opacity: 0.8 }}>
                    {valueLabel(v)}
                  </Typography>
                </Box>
              }
              arrow
            >
              <Box
                role="button"
                onClick={() => onSelect(i)}
                sx={{
                  flex: 1,
                  minWidth: 10,
                  height: h,
                  borderRadius: 0,
                  cursor: "pointer",
                  transition: "transform 120ms ease, opacity 120ms ease",
                  transform: selected ? "translateY(-2px)" : "none",
                  opacity: selected ? 1 : 0.82,
                  background: selected
                    ? `linear-gradient(180deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`
                    : `linear-gradient(180deg, ${alpha(theme.palette.primary.main, isDark ? 0.65 : 0.45)}, ${alpha(
                        theme.palette.secondary.main,
                        isDark ? 0.45 : 0.35
                      )})`,
                }}
              />
            </Tooltip>
          );
        })}
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
        <Typography variant="caption" component="div" sx={{ opacity: 0.7 }}>
          Min: {valueLabel(min)}
        </Typography>
        <Typography variant="caption" component="div" sx={{ opacity: 0.7 }}>
          Max: {valueLabel(max)}
        </Typography>
      </Box>
    </Box>
  );
}

function LineChart({ series, height = 120, stroke }: { series: number[]; height?: number; stroke: string }) {
  const { theme } = useSurface();
  const w = 520;
  const h = height;
  const pad = 10;

  const min = Math.min(...series);
  const max = Math.max(1, ...series);
  const span = Math.max(1, max - min);

  const pts = series.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / Math.max(1, series.length - 1);
    const y = pad + (1 - (v - min) / span) * (h - pad * 2);
    return { x, y };
  });

  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");

  return (
    <Box sx={{ width: "100%", overflow: "hidden" }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ display: "block" }}>
        {[0.25, 0.5, 0.75].map((t, idx) => (
          <line
            key={idx}
            x1={pad}
            x2={w - pad}
            y1={pad + t * (h - pad * 2)}
            y2={pad + t * (h - pad * 2)}
            stroke={alpha(theme.palette.text.primary, 0.10)}
            strokeWidth={1}
          />
        ))}
        <path d={d} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, idx) => (
          <circle key={idx} cx={p.x} cy={p.y} r={2.6} fill={stroke} opacity={0.9} />
        ))}
      </svg>
    </Box>
  );
}

export default function VitalsPage() {
  const router = useRouter();
  const { theme, isDark, border, pageBg } = useSurface();

  // State
  const [range, setRange] = useState<RangeKey>(30);
  const [tab, setTab] = useState<TabKey>("bp");
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [aiAnswer, setAiAnswer] = useState("");

  const load = async () => {
    setLoading(true);
    if (!localStorage.getItem("access")) {
      setLoading(false);
      router.push("/login");
      return;
    }

    try {
      const json = await apiFetch<ProgressData>("/vitals/progress/");
      setData(json);
    } catch (e: any) {
      if (!localStorage.getItem("access")) {
        logout();
        router.push("/login");
        return;
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const askClinicalAI = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "What are the specific risk factors for my condition based on validated research?",
          diagnosis: tab === "bp" ? "Hypertension" : tab === "weight" ? "Obesity" : "Diabetes",
          patient_id: "P101",
        }),
      });
      const data = await res.json();
      setAiAnswer(data.answer);
    } catch (err) {
      setAiAnswer("Could not reach the Clinical Engine. Please ensure the Graph AI server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    load();
  }, []);

  const days = range;

  // Memoized Series
  const weightSeries = useMemo(() => {
    const start = data?.start_weight ?? 80;
    const current = data?.current_weight ?? 78;
    const series: number[] = [];
    for (let i = 0; i < days; i++) {
      const t = i / Math.max(1, days - 1);
      const base = start + (current - start) * t;
      const wobble = Math.sin(i * 0.45) * 0.25 + Math.cos(i * 0.18) * 0.12;
      series.push(Number((base + wobble).toFixed(2)));
    }
    return { series, start, current, target: data?.target_weight ?? 70 };
  }, [data, days]);

  const activitySteps = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < days; i++) {
      const v = 6500 + Math.sin(i * 0.45) * 1400 + Math.cos(i * 0.2) * 900;
      arr.push(Math.round(clamp(v, 1500, 12000)));
    }
    return arr;
  }, [days]);

  const sleepHours = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < days; i++) {
      const v = 6.8 + Math.sin(i * 0.32) * 0.7 + Math.cos(i * 0.18) * 0.4;
      arr.push(Number(clamp(v, 4.5, 9.0).toFixed(1)));
    }
    return arr;
  }, [days]);

  const hrSeries = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < days; i++) {
      const v = 68 + Math.sin(i * 0.35) * 6 + Math.cos(i * 0.11) * 3;
      arr.push(Math.round(clamp(v, 52, 98)));
    }
    return arr;
  }, [days]);

  const bpSystolic = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < days; i++) {
      const v = 121 + Math.sin(i * 0.22) * 4 + Math.cos(i * 0.12) * 3;
      arr.push(Math.round(clamp(v, 105, 140)));
    }
    return arr;
  }, [days]);

  const bpDiastolic = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < days; i++) {
      const v = 78 + Math.sin(i * 0.19) * 3 + Math.cos(i * 0.1) * 2;
      arr.push(Math.round(clamp(v, 65, 95)));
    }
    return arr;
  }, [days]);

  // Summaries
  const bpSummary = useMemo(() => {
    const sAvg = Math.round(bpSystolic.reduce((a, b) => a + b, 0) / bpSystolic.length);
    const dAvg = Math.round(bpDiastolic.reduce((a, b) => a + b, 0) / bpDiastolic.length);
    const lastS = bpSystolic[bpSystolic.length - 1];
    const lastD = bpDiastolic[bpDiastolic.length - 1];
    const sChange = lastS - bpSystolic[0];
    const dChange = lastD - bpDiastolic[0];
    const status = lastS < 120 && lastD < 80 ? "Normal" : lastS < 130 && lastD < 80 ? "Elevated" : "Monitor";
    return { sAvg, dAvg, lastS, lastD, sChange, dChange, status };
  }, [bpSystolic, bpDiastolic]);

  const hrSummary = useMemo(() => {
    const avg = Math.round(hrSeries.reduce((a, b) => a + b, 0) / hrSeries.length);
    const last = hrSeries[hrSeries.length - 1];
    const change = last - hrSeries[0];
    return { avg, last, change };
  }, [hrSeries]);

  const weightSummary = useMemo(() => {
    const last = weightSeries.series[weightSeries.series.length - 1];
    const change = Number((last - weightSeries.series[0]).toFixed(1));
    return { last, change };
  }, [weightSeries]);

  const progressValue = useMemo(() => {
    const v = data?.progress ?? 0;
    return clamp(Number(v.toFixed(2)), 0, 100);
  }, [data]);

  const sectionTitle = (t: string) => (
    <Typography variant="subtitle1" component="div" sx={{ fontWeight: 950 }}>
      {t}
    </Typography>
  );

  const goSecurity = () => router.push("/data-security");
  const goSyncErrors = () => router.push("/sync-errors");
  const goSupport = () => router.push("/support");

  if (!mounted) {
    return <Box sx={{ minHeight: "100vh", background: isDark ? "#0f172a" : "#f8fafc" }} />;
  }

  return (
    <Box sx={{ minHeight: "100vh", px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 }, background: pageBg }}>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* Header */}
        <GlassCard sx={{ mb: 2.4 }}>
          <Box sx={{ height: 6, background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})` }} />
          <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
              <Box sx={{ minWidth: 260 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h5" component="div" sx={{ fontWeight: 950, letterSpacing: -0.6 }}>
                    Vital Trends
                  </Typography>
                  <Tooltip title="Track your health and wellness trends over time.">
                    <IconButton size="small">
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Typography variant="body2" component="div" sx={{ opacity: isDark ? 0.78 : 0.75 }}>
                  Health analytics backed by clinical intelligence.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                  icon={<AutoAwesomeIcon />}
                  label={`Goal Progress: ${progressValue}%`}
                  sx={{ borderRadius: 0, fontWeight: 900, border, background: alpha(theme.palette.secondary.main, 0.18) }}
                />
                <Button
                  variant="contained"
                  onClick={load}
                  disabled={loading}
                  startIcon={<RefreshIcon />}
                  sx={{
                    borderRadius: 0,
                    fontWeight: 950,
                    textTransform: "none",
                    background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                  }}
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </GlassCard>

        <Stack direction={{ xs: "column", lg: "row" }} spacing={2.4} alignItems="stretch">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Tabs Selector */}
            <GlassCard sx={{ mb: 2.2 }}>
              <CardContent sx={{ p: 1.6 }}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" gap={1}>
                  <Tabs
                    value={tab}
                    onChange={(_, v) => { setTab(v); setAiAnswer(""); }}
                    sx={{ minHeight: 40, "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 900 } }}
                  >
                    <Tab value="activity" label="Activity" />
                    <Tab value="sleep" label="Sleep" />
                    <Tab value="weight" label="Weight" />
                    <Tab value="bp" label="Blood Pressure" />
                  </Tabs>

                  <FormControl size="small">
                    <Select
                      value={range}
                      onChange={(e) => setRange(e.target.value as RangeKey)}
                      sx={{ borderRadius: 0, fontWeight: 900, minWidth: 120 }}
                    >
                      <MenuItem value={30}>30 Days</MenuItem>
                      <MenuItem value={60}>60 Days</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </CardContent>
            </GlassCard>

            {/* AI Clinical Insight Card */}
            <GlassCard sx={{ mb: 2.2 }}>
              <CardContent sx={{ p: 2.2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AutoAwesomeIcon sx={{ color: theme.palette.secondary.main }} />
                    {sectionTitle("AI Clinical Insight")}
                  </Stack>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={askClinicalAI}
                    disabled={loading}
                    sx={{ borderRadius: 0, fontWeight: 950, background: theme.palette.secondary.main }}
                  >
                    {loading ? "Analyzing..." : "Generate Insight"}
                  </Button>
                </Stack>
                <Divider sx={{ my: 1.6, opacity: 0.1 }} />
                <Typography variant="body2" sx={{ fontStyle: aiAnswer ? "normal" : "italic", opacity: 0.85, lineHeight: 1.6 }}>
                  {aiAnswer || "Select a category above and click 'Generate Insight' to verify these trends against team-validated research and datasets."}
                </Typography>
              </CardContent>
            </GlassCard>

            {/* Main Data Charts */}
            <GlassCard>
              <CardContent sx={{ p: 2.8 }}>
                <Typography variant="h6" component="div" sx={{ fontWeight: 950, mb: 0.5 }}>
                  {tab === "bp" ? "Blood Pressure" : tab === "weight" ? "Weight Trends" : tab === "sleep" ? "Sleep Trends" : "Activity Trends"}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.7 }}>
                  Visualizing clinical history for the last {range} days.
                </Typography>

                {tab === "activity" && <BarChart values={activitySteps} selectedIndex={selectedIdx} onSelect={setSelectedIdx} valueLabel={(v) => `${v.toLocaleString()} steps`} xLabel={(i) => `Day ${i + 1}`} />}
                {tab === "sleep" && <BarChart values={sleepHours} selectedIndex={selectedIdx} onSelect={setSelectedIdx} valueLabel={(v) => `${v} hours`} xLabel={(i) => `Day ${i + 1}`} />}
                {tab === "weight" && <LineChart series={weightSeries.series} stroke={theme.palette.primary.main} height={140} />}
                {tab === "bp" && (
                  <Stack spacing={1.2}>
                    <LineChart series={bpSystolic} stroke={theme.palette.primary.main} height={120} />
                    <LineChart series={bpDiastolic} stroke={theme.palette.secondary.main} height={120} />
                  </Stack>
                )}
              </CardContent>
            </GlassCard>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2.2} sx={{ mt: 2.2 }}>
              <GlassCard sx={{ flex: 1 }}>
                <CardContent sx={{ p: 2.2 }}>
                  {sectionTitle("Heart Rate Stats")}
                  <Typography variant="h4" sx={{ fontWeight: 950, mt: 0.7 }}>
                    {hrSummary.avg} <span style={{ fontSize: 16, opacity: 0.6 }}>bpm</span>
                  </Typography>
                  <Divider sx={{ my: 1.6, opacity: 0.1 }} />
                  <BarChart values={hrSeries} height={90} selectedIndex={selectedIdx} onSelect={setSelectedIdx} valueLabel={(v) => `${v} bpm`} xLabel={(i) => `Day ${i + 1}`} />
                </CardContent>
              </GlassCard>
              <GlassCard sx={{ flex: 1 }}>
                <CardContent sx={{ p: 2.2 }}>
                  {sectionTitle("Weight Summary")}
                  <Typography variant="h4" sx={{ fontWeight: 950, mt: 0.7 }}>
                    {weightSeries.current} <span style={{ fontSize: 16, opacity: 0.6 }}>kg</span>
                  </Typography>
                  <Divider sx={{ my: 1.6, opacity: 0.1 }} />
                  <LineChart series={weightSeries.series} stroke={theme.palette.secondary.main} height={110} />
                </CardContent>
              </GlassCard>
            </Stack>
          </Box>

          {/* Right Rail */}
          <Box sx={{ width: { xs: "100%", lg: 380 }, flexShrink: 0 }}>
            <Stack spacing={2.2}>
              <GlassCard>
                <CardContent sx={{ p: 2.2 }}>
                  {sectionTitle("Resources")}
                  <List disablePadding sx={{ mt: 1 }}>
                    <ListItemButton onClick={goSecurity} sx={{ px: 1 }}>
                      <Avatar variant="rounded" sx={{ width: 34, height: 34, mr: 1.2, background: alpha(theme.palette.primary.main, 0.14) }}>
                        <SecurityRoundedIcon fontSize="small" />
                      </Avatar>
                      <ListItemText primary={<Typography sx={{ fontWeight: 900 }}>Data Security</Typography>} />
                      <ChevronRightRoundedIcon fontSize="small" />
                    </ListItemButton>
                    <ListItemButton onClick={goSupport} sx={{ px: 1 }}>
                      <Avatar variant="rounded" sx={{ width: 34, height: 34, mr: 1.2, background: alpha(theme.palette.success.main, 0.14) }}>
                        <SupportAgentRoundedIcon fontSize="small" />
                      </Avatar>
                      <ListItemText primary={<Typography sx={{ fontWeight: 900 }}>Support</Typography>} />
                      <ChevronRightRoundedIcon fontSize="small" />
                    </ListItemButton>
                  </List>
                </CardContent>
              </GlassCard>

              <GlassCard>
                <CardContent sx={{ p: 2.2 }}>
                  {sectionTitle("Upcoming")}
                  <List disablePadding>
                    <Stack direction="row" spacing={1.2} sx={{ py: 1 }}>
                      <Avatar variant="rounded" sx={{ width: 34, height: 34, background: alpha(theme.palette.secondary.main, 0.14) }}>A</Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 900 }}>Nutrition Consultation</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.6 }}>Wed, May 1, 10:02AM</Typography>
                      </Box>
                    </Stack>
                  </List>
                </CardContent>
              </GlassCard>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}