import {
  Card,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from "@mui/material";

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const money = (v) => num(v).toFixed(2);
const dateFmt = (v) =>
  v
    ? new Date(v).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

export default function SimpleInvoiceTable({ rows, orderOf, statusOf }) {
  const isCompact = useMediaQuery("(max-width:700px)");
  const statusColor = (id) =>
    statusOf(id) === "supplied"
      ? "success"
      : statusOf(id) === "not_supplied"
        ? "error"
        : "warning";

  if (isCompact) {
    return (
      <Stack spacing={1}>
        {rows.map((inv) => (
          <Card
            key={inv.id}
            variant="outlined"
            sx={{ p: 1.2, borderRadius: 2 }}
          >
            <Stack spacing={0.75}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography fontWeight={700}>#{orderOf(inv.id)}</Typography>
                <Chip
                  size="small"
                  color={statusColor(inv.id)}
                  label={statusOf(inv.id)}
                />
              </Stack>
              <Typography fontWeight={700}>
                {inv.customer_name || "-"}
              </Typography>
              <Typography color="text.secondary" fontSize={13}>
                Invoice: {inv.invoice_no || "-"}
              </Typography>
              <Typography color="text.secondary" fontSize={13}>
                Date: {dateFmt(inv.invoice_date || inv.created_at)}
              </Typography>
              <Typography fontWeight={700}>
                Amount: {money(inv.total_amount)}
              </Typography>
            </Stack>
          </Card>
        ))}
        {rows.length === 0 && (
          <Typography color="text.secondary">No invoices</Typography>
        )}
      </Stack>
    );
  }

  return (
    <TableContainer sx={{ overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth: 720 }}>
        <TableHead>
          <TableRow>
            <TableCell>Order</TableCell>
            <TableCell>Invoice No</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((inv) => (
            <TableRow key={inv.id}>
              <TableCell>{orderOf(inv.id)}</TableCell>
              <TableCell>{inv.invoice_no || "-"}</TableCell>
              <TableCell>{inv.customer_name || "-"}</TableCell>
              <TableCell>
                {dateFmt(inv.invoice_date || inv.created_at)}
              </TableCell>
              <TableCell align="right">{money(inv.total_amount)}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  color={statusColor(inv.id)}
                  label={statusOf(inv.id)}
                />
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>
                <Typography color="text.secondary">No invoices</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
