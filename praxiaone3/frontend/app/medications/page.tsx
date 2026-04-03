"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  Button,
  Grid,
  Chip,
  Divider,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Add,
  Delete,
  Edit,
  Medication as MedicationIcon,
  AccessTime,
  CalendarMonth,
  Notes,
  VerifiedUser,
  InfoOutlined,
  RestartAlt,
} from "@mui/icons-material";

const API_BASE = "http://127.0.0.1:8000/api";

// If you already have these endpoints in backend, great.
// If not, the page will still work using localStorage:
const API_LIST = `${API_BASE}/medications/`; // GET, POST
const API_DELETE = (id: number) => `${API_BASE}/medications/${id}/`; // DELETE

type Med = {
  id: number;
  name: string;
  dosage: string;
  schedule: string; // e.g. "Morning, Night"
  start_date?: string; // yyyy-mm-dd
  notes?: string;
  created_at?: string;
};

const LS_KEY = "praxiaone_meds_v1";

function makeId() {
  return Math.floor(Math.random() * 10_000_000);
}

export default function MedicationsPage() {
  const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const [form, setForm] = useState({
    name: "",
    dosage: "",
    schedule: "",
    start_date: "",
    notes: "",
  });

  const [meds, setMeds] = useState<Med[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [toast, setToast] = useState<{ open: boolean; msg: string; type: "success" | "error" }>({
    open: false,
    msg: "",
    type: "success",
  });

  // --- Derived: Today list (simple heuristic based on schedule text)
  const todayDoses = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();

    const slot =
      hour < 11 ? "Morning" : hour < 17 ? "Afternoon" : hour < 22 ? "Night" : "Night";

    return meds
      .filter((m) => (m.schedule || "").toLowerCase().includes(slot.toLowerCase()))
      .slice(0, 5);
  }, [meds]);

  // --- Load meds (backend first; fallback localStorage)
  const loadMeds = async () => {
    // fallback local
    const loadLocal = () => {
      try {
        const raw = localStorage.getItem(LS_KEY);
        const parsed = raw ? (JSON.parse(raw) as Med[]) : [];
        setMeds(parsed);
      } catch {
        setMeds([]);
      }
    };

    if (!token) {
      loadLocal();
      return;
    }

    try {
      const res = await fetch(API_LIST, { headers });
      if (!res.ok) throw new Error("no_backend");
      const data = await res.json();
      setMeds(Array.isArray(data) ? data : []);
    } catch {
      loadLocal();
    }
  };

  useEffect(() => {
    loadMeds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Save meds to localStorage if backend not available
  const persistLocal = (next: Med[]) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {}
  };

  const resetForm = () => {
    setForm({ name: "", dosage: "", schedule: "", start_date: "", notes: "" });
    setEditingId(null);
  };

  // --- Create / Update (UI-level update; backend POST if available)
  const saveMedication = async () => {
    if (!form.name.trim() || !form.dosage.trim() || !form.schedule.trim()) {
      setToast({ open: true, msg: "Please fill Name, Dosage, and Schedule.", type: "error" });
      return;
    }

    setLoading(true);

    // optimistic update for UI
    const isEdit = editingId !== null;
    const payload: Med = {
      id: isEdit ? editingId! : makeId(),
      name: form.name.trim(),
      dosage: form.dosage.trim(),
      schedule: form.schedule.trim(),
      start_date: form.start_date || undefined,
      notes: form.notes?.trim() || undefined,
    };

    const next = isEdit
      ? meds.map((m) => (m.id === editingId ? { ...m, ...payload } : m))
      : [payload, ...meds];

    // Try backend if token present; otherwise local
    try {
      if (token) {
        const res = await fetch(API_LIST, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        // If backend returns created object list or created object
        if (res.ok) {
          const body = await res.json().catch(() => null);
          if (Array.isArray(body)) setMeds(body);
          else if (body && typeof body === "object") {
            // replace/merge by id
            setMeds((prev) => {
              const exists = prev.some((x) => x.id === body.id);
              return exists ? prev.map((x) => (x.id === body.id ? body : x)) : [body, ...prev];
            });
          } else {
            setMeds(next);
          }
        } else {
          // fallback to local UI save
          setMeds(next);
          persistLocal(next);
        }
      } else {
        setMeds(next);
        persistLocal(next);
      }

      setToast({ open: true, msg: isEdit ? "Medication updated ✅" : "Medication saved ✅", type: "success" });
      resetForm();
    } catch {
      setToast({ open: true, msg: "Save failed ❌", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (m: Med) => {
    setEditingId(m.id);
    setForm({
      name: m.name || "",
      dosage: m.dosage || "",
      schedule: m.schedule || "",
      start_date: m.start_date || "",
      notes: m.notes || "",
    });
    setToast({ open: true, msg: "Editing mode: update fields and press Save.", type: "success" });
  };

  const deleteMed = async (id: number) => {
    const next = meds.filter((m) => m.id !== id);
    setMeds(next); // optimistic

    try {
      if (token) {
        const res = await fetch(API_DELETE(id), { method: "DELETE", headers });
        if (!res.ok) {
          // if backend doesn't support delete, keep local consistent
          persistLocal(next);
        }
      } else {
        persistLocal(next);
      }
      setToast({ open: true, msg: "Deleted ✅", type: "success" });
    } catch {
      setToast({ open: true, msg: "Delete failed ❌", type: "error" });
    }
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 24px)",
        animation: "fadeIn .35s ease-out",
        "@keyframes fadeIn": {
          from: { opacity: 0, transform: "translateY(6px)" },
          to: { opacity: 1, transform: "translateY(0px)" },
        },
      }}
    >
      {/* HERO */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 0,
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 16px 60px rgba(15,23,42,0.10)",
          background:
            "linear-gradient(135deg, rgba(14,165,233,0.16), rgba(20,184,166,0.12), rgba(255,255,255,0.75))",
          backdropFilter: "blur(10px)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(700px 220px at 20% 35%, rgba(14,165,233,0.20), transparent 60%), radial-gradient(600px 240px at 82% 30%, rgba(20,184,166,0.16), transparent 55%)",
          }}
        />
        <CardContent sx={{ position: "relative", py: 3 }}>
          <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.7 }}>
                <Chip
                  icon={<MedicationIcon sx={{ fontSize: 18 }} />}
                  label="Medication tracker"
                  size="small"
                  sx={{ fontWeight: 900, background: "rgba(14,165,233,0.12)" }}
                />
                <Chip
                  icon={<VerifiedUser sx={{ fontSize: 18 }} />}
                  label="Private by default"
                  size="small"
                  sx={{ fontWeight: 900, background: "rgba(20,184,166,0.12)" }}
                />
              </Stack>

              <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: -0.8 }}>
                Medications
              </Typography>
              <Typography color="text.secondary">
                Add meds + schedules. PraxiaOne uses only what you consent to.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={token ? "Signed in" : "Not logged in (local only)"}
                color={token ? "success" : "default"}
                sx={{
                  fontWeight: 900,
                  borderRadius: 0,
                  background: "rgba(255,255,255,0.78)",
                  boxShadow: "0 10px 26px rgba(15,23,42,0.08)",
                }}
              />
              <Tooltip title="Reload list">
                <IconButton onClick={loadMeds}>
                  <RestartAlt />
                </IconButton>
              </Tooltip>
              <Tooltip title="This is a demo-safe tracker (does not replace medical advice).">
                <IconButton>
                  <InfoOutlined />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3} alignItems="stretch">
        {/* FORM */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ borderRadius: 0, boxShadow: "0 16px 60px rgba(15,23,42,0.08)", overflow: "hidden" }}>
            <Box
              sx={{
                px: 3,
                py: 2,
                borderBottom: "1px solid",
                borderColor: "divider",
                background: "linear-gradient(90deg, rgba(14,165,233,0.10), rgba(20,184,166,0.06))",
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography sx={{ fontWeight: 900 }}>{editingId ? "Edit medication" : "Add medication"}</Typography>
                <Chip
                  size="small"
                  label={editingId ? "Editing" : "New"}
                  sx={{ fontWeight: 900, borderRadius: 0, background: "rgba(255,255,255,0.75)" }}
                />
              </Stack>
            </Box>

            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Medication name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>
                          <MedicationIcon fontSize="small" />
                        </Box>
                      ),
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Dosage"
                    placeholder="e.g., 500mg / 1 tablet"
                    value={form.dosage}
                    onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Schedule"
                    placeholder="e.g., Morning, Night"
                    value={form.schedule}
                    onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>
                          <AccessTime fontSize="small" />
                        </Box>
                      ),
                    }}
                  />
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                    {["Morning", "Afternoon", "Night"].map((s) => (
                      <Chip
                        key={s}
                        label={s}
                        size="small"
                        onClick={() => {
                          const current = form.schedule || "";
                          const has = current.toLowerCase().includes(s.toLowerCase());
                          if (has) return;
                          const next = current.trim() ? `${current}, ${s}` : s;
                          setForm({ ...form, schedule: next });
                        }}
                        sx={{ fontWeight: 900, borderRadius: 0, cursor: "pointer" }}
                      />
                    ))}
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Start date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>
                          <CalendarMonth fontSize="small" />
                        </Box>
                      ),
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Notes (optional)"
                    placeholder="e.g., Take after food, avoid with caffeine..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    multiline
                    rows={3}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, mt: 1, display: "flex", alignItems: "flex-start" }}>
                          <Notes fontSize="small" />
                        </Box>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2.5 }} />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">
                  This tracker is for organization — always follow your doctor’s instructions.
                </Typography>

                <Stack direction="row" spacing={1}>
                  {editingId && (
                    <Button
                      variant="outlined"
                      onClick={resetForm}
                      sx={{ borderRadius: 0, fontWeight: 900 }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    color="success"
                    onClick={saveMedication}
                    disabled={loading}
                    startIcon={editingId ? <Edit /> : <Add />}
                    sx={{
                      borderRadius: 0,
                      fontWeight: 950,
                      px: 3,
                      boxShadow: "0 14px 30px rgba(34,197,94,0.25)",
                      "&:active": { transform: "scale(0.98)" },
                    }}
                  >
                    {loading ? "Saving..." : editingId ? "Update" : "Save"}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT PANEL */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={3} sx={{ height: "100%" }}>
            {/* Today */}
            <Card
              sx={{
                borderRadius: 0,
                boxShadow: "0 16px 60px rgba(15,23,42,0.10)",
                background:
                  "linear-gradient(135deg, rgba(14,165,233,0.10), rgba(20,184,166,0.08), rgba(255,255,255,0.75))",
                backdropFilter: "blur(10px)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ fontWeight: 950, mb: 0.5 }}>Today’s doses (smart preview)</Typography>
                <Typography variant="caption" color="text.secondary">
                  Based on keywords in schedule (Morning/Afternoon/Night).
                </Typography>

                <Divider sx={{ my: 1.6 }} />

                <Stack spacing={1}>
                  {todayDoses.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No “today” doses detected yet. Add schedule like “Morning, Night”.
                    </Typography>
                  ) : (
                    todayDoses.map((m) => (
                      <Card
                        key={m.id}
                        sx={{
                          borderRadius: 0,
                          background: "rgba(255,255,255,0.72)",
                          boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
                        }}
                      >
                        <CardContent sx={{ py: 1.2 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography sx={{ fontWeight: 950 }}>{m.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {m.dosage} • {m.schedule}
                              </Typography>
                            </Box>
                            <Chip
                              label="Due"
                              size="small"
                              color="success"
                              sx={{ fontWeight: 900, borderRadius: 0 }}
                            />
                          </Stack>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* List */}
            <Card sx={{ borderRadius: 0, boxShadow: "0 16px 60px rgba(15,23,42,0.08)", overflow: "hidden" }}>
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  background: "linear-gradient(90deg, rgba(14,165,233,0.10), rgba(20,184,166,0.06))",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontWeight: 900 }}>Saved medications</Typography>
                  <Chip
                    label={`${meds.length} total`}
                    size="small"
                    sx={{ fontWeight: 900, borderRadius: 0, background: "rgba(255,255,255,0.75)" }}
                  />
                </Stack>
              </Box>

              <CardContent sx={{ p: 0 }}>
                {meds.length === 0 ? (
                  <Box sx={{ p: 3 }}>
                    <Typography color="text.secondary">
                      Nothing saved yet. Add your first medication on the left.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ overflowX: "auto" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 900 }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 900 }}>Dosage</TableCell>
                          <TableCell sx={{ fontWeight: 900 }}>Schedule</TableCell>
                          <TableCell sx={{ fontWeight: 900 }} align="right">
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {meds.map((m) => (
                          <TableRow key={m.id} hover>
                            <TableCell sx={{ fontWeight: 800 }}>{m.name}</TableCell>
                            <TableCell>{m.dosage}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={m.schedule}
                                sx={{ borderRadius: 0, fontWeight: 900, background: "rgba(14,165,233,0.10)" }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Edit">
                                <IconButton onClick={() => startEdit(m)} size="small">
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton onClick={() => deleteMed(m.id)} size="small">
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Snackbar
        open={toast.open}
        autoHideDuration={2200}
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
