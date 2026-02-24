import { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  Typography,
  Stack,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import toast from "react-hot-toast";

export default function SalesImport() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  /* ================= ANALYZE FILE ================= */

  const handleAnalyze = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    try {
      setLoading(true);
      setProgress(0);
      setAnalysis(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/sales/analyze`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setProgress(percent);
          },
        },
      );

      setAnalysis(response.data);
      setDialogOpen(true);
      toast.success("Analysis completed");
    } catch (err) {
      console.error(err);
      toast.error("Analyze failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <Box maxWidth={700} mx="auto">
      <Typography variant="h5" fontWeight={700} mb={3}>
        Sales Import (Step 1 - Analyze)
      </Typography>

      <Card sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Button
            component="label"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
          >
            Select Excel File
            <input
              type="file"
              hidden
              accept=".xlsx, .xls"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </Button>

          {file && <Typography fontSize={14}>Selected: {file.name}</Typography>}

          {loading && <LinearProgress variant="determinate" value={progress} />}

          <Button
            variant="contained"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Analyze File"}
          </Button>
        </Stack>
      </Card>

      {/* ================= ANALYSIS RESULT DIALOG ================= */}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Analysis Result</DialogTitle>

        <DialogContent dividers>
          {analysis && (
            <>
              <Typography>Total Rows: {analysis.total_rows}</Typography>

              <Typography>Total Invoices: {analysis.total_invoices}</Typography>

              {/* Customers */}
              <Typography mt={3} fontWeight={600}>
                Customers
              </Typography>

              {analysis.customers.map((c, index) => (
                <Typography key={index}>
                  {c.name} — {c.status}
                </Typography>
              ))}

              {/* Products */}
              <Typography mt={3} fontWeight={600}>
                Products
              </Typography>

              {analysis.products.map((p, index) => (
                <Typography key={index}>
                  {p.name} — {p.status}
                </Typography>
              ))}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
