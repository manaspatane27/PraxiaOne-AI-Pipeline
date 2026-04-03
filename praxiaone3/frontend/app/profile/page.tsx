"use client";

import { useEffect, useMemo, useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  TextField,
  Chip,
  LinearProgress,
  Grid,
  Divider,
  Snackbar,
  Alert,
  InputAdornment,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  Person,
  Straighten,
  MonitorWeight,
  CalendarMonth,
  InfoOutlined,
  Bolt,
  VerifiedUser,
} from "@mui/icons-material";

import { apiFetch } from "@/lib/api";

type BackendProfile = {
  id?: number;
  user?: number;
  full_name: string;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  diet_preference: string;
  notes: string;
  updated_at?: string;
};

type UiProfile = {
  full_name: string;
  age: string;
  height_cm: string;
  weight_kg: string;
  diet_preference: "Vegetarian" | "Non-Veg" | "Vegan" | "";
  notes: string;
  updated_at?: string;
};

function safeNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function bmiCategory(bmi: number) {
  if (!Number.isFinite(bmi)) return { label: "--", hint: "Add height + weight" };
  if (bmi < 18.5) return { label: "Underweight", hint: "Consider gradual healthy gain." };
  if (bmi < 25) return { label: "Normal", hint: "Great baseline — maintain consistency." };
  if (bmi < 30) return { label: "Overweight", hint: "Small changes = big wins." };
  return { label: "Obese", hint: "Start gentle — build sustainable habits." };
}

function toUi(b: BackendProfile): UiProfile {
  return {
    full_name: b.full_name || "",
    age: b.age === null || b.age === undefined ? "" : String(b.age),
    height_cm: b.height_cm === null || b.height_cm === undefined ? "" : String(b.height_cm),
    weight_kg: b.weight_kg === null || b.weight_kg === undefined ? "" : String(b.weight_kg),
    diet_preference: (b.diet_preference as any) || "Vegetarian",
    notes: b.notes || "",
    updated_at: b.updated_at,
  };
}

function toBackend(u: UiProfile): BackendProfile {
  const age = u.age.trim() === "" ? null : Number(u.age);
  const h = u.height_cm.trim() === "" ? null : Number(u.height_cm);
  const w = u.weight_kg.trim() === "" ? null : Number(u.weight_kg);

  return {
    full_name: u.full_name || "",
    age: Number.isFinite(age as any) ? (age as any) : null,
    height_cm: Number.isFinite(h as any) ? (h as any) : null,
    weight_kg: Number.isFinite(w as any) ? (w as any) : null,
    diet_preference: u.diet_preference || "",
    notes: u.notes || "",
  };
}

export default function ProfilePage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [data, setData] = useState<UiProfile>({
    full_name: "",
    age: "",
    height_cm: "",
    weight_kg: "",
    diet_preference: "Vegetarian",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [toast, setToast] = useState<{ open: boolean; msg: string; type: "success" | "error" }>(
    { open: false, msg: "", type: "success" }
  );

  // computed
  const heightCm = safeNum(data.height_cm);
  const weightKg = safeNum(data.weight_kg);

  const bmi = useMemo(() => {
    if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg) || heightCm <= 0) return NaN;
    return weightKg / ((heightCm / 100) ** 2);
  }, [heightCm, weightKg]);

  const bmiText = Number.isFinite(bmi) ? bmi.toFixed(1) : "--";
  const bmiMeta = bmiCategory(bmi);

  const completion = useMemo(() => {
    const fields = [
      data.full_name?.trim(),
      data.age?.trim(),
      data.height_cm?.trim(),
      data.weight_kg?.trim(),
      data.diet_preference?.trim(),
      data.notes?.trim(),
    ];
    const filled = fields.filter((x) => String(x ?? "").trim().length > 0).length;
    return Math.min(100, Math.round((filled / fields.length) * 100));
  }, [data]);

  const lastSavedLabel = useMemo(() => {
    const d = data.updated_at ? new Date(data.updated_at) : null;
    if (!d || Number.isNaN(d.getTime())) return "Not saved yet";
    return `Last saved: ${d.toLocaleString()}`;
  }, [data.updated_at]);

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
      boxShadow: isDark ? "0 28px 110px rgba(0,0,0,0.55)" : "0 16px 60px rgba(15,23,42,0.10)",
      overflow: "hidden" as const,
      background: isDark
        ? `linear-gradient(180deg, ${alpha("#0f172a", 0.82)}, ${alpha("#020617", 0.72)})`
        : `linear-gradient(180deg, ${alpha("#ffffff", 0.82)}, ${alpha("#ffffff", 0.58)})`,
      backdropFilter: "blur(12px)",
    }),
    [theme, isDark]
  );

  const pill = useMemo(
    () => ({
      fontWeight: 900,
      borderRadius: 0,
      border: 0,
      background: alpha(theme.palette.primary.main, isDark ? 0.18 : 0.12),
      color: isDark ? alpha("#E2E8F0", 0.92) : theme.palette.text.primary,
    }),
    [theme, isDark]
  );

  // ✅ Load profile from backend
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingInitial(true);
      try {
        const p = await apiFetch<BackendProfile>("/profile/", { method: "GET" });
        if (!mounted) return;
        setData(toUi(p));
      } catch {
        // If not logged in, keep editable UI but show it as "not saved yet"
      } finally {
        if (mounted) setLoadingInitial(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const saveProfile = async () => {
    setLoading(true);
    try {
      const payload = toBackend(data);
      const saved = await apiFetch<BackendProfile>("/profile/", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setData(toUi(saved));
      setToast({ open: true, msg: "Profile saved to server ✅", type: "success" });
    } catch (e: any) {
      setToast({
        open: true,
        msg: "Save failed ❌ (Are you logged in / server running?)",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
        background: pageBg,
        animation: "fadeIn .35s ease-out",
        "@keyframes fadeIn": {
          from: { opacity: 0, transform: "translateY(6px)" },
          to: { opacity: 1, transform: "translateY(0px)" },
        },
      }}
    >
      <Card sx={{ ...surfaceCard, mb: 3, position: "relative" }}>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: isDark
              ? `radial-gradient(900px 300px at 18% 35%, ${alpha(theme.palette.primary.main, 0.22)}, transparent 60%),
                 radial-gradient(800px 320px at 80% 30%, ${alpha(theme.palette.secondary.main, 0.18)}, transparent 55%)`
              : `radial-gradient(700px 220px at 18% 35%, ${alpha(theme.palette.primary.main, 0.16)}, transparent 60%),
                 radial-gradient(600px 240px at 80% 30%, ${alpha(theme.palette.secondary.main, 0.14)}, transparent 55%)`,
          }}
        />

        <CardContent sx={{ position: "relative", py: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.7 }} flexWrap="wrap">
                <Chip icon={<Bolt sx={{ fontSize: 18 }} />} label="AI-ready profile" size="small" sx={pill} />
                <Chip
                  icon={<VerifiedUser sx={{ fontSize: 18 }} />}
                  label="Server-backed"
                  size="small"
                  sx={{ ...pill, background: alpha(theme.palette.secondary.main, isDark ? 0.18 : 0.12) }}
                />
              </Stack>

              <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: -0.8 }}>
                Profile Setup
              </Typography>
              <Typography sx={{ color: isDark ? alpha("#E2E8F0", 0.72) : theme.palette.text.secondary }}>
                Saved to server (Django) so other modules can use it with consent.
              </Typography>
            </Box>

            <Box sx={{ minWidth: 220, textAlign: "right" }}>
              <Typography variant="caption" sx={{ color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}>
                Profile completeness
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                <Box sx={{ width: 160 }}>
                  <LinearProgress
                    variant="determinate"
                    value={completion}
                    sx={{
                      height: 10,
                      borderRadius: 0,
                      backgroundColor: alpha(theme.palette.text.primary, isDark ? 0.12 : 0.08),
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 0,
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      },
                    }}
                  />
                </Box>

                <Chip
                  label={`${completion}%`}
                  size="small"
                  sx={{
                    fontWeight: 950,
                    borderRadius: 0,
                    background: alpha(theme.palette.text.primary, isDark ? 0.10 : 0.06),
                    color: isDark ? alpha("#E2E8F0", 0.92) : theme.palette.text.primary,
                  }}
                />
              </Stack>

              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 0.8,
                  color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary,
                }}
              >
                {loadingInitial ? "Loading..." : lastSavedLabel}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3} alignItems="stretch">
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={surfaceCard}>
            <Box
              sx={{
                px: 3,
                py: 2,
                borderBottom: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.12 : 0.10)}`,
                background: isDark
                  ? `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.16)}, ${alpha(theme.palette.secondary.main, 0.10)})`
                  : `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.10)}, ${alpha(theme.palette.secondary.main, 0.06)})`,
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography sx={{ fontWeight: 900 }}>Basic details</Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="caption" sx={{ color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}>
                    Tip: More details → better insights
                  </Typography>
                  <Tooltip title="Only consented categories are used for AI insights.">
                    <IconButton size="small">
                      <InfoOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Box>

            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={data.full_name}
                    onChange={(e) => setData({ ...data, full_name: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Age"
                    value={data.age}
                    onChange={(e) => setData({ ...data, age: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarMonth fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Height (cm)"
                    value={data.height_cm}
                    onChange={(e) => setData({ ...data, height_cm: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Straighten fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Weight (kg)"
                    value={data.weight_kg}
                    onChange={(e) => setData({ ...data, weight_kg: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MonitorWeight fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" sx={{ display: "block", mb: 1, color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}>
                    Diet preference
                  </Typography>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {(["Vegetarian", "Non-Veg", "Vegan"] as const).map((d) => {
                      const selected = data.diet_preference === d;
                      return (
                        <Chip
                          key={d}
                          label={d}
                          onClick={() => setData({ ...data, diet_preference: d })}
                          sx={{
                            fontWeight: 900,
                            borderRadius: 0,
                            px: 0.6,
                            cursor: "pointer",
                            background: selected
                              ? alpha(theme.palette.success.main, isDark ? 0.22 : 0.14)
                              : alpha(theme.palette.text.primary, isDark ? 0.10 : 0.06),
                          }}
                        />
                      );
                    })}
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Notes / Preferences"
                    multiline
                    rows={3}
                    value={data.notes}
                    onChange={(e) => setData({ ...data, notes: e.target.value })}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2.5, opacity: isDark ? 0.12 : 0.25 }} />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center" justifyContent="space-between">
                <Typography variant="caption" sx={{ color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}>
                  Saved to backend so AI + other screens can use it (with consent).
                </Typography>

                <Button
                  variant="contained"
                  color="success"
                  onClick={saveProfile}
                  disabled={loading}
                  sx={{ borderRadius: 0, fontWeight: 950, px: 3 }}
                >
                  {loading ? "Saving..." : "Save Profile"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={surfaceCard}>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 950, mb: 0.4 }}>Your profile preview</Typography>
              <Typography variant="caption" sx={{ color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}>
                BMI + diet summary
              </Typography>

              <Divider sx={{ my: 2, opacity: isDark ? 0.12 : 0.25 }} />

              <Stack spacing={1}>
                <Row label="Name" value={data.full_name?.trim() || "--"} />
                <Row label="Diet" value={data.diet_preference || "--"} />
                <Row label="BMI" value={bmiText} />
                <Row label="BMI Category" value={bmiMeta.label} />
              </Stack>

              <Box
                sx={{
                  mt: 2,
                  p: 1.3,
                  borderRadius: 0,
                  background: alpha(theme.palette.primary.main, isDark ? 0.14 : 0.10),
                  border: `1px solid ${alpha(theme.palette.primary.main, isDark ? 0.22 : 0.16)}`,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 900 }}>
                  Insight hint:
                </Typography>
                <Typography variant="caption" sx={{ display: "block", opacity: 0.8 }}>
                  {bmiMeta.hint}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={toast.open} autoHideDuration={2200} onClose={() => setToast((t) => ({ ...t, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "left" }}>
        <Alert severity={toast.type} variant="filled" onClose={() => setToast((t) => ({ ...t, open: false }))} sx={{ borderRadius: 0 }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" sx={{ fontWeight: 800 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}>
        {value}
      </Typography>
    </Stack>
  );
}
