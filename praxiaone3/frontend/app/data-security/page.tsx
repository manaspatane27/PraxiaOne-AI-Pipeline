"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { alpha, useTheme } from "@mui/material/styles";
import { Box, Card, CardContent, Typography, Stack, Button, Divider, Chip, List, ListItem, ListItemText } from "@mui/material";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

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

export default function DataSecurityPage() {
  const router = useRouter();
  const { theme, isDark, border, cardBg, pageBg, shadow } = useSurface();

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
                <SecurityRoundedIcon />
                <Typography variant="h5" component="div" sx={{ fontWeight: 950 }}>
                  Data Security
                </Typography>
                <Chip
                  label="HIPAA-ready UX"
                  sx={{
                    ml: 0.5,
                    borderRadius: 0,
                    fontWeight: 900,
                    border,
                    background: alpha(theme.palette.primary.main, isDark ? 0.16 : 0.12),
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
              PraxiaOne uses only the data you consent to, and keeps your health information protected.
            </Typography>

            <Divider sx={{ my: 2, opacity: isDark ? 0.16 : 0.30 }} />

            <List>
              {[
                { k: "Consent-first", v: "We process only categories you explicitly enable." },
                { k: "Least privilege", v: "Access is minimized and scoped per feature." },
                { k: "Token security", v: "JWT tokens protect API access; expired tokens require re-login." },
                { k: "Audit-friendly", v: "Integrations are tracked and can be revoked anytime." },
              ].map((row, idx) => (
                <ListItem key={idx} disableGutters sx={{ py: 0.8 }}>
                  <ListItemText
                    primary={
                      <Typography component="div" sx={{ fontWeight: 950 }}>
                        {row.k}
                      </Typography>
                    }
                    secondary={
                      <Typography component="div" variant="body2" sx={{ opacity: 0.78 }}>
                        {row.v}
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
                onClick={() => router.push("/consent")}
                sx={{
                  borderRadius: 0,
                  fontWeight: 950,
                  textTransform: "none",
                  background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                }}
              >
                Manage Consent
              </Button>
              <Button
                variant="outlined"
                onClick={() => router.push("/data")}
                sx={{ borderRadius: 0, fontWeight: 950, textTransform: "none" }}
              >
                View Data Sources
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
