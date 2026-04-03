"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme, alpha } from "@mui/material/styles";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
} from "@mui/material";

import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";

const API = "http://127.0.0.1:8000/api";

type Doc = {
  id: number;
  doc_type: "care_plan" | "lab_result";
  title?: string;
  file: string;
  file_url?: string | null;
  uploaded_at: string;
};

function authHeadersJSON() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("access")}`,
  };
}

function authHeadersBearerOnly() {
  return {
    Authorization: `Bearer ${localStorage.getItem("access")}`,
  };
}

export default function UploadCarePlanPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const [docs, setDocs] = useState<Doc[]>([]);
  const [err, setErr] = useState<string>("");

  const meta = useMemo(() => {
    if (!file) return null;
    const mb = (file.size / (1024 * 1024)).toFixed(2);
    return { name: file.name, mb };
  }, [file]);

  const pick = () => inputRef.current?.click();

  const onSelect = (f?: File | null) => {
    setErr("");
    setDone(false);
    setProgress(0);

    if (!f) {
      setFile(null);
      return;
    }

    const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setErr("Please select a PDF file only.");
      setFile(null);
      return;
    }

    if (f.size > 10 * 1024 * 1024) {
      setErr("Max 10MB allowed (demo). Please choose a smaller PDF.");
      setFile(null);
      return;
    }

    setFile(f);
  };

  const loadCarePlans = async () => {
    setLoadingList(true);
    setErr("");
    try {
      const res = await fetch(`${API}/documents/?type=care_plan`, {
        headers: authHeadersBearerOnly(),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Failed to fetch uploaded care plans.");
      }

      const data = (await res.json()) as Doc[];
      setDocs(data);
    } catch (e: any) {
      setErr(e?.message || "Failed to load care plans.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    // Load list on page open
    try {
      if (!localStorage.getItem("access")) {
        setErr("Please login first (no access token found).");
        return;
      }
    } catch {}
    loadCarePlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadReal = async () => {
    setErr("");
    if (!file) {
      setErr("Choose a PDF first.");
      return;
    }

    setBusy(true);
    setDone(false);
    setProgress(0);

    // fake progress ticker while upload happens (since fetch doesn't give upload progress)
    let tick = 0;
    const timer = setInterval(() => {
      tick += Math.floor(Math.random() * 8 + 5);
      setProgress((p) => Math.min(92, Math.max(p, tick)));
    }, 220);

    try {
      const fd = new FormData();
      fd.append("doc_type", "care_plan");
      fd.append("title", file.name);
      fd.append("file", file);

      const res = await fetch(`${API}/documents/`, {
        method: "POST",
        headers: authHeadersBearerOnly(),
        body: fd,
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Upload failed.");
      }

      clearInterval(timer);
      setProgress(100);
      setDone(true);
      setFile(null);

      await loadCarePlans();
    } catch (e: any) {
      clearInterval(timer);
      setProgress(0);
      setDone(false);
      setErr(e?.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const deleteDoc = async (id: number) => {
    if (!confirm("Delete this uploaded care plan?")) return;
    setErr("");
    try {
      // backend uses explicit "delete/" suffix on the URL
      const res = await fetch(`${API}/documents/${id}/delete/`, {
        method: "DELETE",
        headers: authHeadersBearerOnly(),
      });

      if (!res.ok) {
        // backend may return HTML debug page; only show the status text
        const t = await res.text();
        // strip tags to avoid dumping entire HTML
        const clean = t.replace(/<[^>]+>/g, "");
        throw new Error(clean || "Delete failed.");
      }

      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (e: any) {
      setErr(e?.message || "Delete failed.");
    }
  };

  // ---- Theme-aware page background like your other pages ----
  const pageBg = useMemo(() => {
    const p = theme.palette.primary.main;
    const s = theme.palette.secondary.main;
    const ok = theme.palette.success.main;

    if (isDark) {
      return (
        `radial-gradient(1200px 700px at 15% 0%, ${alpha(p, 0.22)}, transparent 60%),` +
        `radial-gradient(1000px 600px at 85% 15%, ${alpha(s, 0.20)}, transparent 55%),` +
        `radial-gradient(900px 520px at 50% 110%, ${alpha(ok, 0.12)}, transparent 55%),` +
        `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.default} 100%)`
      );
    }

    return (
      `radial-gradient(1100px 560px at 12% 0%, ${alpha(p, 0.12)}, transparent 60%),` +
      `radial-gradient(900px 520px at 90% 10%, ${alpha(s, 0.10)}, transparent 60%),` +
      `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.default} 100%)`
    );
  }, [theme, isDark]);

  const border = `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.10)}`;

  // ---- Glass card surface ----
  const cardBg = useMemo(() => {
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

    const base = isDark
      ? `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.22)}, ${alpha(
          theme.palette.background.paper,
          0.12
        )})`
      : `linear-gradient(180deg, ${alpha("#ffffff", 0.92)}, ${alpha("#ffffff", 0.72)})`;

    return `${glow}, ${base}`;
  }, [theme, isDark]);

  const shadow = isDark ? "0 30px 95px rgba(0,0,0,0.55)" : "0 22px 70px rgba(2,6,23,0.10)";

  return (
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
        minHeight: "calc(100vh - 64px)",
        background: pageBg,
      }}
    >
      <Stack spacing={2.2}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 950, color: theme.palette.text.primary }}>
            Upload Care Plan
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.4 }}>
            Upload a PDF care plan so recommendations can align with provider guidance (only with your consent).
          </Typography>
        </Box>

        {err && (
          <Alert
            severity="error"
            sx={{
              borderRadius: 0,
              border: `1px solid ${alpha(theme.palette.error.main, isDark ? 0.35 : 0.25)}`,
              background: alpha(theme.palette.error.main, isDark ? 0.10 : 0.08),
            }}
          >
            {err}
          </Alert>
        )}

        <Card
          sx={{
            borderRadius: 0,
            overflow: "hidden",
            border,
            boxShadow: shadow,
            background: cardBg,
            backdropFilter: "blur(14px)",
          }}
        >
          {/* Top accent bar like screenshot */}
          <Box
            sx={{
              height: 6,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            }}
          />

          <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
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
                <DescriptionRoundedIcon />
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 950, lineHeight: 1.1 }}>
                  Care Plan PDF
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supported: PDF • Max: 10MB
                </Typography>
              </Box>

              <Chip
                size="small"
                icon={<AutoAwesomeRoundedIcon />}
                label="AI-aligned guidance"
                sx={{
                  borderRadius: 0,
                  fontWeight: 900,
                  background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.14)}, ${alpha(
                    theme.palette.secondary.main,
                    0.12
                  )})`,
                  border,
                  color: theme.palette.text.primary,
                }}
              />
            </Stack>

            <Divider sx={{ my: 1.8, opacity: isDark ? 0.16 : 0.26 }} />

            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) => onSelect(e.target.files?.[0])}
            />

            {/* Dropzone (theme-aware) */}
            <Stack
              sx={{
                borderRadius: 0,
                border: `1px dashed ${alpha(theme.palette.text.primary, isDark ? 0.35 : 0.28)}`,
                background: isDark ? alpha(theme.palette.background.paper, 0.16) : alpha("#ffffff", 0.60),
                p: { xs: 2.2, md: 3.0 },
                minHeight: { xs: 190, md: 210 },
                justifyContent: "center",
              }}
              spacing={1.2}
              alignItems="center"
            >
              <UploadFileRoundedIcon fontSize="large" />
              <Typography sx={{ fontWeight: 900 }}>Drop your PDF here</Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Or pick a file manually. We’ll extract structure later (titles, schedules, restrictions).
              </Typography>

              <Stack direction="row" spacing={1.2} sx={{ mt: 1 }} flexWrap="wrap" justifyContent="center">
                <Button
                  variant="outlined"
                  onClick={pick}
                  sx={{
                    borderRadius: 0,
                    fontWeight: 950,
                    px: 2.4,
                    borderColor: alpha(theme.palette.text.primary, isDark ? 0.26 : 0.18),
                    "&:hover": {
                      borderColor: alpha(theme.palette.text.primary, isDark ? 0.42 : 0.26),
                      background: alpha(theme.palette.text.primary, isDark ? 0.06 : 0.04),
                    },
                  }}
                >
                  Choose file
                </Button>

                <Button
                  variant="contained"
                  color="success"
                  onClick={uploadReal}
                  disabled={!file || busy}
                  sx={{
                    borderRadius: 0,
                    fontWeight: 950,
                    px: 2.4,
                    boxShadow: isDark
                      ? "0 16px 44px rgba(34,197,94,0.22)"
                      : "0 14px 36px rgba(34,197,94,0.18)",
                  }}
                >
                  {busy ? "Uploading..." : "Upload"}
                </Button>
              </Stack>

              {meta && (
                <Typography variant="caption" color="text.secondary">
                  Selected: <b>{meta.name}</b> • {meta.mb} MB
                </Typography>
              )}
            </Stack>

            {/* Progress */}
            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
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

            {/* Note / Done */}
            <Box sx={{ mt: 2 }}>
              {!done ? (
                <Alert
                  severity="info"
                  sx={{
                    borderRadius: 0,
                    background: alpha(theme.palette.primary.main, isDark ? 0.10 : 0.08),
                    border,
                    color: theme.palette.text.primary,
                  }}
                >
                  Your care plan is used only if you consent to Care Plan data. You stay in control.
                </Alert>
              ) : (
                <Alert
                  icon={<CheckCircleRoundedIcon />}
                  severity="success"
                  sx={{
                    borderRadius: 0,
                    background: alpha(theme.palette.success.main, isDark ? 0.12 : 0.10),
                    border,
                    color: theme.palette.text.primary,
                  }}
                >
                  Uploaded successfully. Next: we’ll parse it and align recommendations to your plan.
                </Alert>
              )}
            </Box>

            {/* Uploaded list */}
            <Divider sx={{ my: 2.2, opacity: isDark ? 0.16 : 0.26 }} />

            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography sx={{ fontWeight: 950 }}>Uploaded care plans</Typography>
              <Button
                onClick={loadCarePlans}
                disabled={loadingList}
                variant="outlined"
                sx={{
                  borderRadius: 0,
                  fontWeight: 950,
                  borderColor: alpha(theme.palette.text.primary, isDark ? 0.26 : 0.18),
                  color: theme.palette.text.primary,
                }}
              >
                {loadingList ? "Loading..." : "Refresh"}
              </Button>
            </Stack>

            {docs.length === 0 ? (
              <Alert
                severity="warning"
                sx={{
                  borderRadius: 0,
                  border: `1px solid ${alpha(theme.palette.warning.main, isDark ? 0.35 : 0.25)}`,
                  background: alpha(theme.palette.warning.main, isDark ? 0.10 : 0.08),
                }}
              >
                No care plan uploaded yet.
              </Alert>
            ) : (
              <List
                dense
                sx={{
                  borderRadius: 0,
                  border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.10)}`,
                  background: isDark ? alpha(theme.palette.background.paper, 0.12) : alpha("#ffffff", 0.55),
                }}
              >
                {docs.map((d) => (
                  <ListItem
                    key={d.id}
                    secondaryAction={
                      <Stack direction="row" spacing={0.6}>
                        {d.file_url && (
                          <Tooltip title="Open">
                            <IconButton
                              onClick={() => window.open(d.file_url!, "_blank")}
                              sx={{ color: theme.palette.text.primary }}
                            >
                              <OpenInNewRoundedIcon />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="Delete">
                          <IconButton
                            onClick={() => deleteDoc(d.id)}
                            sx={{ color: alpha(theme.palette.error.main, isDark ? 0.95 : 0.85) }}
                          >
                            <DeleteOutlineRoundedIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    }
                  >
                    <PictureAsPdfRoundedIcon sx={{ mr: 1 }} />
                    <ListItemText
                      primary={
                        <Typography sx={{ fontWeight: 900 }} noWrap>
                          {d.title || d.file?.split("/").pop() || "Care plan PDF"}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          Uploaded: {new Date(d.uploaded_at).toLocaleString()}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
