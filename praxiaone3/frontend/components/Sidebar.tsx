"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Dashboard,
  Favorite,
  Storage,
  Upload,
  Watch,
  Medication,
  Psychology,
  Settings,
  Help,
  AccountCircle,
  MonitorHeart, // Add this for Vitals
  Shield, // Added for Consent
} from "@mui/icons-material";
import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

// Map our existing paths but style them to match the attached screenshot
const items = [
  ["Home", "/", <Home key="home" />],
  ["Dashboard", "/dashboard", <Dashboard key="dash" />],
  ["Profile", "/profile", <Favorite key="fav" />],
  ["Vitals", "/vitals", <MonitorHeart key="vit" />], // Add this line
  ["Data", "/data", <Storage key="str" />],
  ["Consent", "/consent", <Shield key="cons" />], // Added Consent link
  ["Wearables", "/wearables", <Watch key="wear" />],
  ["Medications", "/medications", <Medication key="med" />],
  ["AI Chat", "/health-ai", <Psychology key="psy" />],
  ["Support", "/support", <Help key="sup" />],
  ["Settings", "/settings", <Settings key="set" />],
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <Box
      sx={{
        width: 260,
        height: "100vh",
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        borderRight: "none", // The screenshot has a solid distinct dark block
        background: `linear-gradient(135deg, #222b3c, #1a202c)`, // Dark blue/grey slate
        boxShadow: "4px 0 16px rgba(0,0,0,0.15)",
        zIndex: 10,
        color: "#ffffff"
      }}
    >
      {/* Brand Logo Area Removed as requested */}

      {/* Navigation List */}
      <List sx={{ py: 2, flex: 1, px: 2 }}>
        {items.map(([label, href, icon]) => {
          const isActive = pathname === href || (pathname.startsWith(href) && href !== "/");
          return (
            <ListItemButton
              key={label}
              component={Link}
              href={href}
              sx={{
                mb: 1,
                borderRadius: 2,
                color: isActive ? "#ffffff" : "rgba(255,255,255,0.7)",
                background: isActive ? "linear-gradient(90deg, #179ebf, #1db5ce)" : "transparent",
                boxShadow: isActive ? "0 4px 12px rgba(29, 181, 206, 0.3)" : "none",
                transition: "all 0.2s ease",
                "&:hover": {
                  background: isActive ? "linear-gradient(90deg, #179ebf, #1db5ce)" : "rgba(255,255,255,0.06)",
                  transform: isActive ? "scale(1)" : "translateX(4px)"
                },
                "& .MuiListItemIcon-root": {
                  color: isActive ? "#ffffff" : "rgba(255,255,255,0.5)",
                  minWidth: 36,
                },
              }}
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{
                  sx: { fontWeight: isActive ? 700 : 500, fontSize: 13, letterSpacing: "0.2px" },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* Bottom Icons Area */}
      <Box sx={{ p: 3, display: "flex", gap: 2, opacity: 0.6 }}>
        <AccountCircle fontSize="small" />
      </Box>
    </Box>
  );
}

