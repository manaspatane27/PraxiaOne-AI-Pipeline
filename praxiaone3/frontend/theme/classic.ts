import { createTheme, alpha } from "@mui/material/styles";

export const classicTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0ea5e9" }, // sky
    secondary: { main: "#14b8a6" }, // teal
    success: { main: "#22c55e" },
    warning: { main: "#f59e0b" },
    error: { main: "#ef4444" },
    background: {
      default: "#f7fbff",
      paper: "rgba(255,255,255,0.78)",
    },
    text: {
      primary: "#0f172a",
      secondary: "#475569",
    },
    divider: "rgba(15,23,42,0.10)",
  },

  shape: { borderRadius: 16 },

  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial',
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
            "radial-gradient(1200px 650px at 15% 0%, rgba(14,165,233,0.12), transparent 60%)," +
            "radial-gradient(900px 520px at 85% 18%, rgba(20,184,166,0.10), transparent 55%)," +
            "linear-gradient(180deg, #f7fbff 0%, #eef6ff 100%)",
          backgroundAttachment: "fixed",
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: "1px solid rgba(15,23,42,0.08)",
          backgroundImage:
            "linear-gradient(180deg, rgba(255,255,255,0.86), rgba(255,255,255,0.70))",
          backdropFilter: "blur(12px)",
          boxShadow: "0 18px 70px rgba(2,6,23,0.10)",
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 18,
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 999 },
        contained: {
          boxShadow: "0 16px 40px rgba(2,6,23,0.10)",
        },
        containedSuccess: {
          background: "linear-gradient(90deg, #22c55e, #16a34a)",
          boxShadow: "0 16px 45px rgba(34,197,94,0.25)",
        },
        outlined: {
          borderColor: "rgba(15,23,42,0.18)",
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 900,
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.74))",
          backdropFilter: "blur(14px)",
          borderRight: "1px solid rgba(15,23,42,0.08)",
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.80), rgba(255,255,255,0.70))",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(15,23,42,0.08)",
          boxShadow: "0 18px 70px rgba(2,6,23,0.08)",
        },
      },
    },

    MuiTextField: {
      defaultProps: { variant: "outlined" },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: "rgba(255,255,255,0.70)",
          "& fieldset": {
            borderColor: "rgba(15,23,42,0.16)",
          },
          "&:hover fieldset": {
            borderColor: "rgba(14,165,233,0.35)",
          },
          "&.Mui-focused fieldset": {
            borderColor: "rgba(14,165,233,0.55)",
            boxShadow: `0 0 0 4px ${alpha("#0ea5e9", 0.12)}`,
          },
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          height: 10,
          backgroundColor: "rgba(2,6,23,0.08)",
        },
        bar: {
          borderRadius: 999,
          backgroundImage: "linear-gradient(90deg, #0ea5e9, #14b8a6)",
        },
      },
    },
  },
});
