"use client";

import Link from "next/link";
import { Box, Card, CardContent, Typography, Button, Stack } from "@mui/material";

export default function InsightsPage() {
  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
      <Typography variant="h4" fontWeight={900} sx={{ mb: 2 }}>
        AI Insights
      </Typography>

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography color="text.secondary">
              This is a placeholder insights screen.
            </Typography>

            <Typography variant="body2" color="text.secondary">
              For now, use the Health AI chat to ask questions and get guidance.
            </Typography>

            <Button component={Link} href="/health-ai" variant="contained">
              Open Health AI
            </Button>

            <Button component={Link} href="/consent" variant="outlined">
              Manage Consent
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
