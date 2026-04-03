"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
  Divider,
} from "@mui/material";
import { login } from "@/lib/api";

import Lottie from "lottie-react";
import loginAi from "@/public/animations/login-ai.json";

export default function LoginPage() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // IMPORTANT: start empty to keep SSR + client first render identical
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [fpOpen, setFpOpen] = useState(false);
  const [fpEmail, setFpEmail] = useState("");
  const [fpMsg, setFpMsg] = useState("");

  // OPTIONAL: set default username ONLY after mount (client-only)
  useEffect(() => {
    // If you don't want any default username, delete this block.
    setUsername((u) => u || "manas");
  }, []);

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

  const lottieWrap = useMemo(
    () => ({
      width: "100%",
      maxWidth: 360,
      borderRadius: 0,
      p: 1.2,
      border,
      overflow: "hidden",
      background: isDark
        ? `linear-gradient(135deg, ${alpha("#0f172a", 0.55)}, ${alpha("#020617", 0.48)})`
        : `linear-gradient(135deg, ${alpha("#ffffff", 0.70)}, ${alpha(
            theme.palette.primary.main,
            0.06
          )})`,
      boxShadow: isDark ? "0 22px 70px rgba(0,0,0,0.45)" : "0 18px 60px rgba(2,6,23,0.08)",
      backdropFilter: "blur(12px)",
      position: "relative",
    }),
    [theme, isDark, border]
  );

  const loginCard = useMemo(
    () => ({
      width: "100%",
      borderRadius: 0,
      overflow: "hidden",
      border,
      boxShadow: isDark ? "0 35px 120px rgba(0,0,0,0.55)" : "0 22px 70px rgba(2,6,23,0.10)",
      background: isDark
        ? `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.22)}, ${alpha(
            theme.palette.background.paper,
            0.12
          )})`
        : `linear-gradient(180deg, ${alpha("#ffffff", 0.78)}, ${alpha("#ffffff", 0.55)})`,
      backdropFilter: "blur(14px)",
    }),
    [theme, isDark, border]
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

  const onLogin = async () => {
    setErr("");

    const u = username.trim();
    if (!u) return setErr("Please enter a username.");
    if (!password) return setErr("Please enter your password.");

    setLoading(true);
    try {
      await login(u, password);
      router.push("/dashboard");
    } catch (e: any) {
      setErr("Login failed. Check username/password and Django server.");
    } finally {
      setLoading(false);
    }
  };

  const openForgot = () => {
    setFpEmail("");
    setFpMsg("");
    setFpOpen(true);
  };

  const submitForgot = () => {
    const email = fpEmail.trim();
    if (!email || !email.includes("@")) {
      setFpMsg("Enter a valid email address.");
      return;
    }

    setFpMsg("Request created. Please check your email (or contact support).");
    // Keep it inside handler (client-only)
    window.open(
      `mailto:support@praxiaone.com?subject=Password%20Reset%20Request&body=Please%20reset%20my%20password%20for%20email:%20${encodeURIComponent(
        email
      )}`,
      "_blank"
    );
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 24px)",
        display: "grid",
        placeItems: "center",
        px: 2,
        py: 6,
        background: pageBg,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 520 }}>
        {/* Animation */}
        <Box sx={{ display: "grid", placeItems: "center", mb: 2 }}>
          <Box sx={lottieWrap}>
            {/* subtle aura */}
            <Box
              sx={{
                position: "absolute",
                inset: -80,
                background:
                  `radial-gradient(circle at 30% 30%, ${alpha(
                    theme.palette.primary.main,
                    isDark ? 0.18 : 0.12
                  )}, transparent 55%),` +
                  `radial-gradient(circle at 70% 30%, ${alpha(
                    theme.palette.secondary.main,
                    isDark ? 0.18 : 0.12
                  )}, transparent 55%),` +
                  `radial-gradient(circle at 50% 80%, ${alpha(
                    theme.palette.success.main,
                    isDark ? 0.12 : 0.10
                  )}, transparent 55%)`,
                filter: "blur(14px)",
                pointerEvents: "none",
              }}
            />

            <Box sx={{ position: "relative" }}>
              <Lottie animationData={loginAi} loop autoplay style={{ width: "100%", height: 220 }} />
            </Box>
          </Box>
        </Box>

        {/* Login Card */}
        <Card sx={loginCard}>
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 950,
                mb: 1,
                color: isDark ? alpha("#F8FAFC", 0.96) : theme.palette.text.primary,
              }}
            >
              Log In
            </Typography>

            <Typography
              variant="body2"
              sx={{ mb: 2, color: isDark ? alpha("#E2E8F0", 0.72) : theme.palette.text.secondary }}
            >
              Use your PraxiaOne account credentials.
            </Typography>

            {err && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 0 }}>
                {err}
              </Alert>
            )}

            {/* IMPORTANT: form-level autocomplete control */}
            <Box component="form" autoComplete="off" onSubmit={(e) => e.preventDefault()}>
              <Stack spacing={2}>
                <TextField
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  fullWidth
                  sx={inputSx}
                  autoComplete="off"
                  suppressHydrationWarning
                  inputProps={{
                    autoComplete: "off",
                    form: { autoComplete: "off" },
                  }}
                />

                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  sx={inputSx}
                  autoComplete="new-password"
                  suppressHydrationWarning
                  inputProps={{
                    autoComplete: "new-password",
                  }}
                />

                {/* Forgot password row */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Button
                    variant="text"
                    onClick={openForgot}
                    sx={{
                      textTransform: "none",
                      fontWeight: 900,
                      px: 0,
                      minWidth: 0,
                      color: isDark ? alpha("#E2E8F0", 0.86) : theme.palette.text.primary,
                      "&:hover": {
                        background: alpha(theme.palette.text.primary, isDark ? 0.06 : 0.04),
                      },
                    }}
                  >
                    Forgot password?
                  </Button>

                  <Link
                    href="/support"
                    underline="hover"
                    sx={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: isDark ? alpha("#E2E8F0", 0.8) : theme.palette.text.primary,
                      opacity: 0.9,
                    }}
                  >
                    Need help?
                  </Link>
                </Stack>

                <Button
                  variant="contained"
                  color="success"
                  onClick={onLogin}
                  disabled={loading}
                  sx={{
                    borderRadius: 0,
                    fontWeight: 950,
                    py: 1.2,
                    boxShadow: isDark
                      ? "0 18px 55px rgba(0,0,0,0.35)"
                      : "0 18px 50px rgba(34,197,94,0.26)",
                  }}
                >
                  {loading ? "Logging in..." : "Log In"}
                </Button>

                <Typography
                  variant="body2"
                  textAlign="center"
                  sx={{ mt: 0.5, fontWeight: 700, color: isDark ? alpha("#E2E8F0", 0.9) : theme.palette.text.primary }}
                >
                  Don't have an account?{" "}
                  <Link href="/signup" underline="hover" sx={{ color: theme.palette.success.main, fontWeight: 900 }}>
                    Sign up
                  </Link>
                </Typography>

                <Divider sx={{ opacity: isDark ? 0.18 : 0.6 }} />

                <Typography
                  variant="caption"
                  sx={{ color: isDark ? alpha("#94A3B8", 0.78) : theme.palette.text.secondary }}
                >
                  By continuing, you agree to PraxiaOne’s Privacy Policy and Terms.
                </Typography>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* Forgot Password Dialog */}
        <Dialog open={fpOpen} onClose={() => setFpOpen(false)} fullWidth maxWidth="xs">
          <DialogTitle sx={{ fontWeight: 950 }}>Reset your password</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter your email. We’ll help you reset your password.
            </Typography>

            <TextField
              label="Email"
              value={fpEmail}
              onChange={(e) => setFpEmail(e.target.value)}
              fullWidth
              autoComplete="email"
            />

            {fpMsg && (
              <Alert
                severity={fpMsg.includes("valid") ? "error" : "success"}
                sx={{ mt: 2, borderRadius: 0 }}
              >
                {fpMsg}
              </Alert>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button variant="outlined" onClick={() => setFpOpen(false)} sx={{ borderRadius: 0, fontWeight: 900 }}>
              Close
            </Button>
            <Button variant="contained" color="success" onClick={submitForgot} sx={{ borderRadius: 0, fontWeight: 900 }}>
              Send reset link
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
