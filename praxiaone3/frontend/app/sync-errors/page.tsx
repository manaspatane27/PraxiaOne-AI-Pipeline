"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { alpha, useTheme } from "@mui/material/styles";
import { Box, Card, CardContent, Typography, Stack, Button, Divider, List, ListItem, ListItemText, Chip } from "@mui/material";
import SyncProblemRoundedIcon from "@mui/icons-material/SyncProblemRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

function useSurface() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const border = `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.10)}`;
  const cardBg = isDark
    ? `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.24)}, ${alpha(theme.palette.background.paper, 0.12)})`
    : `linear-gradient(180deg, ${alpha("#ffffff", 0.86)}, ${alpha("#ffffff", 0.60)})`;

  const pageBg = isDark
    ? `
      radial-gradient(1200px 680px at 18% 0%, ${alpha(theme.palette.primary.main, 0.22)}, transparent 60%),
      radial-gradient(1000px 600px at 90% 10%, ${alpha(theme.palette.secondary.main, 0.20)}, transparent 58%),
      linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.default} 100%)
    `
    : `
      radial-gradient(1100px 600px at 15% 0%, ${alpha(theme.palette.primary.main, 0.12)}, transparent 60%),
      radial-gradient(900px 520px at 90% 10%, ${alpha(theme.palette.secondary.main, 0.10)}, transparent 60%),
      linear-gradient(180deg, ${theme.palette.background.default} 0%, ${alpha("#f6fbff", 0.92)} 100%)
    `;
  const shadow = isDark ? "0 30px 95px rgba(0,0,0,0.55)" : "0 22px 70px rgba(2,6,23,0.10)";
  return { theme, isDark, border, cardBg, pageBg, shadow };
}

export default function SyncErrorsPage() {
  const router = useRouter();
  const { theme, isDark, border, cardBg, pageBg, shadow } = useSurface();

  const steps = [
    { t: "Check Consent", d: "Ensure wearables/app consent is enabled (Consent & Privacy page)." },
    { t: "Re-authenticate Provider", d: "If an integration shows error, disconnect and reconnect it." },
    { t: "Refresh Sync", d: "Use the Refresh button on Wearables/Vitals pages." },
    { t: "Check Server", d: "Confirm Django API is running and tokens are valid." },
    { t: "Network", d: "Try again on a stable connection." },
  ];

  return (
    <Box sx={{ minHeight: "100vh", px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 }, background: pageBg }}>
      <Box sx={{ maxWidth: 980, mx: "auto" }}>
        <Card
          sx={{
            borderRadius: 0,
            border,
            background: cardBg,
            boxShadow: shadow,
            backdropFilter: "blur(14px)",
            overflow: "hidden",
          }}
        >
          <Box sx={{ height: 6, background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})` }} />
          <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <SyncProblemRoundedIcon />
                <Typography variant="h5" component="div" sx={{ fontWeight: 950 }}>
                  Reduce Sync Errors
                </Typography>
                <Chip
                  icon={<CheckCircleRoundedIcon />}
                  label="Troubleshooting"
                  sx={{
                    ml: 0.5,
                    borderRadius: 0,
                    fontWeight: 900,
                    border,
                    background: alpha(theme.palette.success.main, isDark ? 0.16 : 0.12),
                  }}
                />
              </Stack>

              <Button
                onClick={() => router.push("/vitals")}
                startIcon={<ArrowBackRoundedIcon />}
                sx={{ borderRadius: 0, fontWeight: 950, textTransform: "none" }}
                variant="outlined"
              >
                Back to Vitals
              </Button>
            </Stack>

            <Typography variant="body2" component="div" sx={{ mt: 1, opacity: 0.78 }}>
              Follow these steps to fix common device/app sync issues.
            </Typography>

            <Divider sx={{ my: 2, opacity: isDark ? 0.16 : 0.30 }} />

            <List>
              {steps.map((s, idx) => (
                <ListItem key={idx} disableGutters sx={{ py: 0.8 }}>
                  <ListItemText
                    primary={
                      <Typography component="div" sx={{ fontWeight: 950 }}>
                        {idx + 1}. {s.t}
                      </Typography>
                    }
                    secondary={
                      <Typography component="div" variant="body2" sx={{ opacity: 0.78 }}>
                        {s.d}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 2, opacity: isDark ? 0.16 : 0.30 }} />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button
                variant="contained"
                onClick={() => router.push("/wearables")}
                sx={{
                  borderRadius: 0,
                  fontWeight: 950,
                  textTransform: "none",
                  background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                }}
              >
                Go to Wearables
              </Button>
              <Button
                variant="outlined"
                onClick={() => router.push("/consent")}
                sx={{ borderRadius: 0, fontWeight: 950, textTransform: "none" }}
              >
                Check Consent
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
