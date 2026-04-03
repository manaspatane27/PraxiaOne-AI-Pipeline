"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useRouter } from "next/navigation";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Chip,
  Divider,
  Avatar,
  LinearProgress,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Select,
  MenuItem,
} from "@mui/material";

import WatchOutlinedIcon from "@mui/icons-material/WatchOutlined";
import DirectionsWalkRoundedIcon from "@mui/icons-material/DirectionsWalkRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import BedtimeOutlinedIcon from "@mui/icons-material/BedtimeOutlined";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import BloodtypeRoundedIcon from "@mui/icons-material/BloodtypeRounded";
import OpacityRoundedIcon from "@mui/icons-material/OpacityRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import MonitorHeartRoundedIcon from "@mui/icons-material/MonitorHeartRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import TextSnippetRoundedIcon from "@mui/icons-material/TextSnippetRounded";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type ProviderKey = "google_fit" | "apple_health" | "fitbit" | "garmin";

type Provider = {
  key: ProviderKey;
  name: string;
  subtitle: string;
  badge: "Recommended" | "Popular" | "Optional";
};

const STORAGE_KEY = "praxiaone_wearables_demo_state_v3";

function fmtTime(d: Date) {
  const hh = d.getHours();
  const mm = d.getMinutes().toString().padStart(2, "0");
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${mm} ${ampm}`;
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shortDayLabel(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

function monthDayLabel(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type TrendPoint = {
  key: string;
  dateISO: string;
  day: string;
  label: string;
  pulse: number;
  oxygen: number;
  sugar: number;
  bp: string;
};

export default function WearablesPage() {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const providers: Provider[] = useMemo(
    () => [
      {
        key: "google_fit",
        name: "Google Fit",
        subtitle: "Android + Google account sync (steps, HR, workouts).",
        badge: "Recommended",
      },
      {
        key: "apple_health",
        name: "Apple Health",
        subtitle: "iOS device sync via Apple Health permissions.",
        badge: "Popular",
      },
      {
        key: "fitbit",
        name: "Fitbit",
        subtitle: "Steps, sleep, heart rate, activity minutes.",
        badge: "Popular",
      },
      {
        key: "garmin",
        name: "Garmin",
        subtitle: "Training + recovery metrics (optional integration).",
        badge: "Optional",
      },
    ],
    []
  );

  const [connected, setConnected] = useState<Record<ProviderKey, boolean>>({
    google_fit: false,
    apple_health: false,
    fitbit: false,
    garmin: false,
  });

  const [consentWearables, setConsentWearables] = useState(false);
  const [lastSync, setLastSync] = useState<string>("—");
  const [syncing, setSyncing] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Demo metrics
  const [oxygen, setOxygen] = useState(0);
  const [pulse, setPulse] = useState(0);
  const [sugar, setSugar] = useState(0);
  const [bpSystolic, setBpSystolic] = useState(0);
  const [bpDiastolic, setBpDiastolic] = useState(0);
  const [isStale, setIsStale] = useState(false);

  // Trend
  const [trendDays, setTrendDays] = useState<number>(10);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");

  const [isLoaded, setIsLoaded] = useState(false);

  const connectedCount = useMemo(
    () => Object.values(connected).filter(Boolean).length,
    [connected]
  );

  const dataCoverage = useMemo(() => {
    const base = connectedCount * 15 + (consentWearables ? 10 : 0);
    return Math.min(100, Math.max(0, base));
  }, [connectedCount, consentWearables]);

  const aiReadiness = useMemo(() => {
    return consentWearables && connectedCount >= 1 ? "Ready" : "Blocked";
  }, [consentWearables, connectedCount]);

  const scopeChips = useMemo(() => {
    const enabled = consentWearables && connectedCount > 0;
    return [
      { label: "Oxygen (SpO2)", on: enabled },
      { label: "Pulse Rate", on: enabled },
      { label: "Blood Sugar", on: enabled },
      { label: "Blood Pressure", on: enabled },
    ];
  }, [consentWearables, connectedCount]);

  // IMPORTANT: no Date() in render -> avoids hydration mismatch
  const integrationsTableRows = useMemo(() => {
    const base = [
      { name: "Wearable Watch", type: "Wearable", key: "watch", demoIcon: "⌚" },
      { name: "Wearable Ring", type: "Wearable", key: "ring", demoIcon: "💍" },
      { name: "St. Mary's Hospital", type: "Provider Data", key: "hospital", demoIcon: "🏥" },
      { name: "MyFitnessPal", type: "App", key: "mfp", demoIcon: "🍽️" },
    ];

    const providerRows = providers.map((p) => ({
      name: p.name,
      type: "App",
      key: p.key,
      demoIcon: "🔗",
    }));

    return [...base, ...providerRows].map((r) => {
      const isProviderKey = (r.key as any) in connected;
      const isConnected = isProviderKey
        ? connected[r.key as ProviderKey]
        : r.key === "hospital" || r.key === "mfp";

      const status = isConnected ? "Connected" : "Not connected";

      // Use stable values instead of "new Date()" here
      const last =
        isConnected
          ? r.key === "hospital" || r.key === "mfp"
            ? lastSync === "—"
              ? "Today • —"
              : `Today • ${lastSync.replace("Today, ", "")}`
            : lastSync === "—"
            ? "Today • —"
            : lastSync
          : "—";

      return { ...r, status, last, isConnected };
    });
  }, [providers, connected, lastSync]);

  const canShowTrend = consentWearables && connectedCount > 0;

  const buildTrend = (days: number) => {
    const goal = 10000;
    const today = new Date();
    const points: TrendPoint[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);

      points.push({
        key: d.toISOString().slice(0, 10),
        dateISO: d.toISOString(),
        day: shortDayLabel(d),
        label: monthDayLabel(d),
        pulse: randomBetween(68, 82),
        oxygen: randomBetween(97, 99),
        sugar: randomBetween(85, 105),
        bp: `${randomBetween(115, 122)}/${randomBetween(75, 82)}`
      });
    }

    setTrend(points);
    setSelectedKey(points[points.length - 1]?.key || "");
  };

  // Load saved demo state & DB vitals
  useEffect(() => {
    async function fetchLatestVitals() {
      try {
        const { apiFetch } = await import("@/lib/api");
        const data: any = await apiFetch("/api/vitals/latest/");
        if (data) {
          setOxygen(Number(data.oxygen));
          setPulse(data.pulse);
          setSugar(Number(data.sugar));
          setBpSystolic(data.systolic);
          setBpDiastolic(data.diastolic);
          setIsStale(data.is_stale);
          
          if (data.last_updated) {
            const d = new Date(data.last_updated);
            setLastSync(`Today, ${fmtTime(d)}`);
          }
        }
      } catch (err) {
        console.log("No vitals found yet.");
      }
    }
    
    // Persistence for basic settings
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.connected) setConnected(parsed.connected);
          if (typeof parsed?.consentWearables === "boolean") setConsentWearables(parsed.consentWearables);
      }
    } catch {}

    fetchLatestVitals();
    setIsLoaded(true);
  }, []);

  // Save basic settings
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ connected, consentWearables }));
  }, [isLoaded, connected, consentWearables]);

  // Build trend when it becomes available
  useEffect(() => {
    if (!canShowTrend) return;
    if (trend.length) return;
    buildTrend(trendDays);
  }, [canShowTrend, trend.length, trendDays]);

  const connectProvider = (key: ProviderKey) => {
    setConnected((prev) => ({ ...prev, [key]: true }));
    const now = new Date();
    setLastSync(`Today, ${fmtTime(now)}`);

    if (consentWearables) {
       buildTrend(trendDays);
    }
  };

  const disconnectProvider = (key: ProviderKey) => {
    setConnected((prev) => ({ ...prev, [key]: false }));
  };

  const doSync = async () => {
    setSyncing(true);
    try {
      const oxy = randomBetween(96, 99);
      const pul = randomBetween(68, 82);
      const sug = randomBetween(84, 115);
      const sys = randomBetween(115, 122);
      const dia = randomBetween(75, 84);

      const { apiFetch } = await import("@/lib/api");
      await apiFetch("/api/vitals/latest/", {
        method: "POST",
        body: JSON.stringify({
           oxygen: oxy,
           pulse: pul,
           sugar: sug,
           systolic: sys,
           diastolic: dia
        })
      });

      setOxygen(oxy);
      setPulse(pul);
      setSugar(sug);
      setBpSystolic(sys);
      setBpDiastolic(dia);
      setIsStale(false);

      const now = new Date();
      setLastSync(`Today, ${fmtTime(now)}`);
    } catch (err) {
       console.error("Sync failed:", err);
    }
    setSyncing(false);
  };

  const handleDownloadPdf = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`wearables_trend_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
    }
  };

  const handleDownloadCsv = () => {
    if (!trend.length) return;
    const headers = ["Date", "Pulse (bpm)", "Oxygen (%)", "Sugar (mg/dL)", "Blood Pressure"];
    const rows = trend.map(t => `${t.dateISO.slice(0, 10)},${t.pulse},${t.oxygen},${t.sugar},${t.bp}`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `wearables_vitals_flatfile_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selected = useMemo(
    () => trend.find((t) => t.key === selectedKey),
    [trend, selectedKey]
  );

  return (
    <Box
      sx={{
        pb: 6,
        minHeight: "calc(100vh - 120px)",
        background:
          isDark ? `radial-gradient(900px 500px at 20% 0%, ${alpha(theme.palette.success.main, 0.15)}, transparent 60%), radial-gradient(900px 500px at 85% 10%, ${alpha(theme.palette.primary.main, 0.15)}, transparent 55%), linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.default} 100%)` : "radial-gradient(900px 500px at 20% 0%, rgba(20,184,166,0.20), transparent 60%), radial-gradient(900px 500px at 85% 10%, rgba(14,165,233,0.18), transparent 55%)",
        borderRadius: 0,
        p: { xs: 2, md: 3 },
      }}
    >
      {/* Header */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Chip icon={<WatchOutlinedIcon />} label="Wearables" sx={{ fontWeight: 800, borderRadius: 0 }} />
            <Chip
              icon={<VerifiedUserRoundedIcon />}
              label="User-controlled"
              variant="outlined"
              sx={{ borderRadius: 0, fontWeight: 800 }}
            />
          </Stack>

          <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: -0.5 }}>
            Sync Status
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Connect devices and monitor sync health — only with your consent.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.2} alignItems="center">
          <Chip
            label={`AI readiness: ${aiReadiness}`}
            color={aiReadiness === "Ready" ? "success" : "default"}
            sx={{
              borderRadius: 0,
              fontWeight: 900,
              bgcolor: aiReadiness === "Ready" ? "rgba(46, 204, 113, 0.18)" : "rgba(0,0,0,0.06)",
            }}
          />
          <Button
            onClick={doSync}
            startIcon={<SyncRoundedIcon />}
            variant="contained"
            disabled={syncing || connectedCount === 0}
            sx={{ borderRadius: 0, fontWeight: 900, px: 2.2 }}
          >
            {syncing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            onClick={() => router.push("/vitals")}
            variant="outlined"
            endIcon={<OpenInNewRoundedIcon />}
            sx={{ borderRadius: 0, fontWeight: 900 }}
          >
            Vitals
          </Button>
        </Stack>
      </Stack>

      {/* Top row */}
      <Grid container spacing={2.2} sx={{ mb: 2.2 }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card
            sx={{
              borderRadius: 0,
              boxShadow: isDark ? "0 18px 60px rgba(0,0,0,0.5)" : "0 18px 60px rgba(0,0,0,0.08)",
              backdropFilter: "blur(10px)",
              background: isDark ? alpha(theme.palette.background.paper, 0.22) : "rgba(255,255,255,0.82)",
              border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
            }}
          >
            <CardContent sx={{ p: 2.4 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography sx={{ fontWeight: 950 }}>Data coverage</Typography>
                  <Typography variant="body2" color="text.secondary">
                    More sources → better personalization (within your consent).
                  </Typography>
                </Box>
                <Chip label={`${dataCoverage}%`} sx={{ borderRadius: 0, fontWeight: 950 }} />
              </Stack>

              <Box sx={{ mt: 1.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={dataCoverage}
                  sx={{
                    height: 10,
                    borderRadius: 0,
                    bgcolor: "rgba(0,0,0,0.06)",
                  }}
                />
              </Box>

              <Stack direction="row" spacing={1} sx={{ mt: 1.4 }} flexWrap="wrap" useFlexGap>
                {scopeChips.map((s) => (
                  <Chip
                    key={s.label}
                    label={s.label}
                    size="small"
                    icon={s.on ? <CheckCircleRoundedIcon /> : undefined}
                    sx={{
                      borderRadius: 0,
                      fontWeight: 800,
                      bgcolor: s.on ? "rgba(20,184,166,0.14)" : "rgba(0,0,0,0.06)",
                    }}
                  />
                ))}
              </Stack>

              <Divider sx={{ my: 1.7 }} />

              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" sx={{ fontWeight: 900 }}>
                    Connected
                  </Typography>
                  <Chip
                    label={`${connectedCount}/${providers.length}`}
                    size="small"
                    sx={{ borderRadius: 0, fontWeight: 900 }}
                  />
                </Stack>

                <Stack direction="row" alignItems="center" spacing={0.7}>
                  <Typography variant="body2" color="text.secondary">
                    Last sync:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 900 }}>
                    {connectedCount === 0 ? "—" : lastSync}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card
            sx={{
              borderRadius: 0,
              boxShadow: isDark ? "0 18px 60px rgba(0,0,0,0.5)" : "0 18px 60px rgba(0,0,0,0.08)",
              backdropFilter: "blur(10px)",
              background: isDark ? alpha(theme.palette.background.paper, 0.22) : "rgba(255,255,255,0.82)",
              border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
            }}
          >
            <CardContent sx={{ p: 2.4 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                <Box>
                  <Typography sx={{ fontWeight: 950 }}>Consent for wearables</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Wearables data is used only if you allow it.
                  </Typography>
                </Box>

                <Tooltip title="Demo toggle. Replace with real Consent module later.">
                  <IconButton size="small">
                    <InfoOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Box sx={{ mt: 1.4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={consentWearables}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setConsentWearables(on);
                        if (on && connectedCount > 0) buildTrend(trendDays);
                      }}
                      color="success"
                    />
                  }
                  label={<Typography sx={{ fontWeight: 900 }}>Allow PraxiaOne to use Wearables data for insights</Typography>}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                  You can change this anytime in{" "}
                  <Typography
                    component="span"
                    onClick={() => router.push("/consent")}
                    sx={{ fontWeight: 900, cursor: "pointer" }}
                  >
                    Consent & Privacy
                  </Typography>
                  .
                </Typography>
              </Box>

              <Divider sx={{ my: 1.7 }} />

              <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap" useFlexGap>
                <Button
                  onClick={() => router.push("/consent")}
                  variant="outlined"
                  sx={{ borderRadius: 0, fontWeight: 900, px: 2.2 }}
                >
                  Manage Consent
                </Button>

                <Button
                  onClick={() => router.push("/health-ai")}
                  variant="contained"
                  color="success"
                  disabled={aiReadiness !== "Ready"}
                  sx={{ borderRadius: 0, fontWeight: 900, px: 2.2 }}
                >
                  Open AI Chat
                </Button>

                <Chip
                  icon={<ShieldOutlinedIcon />}
                  label="HIPAA-ready UX"
                  sx={{ borderRadius: 0, fontWeight: 900, bgcolor: "rgba(0,0,0,0.04)" }}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Middle row */}
      <Grid container spacing={2.2} sx={{ mb: 2.2 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card
            sx={{
              borderRadius: 0,
              boxShadow: isDark ? "0 18px 60px rgba(0,0,0,0.5)" : "0 18px 60px rgba(0,0,0,0.08)",
              background: isDark ? alpha(theme.palette.background.paper, 0.22) : "rgba(255,255,255,0.86)",
              border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
              overflow: "hidden",
            }}
          >
            <CardContent sx={{ p: 2.4 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Typography sx={{ fontWeight: 950 }}>Device / Integration</Typography>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    icon={<SortRoundedIcon />}
                    label="Sort by"
                    size="small"
                    sx={{ borderRadius: 0, fontWeight: 900, bgcolor: "rgba(0,0,0,0.04)" }}
                  />
                  <Select size="small" value="Newest First" sx={{ minWidth: 150, borderRadius: 0 }}>
                    <MenuItem value="Newest First">Newest First</MenuItem>
                    <MenuItem value="Oldest First">Oldest First</MenuItem>
                  </Select>

                  <Button
                    variant="contained"
                    startIcon={<AddRoundedIcon />}
                    sx={{ borderRadius: 0, fontWeight: 900 }}
                    onClick={() => {}}
                  >
                    New Connection
                  </Button>
                </Stack>
              </Stack>

              <Divider sx={{ mb: 1.4 }} />

              <Box sx={{ display: "grid", gridTemplateColumns: "1.6fr 0.9fr 1fr 0.9fr 0.9fr", gap: 1, px: 1, pb: 0.8 }}>
                <Typography variant="caption" sx={{ fontWeight: 900, color: "text.secondary" }}>
                  Device / Integration
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 900, color: "text.secondary" }}>
                  Type
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 900, color: "text.secondary" }}>
                  Last Sync
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 900, color: "text.secondary" }}>
                  Status
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 900, color: "text.secondary", textAlign: "right" }}>
                  Actions
                </Typography>
              </Box>

              <Divider sx={{ mb: 0.8 }} />

              <Stack spacing={0.7}>
                {integrationsTableRows.map((r) => (
                  <Box
                    key={r.key}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1.6fr 0.9fr 1fr 0.9fr 0.9fr",
                      gap: 1,
                      alignItems: "center",
                      px: 1,
                      py: 0.9,
                      borderRadius: 0,
                      "&:hover": { bgcolor: "rgba(2,132,199,0.04)" },
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 30, height: 30, bgcolor: "rgba(14,165,233,0.14)", color: "text.primary", fontWeight: 900 }}>
                        {r.demoIcon}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900, lineHeight: 1.1 }}>{r.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(r.key === "watch" || r.key === "ring") ? "11:30" : ""}
                        </Typography>
                      </Box>
                    </Stack>

                    <Chip
                      size="small"
                      label={r.type}
                      sx={{
                        borderRadius: 0,
                        fontWeight: 900,
                        bgcolor:
                          r.type === "Wearable"
                            ? "rgba(99,102,241,0.12)"
                            : r.type === "Provider Data"
                            ? "rgba(20,184,166,0.12)"
                            : "rgba(0,0,0,0.06)",
                      }}
                    />

                    <Typography variant="body2" color="text.secondary">
                      {r.last}
                    </Typography>

                    <Chip
                      size="small"
                      label={r.status}
                      sx={{
                        borderRadius: 0,
                        fontWeight: 900,
                        bgcolor: r.isConnected ? "rgba(46, 204, 113, 0.16)" : "rgba(0,0,0,0.06)",
                      }}
                    />

                    <Box sx={{ textAlign: "right" }}>
                      {(r.key as any) in connected ? (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<SettingsOutlinedIcon />}
                          sx={{ borderRadius: 0, fontWeight: 900 }}
                          onClick={() => {
                            const k = r.key as ProviderKey;
                            if (connected[k]) disconnectProvider(k);
                            else connectProvider(k);
                          }}
                        >
                          {connected[r.key as ProviderKey] ? "Manage" : "Connect"}
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<SettingsOutlinedIcon />}
                          sx={{ borderRadius: 0, fontWeight: 900 }}
                        >
                          Manage
                        </Button>
                      )}
                    </Box>
                  </Box>
                ))}
              </Stack>

              <Divider sx={{ mt: 1.2 }} />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Showing {integrationsTableRows.length} results
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={2.2}>
            {/* ✅ Help & Information: FIXED ROUTES */}
            <Card
              sx={{
                borderRadius: 0,
                boxShadow: isDark ? "0 18px 60px rgba(0,0,0,0.5)" : "0 18px 60px rgba(0,0,0,0.08)",
                background: isDark ? alpha(theme.palette.background.paper, 0.22) : "rgba(255,255,255,0.86)",
                border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
              }}
            >
              <CardContent sx={{ p: 2.4 }}>
                <Typography sx={{ fontWeight: 950, mb: 1 }}>Help & Information</Typography>
                <Stack spacing={1.1}>
                  <Button
                    variant="text"
                    sx={{ justifyContent: "flex-start", fontWeight: 900 }}
                    onClick={() => router.push("/data-security")}
                  >
                    Learn About Data Security
                  </Button>
                  <Button
                    variant="text"
                    sx={{ justifyContent: "flex-start", fontWeight: 900 }}
                    onClick={() => router.push("/sync-errors")}
                  >
                    Reduce Sync Errors
                  </Button>
                  <Button
                    variant="text"
                    sx={{ justifyContent: "flex-start", fontWeight: 900 }}
                    onClick={() => router.push("/help-support")}
                  >
                    Contact Support
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            <Card
              sx={{
                borderRadius: 0,
                boxShadow: isDark ? "0 18px 60px rgba(0,0,0,0.5)" : "0 18px 60px rgba(0,0,0,0.08)",
                background: isDark ? alpha(theme.palette.background.paper, 0.22) : "rgba(255,255,255,0.86)",
                border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
              }}
            >
              <CardContent sx={{ p: 2.4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.6 }}>
                  <Typography sx={{ fontWeight: 950 }}>Attention Needed</Typography>
                  <Chip label="All good" size="small" sx={{ borderRadius: 0, fontWeight: 900, bgcolor: "rgba(46, 204, 113, 0.14)" }} />
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  No sync errors detected right now.
                </Typography>

                {!canShowTrend && (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.4 }}>
                    <ErrorOutlineRoundedIcon fontSize="small" />
                    <Typography variant="caption" color="text.secondary">
                      Connect + enable consent to unlock interactive trends.
                    </Typography>
                  </Stack>
                )}
              </CardContent>
            </Card>

            <Card
              sx={{
                borderRadius: 0,
                boxShadow: isDark ? "0 18px 60px rgba(0,0,0,0.5)" : "0 18px 60px rgba(0,0,0,0.08)",
                background: isDark ? alpha(theme.palette.background.paper, 0.22) : "rgba(255,255,255,0.86)",
                border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
              }}
            >
              <CardContent sx={{ p: 2.4 }}>
                <Typography sx={{ fontWeight: 950, mb: 1 }}>Manage Integrations</Typography>

                <Chip
                  label={`${connectedCount} connected integrations`}
                  sx={{ borderRadius: 0, fontWeight: 900, bgcolor: "rgba(20,184,166,0.12)", mb: 1.2 }}
                />

                <Button fullWidth variant="outlined" sx={{ borderRadius: 0, fontWeight: 900 }}>
                  Connected Integrations
                </Button>
              </CardContent>
            </Card>

            <Card
              sx={{
                borderRadius: 0,
                boxShadow: isDark ? "0 18px 60px rgba(0,0,0,0.5)" : "0 18px 60px rgba(0,0,0,0.08)",
                background: isDark ? alpha(theme.palette.background.paper, 0.22) : "rgba(255,255,255,0.86)",
                border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
              }}
            >
              <CardContent sx={{ p: 2.4 }}>
                <Typography sx={{ fontWeight: 950 }}>Use a Health App</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4, mb: 1.4 }}>
                  Track workouts and meals. PraxiaOne can use them for wellness summaries (with consent).
                </Typography>

                <Button fullWidth variant="contained" startIcon={<AddRoundedIcon />} sx={{ borderRadius: 0, fontWeight: 900 }}>
                  New Connection
                </Button>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Trend chart */}
      <Card
        sx={{
          borderRadius: 0,
          boxShadow: isDark ? "0 18px 60px rgba(0,0,0,0.5)" : "0 18px 60px rgba(0,0,0,0.08)",
          background: isDark ? alpha(theme.palette.background.paper, 0.22) : "rgba(255,255,255,0.86)",
          border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
          overflow: "hidden",
          mb: 2.2,
        }}
      >
        <CardContent sx={{ p: 2.4 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <MonitorHeartRoundedIcon />
              <Typography sx={{ fontWeight: 950 }}>Vitals & Wearable Trend</Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Select
                size="small"
                value={trendDays}
                onChange={(e) => {
                  const d = Number(e.target.value);
                  setTrendDays(d);
                  if (canShowTrend) buildTrend(d);
                }}
                sx={{ minWidth: 140, borderRadius: 0 }}
              >
                <MenuItem value={7}>Last 7 days</MenuItem>
                <MenuItem value={10}>Last 10 days</MenuItem>
                <MenuItem value={14}>Last 14 days</MenuItem>
              </Select>

              <Button
                variant="outlined"
                sx={{ borderRadius: 0, fontWeight: 900 }}
                onClick={() => {
                  if (canShowTrend) buildTrend(trendDays);
                }}
              >
                Refresh trend
              </Button>

              <Button
                variant="outlined"
                sx={{ borderRadius: 0, fontWeight: 900 }}
                onClick={() => router.push("/insights")}
              >
                View Detailed Insights
              </Button>

              {canShowTrend && (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<TextSnippetRoundedIcon />}
                    sx={{ borderRadius: 0, fontWeight: 900 }}
                    onClick={handleDownloadCsv}
                  >
                    CSV Data (Flat File)
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PictureAsPdfRoundedIcon />}
                    sx={{ borderRadius: 0, fontWeight: 900 }}
                    onClick={handleDownloadPdf}
                  >
                    Save as PDF
                  </Button>
                </>
              )}
            </Stack>
          </Stack>

          {!canShowTrend ? (
            <Typography variant="body2" color="text.secondary">
              Demo chart will appear after you <b>Connect</b> at least one provider and enable <b>Consent</b> (then hit Refresh).
            </Typography>
          ) : (
            <Box ref={chartRef} sx={{ bgcolor: "background.paper", p: 1 }}>
              <Grid container spacing={2.2} sx={{ mt: 0.2 }}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Box sx={{ height: 260, width: "100%" }}>

                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <ReTooltip
                        formatter={(value: any, name: any) => {
                          if (name === "pulse") return [`${value} bpm`, "Pulse Rate"];
                          if (name === "oxygen") return [`${value}%`, "Oxygen (SpO2)"];
                          if (name === "sugar") return [`${value} mg/dL`, "Blood Sugar"];
                          return [value, name];
                        }}
                        labelFormatter={(_, payload) => {
                          const p = payload?.[0]?.payload as TrendPoint | undefined;
                          return p ? `${p.label} (BP: ${p.bp})` : "";
                        }}
                      />
                      <Bar
                        dataKey="pulse"
                        radius={[12, 12, 12, 12]}
                        fill={theme.palette.primary.main}
                        onClick={(data: any) => {
                          const k = data?.key as string | undefined;
                          if (k) setSelectedKey(k);
                        }}
                      >
                        {trend.map((p) => (
                          <Cell
                            key={p.key}
                            cursor="pointer"
                            opacity={selectedKey && selectedKey !== p.key ? 0.35 : 1}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Click a bar to view that day’s progress.
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Card variant="outlined" sx={{ borderRadius: 0, bgcolor: "rgba(0,0,0,0.02)" }}>
                  <CardContent>
                    <Typography sx={{ fontWeight: 950, mb: 1 }}>
                      {selected ? selected.label : "Select a day"}
                    </Typography>

                    {selected ? (
                      <>
                        <Stack spacing={1} sx={{ mb: 2 }}>
                           <Chip label={`Pulse: ${selected.pulse} bpm`} sx={{ borderRadius: 0, fontWeight: 900 }} color="primary" variant="outlined" />
                           <Chip label={`Oxygen: ${selected.oxygen}%`} sx={{ borderRadius: 0, fontWeight: 900 }} color="info" variant="outlined" />
                           <Chip label={`Sugar: ${selected.sugar} mg/dL`} sx={{ borderRadius: 0, fontWeight: 900 }} color="success" variant="outlined" />
                           <Chip label={`BP: ${selected.bp}`} sx={{ borderRadius: 0, fontWeight: 900 }} color="warning" variant="outlined" />
                        </Stack>

                        <Divider sx={{ my: 1.5 }} />

                        <Typography variant="body2" sx={{ fontWeight: 900 }}>
                          Clinical Note
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selected.oxygen < 95
                            ? "Oxygen slightly low. Sync your device again to confirm."
                            : selected.sugar > 140
                            ? "Sugar elevated. This may impact exercise recommendations."
                            : "Vitals within normal range for this day."}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Click any bar to see details here.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Snapshot */}
      <Card
        sx={{
          borderRadius: 0,
          boxShadow: isDark ? "0 18px 60px rgba(0,0,0,0.5)" : "0 18px 60px rgba(0,0,0,0.08)",
          background: isDark ? alpha(theme.palette.background.paper, 0.22) : "rgba(255,255,255,0.86)",
          border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08)}`,
        }}
      >
        <CardContent sx={{ p: 2.4 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography sx={{ fontWeight: 950 }}>Wearables snapshot</Typography>
              <Typography variant="body2" color="text.secondary">
                A quick preview of wearable vitals (updates after sync).
              </Typography>
            </Box>

            <Chip
              label={
                consentWearables && connectedCount > 0
                  ? "Data available"
                  : connectedCount === 0
                  ? "Connect a source"
                  : "Enable consent to view"
              }
              sx={{ borderRadius: 0, fontWeight: 900 }}
            />
          </Stack>

          <Divider sx={{ my: 1.6 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <MetricCard
                    icon={<OpacityRoundedIcon />}
                    label="Oxygen (SpO2)"
                    value={consentWearables && connectedCount > 0 ? `${oxygen}%` : "—"}
                    hint={isStale ? "⚠️ STALE" : "Fresh"}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <MetricCard
                    icon={<FavoriteBorderRoundedIcon />}
                    label="Pulse Rate"
                    value={consentWearables && connectedCount > 0 ? `${pulse} BPM` : "—"}
                    hint={isStale ? "⚠️ STALE" : "Stable"}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <MetricCard
                    icon={<BloodtypeRoundedIcon />}
                    label="Sugar Level"
                    value={consentWearables && connectedCount > 0 ? `${sugar} mg/dL` : "—"}
                    hint={isStale ? "⚠️ STALE" : "Normal"}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <MetricCard
                    icon={<SpeedRoundedIcon />}
                    label="Blood Pressure"
                    value={consentWearables && connectedCount > 0 ? `${bpSystolic}/${bpDiastolic}` : "—"}
                    hint={isStale ? "⚠️ STALE" : "mmHg"}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Card variant="outlined" sx={{ borderRadius: 0, bgcolor: "rgba(0,0,0,0.02)" }}>
                <CardContent>
                  <Typography sx={{ fontWeight: 950, mb: 1 }}>Recent activity</Typography>
                  <List dense>
                    <ActivityItem
                      primary={connectedCount === 0 ? "No wearable connected yet" : "Wearables connection checked"}
                      secondary="Today"
                    />
                    <ActivityItem
                      primary={consentWearables ? "Wearables consent enabled" : "Wearables consent pending"}
                      secondary="Today"
                    />
                    <ActivityItem
                      primary={connectedCount > 0 ? `Last sync: ${lastSync}` : "Sync available after connect"}
                      secondary="Today"
                    />
                    <ActivityItem primary="Tip: Click bars in trend chart to see daily progress" secondary="Always optional" />
                  </List>

                  <Divider sx={{ my: 1.3 }} />

                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={doSync}
                      disabled={syncing || connectedCount === 0}
                      sx={{ borderRadius: 0, fontWeight: 900, px: 2.2 }}
                    >
                      {syncing ? "Syncing..." : "Refresh snapshot"}
                    </Button>
                    <Button
                      onClick={() => router.push("/vitals")}
                      variant="outlined"
                      sx={{ borderRadius: 0, fontWeight: 900, px: 2.2 }}
                    >
                      Go to Vitals
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

function MetricCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Card variant="outlined" sx={{ borderRadius: 0, bgcolor: isDark ? alpha(theme.palette.background.paper, 0.22) : "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)" }}>
      <CardContent sx={{ py: 1.7 }}>
        <Stack direction="row" spacing={1.1} alignItems="center">
          <Avatar sx={{ width: 36, height: 36, bgcolor: "rgba(14,165,233,0.16)", color: "text.primary" }}>
            {icon}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>
              {label}
            </Typography>
            <Typography sx={{ fontWeight: 950, mt: 0.1 }}>{value}</Typography>
            <Typography variant="caption" color="text.secondary">
              {hint}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <ListItem sx={{ px: 0 }}>
      <ListItemAvatar sx={{ minWidth: 40 }}>
        <Avatar sx={{ width: 28, height: 28, bgcolor: "rgba(20,184,166,0.14)", color: "text.primary" }}>
          <CheckCircleRoundedIcon fontSize="small" />
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={<Typography sx={{ fontWeight: 900 }}>{primary}</Typography>}
        secondary={<Typography variant="caption" color="text.secondary">{secondary}</Typography>}
      />
    </ListItem>
  );
}
