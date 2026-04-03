"use client";

import { useEffect, useMemo, useState } from "react";
import Lottie from "lottie-react";
import Link from "next/link";

import { alpha, useTheme } from "@mui/material/styles";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Divider,
  Grid,
  TextField,
  InputAdornment,
  MenuItem,
  LinearProgress,
  Snackbar,
  Alert,
  Paper,
  Avatar,
  Tooltip,
  IconButton,
  Stack,
  Skeleton,
} from "@mui/material";

import {
  Help as HelpIcon,
  SupportAgent,
  BugReport,
  Feedback,
  Security,
  AttachFile,
  Send,
  CheckCircle,
  InfoOutlined,
  ArrowForward,
  ContentCopy,
  MailOutline,
  LiveHelp,
  Schedule,
} from "@mui/icons-material";

type FormState = {
  category: "Bug" | "Account" | "Feature request" | "Feedback" | "Other";
  subject: string;
  message: string;
  email: string;
  priority: "Low" | "Normal" | "High";
  includeDiagnostics: boolean;
  attachmentName?: string;
  attachmentSize?: number;
};

const STORAGE_KEY = "praxiaone_support_drafts_v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function useLottieJson(url: string) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let alive = true;

    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (!alive) return;
        setData(json);
      })
      .catch(() => {
        if (!alive) return;
        setData(null);
      });

    return () => {
      alive = false;
    };
  }, [url]);

  return data;
}

export default function SupportPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // ✅ ensure file exists: frontend/public/animations/support.json
  const supportAnim = useLottieJson("/animations/support.json");

  const [form, setForm] = useState<FormState>({
    category: "Feedback",
    subject: "",
    message: "",
    email: "",
    priority: "Normal",
    includeDiagnostics: true,
    attachmentName: "",
    attachmentSize: 0,
  });

  const [sending, setSending] = useState(false);
  const [submittedPulse, setSubmittedPulse] = useState(false);

  const [toast, setToast] = useState<{
    open: boolean;
    msg: string;
    type: "success" | "info" | "warning" | "error";
  }>({ open: false, msg: "", type: "success" });

  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const saved = safeParse<FormState>(localStorage.getItem(STORAGE_KEY));
    if (saved) setForm((p) => ({ ...p, ...saved }));
    const t = localStorage.getItem(`${STORAGE_KEY}_ts`);
    if (t) setDraftSavedAt(t);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
        const ts = new Date().toLocaleString();
        localStorage.setItem(`${STORAGE_KEY}_ts`, ts);
        setDraftSavedAt(ts);
      } catch {}
    }, 500);
    return () => clearTimeout(id);
  }, [form]);

  const progress = useMemo(() => {
    const a = form.subject.trim().length > 0 ? 1 : 0;
    const b = form.message.trim().length >= 20 ? 1 : 0;
    const c = form.category ? 1 : 0;
    const d = form.email.trim().length > 3 ? 1 : 0;
    return Math.round(((a + b + c + d) / 4) * 100);
  }, [form]);

  const helperHint = useMemo(() => {
    if (progress < 25) return "Start with a clear subject + what you expected vs what happened.";
    if (progress < 50) return "Add steps to reproduce or a screenshot note to speed up help.";
    if (progress < 75) return "Nice. Add device/browser details if it’s a UI issue.";
    return "Perfect. Ready to send ✅";
  }, [progress]);

  const categoryIcon = useMemo(() => {
    switch (form.category) {
      case "Bug":
        return <BugReport sx={{ fontSize: 18 }} />;
      case "Account":
        return <Security sx={{ fontSize: 18 }} />;
      case "Feature request":
        return <LiveHelp sx={{ fontSize: 18 }} />;
      case "Feedback":
        return <Feedback sx={{ fontSize: 18 }} />;
      default:
        return <HelpIcon sx={{ fontSize: 18 }} />;
    }
  }, [form.category]);

  const onChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const reset = () => {
    setForm({
      category: "Feedback",
      subject: "",
      message: "",
      email: "",
      priority: "Normal",
      includeDiagnostics: true,
      attachmentName: "",
      attachmentSize: 0,
    });
    setToast({ open: true, msg: "Cleared form (draft autosave updated).", type: "info" });
  };

  const copyTemplate = async () => {
    const template =
      `Category: ${form.category}\n` +
      `Priority: ${form.priority}\n` +
      `Subject: ${form.subject || "(add subject)"}\n\n` +
      `What happened?\n- \n\nWhat did you expect?\n- \n\nSteps to reproduce:\n1) \n2) \n3) \n\nEnvironment:\n- Browser: \n- OS: \n- Page URL: /support\n`;
    try {
      await navigator.clipboard.writeText(template);
      setToast({ open: true, msg: "Copied a helpful support template ✅", type: "success" });
    } catch {
      setToast({ open: true, msg: "Could not copy to clipboard.", type: "warning" });
    }
  };

  const submit = async () => {
    if (!form.subject.trim()) {
      setToast({ open: true, msg: "Please add a subject.", type: "warning" });
      return;
    }
    if (form.message.trim().length < 20) {
      setToast({ open: true, msg: "Message is too short. Add a little more detail.", type: "warning" });
      return;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      setToast({ open: true, msg: "Please enter a valid email address.", type: "warning" });
      return;
    }

    setSending(true);
    setToast({ open: true, msg: "Sending… (demo)", type: "info" });

    await new Promise((r) => setTimeout(r, 900));

    setSending(false);
    setSubmittedPulse(true);
    setTimeout(() => setSubmittedPulse(false), 900);

    setToast({ open: true, msg: "Submitted! (demo) ✅ No backend hooked yet.", type: "success" });
  };

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
      `radial-gradient(1100px 520px at 12% 0%, ${alpha(p, 0.12)}, transparent 60%),` +
      `radial-gradient(900px 480px at 90% 10%, ${alpha(s, 0.12)}, transparent 60%),` +
      `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.default} 100%)`
    );
  }, [theme, isDark]);

  const AnimatedCardSx = useMemo(
    () => ({
      borderRadius: 0,
      border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
      boxShadow: isDark ? "0 28px 110px rgba(0,0,0,0.55)" : "0 16px 60px rgba(15,23,42,0.10)",
      background: isDark
        ? `linear-gradient(180deg, ${alpha("#0f172a", 0.80)}, ${alpha("#020617", 0.72)})`
        : `linear-gradient(180deg, ${alpha("#ffffff", 0.86)}, ${alpha("#ffffff", 0.62)})`,
      backdropFilter: "blur(14px)",
      transition: "transform 220ms ease, box-shadow 220ms ease",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: isDark ? "0 38px 140px rgba(0,0,0,0.65)" : "0 22px 70px rgba(15,23,42,0.12)",
      },
    }),
    [theme, isDark]
  );

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 24px)",
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
        background: pageBg,
        "@keyframes pageIn": {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0px)" },
        },
        "@keyframes shimmer": {
          "0%": { backgroundPosition: "-200px 0" },
          "100%": { backgroundPosition: "200px 0" },
        },
        "@keyframes pulseOk": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
          "100%": { transform: "scale(1)" },
        },
        animation: "pageIn .45s ease-out",
      }}
    >
      {/* HERO */}
      <Card
        sx={{
          ...AnimatedCardSx,
          mb: 3,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <CardContent sx={{ position: "relative", py: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    width: 54,
                    height: 54,
                    fontWeight: 950,
                    boxShadow: isDark ? "0 18px 40px rgba(0,0,0,0.40)" : "0 18px 40px rgba(15,23,42,0.10)",
                    background: isDark ? alpha("#0b1228", 0.70) : alpha("#ffffff", 0.80),
                    color: theme.palette.primary.main,
                    border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
                  }}
                >
                  <SupportAgent />
                </Avatar>

                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.6, flexWrap: "wrap" }}>
                    <Chip
                      icon={<HelpIcon sx={{ fontSize: 18 }} />}
                      label="Help / Support"
                      size="small"
                      sx={{
                        fontWeight: 950,
                        borderRadius: 0,
                        background: alpha(theme.palette.primary.main, isDark ? 0.18 : 0.12),
                      }}
                    />
                    <Chip
                      icon={<CheckCircle sx={{ fontSize: 18 }} />}
                      label="Fast triage"
                      size="small"
                      sx={{
                        fontWeight: 950,
                        borderRadius: 0,
                        background: alpha(theme.palette.text.primary, isDark ? 0.10 : 0.06),
                        color: isDark ? alpha("#E2E8F0", 0.92) : theme.palette.text.primary,
                      }}
                    />
                    <Chip
                      icon={<Schedule sx={{ fontSize: 18 }} />}
                      label={draftSavedAt ? `Draft saved: ${draftSavedAt}` : "Draft autosave: on"}
                      size="small"
                      sx={{
                        fontWeight: 950,
                        borderRadius: 0,
                        background: alpha(theme.palette.text.primary, isDark ? 0.10 : 0.06),
                        color: isDark ? alpha("#E2E8F0", 0.92) : theme.palette.text.primary,
                        maxWidth: 520,
                      }}
                    />
                  </Stack>

                  <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: -0.8 }}>
                    How can we help?
                  </Typography>
                  <Typography sx={{ color: isDark ? alpha("#E2E8F0", 0.72) : theme.palette.text.secondary }}>
                    Tell us what’s happening — the more detail, the faster the fix (demo submission).
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                sx={{
                  borderRadius: 0,
                  border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
                  background: isDark
                    ? `linear-gradient(135deg, ${alpha("#0f172a", 0.55)}, ${alpha("#020617", 0.45)})`
                    : `linear-gradient(135deg, ${alpha("#ffffff", 0.70)}, ${alpha(theme.palette.primary.main, 0.06)})`,
                  overflow: "hidden",
                  position: "relative",
                  p: 1.5,
                }}
              >
                {!supportAnim ? (
                  <Skeleton variant="rounded" height={220} />
                ) : (
                  <Lottie animationData={supportAnim} loop autoplay style={{ width: "100%", height: 220 }} />
                )}
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2, opacity: isDark ? 0.12 : 0.25 }} />

          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            spacing={2}
          >
            <Stack spacing={0.8} sx={{ minWidth: { xs: "100%", md: 520 } }}>
              <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                <Chip
                  icon={categoryIcon}
                  label={`Category: ${form.category}`}
                  size="small"
                  sx={{
                    fontWeight: 950,
                    borderRadius: 0,
                    background: alpha(theme.palette.text.primary, isDark ? 0.10 : 0.06),
                    color: isDark ? alpha("#E2E8F0", 0.92) : theme.palette.text.primary,
                  }}
                />
                <Tooltip title="Demo mode: this does not send an actual ticket yet.">
                  <IconButton
                    onClick={() =>
                      setToast({
                        open: true,
                        msg: "Demo mode: we can connect this form to Django later.",
                        type: "info",
                      })
                    }
                  >
                    <InfoOutlined />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 900, color: isDark ? alpha("#E2E8F0", 0.72) : theme.palette.text.secondary }}>
                  Ticket readiness: {progress}%
                </Typography>

                <LinearProgress
                  variant="determinate"
                  value={clamp(progress, 0, 100)}
                  sx={{
                    height: 10,
                    borderRadius: 0,
                    background: alpha(theme.palette.text.primary, isDark ? 0.12 : 0.08),
                    overflow: "hidden",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 0,
                      position: "relative",
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    },
                    "& .MuiLinearProgress-bar::after": {
                      content: '""',
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(90deg, rgba(255,255,255,0.0), rgba(255,255,255,0.45), rgba(255,255,255,0.0))",
                      backgroundSize: "200px 100%",
                      animation: progress > 0 ? "shimmer 1.6s linear infinite" : "none",
                      opacity: 0.7,
                    },
                  }}
                />

                <Typography variant="caption" sx={{ display: "block", mt: 0.8, color: isDark ? alpha("#E2E8F0", 0.72) : theme.palette.text.secondary }}>
                  Tip: {helperHint}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} sx={{ pt: 0.6 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopy />}
                  onClick={copyTemplate}
                  sx={{ borderRadius: 0, fontWeight: 950 }}
                >
                  Copy template
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<Send />}
                  onClick={submit}
                  disabled={sending}
                  sx={{
                    borderRadius: 0,
                    fontWeight: 950,
                    boxShadow: isDark ? "0 18px 50px rgba(34,197,94,0.35)" : "0 14px 40px rgba(34,197,94,0.22)",
                  }}
                >
                  {sending ? "Submitting…" : "Submit"}
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* FORM */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={AnimatedCardSx}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <SupportAgent />
                  <Typography sx={{ fontWeight: 950 }}>Create a support ticket</Typography>
                </Stack>
                <Chip
                  icon={<Security sx={{ fontSize: 18 }} />}
                  label="Privacy-first"
                  size="small"
                  sx={{
                    fontWeight: 950,
                    borderRadius: 0,
                    background: alpha(theme.palette.primary.main, isDark ? 0.18 : 0.12),
                  }}
                />
              </Stack>

              <Typography variant="body2" sx={{ color: isDark ? alpha("#E2E8F0", 0.72) : theme.palette.text.secondary, mb: 2 }}>
                Share only what you’re comfortable with. You’re always in control.
              </Typography>

              <Divider sx={{ mb: 2, opacity: isDark ? 0.12 : 0.25 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="Category"
                    value={form.category}
                    onChange={(e) => onChange("category", e.target.value as FormState["category"])}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {form.category === "Bug" ? (
                            <BugReport />
                          ) : form.category === "Account" ? (
                            <Security />
                          ) : form.category === "Feature request" ? (
                            <LiveHelp />
                          ) : form.category === "Feedback" ? (
                            <Feedback />
                          ) : (
                            <HelpIcon />
                          )}
                        </InputAdornment>
                      ),
                    }}
                  >
                    <MenuItem value="Bug">Bug</MenuItem>
                    <MenuItem value="Account">Account</MenuItem>
                    <MenuItem value="Feature request">Feature request</MenuItem>
                    <MenuItem value="Feedback">Feedback</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="Priority"
                    value={form.priority}
                    onChange={(e) => onChange("priority", e.target.value as FormState["priority"])}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Schedule />
                        </InputAdornment>
                      ),
                    }}
                  >
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Normal">Normal</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Subject"
                    value={form.subject}
                    onChange={(e) => onChange("subject", e.target.value)}
                    placeholder="e.g., Progress bar not updating on Vitals page"
                    inputProps={{ maxLength: 120 }}
                    helperText={`${form.subject.length}/120`}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <HelpIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Message"
                    value={form.message}
                    onChange={(e) => onChange("message", e.target.value)}
                    placeholder={`Include:
• What happened?
• What you expected?
• Steps to reproduce
• Any screenshots or error text`}
                    multiline
                    minRows={6}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1.5 }}>
                          <Feedback />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 7 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={form.email}
                    onChange={(e) => onChange("email", e.target.value)}
                    placeholder="So we can follow up"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <MailOutline />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 5 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 0,
                      height: "100%",
                      border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
                      background: alpha(theme.palette.background.paper, isDark ? 0.35 : 0.70),
                      transition: "transform 220ms ease",
                      "&:hover": { transform: "translateY(-2px)" },
                      display: "flex", flexDirection: "column"
                    }}
                  >
                    <Typography sx={{ fontWeight: 950, mb: 0.5 }}>Attachments</Typography>
                    
                    {form.attachmentName ? (
                      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <Box sx={{ p: 1, border: `1px dashed ${theme.palette.primary.main}`, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1, display: "flex", alignItems: "center", gap: 1 }}>
                          <AttachFile fontSize="small" color="primary" />
                          <Box sx={{ flex: 1, overflow: "hidden" }}>
                            <Typography variant="caption" sx={{ display: "block", fontWeight: 700, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{form.attachmentName}</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.6 }}>{Math.round(form.attachmentSize! / 1024)} KB</Typography>
                          </Box>
                          <IconButton size="small" onClick={() => setForm(p => ({...p, attachmentName: "", attachmentSize: 0}))}>
                             <Typography sx={{ fontSize: 16 }}>×</Typography>
                          </IconButton>
                        </Box>
                      </Box>
                    ) : (
                      <>
                        <Typography variant="body2" sx={{ color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}>
                          Attach screenshots, logs, or error reports to help us debug faster.
                        </Typography>
                        <Button
                          fullWidth
                          variant="outlined"
                          component="label"
                          startIcon={<AttachFile />}
                          sx={{ mt: 'auto', borderRadius: 0, fontWeight: 950 }}
                        >
                          Add file
                          <input type="file" hidden onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const f = e.target.files[0];
                              setForm(p => ({...p, attachmentName: f.name, attachmentSize: f.size}));
                            }
                          }} />
                        </Button>
                      </>
                    )}
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2.5, opacity: isDark ? 0.12 : 0.25 }} />

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.2}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={form.includeDiagnostics ? "Diagnostics: Included (demo)" : "Diagnostics: Off"}
                    size="small"
                    sx={{
                      fontWeight: 950,
                      borderRadius: 0,
                      background: alpha(theme.palette.text.primary, isDark ? 0.10 : 0.06),
                      color: isDark ? alpha("#E2E8F0", 0.92) : theme.palette.text.primary,
                    }}
                  />
                  <Tooltip title="If enabled, we would attach non-sensitive device/app info to help debug.">
                    <IconButton onClick={() => onChange("includeDiagnostics", !form.includeDiagnostics)} size="small">
                      <InfoOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>

                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" onClick={reset} sx={{ borderRadius: 0, fontWeight: 950 }}>
                    Clear
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={submit}
                    disabled={sending}
                    endIcon={<Send />}
                    sx={{
                      borderRadius: 0,
                      fontWeight: 950,
                      px: 2.5,
                      boxShadow: isDark ? "0 18px 50px rgba(34,197,94,0.35)" : "0 14px 40px rgba(34,197,94,0.22)",
                      animation: submittedPulse ? "pulseOk 900ms ease" : "none",
                    }}
                  >
                    {sending ? "Submitting…" : "Submit ticket"}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT PANEL */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card
            sx={{
              ...AnimatedCardSx,
              position: "sticky",
              top: 18,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <HelpIcon />
                <Typography sx={{ fontWeight: 950 }}>Quick help</Typography>
              </Stack>
              <Typography variant="body2" sx={{ mt: 1, color: isDark ? alpha("#E2E8F0", 0.72) : theme.palette.text.secondary }}>
                Try these first — they solve most issues in seconds.
              </Typography>

              <Divider sx={{ my: 2, opacity: isDark ? 0.12 : 0.25 }} />

              <Stack spacing={1.2}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 0,
                    border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
                    background: alpha(theme.palette.background.paper, isDark ? 0.30 : 0.70),
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <BugReport />
                    <Typography sx={{ fontWeight: 950 }}>If it’s a UI bug</Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}>
                    Include page URL, steps, and what you saw vs expected.
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 0,
                    border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
                    background: alpha(theme.palette.background.paper, isDark ? 0.30 : 0.70),
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Security />
                    <Typography sx={{ fontWeight: 950 }}>Privacy note</Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}>
                    Don’t paste passwords or full medical reports. Consent controls everything.
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 0,
                    border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
                    background: alpha(theme.palette.primary.main, isDark ? 0.12 : 0.08),
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.6 }}>
                    <MailOutline />
                    <Typography sx={{ fontWeight: 950 }}>Contact options</Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ mb: 1, color: isDark ? alpha("#E2E8F0", 0.70) : theme.palette.text.secondary }}>
                    For now, this is a placeholder. Later we can connect it to email + Django tickets.
                  </Typography>
                  <Button
                    component={Link}
                    href="/consent"
                    variant="outlined"
                    endIcon={<ArrowForward />}
                    sx={{ borderRadius: 0, fontWeight: 950 }}
                  >
                    Review Consent
                  </Button>
                </Paper>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={toast.open}
        autoHideDuration={2600}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert severity={toast.type} variant="filled" onClose={() => setToast((t) => ({ ...t, open: false }))} sx={{ borderRadius: 0 }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
