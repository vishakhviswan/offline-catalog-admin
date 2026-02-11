import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Checkbox,
  FormControlLabel,
  Typography,
  Divider,
} from "@mui/material";
import toast from "react-hot-toast";

export default function BulkEditModal({
  open,
  onClose,
  selectedCount = 0,
  onContinue,
}) {
  const [fields, setFields] = useState({
    pricing: false,
    stock: false,
    vendor: false,
    category: false,
    name: false,
    units: false,
  });

  function toggleField(key) {
    setFields((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function handleContinue() {
    const selectedFields = Object.keys(fields).filter((k) => fields[k]);

    if (selectedFields.length === 0) {
      toast.error("Select at least one field to edit");
      return;
    }

    onContinue(selectedFields);
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle fontWeight={700}>
        Bulk Edit ({selectedCount} selected)
      </DialogTitle>

      <DialogContent dividers>
        {selectedCount === 0 ? (
          <Typography color="error" fontSize={14}>
            No products selected.
          </Typography>
        ) : (
          <Stack spacing={1}>
            <Typography fontSize={13} color="text.secondary" mb={1}>
              Choose fields to update
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={fields.pricing}
                  onChange={() => toggleField("pricing")}
                />
              }
              label="Pricing (Purchase, Margin, Sales)"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={fields.stock}
                  onChange={() => toggleField("stock")}
                />
              }
              label="Stock"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={fields.vendor}
                  onChange={() => toggleField("vendor")}
                />
              }
              label="Vendor"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={fields.category}
                  onChange={() => toggleField("category")}
                />
              }
              label="Category"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={fields.name}
                  onChange={() => toggleField("name")}
                />
              }
              label="Product Name"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={fields.units}
                  onChange={() => toggleField("units")}
                />
              }
              label="Units"
            />

            <Divider sx={{ my: 2 }} />

            <Typography fontSize={12} color="text.secondary">
              Only selected fields will be editable in next step.
            </Typography>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>

        <Button
          variant="contained"
          onClick={handleContinue}
          disabled={selectedCount === 0}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
