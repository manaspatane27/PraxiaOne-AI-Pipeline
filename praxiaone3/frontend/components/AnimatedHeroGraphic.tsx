"use client";

import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

export default function AnimatedHeroGraphic() {
  return (
    <Box
      sx={{
        height: 380,
        borderRadius: 6,
        border: "1px solid",
        borderColor: "divider",
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(14px)",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 30px 90px rgba(2,6,23,0.14)",
      }}
    >
      {/* glow layers */}
      <Box
        sx={{
          position: "absolute",
          inset: -40,
          background:
            "radial-gradient(520px 260px at 25% 25%, rgba(20,184,166,0.35), transparent 60%), radial-gradient(540px 280px at 75% 30%, rgba(14,165,233,0.30), transparent 60%), radial-gradient(540px 300px at 55% 80%, rgba(99,102,241,0.18), transparent 60%)",
          filter: "blur(2px)",
        }}
      />

      {/* animated orbit ring */}
      <motion.div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 260,
          height: 260,
          borderRadius: 999,
          border: "1px solid rgba(2,6,23,0.14)",
          transform: "translate(-50%, -50%)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      />

      {/* orbiting dot */}
      <motion.div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 12,
          height: 12,
          borderRadius: 999,
          background: "rgba(14,165,233,0.85)",
          boxShadow: "0 12px 30px rgba(14,165,233,0.35)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            transform: "translate(120px, 0px)",
            borderRadius: 999,
            background: "rgba(14,165,233,0.85)",
          }}
        />
      </motion.div>

      {/* floating “cards” */}
      <motion.div
        style={{
          position: "absolute",
          left: 26,
          top: 26,
          width: 170,
          padding: 14,
          borderRadius: 18,
          border: "1px solid rgba(2,6,23,0.10)",
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)",
        }}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <Typography sx={{ fontWeight: 900, fontSize: 13 }}>Labs Connected</Typography>
        <Typography variant="caption" color="text.secondary">
          Trend-ready insights
        </Typography>
      </motion.div>

      <motion.div
        style={{
          position: "absolute",
          right: 26,
          top: 60,
          width: 190,
          padding: 14,
          borderRadius: 18,
          border: "1px solid rgba(2,6,23,0.10)",
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)",
        }}
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Typography sx={{ fontWeight: 900, fontSize: 13 }}>Wearables</Typography>
        <Typography variant="caption" color="text.secondary">
          Steps • Sleep • HR
        </Typography>
      </motion.div>

      {/* center heart module */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
        }}
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <Box
          sx={{
            width: 160,
            height: 160,
            borderRadius: 999,
            background: "rgba(255,255,255,0.60)",
            border: "1px solid rgba(2,6,23,0.10)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Box sx={{ fontSize: 56, fontWeight: 900, lineHeight: 1 }}>❤</Box>
          <Typography variant="caption" color="text.secondary">
            AI + Wellness
          </Typography>
        </Box>
      </motion.div>

      {/* subtle grid */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(2,6,23,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(2,6,23,0.06) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          opacity: 0.35,
          pointerEvents: "none",
        }}
      />
    </Box>
  );
}
