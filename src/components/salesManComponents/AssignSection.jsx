import {
  Button,
  Card,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SectionDateFilterCard from "./SectionDateFilterCard";

export default function AssignSection({
  isMobile,
  sectionDatePresets,
  filter,
  showCustomWarning,
  onChangePreset,
  onChangeFrom,
  onChangeTo,
  assignEditMode,
  rows,
  orderOf,
  statusOf,
  assignDrafts,
  onStartEdit,
  onConfirmEdit,
  onChangeAssignDraft,
}) {
  return (
    <Stack spacing={1.5}>
      <SectionDateFilterCard
        title="Assign Supply Order"
        presets={sectionDatePresets}
        filter={filter}
        showCustomWarning={showCustomWarning}
        onChangePreset={onChangePreset}
        onChangeFrom={onChangeFrom}
        onChangeTo={onChangeTo}
      />
      <Card sx={{ p: 1.2, borderRadius: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          mb={1}
          justifyContent="flex-end"
        >
          <Button
            variant="outlined"
            onClick={onStartEdit}
            disabled={assignEditMode || rows.length === 0}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            onClick={onConfirmEdit}
            disabled={!assignEditMode || rows.length === 0}
          >
            Confirm
          </Button>
        </Stack>
        {isMobile ? (
          <Stack spacing={1}>
            {rows.map((inv) => (
              <Card key={inv.id} variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
                <Stack spacing={0.7}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography fontWeight={700}>#{orderOf(inv.id)}</Typography>
                    <Chip
                      size="small"
                      color={
                        statusOf(inv.id) === "supplied"
                          ? "success"
                          : statusOf(inv.id) === "not_supplied"
                            ? "error"
                            : "warning"
                      }
                      label={statusOf(inv.id)}
                    />
                  </Stack>
                  <Typography fontWeight={700}>{inv.customer_name || "-"}</Typography>
                  <Typography color="text.secondary" fontSize={13}>
                    Invoice: {inv.invoice_no || "-"}
                  </Typography>
                  <TextField
                    size="small"
                    type="number"
                    label="Assign"
                    value={assignEditMode ? (assignDrafts[inv.id] ?? orderOf(inv.id)) : orderOf(inv.id)}
                    disabled={!assignEditMode}
                    onChange={(e) => onChangeAssignDraft(inv.id, e.target.value)}
                    sx={{ width: 120 }}
                  />
                </Stack>
              </Card>
            ))}
            {rows.length === 0 && (
              <Typography color="text.secondary">No invoices for selected date</Typography>
            )}
          </Stack>
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 620 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Invoice</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assign</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{orderOf(inv.id)}</TableCell>
                    <TableCell>{inv.invoice_no || "-"}</TableCell>
                    <TableCell>{inv.customer_name || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={
                          statusOf(inv.id) === "supplied"
                            ? "success"
                            : statusOf(inv.id) === "not_supplied"
                              ? "error"
                              : "warning"
                        }
                        label={statusOf(inv.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={assignEditMode ? (assignDrafts[inv.id] ?? orderOf(inv.id)) : orderOf(inv.id)}
                        disabled={!assignEditMode}
                        onChange={(e) => onChangeAssignDraft(inv.id, e.target.value)}
                        sx={{ width: 90 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography color="text.secondary">No invoices for selected date</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Stack>
  );
}
