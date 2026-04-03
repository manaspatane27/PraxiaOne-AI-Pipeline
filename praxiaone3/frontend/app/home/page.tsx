"use client";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Grid,
  Chip,
  Divider,
} from "@mui/material";
import Link from "next/link";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SecurityIcon from "@mui/icons-material/Security";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import InsightsIcon from "@mui/icons-material/Insights";
import StorageIcon from "@mui/icons-material/Storage";
import PsychologyIcon from "@mui/icons-material/Psychology";
import VideoCallIcon from "@mui/icons-material/VideoCall";

import Lottie from "lottie-react";
import aiHealth from "@/public/animations/ai-health.json"; // ✅ reuse your existing animation

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: 0,
        border: "1px solid rgba(148,163,184,0.18)",
        boxShadow: "0 22px 70px rgba(2,6,23,0.06)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,255,255,0.55))",
        backdropFilter: "blur(10px)",
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1.4} alignItems="center" sx={{ mb: 1 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 0,
              display: "grid",
              placeItems: "center",
              background:
                "linear-gradient(135deg, rgba(14,165,233,0.14), rgba(20,184,166,0.14))",
              border: "1px solid rgba(148,163,184,0.22)",
            }}
          >
            {icon}
          </Box>
          <Typography sx={{ fontWeight: 950 }}>{title}</Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {desc}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  return (
    <Box
      sx={{
        px: { xs: 0, md: 0 },
        py: { xs: 1, md: 1 },
      }}
    >
      {/* HERO */}
      <Card
        sx={{
          borderRadius: 0,
          border: "1px solid rgba(148,163,184,0.18)",
          background:
            "radial-gradient(900px 420px at 15% 15%, rgba(14,165,233,0.12), transparent 60%), radial-gradient(900px 420px at 85% 10%, rgba(20,184,166,0.12), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,255,255,0.55))",
          backdropFilter: "blur(10px)",
          boxShadow: "0 30px 90px rgba(2,6,23,0.08)",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: { xs: 2.4, md: 3.2 } }}>
          <Grid container spacing={3} alignItems="center">
            {/* Left copy */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Chip
                  icon={<AutoAwesomeIcon />}
                  label="PraxiaOne — AI-Driven Personalized Wellness"
                  sx={{
                    borderRadius: 0,
                    fontWeight: 900,
                    background:
                      "linear-gradient(90deg, rgba(14,165,233,0.14), rgba(20,184,166,0.14))",
                    border: "1px solid rgba(148,163,184,0.22)",
                  }}
                />
              </Stack>

              <Typography
                variant="h3"
                sx={{
                  fontWeight: 950,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                }}
              >
                Your Health, Your Data, Your Way
              </Typography>

              <Typography color="text.secondary" sx={{ mt: 1.2, maxWidth: 620 }}>
                Connect labs, care plans, wearables, and self-reported wellness — then get
                AI-assisted guidance you control.
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.6}
                sx={{ mt: 2.3 }}
              >
                <Button
                  component={Link}
                  href="/get-started"
                  variant="contained"
                  color="success"
                  sx={{ borderRadius: 0, fontWeight: 950, px: 2.6, py: 1.2 }}
                >
                  Get Started
                </Button>

                <Button
                  component={Link}
                  href="/login"
                  variant="outlined"
                  sx={{
                    borderRadius: 0,
                    fontWeight: 950,
                    px: 2.6,
                    py: 1.2,
                  }}
                >
                  Log In
                </Button>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mt: 2.2, flexWrap: "wrap" }}>
                <Chip
                  icon={<VerifiedUserIcon />}
                  label="HIPAA Compliant"
                  sx={{
                    borderRadius: 0,
                    fontWeight: 900,
                    background: "rgba(255,255,255,0.65)",
                    border: "1px solid rgba(148,163,184,0.22)",
                  }}
                />
                <Chip
                  icon={<SecurityIcon />}
                  label="Secure & Encrypted"
                  sx={{
                    borderRadius: 0,
                    fontWeight: 900,
                    background: "rgba(255,255,255,0.65)",
                    border: "1px solid rgba(148,163,184,0.22)",
                  }}
                />
                <Chip
                  icon={<InsightsIcon />}
                  label="User Controlled Consent"
                  sx={{
                    borderRadius: 0,
                    fontWeight: 900,
                    background: "rgba(255,255,255,0.65)",
                    border: "1px solid rgba(148,163,184,0.22)",
                  }}
                />
              </Stack>
            </Grid>

            {/* Right illustration */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                sx={{
                  borderRadius: 0,
                  border: "1px solid rgba(148,163,184,0.18)",
                  background: "rgba(255,255,255,0.55)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
                  p: { xs: 1.2, md: 1.6 },
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Lottie
                  animationData={aiHealth}
                  loop
                  autoplay
                  style={{
                    width: "100%",
                    maxWidth: 520,
                    height: 300,
                  }}
                />
              </Box>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1.2, textAlign: "center" }}
              >
                Modern, illustration-based UI — no photoreal people.
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* FEATURE STRIP */}
      <Box sx={{ mt: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <FeatureCard
              icon={<InsightsIcon color="primary" />}
              title="Personalized Wellness Insights"
              desc="Tailored health recommendations."
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FeatureCard
              icon={<StorageIcon color="secondary" />}
              title="Secure Data Integration"
              desc="Self, Labs, Wearables, EHR."
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FeatureCard
              icon={<PsychologyIcon color="success" />}
              title="AI-Assisted Guidance"
              desc="Smart health recommendations."
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FeatureCard
              icon={<VideoCallIcon color="primary" />}
              title="Optional Telehealth Access"
              desc="Connect with providers."
            />
          </Grid>
        </Grid>
      </Box>

      {/* TRUST BAR + FOOTER */}
      <Card
        sx={{
          mt: 3,
          borderRadius: 0,
          border: "1px solid rgba(148,163,184,0.18)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.80), rgba(255,255,255,0.55))",
          backdropFilter: "blur(10px)",
          boxShadow: "0 24px 70px rgba(2,6,23,0.06)",
        }}
      >
        <CardContent sx={{ p: { xs: 2.2, md: 2.8 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.2}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                icon={<VerifiedUserIcon />}
                label="HIPAA Compliant"
                sx={{
                  borderRadius: 0,
                  fontWeight: 900,
                  background:
                    "linear-gradient(90deg, rgba(14,165,233,0.12), rgba(20,184,166,0.12))",
                  border: "1px solid rgba(148,163,184,0.22)",
                }}
              />
              <Chip
                icon={<SecurityIcon />}
                label="Secure & Encrypted"
                sx={{
                  borderRadius: 0,
                  fontWeight: 900,
                  background:
                    "linear-gradient(90deg, rgba(14,165,233,0.12), rgba(20,184,166,0.12))",
                  border: "1px solid rgba(148,163,184,0.22)",
                }}
              />
              <Chip
                icon={<InsightsIcon />}
                label="User Controlled Consent"
                sx={{
                  borderRadius: 0,
                  fontWeight: 900,
                  background:
                    "linear-gradient(90deg, rgba(14,165,233,0.12), rgba(20,184,166,0.12))",
                  border: "1px solid rgba(148,163,184,0.22)",
                }}
              />
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mt: { xs: 1, md: 0 } }}>
              <Button
                component={Link}
                href="/privacy"
                variant="text"
                sx={{ fontWeight: 900 }}
              >
                Privacy Policy
              </Button>
              <Button
                component={Link}
                href="/terms"
                variant="text"
                sx={{ fontWeight: 900 }}
              >
                Terms of Service
              </Button>
              <Button
                component={Link}
                href="/contact"
                variant="text"
                sx={{ fontWeight: 900 }}
              >
                Contact Us
              </Button>
            </Stack>
          </Stack>

          <Divider sx={{ my: 2, opacity: 0.6 }} />

          <Typography variant="caption" color="text.secondary">
            PraxiaOne provides wellness guidance and is not a substitute for professional medical advice.
            Always consult a qualified provider for diagnosis or treatment.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
