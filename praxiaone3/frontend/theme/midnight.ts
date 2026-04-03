import { createTheme, alpha } from "@mui/material/styles";

export const midnightTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#38bdf8" }, // sky
    secondary: { main: "#22c55e" }, // green
    success: { main: "#22c55e" },
    warning: { main: "#fbbf24" },
    error: { main: "#fb7185" },
    background: {
      default: "#020617",
      paper: "rgba(2, 6, 23, 0.72)",
    },
    text: {
      primary: "#f1f5f9",
      secondary: "#94a3b8",
    },
    divider: "rgba(148,163,184,0.16)",
  },

  shape: { borderRadius: 18 },

  typography: {
    fontFamily: `"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial`,
    h3: { fontWeight: 950, letterSpacing: "-0.03em" },
    h4: { fontWeight: 900, letterSpacing: "-0.03em" },
    h6: { fontWeight: 850 },
    button: { textTransform: "none", fontWeight: 900 },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "radial-gradient(1200px 650px at 15% 0%, rgba(56,189,248,0.18), transparent 60%)," +
            "radial-gradient(900px 520px at 85% 18%, rgba(34,197,94,0.12), transparent 55%)," +
            "linear-gradient(180deg, #020617 0%, #020617 100%)",
          backgroundAttachment: "fixed",
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(16px)",
          backgroundImage:
            "linear-gradient(180deg, rgba(15,23,42,0.88), rgba(2,6,23,0.78))",
          border: "1px solid rgba(148,163,184,0.16)",
          boxShadow: "0 40px 140px rgba(0,0,0,0.65)",
          borderRadius: 20,
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 20 },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 999 },
        containedSuccess: {
          background: "linear-gradient(90deg, #22c55e, #16a34a)",
          boxShadow: "0 14px 45px rgba(34,197,94,0.45)",
        },
        outlined: {
          borderColor: "rgba(148,163,184,0.34)",
          color: "#e5e7eb",
          "&:hover": {
            borderColor: "rgba(148,163,184,0.48)",
            background: "rgba(226,232,240,0.06)",
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 900,
          border: "1px solid rgba(148,163,184,0.16)",
          background: "rgba(2,6,23,0.40)",
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: "linear-gradient(180deg, #020617, #020617)",
          borderRight: "1px solid rgba(148,163,184,0.16)",
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "rgba(2,6,23,0.55)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(148,163,184,0.16)",
          boxShadow: "0 24px 90px rgba(0,0,0,0.55)",
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: "rgba(2,6,23,0.35)",
          "& fieldset": { borderColor: "rgba(148,163,184,0.20)" },
          "&:hover fieldset": { borderColor: "rgba(56,189,248,0.35)" },
          "&.Mui-focused fieldset": {
            borderColor: "rgba(56,189,248,0.55)",
            boxShadow: `0 0 0 4px ${alpha("#38bdf8", 0.18)}`,
          },
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          height: 10,
          backgroundColor: "rgba(148,163,184,0.16)",
        },
        bar: {
          borderRadius: 999,
          backgroundImage: "linear-gradient(90deg, #38bdf8, #22c55e)",
        },
      },
    },
  },
});
