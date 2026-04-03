"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { alpha, useTheme } from "@mui/material/styles";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Chip,
  Grid,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  IconButton,
  Radio,
} from "@mui/material";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import MonitorHeartRoundedIcon from "@mui/icons-material/MonitorHeartRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import LocalHospitalRoundedIcon from "@mui/icons-material/LocalHospitalRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";

type SourceKey = "self" | "labs" | "care" | "wearables" | "ehr";
type SourceStatus = "connected" | "not_connected" | "coming_soon" | "optional";

type Source = {
  key: SourceKey;
  title: string;
  subtitle: string;
  status: SourceStatus;
  aiUse: string;
  icon: React.ReactNode;
  primaryAction: { label: string; onClick: () => void; variant?: "contained" | "outlined" };
  secondaryAction?: { label: string; onClick: () => void; variant?: "contained" | "outlined" };
};

/** Theme-aware glass surface (NO hardcoded colors) */
function useSurfaceStyles() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const border = `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.10)}`;

  const cardBg = isDark
    ? `linear-gradient(180deg,
        ${alpha(theme.palette.background.paper, 0.26)},
        ${alpha(theme.palette.background.paper, 0.14)}
      )`
    : `linear-gradient(180deg,
        ${alpha("#ffffff", 0.92)},
        ${alpha("#ffffff", 0.72)}
      )`;

  const glow = isDark
    ? `
      radial-gradient(900px 420px at 12% 10%, ${alpha(theme.palette.primary.main, 0.20)}, transparent 60%),
      radial-gradient(820px 380px at 90% 0%, ${alpha(theme.palette.secondary.main, 0.18)}, transparent 58%),
      radial-gradient(760px 360px at 50% 110%, ${alpha(theme.palette.success.main, 0.12)}, transparent 60%)
    `
    : `
      radial-gradient(900px 420px at 12% 10%, ${alpha(theme.palette.primary.main, 0.12)}, transparent 62%),
      radial-gradient(820px 380px at 90% 0%, ${alpha(theme.palette.secondary.main, 0.10)}, transparent 60%)
    `;

  const pageBg = isDark
    ? `
      radial-gradient(1200px 700px at 15% 0%, ${alpha(theme.palette.primary.main, 0.22)}, transparent 60%),
      radial-gradient(1000px 600px at 85% 15%, ${alpha(theme.palette.secondary.main, 0.20)}, transparent 55%),
      radial-gradient(900px 520px at 50% 110%, ${alpha(theme.palette.success.main, 0.12)}, transparent 55%),
      linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.default} 100%)
    `
    : `
      radial-gradient(1100px 560px at 12% 0%, ${alpha(theme.palette.primary.main, 0.12)}, transparent 60%),
      radial-gradient(900px 520px at 90% 10%, ${alpha(theme.palette.secondary.main, 0.10)}, transparent 60%),
      linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.default} 100%)
    `;

  const shadow = isDark ? "0 30px 95px rgba(0,0,0,0.55)" : "0 22px 70px rgba(2,6,23,0.10)";

  return { theme, isDark, border, cardBg, glow, shadow, pageBg };
}

function GlassCard({ children, sx }: { children: React.ReactNode; sx?: any }) {
  const { border, cardBg, glow, shadow } = useSurfaceStyles();

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

function StatusPill({ status }: { status: SourceStatus }) {
  const { theme, isDark, border } = useSurfaceStyles();

  const map: Record<SourceStatus, { label: string; bg: string }> = {
    connected: {
      label: "Connected",
      bg: `linear-gradient(90deg, ${alpha(theme.palette.success.main, isDark ? 0.22 : 0.18)}, ${alpha(
        theme.palette.success.main,
        isDark ? 0.12 : 0.10
      )})`,
    },
    not_connected: {
      label: "Not connected",
      bg: `linear-gradient(90deg, ${alpha(theme.palette.text.secondary, isDark ? 0.22 : 0.18)}, ${alpha(
        theme.palette.text.secondary,
        isDark ? 0.10 : 0.08
      )})`,
    },
    coming_soon: {
      label: "Coming soon",
      bg: `linear-gradient(90deg, ${alpha(theme.palette.warning.main, isDark ? 0.22 : 0.18)}, ${alpha(
        theme.palette.warning.main,
        isDark ? 0.12 : 0.10
      )})`,
    },
    optional: {
      label: "Optional",
      bg: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, isDark ? 0.18 : 0.14)}, ${alpha(
        theme.palette.secondary.main,
        isDark ? 0.14 : 0.10
      )})`,
    },
  };

  const cfg = map[status];

  return (
    <Chip
      size="small"
      label={cfg.label}
      sx={{
        borderRadius: 0,
        fontWeight: 900,
        px: 0.8,
        background: cfg.bg,
        border,
        color: theme.palette.text.primary,
      }}
    />
  );
}

function SourceCard({ source }: { source: Source }) {
  const { theme, isDark, border } = useSurfaceStyles();
  const disabledPrimary = source.status === "coming_soon";
  const disabledSecondary = source.status === "coming_soon";

  return (
    <GlassCard sx={{ height: "100%" }}>
      <CardContent sx={{ p: { xs: 2.2, md: 2.8 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: 0,
                display: "grid",
                placeItems: "center",
                border,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.16)}, ${alpha(
                  theme.palette.secondary.main,
                  0.14
                )})`,
                color: theme.palette.text.primary,
              }}
            >
              {source.icon}
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 950, lineHeight: 1.1 }} noWrap>
                {source.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.2 }}>
                {source.subtitle}
              </Typography>
            </Box>
          </Stack>

          <StatusPill status={source.status} />
        </Stack>

        <Divider sx={{ my: 1.8, opacity: isDark ? 0.16 : 0.26 }} />

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.6 }}>
          AI use:
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {source.aiUse}
        </Typography>

        <Stack direction="row" spacing={1.2} flexWrap="wrap">
          <Button
            variant={source.primaryAction.variant ?? "contained"}
            color="success"
            disabled={disabledPrimary}
            onClick={source.primaryAction.onClick}
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{
              borderRadius: 0,
              fontWeight: 950,
              px: 2.2,
              boxShadow: isDark ? "0 16px 44px rgba(34,197,94,0.22)" : "0 14px 36px rgba(34,197,94,0.18)",
            }}
          >
            {source.primaryAction.label}
          </Button>

          {source.secondaryAction && (
            <Button
              variant={source.secondaryAction.variant ?? "outlined"}
              disabled={disabledSecondary}
              onClick={source.secondaryAction.onClick}
              sx={{
                borderRadius: 0,
                fontWeight: 950,
                px: 2.2,
                borderColor: alpha(theme.palette.text.primary, isDark ? 0.26 : 0.18),
                "&:hover": {
                  borderColor: alpha(theme.palette.text.primary, isDark ? 0.42 : 0.26),
                  background: alpha(theme.palette.text.primary, isDark ? 0.06 : 0.04),
                },
              }}
            >
              {source.secondaryAction.label}
            </Button>
          )}
        </Stack>
      </CardContent>
    </GlassCard>
  );
}

export default function DataSourcesPage() {
  const router = useRouter();
  const { theme, isDark, border, pageBg } = useSurfaceStyles();

  // Demo toggles
  const [isLoaded, setIsLoaded] = useState(false);
  const [consentGranted, setConsentGranted] = useState(false);
  const [connected, setConnected] = useState<Record<SourceKey, boolean>>({
    self: true,
    labs: false,
    care: false,
    wearables: false,
    ehr: false,
  });

  // Load persisted state safely on client side
  React.useEffect(() => {
    try {
      const storedConnections = localStorage.getItem("praxia_data_connected");
      if (storedConnections) setConnected(JSON.parse(storedConnections));
      
      const storedConsent = localStorage.getItem("praxia_data_consent");
      if (storedConsent !== null) setConsentGranted(JSON.parse(storedConsent));
    } catch (e) {
      console.error("Could not load stored data connections", e);
    }
    // Only after reading from storage do we toggle the green light to allow saves
    setIsLoaded(true);
  }, []);

  // Sync state to storage instantly (ONLY once initial data has been injected)
  React.useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("praxia_data_connected", JSON.stringify(connected));
    }
  }, [connected, isLoaded]);

  React.useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("praxia_data_consent", JSON.stringify(consentGranted));
    }
  }, [consentGranted, isLoaded]);

  const connectedCount = useMemo(() => Object.values(connected).filter(Boolean).length, [connected]);

  const dataCoverage = useMemo(() => {
    let v = 0;
    if (connected.self) v += 20;
    if (connected.labs) v += 25;
    if (connected.care) v += 20;
    if (connected.wearables) v += 25;
    if (connected.ehr) v += 10;
    return Math.min(100, v);
  }, [connected]);

  const aiBlocked = !consentGranted || dataCoverage < 40;

  const sources: Source[] = useMemo(
    () => [
      {
        key: "self",
        title: "Self-reported",
        subtitle: "Daily inputs like weight, sleep, mood, symptoms, and goals.",
        status: connected.self ? "connected" : "not_connected",
        aiUse: "Helps personalize insights using your goals + self inputs.",
        icon: <StorageRoundedIcon />,
        primaryAction: {
          label: connected.self ? "Manage" : "Connect",
          onClick: () => setConnected((p) => ({ ...p, self: true })),
        },
        secondaryAction: {
          label: "Go to Vitals",
          onClick: () => router.push("/vitals"),
          variant: "outlined",
        },
      },
      {
        key: "labs",
        title: "Labs (Upload)",
        subtitle: "Upload PDF lab reports. We extract key trends (with consent).",
        status: connected.labs ? "connected" : "not_connected",
        aiUse: "Adds biomarker trends to explanations (never raw data without consent).",
        icon: <ScienceRoundedIcon />,
        primaryAction: { label: "Upload Labs", onClick: () => router.push("/upload/lab-results") },
        secondaryAction: {
          label: connected.labs ? "Connected" : "Mark as Connected",
          onClick: () => setConnected((p) => ({ ...p, labs: true })),
          variant: "outlined",
        },
      },
      {
        key: "care",
        title: "Care Plans (Upload)",
        subtitle: "Upload your care plan PDFs to align recommendations with guidance.",
        status: connected.care ? "connected" : "not_connected",
        aiUse: "Keeps suggestions aligned to your plan (scope-limited by consent).",
        icon: <DescriptionRoundedIcon />,
        primaryAction: { label: "Upload Care Plan", onClick: () => router.push("/upload/care-plan") },
        secondaryAction: {
          label: connected.care ? "Connected" : "Mark as Connected",
          onClick: () => setConnected((p) => ({ ...p, care: true })),
          variant: "outlined",
        },
      },
      {
        key: "wearables",
        title: "Wearables & Vitals",
        subtitle: "Sync activity, heart rate, sleep, and trends from devices.",
        status: connected.wearables ? "connected" : "not_connected",
        aiUse: "Enables trend-based insights (sleep/activity/HR patterns).",
        icon: <MonitorHeartRoundedIcon />,
        primaryAction: { label: "Go to Wearables", onClick: () => router.push("/wearables") },
        secondaryAction: { label: "Go to Vitals", onClick: () => router.push("/vitals"), variant: "outlined" },
      },
      {
        key: "ehr",
        title: "EHR (Optional)",
        subtitle: "Optional integration with clinical records (requires explicit consent).",
        status: "optional",
        aiUse: "Optional clinical context (only used if you explicitly consent).",
        icon: <LocalHospitalRoundedIcon />,
        primaryAction: { label: "Request Access", onClick: () => setConnected((p) => ({ ...p, ehr: true })) },
        secondaryAction: { label: "Learn More", onClick: () => router.push("/consent"), variant: "outlined" },
      },
    ],
    [connected, router]
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
      {/* Header */}
      <GlassCard sx={{ mb: 3 }}>
        {/* Accent bar like your screenshot */}
        <Box
          sx={{
            height: 6,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          }}
        />
        <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
          >
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h4" sx={{ fontWeight: 950 }}>
                  Data Sources
                </Typography>

                <Tooltip title="PraxiaOne only uses data you consent to. You can change this anytime.">
                  <IconButton size="small" sx={{ ml: 0.5 }}>
                    <InfoOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Typography color="text.secondary" sx={{ mt: 0.4 }}>
                Connect and manage the data PraxiaOne can use — always controlled by your consent.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
              <Chip
                icon={<ShieldRoundedIcon />}
                label={`Consent: ${consentGranted ? "Granted" : "Partial"}`}
                sx={{
                  borderRadius: 0,
                  fontWeight: 950,
                  background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.14)}, ${alpha(
                    theme.palette.secondary.main,
                    0.12
                  )})`,
                  border,
                  color: theme.palette.text.primary,
                }}
              />

              <Chip
                label={`${connectedCount}/5 connected`}
                sx={{
                  borderRadius: 0,
                  fontWeight: 950,
                  background: alpha(theme.palette.background.paper, isDark ? 0.18 : 0.65),
                  border,
                  color: theme.palette.text.primary,
                }}
              />

              <Button
                variant="outlined"
                onClick={() => setConsentGranted((v) => !v)}
                sx={{
                  borderRadius: 0,
                  fontWeight: 950,
                  px: 2.2,
                  borderColor: alpha(theme.palette.text.primary, isDark ? 0.26 : 0.18),
                  "&:hover": {
                    borderColor: alpha(theme.palette.text.primary, isDark ? 0.42 : 0.26),
                    background: alpha(theme.palette.text.primary, isDark ? 0.06 : 0.04),
                  },
                }}
              >
                Toggle Consent (Demo)
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </GlassCard>

      <Grid container spacing={3} alignItems="stretch">
        {/* Main */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Grid container spacing={2.4} alignItems="stretch">
            <Grid size={{ xs: 12, md: 6 }}>
              <SourceCard source={sources[0]} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <SourceCard source={sources[1]} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <SourceCard source={sources[2]} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <SourceCard source={sources[3]} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <SourceCard source={sources[4]} />
            </Grid>
          </Grid>
        </Grid>

        {/* Right rail */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2.4}>
            {/* Data coverage */}
            <GlassCard>
              <CardContent sx={{ p: 2.6 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography sx={{ fontWeight: 950 }}>Data coverage</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Connecting more sources improves personalization (within your consent).
                    </Typography>
                  </Box>

                  <Chip
                    label={`${dataCoverage}%`}
                    sx={{
                      borderRadius: 0,
                      fontWeight: 950,
                      background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.16)}, ${alpha(
                        theme.palette.secondary.main,
                        0.14
                      )})`,
                      border,
                      color: theme.palette.text.primary,
                    }}
                  />
                </Stack>

                <Box sx={{ mt: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={dataCoverage}
                    sx={{
                      height: 12,
                      borderRadius: 0,
                      backgroundColor: alpha(theme.palette.text.primary, isDark ? 0.10 : 0.08),
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 0,
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      },
                    }}
                  />
                </Box>

                <Stack direction="row" spacing={1} sx={{ mt: 1.6 }} flexWrap="wrap">
                  {connected.self && <Chip size="small" label="Self-reported" sx={{ borderRadius: 0, fontWeight: 800 }} />}
                  {connected.labs && <Chip size="small" label="Labs" sx={{ borderRadius: 0, fontWeight: 800 }} />}
                  {connected.care && <Chip size="small" label="Care plan" sx={{ borderRadius: 0, fontWeight: 800 }} />}
                  {connected.wearables && <Chip size="small" label="Wearables" sx={{ borderRadius: 0, fontWeight: 800 }} />}
                  {connected.ehr && <Chip size="small" label="EHR" sx={{ borderRadius: 0, fontWeight: 800 }} />}
                </Stack>

                <Divider sx={{ my: 1.8, opacity: isDark ? 0.16 : 0.26 }} />

                <Stack direction="row" spacing={1} alignItems="center">
                  <CheckCircleRoundedIcon color="success" fontSize="small" />
                  <Typography variant="body2">
                    Next step: <b>Complete consent</b> to unlock AI insights.
                  </Typography>
                </Stack>
              </CardContent>
            </GlassCard>

            {/* AI readiness */}
            <GlassCard>
              <CardContent sx={{ p: 2.6 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 0,
                        display: "grid",
                        placeItems: "center",
                        border,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.16)}, ${alpha(
                          theme.palette.secondary.main,
                          0.14
                        )})`,
                      }}
                    >
                      <AutoAwesomeRoundedIcon />
                    </Box>

                    <Box>
                      <Typography sx={{ fontWeight: 950 }}>AI readiness</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Unlock explainable AI insights safely.
                      </Typography>
                    </Box>
                  </Stack>

                  <Chip
                    icon={aiBlocked ? <LockRoundedIcon /> : <CheckCircleRoundedIcon />}
                    label={aiBlocked ? "Blocked" : "Ready"}
                    sx={{
                      borderRadius: 0,
                      fontWeight: 950,
                      background: aiBlocked
                        ? `linear-gradient(90deg, ${alpha(theme.palette.text.secondary, 0.22)}, ${alpha(
                            theme.palette.text.secondary,
                            0.10
                          )})`
                        : `linear-gradient(90deg, ${alpha(theme.palette.success.main, 0.22)}, ${alpha(
                            theme.palette.success.main,
                            0.12
                          )})`,
                      border,
                      color: theme.palette.text.primary,
                    }}
                  />
                </Stack>

                <Divider sx={{ my: 1.8, opacity: isDark ? 0.16 : 0.26 }} />

                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Requirements:
                </Typography>

                <Stack spacing={1.2}>
                  {/* ✅ TOGGLE: Consent requirement */}
                  <Box
                    onClick={() => setConsentGranted((v) => !v)}
                    sx={{
                      cursor: "pointer",
                      borderRadius: 0,
                      px: 1,
                      py: 0.6,
                      border,
                      background: alpha(theme.palette.background.paper, isDark ? 0.16 : 0.55),
                      "&:hover": {
                        background: alpha(theme.palette.background.paper, isDark ? 0.22 : 0.7),
                      },
                      userSelect: "none",
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Radio
                        checked={consentGranted}
                        onChange={() => setConsentGranted((v) => !v)}
                        size="small"
                      />
                      <Box>
                        <Typography sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                          AI processing consent granted
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {consentGranted ? "OK" : "Needs attention"}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  {/* Coverage requirement (computed, not toggle) */}
                  <Box
                    sx={{
                      borderRadius: 0,
                      px: 1,
                      py: 0.6,
                      border,
                      background: alpha(theme.palette.background.paper, isDark ? 0.16 : 0.55),
                      userSelect: "none",
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      {dataCoverage >= 40 ? (
                        <CheckCircleRoundedIcon color="success" fontSize="small" />
                      ) : (
                        <RadioButtonUncheckedRoundedIcon color="disabled" fontSize="small" />
                      )}
                      <Box>
                        <Typography sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                          At least 40% data coverage
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {dataCoverage >= 40 ? "OK" : "Needs attention"}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Stack>

                <Stack spacing={1.2} sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    disabled={aiBlocked}
                    onClick={() => router.push("/insights")}
                    sx={{ borderRadius: 0, fontWeight: 950 }}
                  >
                    Open AI Insights
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => router.push("/consent")}
                    sx={{
                      borderRadius: 0,
                      fontWeight: 950,
                      borderColor: alpha(theme.palette.text.primary, isDark ? 0.26 : 0.18),
                      "&:hover": {
                        borderColor: alpha(theme.palette.text.primary, isDark ? 0.42 : 0.26),
                        background: alpha(theme.palette.text.primary, isDark ? 0.06 : 0.04),
                      },
                    }}
                  >
                    Manage Consent
                  </Button>
                </Stack>

                <Box
                  sx={{
                    mt: 1.8,
                    p: 1.2,
                    borderRadius: 0,
                    border,
                    background: alpha(theme.palette.primary.main, isDark ? 0.08 : 0.06),
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    AI uses only consented data categories. You can change consent anytime.
                  </Typography>
                </Box>
              </CardContent>
            </GlassCard>

            {/* Quick actions + Recent activity */}
            <Grid container spacing={2.4}>
              <Grid size={{ xs: 12, md: 6, lg: 12 }}>
                <GlassCard>
                  <CardContent sx={{ p: 2.6 }}>
                    <Typography sx={{ fontWeight: 950 }}>Quick actions</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.8 }}>
                      Upload key documents to unlock stronger guidance.
                    </Typography>

                    <Stack spacing={1.2}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<UploadFileRoundedIcon />}
                        onClick={() => router.push("/upload/lab-results")}
                        sx={{ borderRadius: 0, fontWeight: 950 }}
                      >
                        Upload Lab Results (PDF)
                      </Button>

                      <Button
                        variant="outlined"
                        startIcon={<UploadFileRoundedIcon />}
                        onClick={() => router.push("/upload/care-plan")}
                        sx={{
                          borderRadius: 0,
                          fontWeight: 950,
                          borderColor: alpha(theme.palette.text.primary, isDark ? 0.26 : 0.18),
                          "&:hover": {
                            borderColor: alpha(theme.palette.text.primary, isDark ? 0.42 : 0.26),
                            background: alpha(theme.palette.text.primary, isDark ? 0.06 : 0.04),
                          },
                        }}
                      >
                        Upload Care Plan (PDF)
                      </Button>
                    </Stack>

                    <Box
                      sx={{
                        mt: 1.8,
                        p: 1.2,
                        borderRadius: 0,
                        border,
                        background: alpha(theme.palette.success.main, isDark ? 0.08 : 0.06),
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        We only use data categories you consent to.
                      </Typography>
                    </Box>
                  </CardContent>
                </GlassCard>
              </Grid>

              <Grid size={{ xs: 12, md: 6, lg: 12 }}>
                <GlassCard>
                  <CardContent sx={{ p: 2.6 }}>
                    <Typography sx={{ fontWeight: 950 }}>Recent activity</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.4 }}>
                      A quick timeline of changes (placeholder).
                    </Typography>

                    <List disablePadding>
                      {["Consent settings reviewed", "Self-reported source active", "Labs upload ready", "Wearables integration coming soon"].map(
                        (t, idx) => (
                          <ListItem key={idx} sx={{ px: 0, py: 0.6 }}>
                            <ListItemText
                              primary={t}
                              secondary="Today"
                              primaryTypographyProps={{ sx: { fontWeight: 800 } }}
                            />
                          </ListItem>
                        )
                      )}
                    </List>
                  </CardContent>
                </GlassCard>
              </Grid>
            </Grid>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
