"use client";

import { useEffect, useMemo, useState, useContext } from "react";
import Link from "next/link";
import { alpha, useTheme } from "@mui/material/styles";
import { ThemeCtx, ThemeName } from "../providers";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Button,
  Divider,
  Grid,
  TextField,
  InputAdornment,
  Switch,
  FormControlLabel,
  LinearProgress,
  Snackbar,
  Alert,
  Paper,
  Avatar,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  Mail,
  Phone,
  Person,
  Security,
  Notifications,
  Palette,
  DarkMode,
  LightMode,
  Save,
  Restore,
  InfoOutlined,
  CheckCircle,
  WarningAmber,
  VerifiedUser,
  ArrowForward,
} from "@mui/icons-material";

type SettingsModel = {
  email: string;
  phone: string;
  displayName: string;
  notificationsEmail: boolean;
  notificationsSMS: boolean;
  themeMode: "system" | "light" | "dark";
  marketing: boolean;
};

const STORAGE_KEY = "praxiaone_settings_v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function SettingsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

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

  const glassCardSx = useMemo(
    () => ({
      borderRadius: 0,
      overflow: "hidden",
      border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
      boxShadow: isDark ? "0 22px 90px rgba(0,0,0,0.45)" : "0 16px 60px rgba(15,23,42,0.10)",
      background: isDark
        ? `linear-gradient(180deg, ${alpha("#0f172a", 0.70)}, ${alpha("#020617", 0.60)})`
        : `linear-gradient(135deg, ${alpha("#ffffff", 0.82)}, ${alpha(
            theme.palette.primary.main,
            0.05
          )}, ${alpha(theme.palette.secondary.main, 0.04)})`,
      backdropFilter: "blur(14px)",
    }),
    [theme, isDark]
  );

  const heroSx = useMemo(
    () => ({
      ...glassCardSx,
      position: "relative" as const,
      mb: 3,
      background: isDark
        ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.20)}, ${alpha(
            theme.palette.secondary.main,
            0.16
          )}, ${alpha("#020617", 0.78)})`
        : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.14)}, ${alpha(
            theme.palette.secondary.main,
            0.10
          )}, ${alpha("#ffffff", 0.80)})`,
    }),
    [glassCardSx, theme, isDark]
  );

  const progressSx = useMemo(
    () => ({
      height: 10,
      borderRadius: 0,
      background: isDark ? alpha("#ffffff", 0.10) : "rgba(15,23,42,0.06)",
      "& .MuiLinearProgress-bar": {
        borderRadius: 0,
        background: "linear-gradient(90deg, #0ea5e9, #14b8a6)",
      },
    }),
    [isDark]
  );

  const paperSx = useMemo(
    () => ({
      p: 2,
      borderRadius: 0,
      border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
      background: isDark ? alpha("#0b1228", 0.42) : alpha("#ffffff", 0.72),
      boxShadow: isDark ? "0 14px 55px rgba(0,0,0,0.35)" : "0 10px 40px rgba(15,23,42,0.06)",
    }),
    [theme, isDark]
  );

  const stickySx = useMemo(
    () => ({
      ...glassCardSx,
      position: "sticky" as const,
      top: 18,
    }),
    [glassCardSx]
  );

  const textPrimary = isDark ? alpha("#F8FAFC", 0.96) : theme.palette.text.primary;
  const textSecondary = isDark ? alpha("#E2E8F0", 0.72) : theme.palette.text.secondary;

  const { themeName, setThemeName } = useContext(ThemeCtx);

  const [form, setForm] = useState<SettingsModel>({
    email: "",
    phone: "",
    displayName: "",
    notificationsEmail: true,
    notificationsSMS: false,
    themeMode: "dark", // default
    marketing: false,
  });

  const [toast, setToast] = useState<{
    open: boolean;
    msg: string;
    type: "success" | "info" | "warning" | "error";
  }>({ open: false, msg: "", type: "success" });

  const [dirty, setDirty] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = safeParse<SettingsModel>(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      setForm((p) => ({ ...p, ...saved }));
    } else {
      // Sync initial state with current global theme
      setForm(p => ({ ...p, themeMode: themeName as any }));
    }
  }, []);

  const completeness = useMemo(() => {
    const fields = [
      Boolean(form.displayName?.trim()),
      Boolean(form.email?.trim()),
      Boolean(form.phone?.trim()),
      true,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [form]);

  const status = useMemo(() => {
    if (completeness >= 80) return { label: "Profile settings: Complete", ok: true };
    if (completeness >= 50) return { label: "Profile settings: Partial", ok: false };
    return { label: "Profile settings: Minimal", ok: false };
  }, [completeness]);

  const initials = useMemo(() => {
    const name = form.displayName.trim();
    if (!name) return "P";
    const parts = name.split(" ").filter(Boolean);
    return (parts[0]?.[0] || "P").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
  }, [form.displayName]);

  const onChange = <K extends keyof SettingsModel>(key: K, value: SettingsModel[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    
    // Immediate reactive theme feedback
    if (key === "themeMode") {
      setThemeName(value as ThemeName);
    }
  };

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      setDirty(false);
      setToast({ open: true, msg: "Settings saved (demo) ✅", type: "success" });
    } catch {
      setToast({ open: true, msg: "Could not save settings in browser storage.", type: "error" });
    }
  };

  const reset = () => {
    const saved = safeParse<SettingsModel>(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      setForm((p) => ({ ...p, ...saved }));
      setThemeName(saved.themeMode as ThemeName);
      setToast({ open: true, msg: "Reverted to last saved settings.", type: "info" });
    } else {
      setForm({
        email: "",
        phone: "",
        displayName: "",
        notificationsEmail: true,
        notificationsSMS: false,
        themeMode: "dark",
        marketing: false,
      });
      setThemeName("dark");
      setToast({ open: true, msg: "Reset to defaults (demo).", type: "info" });
    }
    setDirty(false);
  };

  return (
    <Box
      suppressHydrationWarning
      sx={{
        minHeight: "calc(100vh - 24px)",
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
      {/* HERO */}
      <Card sx={heroSx}>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: isDark
              ? `radial-gradient(760px 240px at 18% 38%, ${alpha(
                  theme.palette.primary.main,
                  0.22
                )}, transparent 60%),
                 radial-gradient(680px 240px at 82% 30%, ${alpha(
                   theme.palette.secondary.main,
                   0.20
                 )}, transparent 55%)`
              : `radial-gradient(760px 240px at 18% 38%, ${alpha(
                  theme.palette.primary.main,
                  0.18
                )}, transparent 60%),
                 radial-gradient(680px 240px at 82% 30%, ${alpha(
                   theme.palette.secondary.main,
                   0.14
                 )}, transparent 55%)`,
          }}
        />

        <CardContent sx={{ position: "relative", py: 3 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            spacing={2}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  width: 54,
                  height: 54,
                  fontWeight: 950,
                  boxShadow: isDark ? "0 18px 55px rgba(0,0,0,0.45)" : "0 18px 40px rgba(15,23,42,0.10)",
                  background: isDark ? alpha("#0b1228", 0.55) : alpha("#ffffff", 0.80),
                  color: isDark ? alpha("#E2E8F0", 0.90) : "rgba(2,132,199,1)",
                  border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.10)}`,
                }}
              >
                {initials}
              </Avatar>

              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.6, flexWrap: "wrap" }}>
                  <Chip
                    icon={<SettingsIcon sx={{ fontSize: 18 }} />}
                    label="Settings"
                    size="small"
                    sx={{
                      fontWeight: 950,
                      borderRadius: 0,
                      background: isDark ? alpha(theme.palette.primary.main, 0.20) : alpha(theme.palette.primary.main, 0.12),
                      border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.16 : 0.10)}`,
                      color: isDark ? alpha("#E2E8F0", 0.90) : theme.palette.text.primary,
                    }}
                  />
                  <Chip
                    icon={<VerifiedUser sx={{ fontSize: 18 }} />}
                    label="User-controlled"
                    size="small"
                    sx={{
                      fontWeight: 950,
                      borderRadius: 0,
                      background: isDark ? alpha("#0b1228", 0.45) : alpha("#ffffff", 0.74),
                      border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.16 : 0.10)}`,
                      color: isDark ? alpha("#E2E8F0", 0.90) : theme.palette.text.primary,
                    }}
                  />
                  <Chip
                    icon={status.ok ? <CheckCircle sx={{ fontSize: 18 }} /> : <WarningAmber sx={{ fontSize: 18 }} />}
                    label={status.label}
                    size="small"
                    sx={{
                      fontWeight: 950,
                      borderRadius: 0,
                      background: isDark ? alpha("#0b1228", 0.45) : alpha("#ffffff", 0.74),
                      border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.16 : 0.10)}`,
                      color: isDark ? alpha("#E2E8F0", 0.90) : theme.palette.text.primary,
                    }}
                  />
                </Stack>

                <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: -0.8, color: textPrimary }}>
                  Account & Preferences
                </Typography>
                <Typography sx={{ color: textSecondary }}>
                  Update contact info, notifications and appearance (demo settings saved in browser).
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={1.2} sx={{ minWidth: { xs: "100%", md: 420 } }}>
              <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", md: "flex-end" }} alignItems="center">
                <Chip
                  label={dirty ? "Unsaved changes" : "Saved"}
                  color={dirty ? "warning" : "success"}
                  sx={{
                    fontWeight: 950,
                    borderRadius: 0,
                    background: isDark ? alpha("#0b1228", 0.45) : alpha("#ffffff", 0.78),
                    border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.16 : 0.10)}`,
                    color: isDark ? alpha("#E2E8F0", 0.90) : theme.palette.text.primary,
                  }}
                />
                <Tooltip title="This is a UI demo: settings persist in localStorage.">
                  <IconButton
                    sx={{ color: isDark ? alpha("#E2E8F0", 0.85) : undefined }}
                    onClick={() =>
                      setToast({
                        open: true,
                        msg: "Demo mode: settings are stored in localStorage only (no backend yet).",
                        type: "info",
                      })
                    }
                  >
                    <InfoOutlined />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 900, color: textSecondary }}>
                  Settings completeness: {completeness}%
                </Typography>
                <LinearProgress variant="determinate" value={completeness} sx={progressSx} />
              </Box>

              <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Restore />}
                  onClick={reset}
                  sx={{ borderRadius: 0, fontWeight: 950 }}
                >
                  Revert
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<Save />}
                  onClick={save}
                  sx={{
                    borderRadius: 0,
                    fontWeight: 950,
                    boxShadow: "0 14px 30px rgba(34,197,94,0.20)",
                    "&:active": { transform: "scale(0.98)" },
                  }}
                >
                  Save
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* LEFT */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={glassCardSx}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Person sx={{ color: isDark ? alpha("#E2E8F0", 0.85) : undefined }} />
                  <Typography sx={{ fontWeight: 950, color: textPrimary }}>Contact details</Typography>
                </Stack>

                <Chip
                  icon={<Security sx={{ fontSize: 18 }} />}
                  label="Secure by design"
                  size="small"
                  sx={{
                    fontWeight: 950,
                    borderRadius: 0,
                    background: isDark ? alpha(theme.palette.primary.main, 0.20) : alpha(theme.palette.primary.main, 0.12),
                    border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.16 : 0.10)}`,
                    color: isDark ? alpha("#E2E8F0", 0.90) : theme.palette.text.primary,
                  }}
                />
              </Stack>

              <Typography variant="body2" sx={{ mb: 2, color: textSecondary }}>
                Used for reminders and account recovery (when backend auth is enabled).
              </Typography>

              <Divider sx={{ mb: 2, opacity: isDark ? 0.15 : 0.55 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Display name"
                    value={form.displayName}
                    onChange={(e) => onChange("displayName", e.target.value)}
                    placeholder="e.g., Manas"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={form.email}
                    onChange={(e) => onChange("email", e.target.value)}
                    placeholder="name@email.com"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Mail />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={form.phone}
                    onChange={(e) => onChange("phone", e.target.value)}
                    placeholder="+91 xxxxx xxxxx"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper elevation={0} sx={{ ...paperSx, height: "100%" }}>
                    <Typography sx={{ fontWeight: 950, mb: 0.5, color: textPrimary }}>Account status</Typography>
                    <Typography variant="body2" sx={{ color: textSecondary }}>
                      Demo app: no backend auth. When enabled, you’ll see verified email/phone badges here.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2.5, opacity: isDark ? 0.15 : 0.55 }} />

              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Notifications sx={{ color: isDark ? alpha("#E2E8F0", 0.85) : undefined }} />
                <Typography sx={{ fontWeight: 950, color: textPrimary }}>Notifications</Typography>
              </Stack>

              <Typography variant="body2" sx={{ mb: 2, color: textSecondary }}>
                Choose what reminders you want (future module).
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper elevation={0} sx={paperSx}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={form.notificationsEmail}
                          onChange={(e) => onChange("notificationsEmail", e.target.checked)}
                        />
                      }
                      label="Email reminders"
                      sx={{ "& .MuiFormControlLabel-label": { fontWeight: 900, color: textPrimary } }}
                    />
                    <Typography variant="body2" sx={{ color: textSecondary }}>
                      Weekly check-ins + important alerts (demo).
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper elevation={0} sx={paperSx}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={form.notificationsSMS}
                          onChange={(e) => onChange("notificationsSMS", e.target.checked)}
                        />
                      }
                      label="SMS reminders"
                      sx={{ "& .MuiFormControlLabel-label": { fontWeight: 900, color: textPrimary } }}
                    />
                    <Typography variant="body2" sx={{ color: textSecondary }}>
                      High priority alerts only (demo).
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Paper elevation={0} sx={paperSx}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={form.marketing}
                          onChange={(e) => onChange("marketing", e.target.checked)}
                        />
                      }
                      label="Product updates (optional)"
                      sx={{ "& .MuiFormControlLabel-label": { fontWeight: 900, color: textPrimary } }}
                    />
                    <Typography variant="body2" sx={{ color: textSecondary }}>
                      Only feature updates. No spam. (demo)
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={stickySx}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Palette sx={{ color: isDark ? alpha("#E2E8F0", 0.85) : undefined }} />
                <Typography sx={{ fontWeight: 950, color: textPrimary }}>Appearance</Typography>
              </Stack>

              <Typography variant="body2" sx={{ mt: 1, color: textSecondary }}>
                You already have a theme control in the top bar — this is a settings view placeholder.
              </Typography>

              <Divider sx={{ my: 2, opacity: isDark ? 0.15 : 0.55 }} />

              <Stack spacing={1.2}>
                <Paper elevation={0} sx={paperSx}>
                  <Typography sx={{ fontWeight: 950, mb: 0.5, color: textPrimary }}>Theme mode (demo)</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button
                      size="small"
                      startIcon={<Palette />}
                      variant={mounted && form.themeMode === ("aurora" as any) ? "contained" : "outlined"}
                      onClick={() => onChange("themeMode", "aurora" as any)}
                      sx={{ borderRadius: 0, fontWeight: 950 }}
                    >
                      Aurora (Neon Green)
                    </Button>
                    <Button
                      size="small"
                      startIcon={<LightMode />}
                      variant={mounted && form.themeMode === "light" ? "contained" : "outlined"}
                      onClick={() => onChange("themeMode", "light")}
                      sx={{ borderRadius: 0, fontWeight: 950 }}
                    >
                      Light
                    </Button>
                    <Button
                      size="small"
                      startIcon={<DarkMode />}
                      variant={mounted && form.themeMode === "dark" ? "contained" : "outlined"}
                      onClick={() => onChange("themeMode", "dark")}
                      sx={{ borderRadius: 0, fontWeight: 950 }}
                    >
                      Dark
                    </Button>
                  </Stack>

                  <Typography variant="caption" sx={{ display: "block", mt: 1, color: textSecondary }}>
                    (Optional) Later we can sync this with your top-bar theme dropdown.
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    ...paperSx,
                    background: isDark ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.primary.main, 0.08),
                    borderColor: alpha(theme.palette.primary.main, isDark ? 0.22 : 0.14),
                  }}
                >
                  <Typography sx={{ fontWeight: 950, color: textPrimary }}>Quick navigation</Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: textSecondary }}>
                    Settings affect privacy + AI unlock flow.
                  </Typography>
                  <Button
                    component={Link}
                    href="/consent"
                    variant="outlined"
                    endIcon={<ArrowForward />}
                    sx={{ borderRadius: 0, fontWeight: 950 }}
                  >
                    Go to Consent
                  </Button>
                </Paper>
              </Stack>

              <Divider sx={{ my: 2, opacity: isDark ? 0.15 : 0.55 }} />

              <Button
                fullWidth
                onClick={save}
                variant="contained"
                color="success"
                startIcon={<Save />}
                sx={{
                  borderRadius: 0,
                  fontWeight: 950,
                  py: 1.1,
                  boxShadow: "0 14px 30px rgba(34,197,94,0.20)",
                  "&:active": { transform: "scale(0.98)" },
                }}
              >
                Save settings
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={toast.open}
        autoHideDuration={2400}
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
