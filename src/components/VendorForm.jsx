import { useEffect, useState } from "react";
import { Box, Card, TextField, Button, Stack, Typography } from "@mui/material";
import toast from "react-hot-toast";
import { apiPost, apiPut } from "../api/api";

export default function VendorForm({ editingVendor, onSaved, onCancel }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!editingVendor) return;

    setName(editingVendor.name || "");
    setPhone(editingVendor.phone || "");
    setAddress(editingVendor.address || "");
  }, [editingVendor]);

  async function handleSave(e) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Vendor name required");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
      };

      editingVendor
        ? await apiPut(`/api/vendors/${editingVendor.id}`, payload)
        : await apiPost("/api/vendors", payload);

      toast.success(editingVendor ? "Vendor updated ✅" : "Vendor added ✅");
      onSaved?.();
    } catch (err) {
      console.error(err);
      toast.error("Save failed ❌");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box p={3} width={{ xs: "100%", md: 420 }}>
      <Typography variant="h6" fontWeight={700} mb={2}>
        {editingVendor ? "Edit Vendor" : "Add Vendor"}
      </Typography>

      <Card sx={{ p: 3 }}>
        <Stack spacing={2}>
          <TextField
            label="Vendor Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />

          <TextField
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
          />

          <TextField
            label="Address"
            multiline
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            fullWidth
          />
        </Stack>
      </Card>

      <Stack direction="row" spacing={2} mt={3}>
        <Button fullWidth variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={handleSave}
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : editingVendor
              ? "Update Vendor"
              : "Save Vendor"}
        </Button>
      </Stack>
    </Box>
  );
}
