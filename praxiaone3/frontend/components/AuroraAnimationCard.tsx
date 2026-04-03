"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { Box, Typography } from "@mui/material";

export default function AuroraAnimationCard({
  src = "/animations/support.json",
  height = 320,
  caption,
}: {
  src?: string;
  height?: number;
  caption?: string;
}) {
  const [animData, setAnimData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load ${src}`);
        return r.json();
      })
      .then((json) => mounted && setAnimData(json))
      .catch((e) => console.error("Lottie load error:", e));

    return () => {
      mounted = false;
    };
  }, [src]);

  return (
    <Box
      sx={{
        borderRadius: 7,
        border: "1px solid rgba(148,163,184,0.18)",
        background: "linear-gradient(135deg, rgba(10,14,34,0.92), rgba(3,6,18,0.86))",
        boxShadow: "0 26px 90px rgba(0,0,0,0.55)",
        backdropFilter: "blur(18px)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Aurora glow (matches sidebar vibe) */}
      <Box
        sx={{
          position: "absolute",
          inset: -70,
          background:
            "radial-gradient(circle at 25% 20%, rgba(34,211,238,0.18), transparent 58%)," +
            "radial-gradient(circle at 75% 20%, rgba(167,139,250,0.18), transparent 58%)," +
            "radial-gradient(circle at 50% 85%, rgba(34,197,94,0.12), transparent 60%)",
          filter: "blur(10px)",
          pointerEvents: "none",
        }}
      />

      {/* Inner frame */}
      <Box
        sx={{
          height,
          p: 2,
          display: "grid",
          placeItems: "center",
          position: "relative",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 420,
            borderRadius: 6,
            border: "1px solid rgba(226,232,240,0.14)",
            background: "rgba(2,6,23,0.22)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 18px 70px rgba(0,0,0,0.40)",
            p: 1.5,
          }}
        >
          {animData ? (
            <Lottie animationData={animData} loop autoplay style={{ width: "100%", height: "100%" }} />
          ) : (
            <Box
              sx={{
                height: height - 60,
                display: "grid",
                placeItems: "center",
                color: "rgba(226,232,240,0.72)",
                fontWeight: 900,
              }}
            >
              Loading…
            </Box>
          )}
        </Box>
      </Box>

      {caption ? (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            px: 2.4,
            pb: 2,
            color: "rgba(148,163,184,0.78)",
          }}
        >
          {caption}
        </Typography>
      ) : null}
    </Box>
  );
}
