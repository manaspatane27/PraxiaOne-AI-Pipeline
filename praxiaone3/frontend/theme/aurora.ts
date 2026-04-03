import { createTheme, alpha } from "@mui/material/styles";

export const auroraTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#22d3ee" }, // cyan
    secondary: { main: "#a78bfa" }, // violet
    success: { main: "#22c55e" },
    warning: { main: "#fbbf24" },
    error: { main: "#fb7185" },

    background: {
      default: "#050816", // deep navy (matches your screenshots)
      paper: "rgba(2,6,23,0.72)",
    },

    text: {
      primary: "#f8fafc",
      secondary: "#cbd5e1",
    },

    divider: "rgba(148,163,184,0.16)",
  },

  shape: { borderRadius: 20 },

  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial',
    h3: { fontWeight: 950, letterSpacing: "-0.04em" },
    h4: { fontWeight: 900, letterSpacing: "-0.03em" },
    h6: { fontWeight: 850 },
    button: { textTransform: "none", fontWeight: 900 },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "radial-gradient(1200px 650px at 15% 0%, rgba(34,211,238,0.16), transparent 60%)," +
            "radial-gradient(900px 520px at 85% 18%, rgba(167,139,250,0.18), transparent 55%)," +
            "radial-gradient(900px 520px at 50% 110%, rgba(34,197,94,0.10), transparent 55%)," +
            "linear-gradient(180deg, #050816 0%, #030615 100%)",
          backgroundAttachment: "fixed",
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 28,
          border: "1px solid rgba(148,163,184,0.16)",
          backgroundImage:
            "linear-gradient(180deg, rgba(15,23,42,0.82), rgba(2,6,23,0.74))",
          backdropFilter: "blur(18px)",
          boxShadow: "0 36px 140px rgba(0,0,0,0.70)",
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 24 },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 999 },
        containedSuccess: {
          background: "linear-gradient(90deg, #22c55e, #16a34a)",
          boxShadow: "0 16px 55px rgba(34,197,94,0.38)",
        },
        containedPrimary: {
          background: "linear-gradient(90deg, #22d3ee, #a78bfa)",
          boxShadow: "0 16px 55px rgba(34,211,238,0.28)",
        },
        outlined: {
          borderColor: "rgba(226,232,240,0.24)",
          color: "rgba(226,232,240,0.88)",
          "&:hover": {
            borderColor: "rgba(226,232,240,0.38)",
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
          border: "1px solid rgba(226,232,240,0.16)",
          color: "rgba(226,232,240,0.92)",
          background:
            "linear-gradient(90deg, rgba(34,211,238,0.14), rgba(167,139,250,0.12))",
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          background:
            "linear-gradient(180deg, rgba(2,6,23,0.92), rgba(2,6,23,0.78))",
          backdropFilter: "blur(18px)",
          borderRight: "1px solid rgba(148,163,184,0.16)",
          boxShadow: "0 24px 90px rgba(0,0,0,0.60)",
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "rgba(2,6,23,0.55)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(148,163,184,0.16)",
          boxShadow: "0 26px 110px rgba(0,0,0,0.60)",
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: "rgba(2,6,23,0.30)",
          "& fieldset": { borderColor: "rgba(148,163,184,0.20)" },
          "&:hover fieldset": { borderColor: "rgba(34,211,238,0.35)" },
          "&.Mui-focused fieldset": {
            borderColor: "rgba(34,211,238,0.55)",
            boxShadow: `0 0 0 4px ${alpha("#22d3ee", 0.18)}`,
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
          backgroundImage: "linear-gradient(90deg, #22d3ee, #a78bfa)",
        },
      },
    },
  },
});
