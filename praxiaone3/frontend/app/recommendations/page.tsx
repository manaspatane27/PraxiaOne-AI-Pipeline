"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { alpha, useTheme } from "@mui/material/styles";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Divider,
  Button,
  Grid,
  LinearProgress,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

import {
  AutoAwesome,
  VerifiedUser,
  Refresh,
  Checklist,
  LocalDrink,
  DirectionsWalk,
  MonitorWeight,
  Bolt,
  Done,
  Schedule,
  ArrowForward,
  InfoOutlined,
} from "@mui/icons-material";

type Rec = {
  id: string;
  title: string;
  description: string;
  category: "Activity" | "Hydration" | "Weight" | "Recovery" | "Nutrition";
  impact: "High" | "Medium" | "Low";
  status: "New" | "In progress" | "Done";
  progress: number; // 0-100
  ctaLabel?: string;
  ctaHref?: string;
};

type VitalsProgress = {
  target_weight?: number;
  start_weight?: number;
  current_weight?: number;
  progress?: number;
  message?: string;
};

const API_BASE = "http://127.0.0.1:8000/api";
const LS_KEY = "praxiaone_recs_v1";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function computeScore(progress: number, impact: Rec["impact"]) {
  const w = impact === "High" ? 1.0 : impact === "Medium" ? 0.75 : 0.55;
  return Math.round(clamp(progress * w, 0, 100));
}

function iconFor(cat: Rec["category"]) {
  switch (cat) {
    case "Activity":
      return <DirectionsWalk />;
    case "Hydration":
      return <LocalDrink />;
    case "Weight":
      return <MonitorWeight />;
    case "Recovery":
      return <Bolt />;
    case "Nutrition":
      return <Checklist />;
  }
}

function seedRecs(vitals?: VitalsProgress): Rec[] {
  const prog = typeof vitals?.progress === "number" ? vitals!.progress : null;
  const current = vitals?.current_weight;
  const target = vitals?.target_weight;

  const weightDesc =
    prog === null
      ? "Update weight once a week to keep progress accurate (no daily stress)."
      : target && current
        ? `Your current weight is ~${current} kg. Target is ${target} kg. Progress: ${prog}%.`
        : `Weight progress: ${prog}%. Log weight consistently to improve accuracy.`;

  const weightStatus: Rec["status"] =
    prog !== null && prog >= 100 ? "Done" : prog !== null && prog > 0 ? "In progress" : "New";

  const weightProgress = prog !== null ? clamp(Math.round(prog), 0, 100) : 25;

  return [
    {
      id: "walk-30",
      title: "Walk 30 minutes daily",
      description:
        "A simple daily walk improves recovery + consistency. Start small and keep it repeatable.",
      category: "Activity",
      impact: "High",
      status: "New",
      progress: 0,
      ctaLabel: "Open Vitals",
      ctaHref: "/vitals",
    },
    {
      id: "hydration-2-5",
      title: "Hydration target: 2.5L/day",
      description:
        "Keep it steady across the day. Try 500ml in the first 2 hours after waking.",
      category: "Hydration",
      impact: "Medium",
      status: "New",
      progress: 0,
      ctaLabel: "Track in Data",
      ctaHref: "/data",
    },
    {
      id: "weekly-weight",
      title: "Weekly weight update reminder",
      description: weightDesc,
      category: "Weight",
      impact: "High",
      status: weightStatus,
      progress: weightProgress,
      ctaLabel: "Update Profile",
      ctaHref: "/profile",
    },
    {
      id: "sleep-7",
      title: "Aim for 7–8 hours sleep",
      description:
        "Recovery improves energy, mood and appetite control. Keep wake time consistent.",
      category: "Recovery",
      impact: "High",
      status: "New",
      progress: 0,
    },
    {
      id: "protein-balance",
      title: "Balance meals with protein + fiber",
      description:
        "Add dal/beans + veggies. Helps satiety and supports muscle retention while cutting.",
      category: "Nutrition",
      impact: "High",
      status: "In progress",
      progress: 40,
    },
  ];
}

export default function RecommendationsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [filter, setFilter] = useState<"All" | Rec["category"]>("All");
  const [toast, setToast] = useState<{
    open: boolean;
    msg: string;
    type: "success" | "info" | "error";
  }>({ open: false, msg: "", type: "success" });

  const [items, setItems] = useState<Rec[]>([]);
  const [vitals, setVitals] = useState<VitalsProgress | null>(null);

  // ---- theme-aware backgrounds ----
  const pageBg = useMemo(() => {
    const p = theme.palette.primary.main;
    const s = theme.palette.secondary.main;
    const ok = theme.palette.success.main;

    if (isDark) {
      return (
        `radial-gradient(1200px 650px at 15% 0%, ${alpha(p, 0.18)}, transparent 60%),` +
        `radial-gradient(900px 520px at 85% 20%, ${alpha(s, 0.18)}, transparent 55%),` +
        `radial-gradient(900px 520px at 50% 110%, ${alpha(ok, 0.10)}, transparent 55%),` +
        `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.default} 100%)`
      );
    }

    return (
      `radial-gradient(1100px 520px at 12% 0%, ${alpha(p, 0.12)}, transparent 60%),` +
      `radial-gradient(900px 480px at 90% 10%, ${alpha(s, 0.12)}, transparent 60%),` +
      `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.default} 100%)`
    );
  }, [theme, isDark]);

  const border = useMemo(
    () => `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
    [theme, isDark]
  );

  const glassHero = useMemo(
    () => ({
      borderRadius: 0,
      overflow: "hidden",
      position: "relative" as const,
      boxShadow: isDark ? "0 35px 120px rgba(0,0,0,0.65)" : "0 16px 60px rgba(15,23,42,0.10)",
      border,
      background: isDark
        ? `linear-gradient(135deg, ${alpha("#0b1228", 0.90)}, ${alpha("#050816", 0.86)})`
        : `linear-gradient(135deg, ${alpha("#ffffff", 0.84)}, ${alpha(
          theme.palette.primary.main,
          0.06
        )}, ${alpha(theme.palette.secondary.main, 0.05)})`,
      backdropFilter: "blur(14px)",
    }),
    [theme, isDark, border]
  );

  const heroAura = useMemo(
    () => ({
      position: "absolute" as const,
      inset: 0,
      pointerEvents: "none" as const,
      background:
        `radial-gradient(700px 220px at 18% 38%, ${alpha(
          theme.palette.primary.main,
          isDark ? 0.22 : 0.18
        )}, transparent 60%),` +
        `radial-gradient(650px 240px at 82% 30%, ${alpha(
          theme.palette.secondary.main,
          isDark ? 0.18 : 0.14
        )}, transparent 55%)`,
    }),
    [theme, isDark]
  );

  const pillSx = useMemo(
    () => ({
      borderRadius: 0,
      fontWeight: 900,
      border,
      color: isDark ? alpha("#E2E8F0", 0.92) : alpha(theme.palette.text.primary, 0.88),
      background: isDark
        ? `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.16)}, ${alpha(
          theme.palette.secondary.main,
          0.14
        )})`
        : `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(
          theme.palette.secondary.main,
          0.10
        )})`,
      backdropFilter: "blur(12px)",
    }),
    [theme, isDark, border]
  );

  const toggleWrapSx = useMemo(
    () => ({
      background: isDark ? alpha(theme.palette.background.paper, 0.16) : alpha("#ffffff", 0.72),
      backdropFilter: "blur(12px)",
      borderRadius: 0,
      p: 0.6,
      border,
      boxShadow: isDark ? "0 18px 60px rgba(0,0,0,0.35)" : "0 12px 40px rgba(15,23,42,0.06)",
      "& .MuiToggleButton-root": {
        border: 0,
        borderRadius: 0,
        px: 2,
        fontWeight: 950,
        textTransform: "none",
        color: isDark ? alpha("#E2E8F0", 0.90) : theme.palette.text.primary,
      },
      "& .Mui-selected": {
        background: isDark ? alpha(theme.palette.primary.main, 0.22) : alpha(theme.palette.primary.main, 0.14),
      },
      "& .Mui-selected:hover": {
        background: isDark ? alpha(theme.palette.primary.main, 0.28) : alpha(theme.palette.primary.main, 0.18),
      },
    }),
    [theme, isDark, border]
  );

  const cardSx = useMemo(
    () => ({
      borderRadius: 0,
      height: "100%",
      border,
      overflow: "hidden",
      position: "relative" as const,
      background: isDark
        ? `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.22)}, ${alpha(
          theme.palette.background.paper,
          0.10
        )})`
        : `linear-gradient(135deg, ${alpha("#ffffff", 0.82)}, ${alpha(
          theme.palette.primary.main,
          0.06
        )}, ${alpha(theme.palette.secondary.main, 0.05)})`,
      backdropFilter: "blur(12px)",
      boxShadow: isDark ? "0 22px 80px rgba(0,0,0,0.45)" : "0 16px 60px rgba(15,23,42,0.08)",
      transition: "transform .18s ease, box-shadow .18s ease",
      "&:hover": {
        transform: "translateY(-3px)",
        boxShadow: isDark ? "0 28px 90px rgba(0,0,0,0.58)" : "0 22px 80px rgba(15,23,42,0.12)",
      },
    }),
    [theme, isDark, border]
  );

  const progressTrackBg = useMemo(
    () => alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08),
    [theme, isDark]
  );

  // ✅ Robust localStorage load + auto-reseed if [] or invalid
  useEffect(() => {
    const load = async () => {
      // 1) try fetch vitals (optional)
      try {
        const token = localStorage.getItem("access") || "";
        const res = await fetch(`${API_BASE}/vitals/progress/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const v = (await res.json()) as VitalsProgress;
          setVitals(v);
        }
      } catch {
        // ignore - vitals optional
      }

      // 2) load stored recs
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setItems(parsed);
            return;
          }
          // if it's [] or bad array → reseed
        }
      } catch {
        // ignore parse errors
      }

      // 3) seed
      const starter = seedRecs(vitals ?? undefined);
      setItems(starter);
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(starter));
      } catch { }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist items
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch { }
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === "All") return items;
    return items.filter((r) => r.category === filter);
  }, [items, filter]);

  const overall = useMemo(() => {
    if (items.length === 0) return 0;
    const avg = items.reduce((acc, r) => acc + computeScore(r.progress, r.impact), 0) / items.length;
    return Math.round(avg);
  }, [items]);

  const counts = useMemo(() => {
    const c: Record<Rec["status"], number> = { New: 0, "In progress": 0, Done: 0 };
    for (const r of items) c[r.status] += 1;
    return c;
  }, [items]);

  const bumpProgress = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const nextProg = clamp(r.progress + delta, 0, 100);
        const nextStatus: Rec["status"] = nextProg >= 100 ? "Done" : nextProg > 0 ? "In progress" : "New";
        return { ...r, progress: nextProg, status: nextStatus };
      })
    );
  };

  const markDone = (id: string) => {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, progress: 100, status: "Done" } : r)));
    setToast({ open: true, msg: "Marked as done ✅", type: "success" });
  };

  const refreshSuggestions = () => {
    if (items.length === 0) {
      const starter = seedRecs(vitals ?? undefined);
      setItems(starter);
      setToast({ open: true, msg: "Seeded recommendations ✨", type: "info" });
      return;
    }
    setItems((prev) => [...prev].sort(() => Math.random() - 0.5));
    setToast({ open: true, msg: "Refreshed suggestions 🔄", type: "info" });
  };

  const resetToStarter = () => {
    const starter = seedRecs(vitals ?? undefined);
    setItems(starter);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(starter));
    } catch { }
    setToast({ open: true, msg: "Reset recommendations ✅", type: "success" });
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 24px)",
        px: { xs: 2, md: 3 },
        py: 3,
        background: pageBg,
        animation: "fadeIn .35s ease-out",
        "@keyframes fadeIn": {
          from: { opacity: 0, transform: "translateY(6px)" },
          to: { opacity: 1, transform: "translateY(0px)" },
        },
      }}
    >
      {/* HERO */}
      <Card sx={{ ...glassHero, mb: 3 }}>
        <Box sx={heroAura} />
        <CardContent sx={{ position: "relative", py: 3 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            spacing={2}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.7, flexWrap: "wrap" }}>
                <Chip icon={<AutoAwesome sx={{ fontSize: 18 }} />} label="AI-style recommendations" size="small" sx={pillSx} />
                <Chip icon={<VerifiedUser sx={{ fontSize: 18 }} />} label="Consent-first" size="small" sx={pillSx} />
                <Chip icon={<Schedule sx={{ fontSize: 18 }} />} label="Daily/Weekly habits" size="small" sx={pillSx} />
              </Stack>

              <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: -0.8 }}>
                Recommendations
              </Typography>
              <Typography color="text.secondary">
                Personalized suggestions based on your profile + vitals (demo logic for now).
              </Typography>

              {vitals?.message ? (
                <Typography variant="caption" sx={{ display: "block", mt: 0.8, fontWeight: 800 }} color="text.secondary">
                  Vitals: {vitals.message}
                </Typography>
              ) : null}
            </Box>

            <Stack spacing={1.2} sx={{ minWidth: { xs: "100%", md: 360 } }}>
              <Stack
                direction="row"
                spacing={1}
                justifyContent={{ xs: "flex-start", md: "flex-end" }}
                alignItems="center"
                flexWrap="wrap"
              >
                <Chip
                  label={`Overall: ${overall}%`}
                  sx={{
                    fontWeight: 950,
                    borderRadius: 0,
                    border,
                    background: isDark ? alpha(theme.palette.background.paper, 0.16) : alpha("#ffffff", 0.78),
                    backdropFilter: "blur(12px)",
                  }}
                />
                <Chip label={`New ${counts.New}`} sx={pillSx} />
                <Chip label={`In progress ${counts["In progress"]}`} sx={pillSx} />
                <Chip label={`Done ${counts.Done}`} sx={pillSx} />

                <Tooltip title="Refresh (demo)">
                  <IconButton onClick={refreshSuggestions} sx={{ color: theme.palette.text.primary }}>
                    <Refresh />
                  </IconButton>
                </Tooltip>

                <Tooltip title="What does this mean?">
                  <IconButton
                    onClick={() =>
                      setToast({
                        open: true,
                        msg: "Recommendations are local demo data until backend rules/ML is connected.",
                        type: "info",
                      })
                    }
                    sx={{ color: theme.palette.text.primary }}
                  >
                    <InfoOutlined />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>
                  Progress score
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={overall}
                  sx={{
                    height: 10,
                    borderRadius: 0,
                    background: progressTrackBg,
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 0,
                      background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                    },
                  }}
                />
              </Box>

              <Stack direction="row" justifyContent="flex-end" spacing={1}>
                <Button
                  onClick={resetToStarter}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderRadius: 0,
                    fontWeight: 950,
                    borderColor: alpha(theme.palette.text.primary, isDark ? 0.30 : 0.20),
                    color: theme.palette.text.primary,
                  }}
                >
                  Reset
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* FILTERS */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <ToggleButtonGroup exclusive value={filter} onChange={(_, v) => v && setFilter(v)} sx={toggleWrapSx}>
          <ToggleButton value="All">All</ToggleButton>
          <ToggleButton value="Activity">Activity</ToggleButton>
          <ToggleButton value="Hydration">Hydration</ToggleButton>
          <ToggleButton value="Weight">Weight</ToggleButton>
          <ToggleButton value="Recovery">Recovery</ToggleButton>
          <ToggleButton value="Nutrition">Nutrition</ToggleButton>
        </ToggleButtonGroup>

        <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
          <Button
            component={Link}
            href="/vitals"
            variant="contained"
            color="success"
            sx={{
              borderRadius: 0,
              fontWeight: 950,
              px: 3,
              boxShadow: isDark ? "0 18px 55px rgba(0,0,0,0.35)" : "0 14px 30px rgba(34,197,94,0.22)",
            }}
          >
            Go to Vitals
          </Button>
          <Button
            component={Link}
            href="/profile"
            variant="outlined"
            sx={{
              borderRadius: 0,
              fontWeight: 950,
              px: 3,
              borderColor: alpha(theme.palette.text.primary, isDark ? 0.30 : 0.20),
              color: theme.palette.text.primary,
              "&:hover": {
                borderColor: alpha(theme.palette.text.primary, isDark ? 0.45 : 0.28),
                background: alpha(theme.palette.text.primary, isDark ? 0.06 : 0.04),
              },
            }}
          >
            Update Profile
          </Button>
        </Stack>
      </Stack>

      {/* EMPTY STATE (critical fix) */}
      {filtered.length === 0 ? (
        <Card sx={{ ...cardSx }}>
          <CardContent sx={{ p: 3 }}>
            <Typography sx={{ fontWeight: 950, mb: 0.6 }}>No recommendations to show</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Either your saved recommendations are empty, or your filter has no matches.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button
                onClick={resetToStarter}
                variant="contained"
                color="success"
                sx={{ borderRadius: 0, fontWeight: 950 }}
              >
                Restore starter recommendations
              </Button>
              <Button
                onClick={() => {
                  try {
                    localStorage.removeItem(LS_KEY);
                  } catch { }
                  resetToStarter();
                }}
                variant="outlined"
                sx={{
                  borderRadius: 0,
                  fontWeight: 950,
                  borderColor: alpha(theme.palette.text.primary, isDark ? 0.30 : 0.20),
                  color: theme.palette.text.primary,
                }}
              >
                Clear saved + reseed
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        /* CARDS */
        <Grid container spacing={3}>
          {filtered.map((r) => {
            const score = computeScore(r.progress, r.impact);

            const statusChipBg =
              r.status === "Done"
                ? alpha(theme.palette.success.main, isDark ? 0.22 : 0.16)
                : r.status === "In progress"
                  ? alpha(theme.palette.primary.main, isDark ? 0.22 : 0.16)
                  : alpha(theme.palette.text.primary, isDark ? 0.10 : 0.06);

            return (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={r.id}>
                <Card sx={cardSx}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                      <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 0,
                            display: "grid",
                            placeItems: "center",
                            border,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.16)}, ${alpha(
                              theme.palette.secondary.main,
                              0.14
                            )})`,
                            color: theme.palette.text.primary,
                            flexShrink: 0,
                          }}
                        >
                          {iconFor(r.category)}
                        </Box>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 950, lineHeight: 1.1 }} noWrap>
                            {r.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                            {r.category} • Impact: {r.impact}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack spacing={0.7} alignItems="flex-end">
                        <Chip
                          label={r.status}
                          size="small"
                          sx={{
                            fontWeight: 950,
                            borderRadius: 0,
                            border,
                            background: statusChipBg,
                            backdropFilter: "blur(12px)",
                          }}
                        />
                        <Chip
                          label={`${score}% score`}
                          size="small"
                          sx={{
                            fontWeight: 900,
                            borderRadius: 0,
                            border,
                            background: isDark ? alpha(theme.palette.background.paper, 0.16) : alpha("#ffffff", 0.72),
                            backdropFilter: "blur(12px)",
                          }}
                        />
                      </Stack>
                    </Stack>

                    <Divider sx={{ my: 1.6, opacity: isDark ? 0.18 : 0.35 }} />

                    <Typography color="text.secondary" sx={{ minHeight: 52 }}>
                      {r.description}
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>
                          Progress
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 950 }}>
                          {r.progress}%
                        </Typography>
                      </Stack>

                      <LinearProgress
                        variant="determinate"
                        value={r.progress}
                        sx={{
                          height: 10,
                          borderRadius: 0,
                          background: progressTrackBg,
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 0,
                            background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                          },
                        }}
                      />
                    </Box>

                    <Stack direction="row" spacing={1} sx={{ mt: 2.2 }} alignItems="center" justifyContent="space-between">
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Tooltip title="Small win (+10%)">
                          <Button
                            onClick={() => bumpProgress(r.id, 10)}
                            variant="outlined"
                            size="small"
                            sx={{
                              borderRadius: 0,
                              fontWeight: 950,
                              borderColor: alpha(theme.palette.text.primary, isDark ? 0.28 : 0.20),
                              color: theme.palette.text.primary,
                            }}
                          >
                            +10
                          </Button>
                        </Tooltip>

                        <Tooltip title="Big win (+25%)">
                          <Button
                            onClick={() => bumpProgress(r.id, 25)}
                            variant="outlined"
                            size="small"
                            sx={{
                              borderRadius: 0,
                              fontWeight: 950,
                              borderColor: alpha(theme.palette.text.primary, isDark ? 0.28 : 0.20),
                              color: theme.palette.text.primary,
                            }}
                          >
                            +25
                          </Button>
                        </Tooltip>

                        <Tooltip title="Mark complete">
                          <Button
                            onClick={() => markDone(r.id)}
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<Done />}
                            sx={{
                              borderRadius: 0,
                              fontWeight: 950,
                              boxShadow: isDark ? "0 14px 35px rgba(0,0,0,0.35)" : "0 12px 26px rgba(34,197,94,0.20)",
                              "&:active": { transform: "scale(0.98)" },
                            }}
                          >
                            Done
                          </Button>
                        </Tooltip>
                      </Stack>

                      {r.ctaHref ? (
                        <Button
                          component={Link}
                          href={r.ctaHref}
                          size="small"
                          endIcon={<ArrowForward />}
                          sx={{ borderRadius: 0, fontWeight: 950, color: theme.palette.text.primary }}
                        >
                          {r.ctaLabel || "Open"}
                        </Button>
                      ) : (
                        <Chip label="No action" size="small" sx={pillSx} />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={2200}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          severity={toast.type}
          variant="filled"
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          sx={{ borderRadius: 0 }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
