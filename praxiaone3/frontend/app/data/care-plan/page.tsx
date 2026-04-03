"use client";

import { Box, Card, CardContent, Typography, Button } from "@mui/material";
import { requireAuth } from "@/lib/requireAuth";

export default function UploadCarePlanPage() {
  requireAuth();

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>
        Upload Care Plan
      </Typography>

      <Card>
        <CardContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Upload PDF / image care plan. (Backend upload API can be added next.)
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
