"use client";

import { Box } from "@mui/material";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", overflow: "hidden" }} className="metabo-bg">
      <Sidebar />
      <Box sx={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1, display: "flex", flexDirection: "column" }}>
        <TopNav />
        <Box sx={{ flex: 1, px: { xs: 2, md: 5 }, pb: 6 }}>{children}</Box>
      </Box>
    </Box>
  );
}
