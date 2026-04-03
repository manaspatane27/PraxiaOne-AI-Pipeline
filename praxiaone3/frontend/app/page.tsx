"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";

import { alpha, useTheme } from "@mui/material/styles";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  Grid,
  Divider,
} from "@mui/material";

import {
  VerifiedUser,
  Lock,
  ManageAccounts,
  Insights,
  Hub,
  Psychology,
  VideoCall,
} from "@mui/icons-material";

export default function HomePage() {
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
        `radial-gradient(900px 520px at 50% 110%, ${alpha(ok, 0.12)}, transparent 55%),` +
        `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.default} 100%)`
      );
    }

    // Light (Classic)
    return (
      `radial-gradient(1100px 520px at 12% 0%, ${alpha(p, 0.12)}, transparent 60%),` +
      `radial-gradient(900px 480px at 90% 10%, ${alpha(s, 0.12)}, transparent 60%),` +
      `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.default} 100%)`
    );
  }, [theme, isDark]);

  const glassCard = useMemo(
    () => ({
      borderRadius: 0,
      overflow: "hidden",
      position: "relative",
      border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
      background: isDark
        ? `linear-gradient(135deg, ${alpha("#0b1228", 0.90)}, ${alpha("#050816", 0.86)})`
        : `linear-gradient(135deg, ${alpha("#ffffff", 0.84)}, ${alpha(
          theme.palette.primary.main,
          0.05
        )}, ${alpha(theme.palette.secondary.main, 0.04)})`,
      boxShadow: isDark
        ? "0 35px 120px rgba(0,0,0,0.65)"
        : "0 26px 90px rgba(2,6,23,0.10)",
      backdropFilter: "blur(18px)",
    }),
    [theme, isDark]
  );

  const pillSx = useMemo(
    () => ({
      borderRadius: 0,
      fontWeight: 900,
      border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.18 : 0.12)}`,
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
    }),
    [theme, isDark]
  );

  const features = useMemo(
    () => [
      {
        title: "Personalized Wellness Insights",
        desc: "Tailored health recommendations based on your inputs and consented data.",
        icon: <Insights />,
      },
      {
        title: "Secure Data Integration",
        desc: "Bring in self, labs, wearables, and EHR sources with controlled access.",
        icon: <Hub />,
      },
      {
        title: "AI-Assisted Guidance",
        desc: "Smart suggestions and summaries — designed to keep you in control.",
        icon: <Psychology />,
      },
      {
        title: "Optional Telehealth Access",
        desc: "Connect with providers (module-ready screen for future extension).",
        icon: <VideoCall />,
      },
    ],
    []
  );

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 24px)",
        py: 3,
        px: { xs: 2, md: 3 },
        background: pageBg,
      }}
    >
      {/* HERO */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 0,
          overflow: "hidden",
          position: "relative",
          minHeight: { xs: 420, md: 460 },
        }}
      >
        {/* Background Image */}
        <Box sx={{ position: "absolute", inset: 0 }}>
          <Image
            src="/hearth-1674896_1280.webp"
            alt="Health background"
            fill
            priority
            style={{ objectFit: "cover" }}
          />


          {/* Theme-aware overlay */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: isDark
                ? `
            linear-gradient(
              90deg,
              rgba(2,6,23,0.88) 0%,
              rgba(2,6,23,0.65) 55%,
              rgba(2,6,23,0.45) 100%
            )`
                : `
            linear-gradient(
              90deg,
              rgba(255,255,255,0.90) 0%,
              rgba(255,255,255,0.70) 55%,
              rgba(255,255,255,0.45) 100%
            )`,
            }}
          />
        </Box>

        {/* Overlay Content */}
        <CardContent
          sx={{
            position: "relative",
            zIndex: 1,
            p: { xs: 3, md: 4 },
            height: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={2}>
                <Chip
                  label="PraxiaOne — AI-Driven Personalized Wellness"
                  size="small"
                  sx={{
                    width: "fit-content",
                    fontWeight: 900,
                    borderRadius: 0,
                    backdropFilter: "blur(10px)",
                    background: isDark
                      ? "rgba(15,23,42,0.55)"
                      : "rgba(255,255,255,0.65)",
                  }}
                />

                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 950,
                    letterSpacing: "-0.04em",
                    color: isDark ? "#F8FAFC" : "#020617",
                    textShadow: isDark
                      ? "0 12px 35px rgba(0,0,0,0.65)"
                      : "0 8px 20px rgba(0,0,0,0.12)",
                  }}
                >
                  Your Health, Your Data, Your Way
                </Typography>

                <Typography
                  sx={{
                    maxWidth: 700,
                    color: isDark
                      ? "rgba(226,232,240,0.85)"
                      : "rgba(15,23,42,0.75)",
                  }}
                >
                  Connect labs, care plans, wearables, and self-reported wellness — then
                  get AI-assisted guidance you fully control.
                </Typography>

                <Stack direction="row" spacing={1.2} flexWrap="wrap">
                  <Button
                    component={Link}
                    href="/profile"
                    variant="contained"
                    color="success"
                    sx={{
                      borderRadius: 0,
                      fontWeight: 900,
                      px: 2.5,
                      boxShadow: "0 18px 50px rgba(34,197,94,0.35)",
                    }}
                  >
                    Get Started
                  </Button>

                  <Button
                    component={Link}
                    href="/login"
                    variant="outlined"
                    sx={{
                      borderRadius: 0,
                      fontWeight: 900,
                      px: 2.5,
                      color: isDark ? "#E2E8F0" : "#020617",
                      borderColor: "rgba(148,163,184,0.45)",
                      background: "rgba(255,255,255,0.15)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    Log In
                  </Button>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip icon={<VerifiedUser />} label="HIPAA Compliant" size="small" sx={pillSx} />
                  <Chip icon={<Lock />} label="Secure & Encrypted" size="small" sx={pillSx} />
                  <Chip icon={<ManageAccounts />} label="User Controlled Consent" size="small" sx={pillSx} />
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>


      {/* FEATURES */}
      <Grid container spacing={2.2}>
        {features.map((f) => (
          <Grid key={f.title} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                borderRadius: 0,
                height: "100%",
                border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
                background: isDark
                  ? `linear-gradient(180deg, ${alpha("#0f172a", 0.78)}, ${alpha("#020617", 0.70)})`
                  : `linear-gradient(180deg, ${alpha("#ffffff", 0.80)}, ${alpha("#ffffff", 0.58)})`,
                backdropFilter: "blur(14px)",
                boxShadow: isDark
                  ? "0 18px 70px rgba(0,0,0,0.38)"
                  : "0 18px 60px rgba(2,6,23,0.08)",
                transition: "transform 180ms ease, box-shadow 200ms ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: isDark
                    ? "0 28px 90px rgba(0,0,0,0.55)"
                    : "0 26px 80px rgba(2,6,23,0.12)",
                },
              }}
            >
              <CardContent sx={{ p: 2.4 }}>
                <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1 }}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 0,
                      display: "grid",
                      placeItems: "center",
                      border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.primary.main,
                        0.14
                      )}, ${alpha(theme.palette.secondary.main, 0.12)})`,
                      color: isDark ? alpha("#E2E8F0", 0.95) : theme.palette.text.primary,
                    }}
                  >
                    {f.icon}
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: 950,
                      color: isDark ? alpha("#F8FAFC", 0.95) : theme.palette.text.primary,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {f.title}
                  </Typography>
                </Stack>

                <Typography
                  variant="body2"
                  sx={{ color: isDark ? alpha("#E2E8F0", 0.72) : theme.palette.text.secondary }}
                >
                  {f.desc}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* FOOTER */}
      <Card
        sx={{
          mt: 3,
          borderRadius: 0,
          border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
          background: isDark
            ? `linear-gradient(180deg, ${alpha("#0f172a", 0.74)}, ${alpha("#020617", 0.68)})`
            : `linear-gradient(180deg, ${alpha("#ffffff", 0.82)}, ${alpha("#ffffff", 0.62)})`,
          backdropFilter: "blur(14px)",
          boxShadow: isDark ? "0 18px 70px rgba(0,0,0,0.35)" : "0 18px 60px rgba(2,6,23,0.08)",
        }}
      >
        <CardContent sx={{ p: 2.6 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            spacing={2}
          >
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip icon={<VerifiedUser sx={{ fontSize: 18 }} />} label="HIPAA Compliant" size="small" sx={pillSx} />
                <Chip icon={<Lock sx={{ fontSize: 18 }} />} label="Secure & Encrypted" size="small" sx={pillSx} />
                <Chip icon={<ManageAccounts sx={{ fontSize: 18 }} />} label="User Controlled Consent" size="small" sx={pillSx} />
              </Stack>

              <Typography
                variant="caption"
                sx={{ color: isDark ? alpha("#94A3B8", 0.78) : theme.palette.text.secondary }}
              >
                PraxiaOne provides wellness guidance and is not a substitute for professional medical advice. Always consult a qualified provider for diagnosis or treatment.
              </Typography>
            </Stack>

            <Stack direction="row" spacing={2}>
              <FooterLink href="/consent" label="Privacy Policy" />
              <FooterLink href="/support" label="Contact Us" />
              <FooterLink href="/settings" label="Settings" />
            </Stack>
          </Stack>

          <Divider sx={{ mt: 2, opacity: isDark ? 0.15 : 0.25 }} />
          <Typography
            variant="caption"
            sx={{ display: "block", mt: 1.4, color: isDark ? alpha("#94A3B8", 0.70) : theme.palette.text.secondary }}
          >
            © {new Date().getFullYear()} PraxiaOne
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Button
      component={Link}
      href={href}
      variant="text"
      sx={{
        fontWeight: 900,
        borderRadius: 0,
        color: isDark ? alpha("#E2E8F0", 0.82) : theme.palette.text.primary,
        "&:hover": { background: alpha(theme.palette.text.primary, isDark ? 0.06 : 0.04) },
      }}
    >
      {label}
    </Button>
  );
}
