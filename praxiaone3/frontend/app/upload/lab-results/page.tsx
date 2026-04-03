"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { alpha, useTheme } from "@mui/material/styles";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";

import UploadFileIcon from "@mui/icons-material/UploadFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import InsightsIcon from "@mui/icons-material/Insights";
import ScienceIcon from "@mui/icons-material/Science";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";

import { apiFetch } from "@/lib/api"; // ✅ uses JWT + refresh + FormData-safe apiFetch

type UploadState = "idle" | "uploading" | "done";

type Doc = {
  id: number;
  doc_type: "care_plan" | "lab_result";
  title?: string;
  file: string;
  file_url?: string | null;
  uploaded_at: string;
};

type BackendConsent = {
  care_plan_allowed: boolean;
  lab_results_allowed: boolean;
  vitals_allowed: boolean;
  ai_insights_allowed: boolean;
  recommendations_allowed: boolean;
  updated_at?: string;
};

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(val >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export default function UploadLabResultsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [checkingConsent, setCheckingConsent] = useState(true);
  const [labAllowed, setLabAllowed] = useState(false);

  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);

  const [err, setErr] = useState("");
  const [uploaded, setUploaded] = useState<Doc[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const locked = useMemo(() => !labAllowed, [labAllowed]);
  const totalSize = useMemo(() => files.reduce((a, f) => a + f.size, 0), [files]);

  const acceptFiles = (incoming: FileList | null) => {
    setErr("");
    if (!incoming || incoming.length === 0) return;

    if (locked) {
      setErr("Lab Results consent is disabled. Enable it to upload PDFs.");
      return;
    }

    const picked = Array.from(incoming);
    const validFiles = picked.filter(
      (f) => f.type === "application/pdf" || f.type === "text/csv" || f.name.toLowerCase().endsWith(".pdf") || f.name.toLowerCase().endsWith(".csv")
    );

    if (validFiles.length === 0) {
      setErr("Please upload PDF lab reports or CSV flat files only.");
      return;
    }

    // max 5 files
    const merged = [...files, ...validFiles].slice(0, 5);

    // enforce 10MB each (demo)
    const tooBig = merged.find((f) => f.size > 10 * 1024 * 1024);
    if (tooBig) {
      setErr(`"${tooBig.name}" exceeds 10MB (demo). Please choose a smaller PDF.`);
      return;
    }

    setFiles(merged);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    acceptFiles(e.dataTransfer.files);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const reset = () => {
    setErr("");
    setFiles([]);
    setState("idle");
    setProgress(0);
  };

  const loadConsent = async () => {
    setCheckingConsent(true);
    setErr("");

    try {
      const c = await apiFetch<BackendConsent>("/consent/", { method: "GET" });
      setLabAllowed(Boolean(c.lab_results_allowed));
    } catch (e: any) {
      setLabAllowed(false);
      setErr(
        typeof e?.message === "string"
          ? e.message
          : "Could not verify consent. Please login and try again."
      );
    } finally {
      setCheckingConsent(false);
    }
  };

  const loadUploadedLabs = async () => {
    setLoadingList(true);
    setErr("");

    try {
      // This endpoint is already consent-gated on backend:
      // GET /documents/?type=lab_result -> 403 if consent disabled
      const data = await apiFetch<Doc[]>("/documents/?type=lab_result", { method: "GET" });
      setUploaded(data);
    } catch (e: any) {
      const msg =
        typeof e?.message === "string" ? e.message : "Failed to load lab reports.";
      setErr(msg);
      setUploaded([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadConsent();
      // load list even if locked: backend may 403, we handle that nicely
      await loadUploadedLabs();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadAll = async () => {
    setErr("");

    if (locked) {
      setErr("Lab Results consent is disabled. Enable it to upload PDFs.");
      return;
    }

    if (files.length === 0) {
      setErr("Add at least one PDF to upload.");
      return;
    }

    setState("uploading");
    setProgress(0);

    // fake progress ticker (UI only)
    let tick = 0;
    const timer = setInterval(() => {
      tick += Math.floor(Math.random() * 10 + 6);
      setProgress((p) => Math.min(92, Math.max(p, tick)));
    }, 260);

    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];

        const fd = new FormData();
        fd.append("doc_type", "lab_result"); // ✅ IMPORTANT: backend requires this
        fd.append("title", f.name);
        fd.append("file", f);

        await apiFetch("/documents/", {
          method: "POST",
          body: fd, // ✅ apiFetch must not force JSON headers here (your comment says it’s FormData-safe)
        });

        setProgress((p) => Math.min(92, p + Math.floor(60 / files.length)));
      }

      clearInterval(timer);
      setProgress(100);
      setState("done");
      setFiles([]);
      await loadUploadedLabs();
    } catch (e: any) {
      clearInterval(timer);
      setProgress(0);
      setState("idle");

      const msg =
        typeof e?.message === "string" ? e.message : "Upload failed.";
      setErr(msg);
    }
  };

  const deleteDoc = async (id: number) => {
    if (!confirm("Delete this lab report PDF?")) return;

    setErr("");
    try {
      // use the same "delete/" suffix as backend
      await apiFetch(`/documents/${id}/delete/`, { method: "DELETE" });
      setUploaded((prev) => prev.filter((d) => d.id !== id));
    } catch (e: any) {
      // strip any HTML from the error message
      let msg = typeof e?.message === "string" ? e.message : "Delete failed.";
      msg = msg.replace(/<[^>]+>/g, "");
      setErr(msg);
    }
  };

  const glassCard = useMemo(
    () => ({
      borderRadius: 0,
      overflow: "hidden",
      border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.10)}`,
      background: isDark
        ? `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.20)}, ${alpha(
            theme.palette.background.paper,
            0.10
          )})`
        : "linear-gradient(180deg, rgba(20,184,166,0.10), rgba(14,165,233,0.06) 55%, rgba(255,255,255,0.60))",
      backdropFilter: "blur(12px)",
      boxShadow: isDark ? "0 22px 70px rgba(0,0,0,0.45)" : "0 20px 50px rgba(2,8,23,0.06)",
    }),
    [theme, isDark]
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: -0.5 }}>
              Upload Lab Results
            </Typography>
            <Chip size="small" icon={<ScienceIcon />} label="PDF / CSV" sx={{ fontWeight: 800 }} />
          </Stack>

          <Typography color="text.secondary">
            Upload lab report PDFs or Flat File CSVs. PraxiaOne extracts trends (with your consent) to power AI insights.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button component={Link} href="/data" variant="outlined" sx={{ borderRadius: 0, fontWeight: 900 }}>
            Back to Data Sources
          </Button>

          <Button
            component={Link}
            href="/consent"
            variant="outlined"
            startIcon={<LockIcon />}
            sx={{ borderRadius: 0, fontWeight: 900 }}
          >
            Manage Consent
          </Button>
        </Stack>
      </Stack>

      {checkingConsent && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Checking consent…
        </Alert>
      )}

      {!checkingConsent && locked && (
        <Alert
          severity="warning"
          icon={<LockIcon />}
          sx={{ mb: 2 }}
          action={
            <Button component={Link} href="/consent" size="small" variant="contained">
              Go to Consent
            </Button>
          }
        >
          Lab Results consent is <b>disabled</b>. Enable it to upload PDFs.
        </Alert>
      )}

      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}

      <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
        {/* Left: Upload area */}
        <Box sx={{ flex: 1.2 }}>
          <Card sx={glassCard}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              {/* Dropzone */}
              <Box
                onDragEnter={() => !locked && setDragOver(true)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!locked) setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={locked ? undefined : onDrop}
                onClick={() => {
                  if (!locked) inputRef.current?.click();
                }}
                role="button"
                tabIndex={0}
                sx={{
                  cursor: locked ? "not-allowed" : "pointer",
                  opacity: locked ? 0.65 : 1,
                  borderRadius: 0,
                  p: { xs: 2.2, md: 3 },
                  border: "1px dashed",
                  borderColor: dragOver ? "primary.main" : alpha(theme.palette.text.primary, isDark ? 0.22 : 0.14),
                  bgcolor: dragOver
                    ? alpha(theme.palette.primary.main, isDark ? 0.12 : 0.08)
                    : alpha("#ffffff", isDark ? 0.06 : 0.55),
                  transition: "all .18s ease",
                }}
              >
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 54,
                      height: 54,
                      borderRadius: 0,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: alpha(theme.palette.primary.main, isDark ? 0.18 : 0.14),
                    }}
                  >
                    <UploadFileIcon />
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 950 }}>
                      Drag & drop PDFs/CSVs here, or click to browse
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Max 5 files • Recommended: 1–3 reports at a time • Max 10MB each
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    color="success"
                    disabled={locked}
                    sx={{ borderRadius: 0, fontWeight: 950, px: 2.2 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!locked) inputRef.current?.click();
                    }}
                  >
                    Choose Files
                  </Button>

                  <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf,.pdf,text/csv,.csv"
                    multiple
                    hidden
                    onChange={(e) => acceptFiles(e.target.files)}
                  />
                </Stack>
              </Box>

              {/* File list */}
              {files.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                    spacing={1}
                    sx={{ mb: 1 }}
                  >
                    <Typography sx={{ fontWeight: 950 }}>
                      Selected files ({files.length})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total: {formatBytes(totalSize)}
                    </Typography>
                  </Stack>

                  <List
                    dense
                    sx={{
                      borderRadius: 0,
                      bgcolor: alpha("#ffffff", isDark ? 0.06 : 0.60),
                      border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
                    }}
                  >
                    {files.map((f, idx) => (
                      <ListItem
                        key={`${f.name}-${idx}`}
                        secondaryAction={
                          <IconButton aria-label="remove" onClick={() => removeFile(idx)}>
                            <DeleteOutlineIcon />
                          </IconButton>
                        }
                      >
                        <PictureAsPdfIcon sx={{ mr: 1 }} />
                        <ListItemText
                          primary={
                            <Typography sx={{ fontWeight: 850 }} noWrap>
                              {f.name}
                            </Typography>
                          }
                          secondary={`${formatBytes(f.size)}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Progress + actions */}
              <Divider sx={{ my: 2 }} />

              {state === "uploading" && (
                <Box sx={{ mb: 1 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 850 }}>
                      Uploading…
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {progress}%
                    </Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={progress} />
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.8 }}>
                    We’ll extract lab trends (not raw values) for explainable insights — based on your consent.
                  </Typography>
                </Box>
              )}

              {state === "done" && (
                <Alert icon={<CheckCircleIcon />} severity="success" sx={{ mb: 2 }}>
                  Uploaded successfully. Your lab source is now ready for AI insights (based on consent).
                </Alert>
              )}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <Button
                  onClick={uploadAll}
                  disabled={locked || state === "uploading"}
                  variant="contained"
                  color="success"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ borderRadius: 0, fontWeight: 950, py: 1.1, flex: 1 }}
                >
                  {state === "uploading" ? "Uploading…" : state === "done" ? "Upload Again" : "Upload PDFs"}
                </Button>

                <Button
                  onClick={reset}
                  disabled={state === "uploading"}
                  variant="outlined"
                  sx={{ borderRadius: 0, fontWeight: 950, py: 1.1 }}
                >
                  Clear
                </Button>

                <Button
                  component={Link}
                  href="/insights"
                  disabled={state !== "done"}
                  variant="outlined"
                  startIcon={<InsightsIcon />}
                  sx={{ borderRadius: 0, fontWeight: 950, py: 1.1 }}
                >
                  Open AI Insights
                </Button>
              </Stack>

              {/* Uploaded list */}
              <Divider sx={{ my: 2 }} />

              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography sx={{ fontWeight: 950 }}>Uploaded lab reports</Typography>
                <Button
                  onClick={async () => {
                    await loadConsent();
                    await loadUploadedLabs();
                  }}
                  disabled={loadingList}
                  variant="outlined"
                  sx={{ borderRadius: 0, fontWeight: 900 }}
                >
                  {loadingList ? "Loading..." : "Refresh"}
                </Button>
              </Stack>

              {uploaded.length === 0 ? (
                <Alert severity="warning">
                  {locked ? "Enable consent to view lab reports." : "No lab reports uploaded yet."}
                </Alert>
              ) : (
                <List
                  dense
                  sx={{
                    borderRadius: 0,
                    bgcolor: alpha("#ffffff", isDark ? 0.06 : 0.60),
                    border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
                  }}
                >
                  {uploaded.map((d) => (
                    <ListItem
                      key={d.id}
                      secondaryAction={
                        <Stack direction="row" spacing={0.6}>
                          {d.file_url && (
                            <Tooltip title="Open">
                              <IconButton onClick={() => window.open(d.file_url!, "_blank")}>
                                <OpenInNewRoundedIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <IconButton onClick={() => deleteDoc(d.id)}>
                              <DeleteOutlineIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      }
                    >
                      <PictureAsPdfIcon sx={{ mr: 1 }} />
                      <ListItemText
                        primary={
                          <Typography sx={{ fontWeight: 850 }} noWrap>
                            {d.title || d.file?.split("/").pop() || "Lab report PDF"}
                          </Typography>
                        }
                        secondary={`Uploaded: ${new Date(d.uploaded_at).toLocaleString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Right: Info */}
        <Box sx={{ flex: 0.9 }}>
          <Stack spacing={2}>
            <Card
              sx={{
                borderRadius: 0,
                bgcolor: alpha("#ffffff", isDark ? 0.06 : 0.75),
                backdropFilter: "blur(10px)",
                border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
                boxShadow: isDark ? "0 16px 40px rgba(0,0,0,0.35)" : "0 16px 40px rgba(2,8,23,0.05)",
              }}
            >
              <CardContent>
                <Typography sx={{ fontWeight: 950, mb: 1 }}>What PraxiaOne extracts</Typography>

                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label="Trends" sx={{ fontWeight: 850 }} />
                    <Typography variant="body2" color="text.secondary">
                      Changes over time (e.g., improving / stable / needs attention)
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label="Highlights" sx={{ fontWeight: 850 }} />
                    <Typography variant="body2" color="text.secondary">
                      Key findings you can review before using AI insights
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label="Explainability" sx={{ fontWeight: 850 }} />
                    <Typography variant="body2" color="text.secondary">
                      AI will say why it made a suggestion and what data categories were used
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Card
              sx={{
                borderRadius: 0,
                bgcolor: alpha(theme.palette.success.main, isDark ? 0.08 : 0.10),
                border: `1px solid ${alpha(theme.palette.success.main, isDark ? 0.20 : 0.22)}`,
              }}
            >
              <CardContent>
                <Typography sx={{ fontWeight: 950, mb: 1 }}>Consent-first by design</Typography>
                <Typography variant="body2" color="text.secondary">
                  Lab data is only used if you enable the relevant consent categories. You can revoke consent anytime.
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
                  <Chip icon={<LockIcon />} label="User controlled consent" />
                  <Chip label="Secure & encrypted" />
                  <Chip label="HIPAA-ready UX" />
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
                  <Button
                    component={Link}
                    href="/consent"
                    variant="contained"
                    color="primary"
                    sx={{ borderRadius: 0, fontWeight: 950 }}
                  >
                    Review Consent
                  </Button>
                  <Button component={Link} href="/data" variant="outlined" sx={{ borderRadius: 0, fontWeight: 950 }}>
                    See Connected Sources
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
