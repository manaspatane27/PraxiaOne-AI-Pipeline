"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  Divider,
  Alert,
} from "@mui/material";

import Lottie from "lottie-react";
import signupAnimation from "@/public/animations/signup-security.json";

import GoogleIcon from "@mui/icons-material/Google";
import FacebookIcon from "@mui/icons-material/Facebook";

import { register, login } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onSignup = async () => {
    const u = username.trim();
    const e = email.trim();
    const p = password;

    setErr("");

    if (!u) return setErr("Please enter a username.");
    if (u.includes(" ")) return setErr("Usernames cannot contain spaces. Use only letters, numbers, and @/./+/-/_ characters.");
    if (!e || !e.includes("@")) return setErr("Please enter a valid email address.");
    if (!p || p.length < 6) return setErr("Password must be at least 6 characters.");

    setLoading(true);

    try {
      // 1) Register
      await register({ username: u, email: e, password: p });

      // 2) Clear local storage drafts to ensure fresh state for the new user
      if (typeof window !== "undefined") {
        const keys = ["praxiaone_consent_state_v1", "praxiaone_wearables_state_v1", "praxiaone_support_drafts_v1"];
        keys.forEach(k => window.localStorage.removeItem(k));
      }

      // 3) Auto-login right after signup
      await login(u, p);

      // 4) Redirect to consent for immediate privacy setup
      router.push("/consent");
    } catch (e: any) {
      const msg =
        typeof e?.message === "string" && e.message.trim()
          ? e.message
          : "Signup failed. Please try again.";

      // Make error prettier when backend returns JSON/text
      if (msg.includes("Username already exists")) {
        setErr("That username is already taken. Try another one.");
      } else {
        setErr(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMockOAuth = async (provider: string) => {
    setErr("");
    setLoading(true);
    const mockUser = `${provider.toLowerCase()}User_${Math.floor(Math.random() * 10000)}`;
    const mockEmail = `${mockUser}@${provider.toLowerCase()}.com`;
    const mockPass = "OAuthStrongPass123!";

    try {
      await register({ username: mockUser, email: mockEmail, password: mockPass });
      
      if (typeof window !== "undefined") {
        const keys = ["praxiaone_consent_state_v1", "praxiaone_wearables_state_v1", "praxiaone_support_drafts_v1"];
        keys.forEach(k => window.localStorage.removeItem(k));
      }

      await login(mockUser, mockPass);
      router.push("/consent");
    } catch (e: any) {
      setErr(`Failed to connect to ${provider} OAuth.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "80vh",
        display: "grid",
        placeItems: "center",
        p: 2,
      }}
    >
      <Stack spacing={3} alignItems="center" sx={{ width: "100%", maxWidth: 440 }}>
        {/* ANIMATION */}
        <Box
          sx={{
            width: "100%",
            maxWidth: 320,
            borderRadius: 0,
            background:
              "linear-gradient(180deg, rgba(14,165,233,0.10), rgba(20,184,166,0.08))",
            boxShadow: "0 25px 80px rgba(2,6,23,0.08)",
            p: 2,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Lottie animationData={signupAnimation} loop autoplay style={{ height: 220 }} />
        </Box>

        {/* CARD */}
        <Card
          sx={{
            width: "100%",
            borderRadius: 0,
            boxShadow: "0 30px 90px rgba(2,6,23,0.10)",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              Create your account
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Join PraxiaOne and take control of your wellness data.
            </Typography>

            {err && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {err}
              </Alert>
            )}

            {/* FORM */}
            <Stack spacing={2}>
              <TextField
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                fullWidth
                autoComplete="username"
              />

              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                autoComplete="email"
              />

              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                autoComplete="new-password"
              />

              <Button
                variant="contained"
                color="success"
                onClick={onSignup}
                disabled={loading}
                sx={{ borderRadius: 0, fontWeight: 900, py: 1.2 }}
              >
                {loading ? "Creating account..." : "Sign Up"}
              </Button>
            </Stack>

            {/* DIVIDER */}
            <Divider sx={{ my: 3 }}>or continue with</Divider>

            {/* SOCIAL LOGIN */}
            <Stack spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<GoogleIcon />}
                sx={{ borderRadius: 0, fontWeight: 700 }}
                onClick={() => handleMockOAuth("Google")}
                disabled={loading}
              >
                Continue with Google
              </Button>

              <Button
                variant="outlined"
                startIcon={<FacebookIcon />}
                sx={{ borderRadius: 0, fontWeight: 700 }}
                onClick={() => handleMockOAuth("Facebook")}
                disabled={loading}
              >
                Continue with Facebook
              </Button>
            </Stack>

            {/* FOOTER */}
            <Typography
              variant="caption"
              sx={{ display: "block", mt: 3, textAlign: "center", opacity: 0.7 }}
            >
              By creating an account, you agree to PraxiaOne’s Privacy Policy and Terms of
              Service.
            </Typography>

            <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
              Already have an account?{" "}
              <span
                style={{ color: "#0ea5e9", cursor: "pointer", fontWeight: 700 }}
                onClick={() => router.push("/login")}
              >
                Log in
              </span>
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
