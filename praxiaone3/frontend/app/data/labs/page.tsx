"use client";

import { Box, Card, CardContent, Typography, Button } from "@mui/material";
import { requireAuth } from "@/lib/requireAuth";

export default function UploadLabsPage() {
  requireAuth();

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>
        Upload Lab Results
      </Typography>

      <Card>
        <CardContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Upload lab reports (PDF / image). Later we’ll parse + store embeddings.
          </Typography>

          <Button variant="contained" component="label" sx={{ borderRadius: 0, fontWeight: 900 }}>
            Choose File
            <input hidden type="file" accept=".pdf,.png,.jpg,.jpeg" />
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
