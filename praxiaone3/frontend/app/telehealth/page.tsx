"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
  Grid,
  TextField,
  MenuItem,
  Avatar,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  LinearProgress,
} from "@mui/material";
import {
  VideoCall,
  VerifiedUser,
  CalendarMonth,
  LocalHospital,
  Search,
  LocationOn,
  Star,
  StarBorder,
  AccessTime,
  Shield,
  ArrowForward,
  Phone,
  Chat,
  Refresh,
  InfoOutlined,
} from "@mui/icons-material";

type Provider = {
  id: string;
  name: string;
  specialty: string;
  mode: "Video" | "In-person";
  fee: number;
  rating: number; // 0-5
  years: number;
  location: string;
  nextSlot: string;
  verified: boolean;
};

const SPECIALTIES = [
  "General Physician",
  "Nutritionist",
  "Physiotherapist",
  "Dermatologist",
  "Mental Wellness",
] as const;

const MODES = ["Video", "In-person"] as const;

const sampleProviders: Provider[] = [
  {
    id: "p1",
    name: "Dr. A. Mehta",
    specialty: "General Physician",
    mode: "Video",
    fee: 499,
    rating: 4.6,
    years: 10,
    location: "Pune",
    nextSlot: "Today • 7:30 PM",
    verified: true,
  },
  {
    id: "p2",
    name: "Dr. S. Kulkarni",
    specialty: "Nutritionist",
    mode: "Video",
    fee: 699,
    rating: 4.7,
    years: 7,
    location: "Mumbai",
    nextSlot: "Tomorrow • 10:00 AM",
    verified: true,
  },
  {
    id: "p3",
    name: "Dr. N. Desai",
    specialty: "Physiotherapist",
    mode: "In-person",
    fee: 800,
    rating: 4.4,
    years: 12,
    location: "Pune",
    nextSlot: "Sat • 5:00 PM",
    verified: false,
  },
  {
    id: "p4",
    name: "Dr. R. Sharma",
    specialty: "Mental Wellness",
    mode: "Video",
    fee: 999,
    rating: 4.8,
    years: 9,
    location: "Remote",
    nextSlot: "Today • 9:00 PM",
    verified: true,
  },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function Stars({ value }: { value: number }) {
  const full = Math.floor(value);
  const total = 5;
  const icons = [];
  for (let i = 0; i < total; i++) {
    if (i < full) icons.push(<Star key={i} sx={{ fontSize: 18 }} />);
    else icons.push(<StarBorder key={i} sx={{ fontSize: 18 }} />);
  }
  return <Stack direction="row" spacing={0.2}>{icons}</Stack>;
}

export default function TelehealthPage() {
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
          )}, ${alpha("#020617", 0.75)})`
        : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.16)}, ${alpha(
            theme.palette.secondary.main,
            0.12
          )}, ${alpha("#ffffff", 0.75)})`,
    }),
    [glassCardSx, theme, isDark]
  );

  const inputSx = useMemo(
    () => ({
      "& .MuiInputBase-root": {
        borderRadius: 0,
        background: isDark ? alpha("#020617", 0.22) : alpha("#ffffff", 0.70),
        backdropFilter: "blur(10px)",
      },
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: alpha(theme.palette.text.primary, isDark ? 0.22 : 0.16),
      },
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: alpha(theme.palette.text.primary, isDark ? 0.35 : 0.22),
      },
      "& .MuiInputLabel-root": {
        color: alpha(theme.palette.text.primary, isDark ? 0.70 : 0.65),
        fontWeight: 700,
      },
    }),
    [theme, isDark]
  );

  const [specialty, setSpecialty] = useState<(typeof SPECIALTIES)[number] | "All">("All");
  const [mode, setMode] = useState<(typeof MODES)[number] | "All">("All");
  const [location, setLocation] = useState("Pune");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Provider | null>(null);

  const [toast, setToast] = useState<{
    open: boolean;
    msg: string;
    type: "success" | "info" | "error";
  }>({
    open: false,
    msg: "",
    type: "success",
  });

  const filtered = useMemo(() => {
    return sampleProviders
      .filter((p) => (specialty === "All" ? true : p.specialty === specialty))
      .filter((p) => (mode === "All" ? true : p.mode === mode))
      .filter((p) =>
        location.trim() ? p.location.toLowerCase().includes(location.toLowerCase()) : true
      )
      .filter((p) =>
        query.trim()
          ? (p.name + " " + p.specialty).toLowerCase().includes(query.toLowerCase())
          : true
      );
  }, [specialty, mode, location, query]);

  const readiness = useMemo(() => {
    let score = 30;
    if (specialty !== "All") score += 20;
    if (mode !== "All") score += 20;
    if (location.trim().length > 1) score += 15;
    if (query.trim().length > 1) score += 15;
    return clamp(score, 0, 100);
  }, [specialty, mode, location, query]);

  const book = () => {
    if (!selected) {
      setToast({ open: true, msg: "Select a provider first.", type: "info" });
      return;
    }
    setToast({
      open: true,
      msg: `Booked (demo) with ${selected.name} • ${selected.nextSlot}`,
      type: "success",
    });
  };

  const refresh = () => setToast({ open: true, msg: "Refreshed providers (demo).", type: "info" });

  return (
    <Box
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
              ? `radial-gradient(700px 220px at 18% 38%, ${alpha(
                  theme.palette.primary.main,
                  0.22
                )}, transparent 60%),
                 radial-gradient(650px 240px at 82% 30%, ${alpha(
                   theme.palette.secondary.main,
                   0.20
                 )}, transparent 55%)`
              : `radial-gradient(700px 220px at 18% 38%, ${alpha(
                  theme.palette.primary.main,
                  0.20
                )}, transparent 60%),
                 radial-gradient(650px 240px at 82% 30%, ${alpha(
                   theme.palette.secondary.main,
                   0.16
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
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.7, flexWrap: "wrap" }}>
                <Chip
                  icon={<VideoCall sx={{ fontSize: 18 }} />}
                  label="Telehealth (Optional)"
                  size="small"
                  sx={{
                    fontWeight: 900,
                    borderRadius: 0,
                    background: isDark ? alpha(theme.palette.primary.main, 0.20) : alpha(theme.palette.primary.main, 0.12),
                    border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.16 : 0.10)}`,
                    color: isDark ? alpha("#E2E8F0", 0.90) : theme.palette.text.primary,
                  }}
                />
                <Chip
                  icon={<Shield sx={{ fontSize: 18 }} />}
                  label="Consent-first"
                  size="small"
                  sx={{
                    fontWeight: 900,
                    borderRadius: 0,
                    background: isDark ? alpha(theme.palette.secondary.main, 0.18) : alpha(theme.palette.secondary.main, 0.12),
                    border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.16 : 0.10)}`,
                    color: isDark ? alpha("#E2E8F0", 0.90) : theme.palette.text.primary,
                  }}
                />
                <Chip
                  icon={<VerifiedUser sx={{ fontSize: 18 }} />}
                  label="Verified providers"
                  size="small"
                  sx={{
                    fontWeight: 900,
                    borderRadius: 0,
                    background: isDark ? alpha("#0b1228", 0.45) : alpha("#ffffff", 0.72),
                    border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.16 : 0.10)}`,
                    color: isDark ? alpha("#E2E8F0", 0.90) : theme.palette.text.primary,
                  }}
                />
              </Stack>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 950,
                  letterSpacing: -0.8,
                  color: isDark ? alpha("#F8FAFC", 0.96) : theme.palette.text.primary,
                }}
              >
                Telehealth
              </Typography>
              <Typography sx={{ color: isDark ? alpha("#E2E8F0", 0.72) : theme.palette.text.secondary }}>
                Book a session with a provider (demo UI). Connect backend later.
              </Typography>
            </Box>

            <Stack spacing={1.2} sx={{ minWidth: { xs: "100%", md: 380 } }}>
              <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", md: "flex-end" }} alignItems="center" flexWrap="wrap">
                <Chip
                  label={`Ready: ${readiness}%`}
                  color={readiness >= 70 ? "success" : readiness >= 45 ? "info" : "default"}
                  sx={{
                    fontWeight: 950,
                    borderRadius: 0,
                    background: isDark ? alpha("#0b1228", 0.45) : alpha("#ffffff", 0.78),
                    border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.16 : 0.10)}`,
                  }}
                />

                <Tooltip title="Refresh (demo)">
                  <IconButton onClick={refresh} sx={{ color: isDark ? alpha("#E2E8F0", 0.85) : undefined }}>
                    <Refresh />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Info">
                  <IconButton
                    sx={{ color: isDark ? alpha("#E2E8F0", 0.85) : undefined }}
                    onClick={() =>
                      setToast({
                        open: true,
                        msg: "This is a demo screen. Booking/provider lists are placeholders until backend integration.",
                        type: "info",
                      })
                    }
                  >
                    <InfoOutlined />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 900, color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}>
                  Setup completeness
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={readiness}
                  sx={{
                    height: 10,
                    borderRadius: 0,
                    background: isDark ? alpha("#ffffff", 0.10) : "rgba(15,23,42,0.06)",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 0,
                      background: "linear-gradient(90deg, #0ea5e9, #14b8a6)",
                    },
                  }}
                />
              </Box>
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
                  <LocalHospital sx={{ color: isDark ? alpha("#E2E8F0", 0.90) : undefined }} />
                  <Typography sx={{ fontWeight: 950, color: isDark ? alpha("#F8FAFC", 0.95) : undefined }}>
                    Find a provider
                  </Typography>
                </Stack>
                <Chip
                  label={`${filtered.length} result${filtered.length === 1 ? "" : "s"}`}
                  sx={{
                    fontWeight: 900,
                    borderRadius: 0,
                    background: isDark ? alpha("#0b1228", 0.45) : alpha("#ffffff", 0.78),
                    border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.16 : 0.10)}`,
                    color: isDark ? alpha("#E2E8F0", 0.88) : theme.palette.text.primary,
                  }}
                />
              </Stack>

              <Typography sx={{ mb: 2, color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }} variant="body2">
                Filter by specialty, mode, and location. Select a provider to book.
              </Typography>

              {/* Filters */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    select
                    fullWidth
                    label="Specialty"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value as any)}
                    sx={inputSx}
                  >
                    <MenuItem value="All">All</MenuItem>
                    {SPECIALTIES.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    select
                    fullWidth
                    label="Mode"
                    value={mode}
                    onChange={(e) => setMode(e.target.value as any)}
                    sx={inputSx}
                  >
                    <MenuItem value="All">All</MenuItem>
                    {MODES.map((m) => (
                      <MenuItem key={m} value={m}>
                        {m}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    sx={inputSx}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, display: "grid", placeItems: "center" }}>
                          <LocationOn sx={{ fontSize: 20 }} />
                        </Box>
                      ),
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    label="Search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    sx={inputSx}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, display: "grid", placeItems: "center" }}>
                          <Search sx={{ fontSize: 20 }} />
                        </Box>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ mb: 2, opacity: isDark ? 0.15 : 0.55 }} />

              {/* Provider cards */}
              <Grid container spacing={2}>
                {filtered.map((p) => {
                  const active = selected?.id === p.id;

                  return (
                    <Grid size={{ xs: 12, md: 6 }} key={p.id}>
                      <Card
                        onClick={() => setSelected(p)}
                        sx={{
                          cursor: "pointer",
                          borderRadius: 0,
                          border: `1px solid ${alpha(theme.palette.text.primary, active ? 0.28 : isDark ? 0.16 : 0.10)}`,
                          boxShadow: active
                            ? (isDark ? "0 18px 70px rgba(34,197,94,0.18)" : "0 18px 60px rgba(34,197,94,0.15)")
                            : (isDark ? "0 14px 50px rgba(0,0,0,0.35)" : "0 10px 40px rgba(15,23,42,0.06)"),
                          transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: isDark ? "0 18px 70px rgba(0,0,0,0.50)" : "0 16px 60px rgba(15,23,42,0.10)",
                          },
                          background: isDark
                            ? `linear-gradient(180deg, ${alpha("#0b1228", 0.70)}, ${alpha("#020617", 0.62)})`
                            : alpha("#ffffff", 0.82),
                          backdropFilter: "blur(12px)",
                        }}
                      >
                        <CardContent sx={{ p: 2.2 }}>
                          <Stack direction="row" spacing={1.4} alignItems="flex-start" justifyContent="space-between">
                            <Stack direction="row" spacing={1.2} alignItems="center">
                              <Avatar
                                sx={{
                                  width: 42,
                                  height: 42,
                                  bgcolor: alpha(theme.palette.primary.main, isDark ? 0.22 : 0.12),
                                  color: isDark ? alpha("#F8FAFC", 0.95) : theme.palette.text.primary,
                                }}
                              >
                                {p.name.split(" ")[1]?.[0] || "D"}
                              </Avatar>

                              <Box>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                  <Typography sx={{ fontWeight: 950, lineHeight: 1.1, color: isDark ? alpha("#F8FAFC", 0.95) : undefined }}>
                                    {p.name}
                                  </Typography>
                                  {p.verified && (
                                    <Chip
                                      icon={<VerifiedUser sx={{ fontSize: 18 }} />}
                                      label="Verified"
                                      size="small"
                                      sx={{
                                        fontWeight: 900,
                                        borderRadius: 0,
                                        background: alpha(theme.palette.secondary.main, isDark ? 0.18 : 0.12),
                                        border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.10)}`,
                                        color: isDark ? alpha("#E2E8F0", 0.90) : theme.palette.text.primary,
                                      }}
                                    />
                                  )}
                                </Stack>
                                <Typography
                                  variant="caption"
                                  sx={{ fontWeight: 800, color: isDark ? alpha("#E2E8F0", 0.68) : theme.palette.text.secondary }}
                                >
                                  {p.specialty} • {p.years} yrs exp
                                </Typography>
                              </Box>
                            </Stack>

                            <Chip
                              label={p.mode}
                              size="small"
                              sx={{
                                fontWeight: 950,
                                borderRadius: 0,
                                background:
                                  p.mode === "Video"
                                    ? alpha(theme.palette.primary.main, isDark ? 0.20 : 0.12)
                                    : isDark
                                    ? alpha("#0b1228", 0.45)
                                    : alpha("#ffffff", 0.78),
                                border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.10)}`,
                                color: isDark ? alpha("#E2E8F0", 0.90) : theme.palette.text.primary,
                              }}
                            />
                          </Stack>

                          <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mt: 1.4, color: isDark ? alpha("#E2E8F0", 0.88) : undefined }}>
                            <Stars value={p.rating} />
                            <Typography variant="caption" sx={{ fontWeight: 900 }}>
                              {p.rating.toFixed(1)}
                            </Typography>
                            <Divider orientation="vertical" flexItem sx={{ opacity: isDark ? 0.18 : 0.45 }} />
                            <Typography variant="caption" sx={{ fontWeight: 900, color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}>
                              ₹{p.fee}
                            </Typography>
                          </Stack>

                          <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mt: 1, color: isDark ? alpha("#E2E8F0", 0.88) : undefined }}>
                            <AccessTime sx={{ fontSize: 18 }} />
                            <Typography variant="caption" sx={{ fontWeight: 900 }}>
                              Next slot: {p.nextSlot}
                            </Typography>
                          </Stack>

                          {active && (
                            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} alignItems="center">
                              <Chip label="Selected" color="success" size="small" sx={{ fontWeight: 950, borderRadius: 0 }} />
                              <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}>
                                Ready to book on the right panel.
                              </Typography>
                            </Stack>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              {filtered.length === 0 && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: 0,
                    border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
                    background: isDark ? alpha("#0b1228", 0.40) : alpha("#ffffff", 0.65),
                  }}
                >
                  <Typography sx={{ fontWeight: 900, color: isDark ? alpha("#F8FAFC", 0.95) : undefined }}>
                    No providers match your filters.
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}>
                    Try switching specialty/mode or clearing search.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card
            sx={{
              ...glassCardSx,
              position: "sticky",
              top: 18,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={1} alignItems="center">
                  <CalendarMonth sx={{ color: isDark ? alpha("#E2E8F0", 0.90) : undefined }} />
                  <Typography sx={{ fontWeight: 950, color: isDark ? alpha("#F8FAFC", 0.95) : undefined }}>
                    Book session
                  </Typography>
                </Stack>
                <Chip
                  icon={<VerifiedUser sx={{ fontSize: 18 }} />}
                  label="Secure"
                  size="small"
                  sx={{
                    fontWeight: 900,
                    borderRadius: 0,
                    background: alpha(theme.palette.secondary.main, isDark ? 0.18 : 0.12),
                    border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.10)}`,
                    color: isDark ? alpha("#E2E8F0", 0.90) : theme.palette.text.primary,
                  }}
                />
              </Stack>

              <Typography variant="body2" sx={{ mt: 1, color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}>
                Booking is a placeholder flow — UI only.
              </Typography>

              <Divider sx={{ my: 2, opacity: isDark ? 0.15 : 0.55 }} />

              {selected ? (
                <>
                  <Stack spacing={1}>
                    <Typography sx={{ fontWeight: 950, color: isDark ? alpha("#F8FAFC", 0.95) : undefined }}>
                      {selected.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}>
                      {selected.specialty} • {selected.mode} • ₹{selected.fee}
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ color: isDark ? alpha("#E2E8F0", 0.88) : undefined }}>
                      <AccessTime sx={{ fontSize: 18 }} />
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>
                        {selected.nextSlot}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ color: isDark ? alpha("#E2E8F0", 0.88) : undefined }}>
                      <LocationOn sx={{ fontSize: 18 }} />
                      <Typography variant="body2" sx={{ fontWeight: 900 }}>
                        {selected.location}
                      </Typography>
                    </Stack>
                  </Stack>

                  <Stack spacing={1.2} sx={{ mt: 2 }}>
                    <Button
                      onClick={book}
                      variant="contained"
                      color="success"
                      startIcon={<VideoCall />}
                      sx={{
                        borderRadius: 0,
                        fontWeight: 950,
                        py: 1.2,
                        boxShadow: "0 14px 30px rgba(34,197,94,0.22)",
                        "&:active": { transform: "scale(0.98)" },
                      }}
                    >
                      Book now (demo)
                    </Button>

                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        startIcon={<Chat />}
                        sx={{ borderRadius: 0, fontWeight: 950, flex: 1 }}
                        onClick={() => setToast({ open: true, msg: "Chat is a placeholder.", type: "info" })}
                      >
                        Chat
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Phone />}
                        sx={{ borderRadius: 0, fontWeight: 950, flex: 1 }}
                        onClick={() => setToast({ open: true, msg: "Call is a placeholder.", type: "info" })}
                      >
                        Call
                      </Button>
                    </Stack>

                    <Button component={Link} href="/consent" endIcon={<ArrowForward />} sx={{ borderRadius: 0, fontWeight: 950 }}>
                      Manage consent
                    </Button>
                  </Stack>
                </>
              ) : (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 0,
                    border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
                    background: isDark ? alpha("#0b1228", 0.40) : alpha("#ffffff", 0.65),
                  }}
                >
                  <Typography sx={{ fontWeight: 950, color: isDark ? alpha("#F8FAFC", 0.95) : undefined }}>
                    No provider selected
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}>
                    Pick a provider from the list to enable booking.
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2, opacity: isDark ? 0.15 : 0.55 }} />

              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ color: isDark ? alpha("#E2E8F0", 0.88) : undefined }}>
                  <Shield sx={{ fontSize: 18 }} />
                  <Typography sx={{ fontWeight: 950, color: isDark ? alpha("#F8FAFC", 0.95) : undefined }}>
                    Privacy note
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}>
                  Providers only see what you explicitly share. This module will require consent before any data is used.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={toast.open}
        autoHideDuration={2300}
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
