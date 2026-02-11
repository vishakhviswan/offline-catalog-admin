import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  Stack,
  IconButton,
  TextField,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import toast from "react-hot-toast";
import { apiGet, apiDelete } from "../api/api";
import VendorForm from "../components/VendorForm";

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [deleteVendor, setDeleteVendor] = useState(null);

  /* ================= LOAD ================= */
  useEffect(() => {
    loadVendors();
  }, []);

  async function loadVendors() {
    try {
      const data = await apiGet("/api/vendors");
      setVendors(data || []);
    } catch {
      toast.error("Failed to load vendors");
    }
  }

  /* ================= DELETE ================= */
  async function handleDelete() {
    try {
      await apiDelete(`/api/vendors/${deleteVendor.id}`);
      toast.success("Vendor deleted");
      setDeleteVendor(null);
      loadVendors();
    } catch {
      toast.error("Delete failed");
    }
  }

  /* ================= FILTER ================= */
  const filtered = vendors.filter((v) =>
    v.name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Box>
      {/* HEADER */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5" fontWeight={700}>
          Vendors
        </Typography>

        <Button
          startIcon={<AddIcon />}
          variant="contained"
          onClick={() => {
            setEditingVendor(null);
            setDrawerOpen(true);
          }}
        >
          Add Vendor
        </Button>
      </Stack>

      {/* SEARCH */}
      <TextField
        fullWidth
        size="small"
        placeholder="Search vendor..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* LIST */}
      <Stack spacing={1.5}>
        {filtered.map((vendor) => (
          <Card key={vendor.id} sx={{ p: 2 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box>
                <Typography fontWeight={600}>{vendor.name}</Typography>
                <Typography fontSize={13} color="text.secondary">
                  {vendor.phone}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1}>
                <IconButton
                  onClick={() => {
                    setEditingVendor(vendor);
                    setDrawerOpen(true);
                  }}
                >
                  <EditIcon />
                </IconButton>

                <IconButton
                  color="error"
                  onClick={() => setDeleteVendor(vendor)}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            </Stack>
          </Card>
        ))}

        {filtered.length === 0 && (
          <Typography align="center" color="text.secondary">
            No vendors found
          </Typography>
        )}
      </Stack>

      {/* DRAWER */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", md: 420 } } }}
      >
        <VendorForm
          editingVendor={editingVendor}
          onSaved={() => {
            setDrawerOpen(false);
            loadVendors();
          }}
          onCancel={() => setDrawerOpen(false)}
        />
      </Drawer>

      {/* DELETE CONFIRM */}
      <Dialog open={!!deleteVendor} onClose={() => setDeleteVendor(null)}>
        <DialogTitle>Delete Vendor?</DialogTitle>
        <DialogContent>
          {deleteVendor?.name} will be permanently deleted.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteVendor(null)}>Cancel</Button>
          <Button color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
