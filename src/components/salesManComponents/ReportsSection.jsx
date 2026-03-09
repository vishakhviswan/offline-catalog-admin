import {
  Button,
  Card,
  Chip,
  MenuItem,
  Select,
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

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const money = (v) => num(v).toFixed(2);

export default function ReportsSection({
  isMobile,
  reportType,
  setReportType,
  reportDateFilter,
  setReportDateFilter,
  reportSortOrder,
  setReportSortOrder,
  reportFromDate,
  setReportFromDate,
  reportToDate,
  setReportToDate,
  reportDateFilters,
  reportFilterLabel,
  reportCustomMissing,
  isPaymentReport,
  isSalesOnlyReport,
  isSalesReturnReport,
  reportSalesRows,
  reportPaymentRows,
  reportSalesReturnRows,
  reportSalesTotals,
  reportPaymentTotals,
  reportSalesReturnTotal,
  onDownloadPdf,
}) {
  return (
    <Stack spacing={1.5}>
      <Card
        sx={{
          p: { xs: 1.3, md: 1.8 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          background:
            "linear-gradient(120deg, #f8fafc 0%, #ecfeff 50%, #e0f2fe 100%)",
        }}
      >
        <Stack spacing={1.2}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ md: "center" }}
          >
            <Typography fontWeight={800} fontSize={{ xs: 17, md: 19 }}>
              Reports
            </Typography>
            <Typography color="text.secondary" fontSize={13}>
              Range: {reportFilterLabel} | Sort:{" "}
              {reportSortOrder === "desc" ? "Newest first" : "Oldest first"}
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            flexWrap="wrap"
            useFlexGap
          >
            <Select
              size="small"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="sales">Sales Report</MenuItem>
              <MenuItem value="payment">Payment Report</MenuItem>
              <MenuItem value="sales_collection">Sales & Collection Report</MenuItem>
              <MenuItem value="sales_return">Sales Return Report</MenuItem>
            </Select>
            <Select
              size="small"
              value={reportDateFilter}
              onChange={(e) => setReportDateFilter(e.target.value)}
              sx={{ minWidth: 170 }}
            >
              {reportDateFilters.map((f) => (
                <MenuItem key={f.id} value={f.id}>
                  {f.label}
                </MenuItem>
              ))}
            </Select>
            <Select
              size="small"
              value={reportSortOrder}
              onChange={(e) => setReportSortOrder(e.target.value)}
              sx={{ minWidth: 170 }}
            >
              <MenuItem value="desc">Newest First</MenuItem>
              <MenuItem value="asc">Oldest First</MenuItem>
            </Select>
            {reportDateFilter === "custom" && (
              <>
                <TextField
                  size="small"
                  type="date"
                  label="From"
                  value={reportFromDate}
                  onChange={(e) => setReportFromDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  size="small"
                  type="date"
                  label="To"
                  value={reportToDate}
                  onChange={(e) => setReportToDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </>
            )}
            <Button variant="contained" onClick={onDownloadPdf}>
              Download PDF
            </Button>
          </Stack>

          {reportCustomMissing && (
            <Typography color="warning.main" fontSize={13}>
              Custom filter use cheyyan From and To date select cheyyuka.
            </Typography>
          )}

          {isPaymentReport ? (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`Rows: ${reportPaymentRows.length}`} color="primary" />
              <Chip label={`Total: ${money(reportPaymentTotals.total)}`} color="success" />
              <Chip label={`Cash: ${money(reportPaymentTotals.cash)}`} variant="outlined" />
              <Chip label={`Cheque: ${money(reportPaymentTotals.cheque)}`} variant="outlined" />
              <Chip label={`UPI: ${money(reportPaymentTotals.upi)}`} variant="outlined" />
              <Chip
                label={`A/C Transfer: ${money(reportPaymentTotals.accountTransfer)}`}
                variant="outlined"
              />
            </Stack>
          ) : isSalesReturnReport ? (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`Rows: ${reportSalesReturnRows.length}`} color="primary" />
              <Chip label={`Return Total: ${money(reportSalesReturnTotal)}`} color="warning" />
            </Stack>
          ) : (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`Rows: ${reportSalesRows.length}`} color="primary" />
              <Chip label={`Invoice: ${money(reportSalesTotals.invoice)}`} color="success" />
              <Chip label={`Return: ${money(reportSalesTotals.returned)}`} variant="outlined" />
              <Chip label={`Collected: ${money(reportSalesTotals.received)}`} variant="outlined" />
              <Chip label={`Balance: ${money(reportSalesTotals.balance)}`} color="warning" />
            </Stack>
          )}
        </Stack>
      </Card>

      {isMobile ? (
        <Stack spacing={1}>
          {isPaymentReport
            ? reportPaymentRows.map((r, i) => (
                <Card key={`${r.invoice_no}-${i}`} variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
                  <Stack spacing={0.6}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography fontWeight={700}>{r.invoice_no}</Typography>
                      <Typography color="text.secondary" fontSize={12}>
                        {r.date}
                      </Typography>
                    </Stack>
                    <Typography fontWeight={700}>{r.customer_name}</Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Cash {money(r.cash_amount)} | Cheque {money(r.cheque_amount)}
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      UPI {money(r.upi_amount)} | A/C Transfer {money(r.account_transfer_amount)}
                    </Typography>
                    <Typography fontWeight={700}>Total: {money(r.amount)}</Typography>
                  </Stack>
                </Card>
              ))
            : isSalesReturnReport
              ? reportSalesReturnRows.map((r, i) => (
                  <Card key={`${r.invoice_no}-${i}`} variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
                    <Stack spacing={0.6}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography fontWeight={700}>{r.invoice_no}</Typography>
                        <Typography color="text.secondary" fontSize={12}>
                          {r.date}
                        </Typography>
                      </Stack>
                      <Typography fontWeight={700}>{r.customer_name}</Typography>
                      <Typography fontSize={13} color="text.secondary">
                        Items: {r.items || "-"}
                      </Typography>
                      <Typography fontWeight={700}>Return: {money(r.return_amount)}</Typography>
                    </Stack>
                  </Card>
                ))
              : reportSalesRows.map((r, i) => (
                  <Card key={`${r.invoice_no}-${i}`} variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
                    <Stack spacing={0.6}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography fontWeight={700}>{r.invoice_no}</Typography>
                        <Typography color="text.secondary" fontSize={12}>
                          {r.date}
                        </Typography>
                      </Stack>
                      <Typography fontWeight={700}>{r.customer_name}</Typography>
                      <Typography fontSize={13} color="text.secondary">
                        Invoice: {money(r.invoice_amount)} | Return: {money(r.return_amount)}
                      </Typography>
                      {!isSalesOnlyReport && (
                        <Typography fontSize={13} color="text.secondary">
                          Collected: {money(r.received_amount)} | Method: {r.payment_method || "-"}
                        </Typography>
                      )}
                      <Typography fontWeight={700}>Balance: {money(r.balance)}</Typography>
                    </Stack>
                  </Card>
                ))}
          {isPaymentReport && reportPaymentRows.length === 0 && (
            <Typography color="text.secondary">No payment records</Typography>
          )}
          {isSalesReturnReport && reportSalesReturnRows.length === 0 && (
            <Typography color="text.secondary">No sales return records</Typography>
          )}
          {!isPaymentReport && !isSalesReturnReport && reportSalesRows.length === 0 && (
            <Typography color="text.secondary">No sales records</Typography>
          )}
        </Stack>
      ) : (
        <Card sx={{ p: 1, borderRadius: 3 }}>
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table
              size="small"
              sx={{
                minWidth: isPaymentReport ? 1250 : isSalesReturnReport ? 920 : isSalesOnlyReport ? 900 : 1200,
              }}
            >
              <TableHead>
                {isPaymentReport ? (
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Invoice No</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Cash</TableCell>
                    <TableCell align="right">Cheque</TableCell>
                    <TableCell align="right">UPI</TableCell>
                    <TableCell align="right">Account Transfer</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Note</TableCell>
                  </TableRow>
                ) : isSalesReturnReport ? (
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Invoice No</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell align="right">Return Amount</TableCell>
                  </TableRow>
                ) : isSalesOnlyReport ? (
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Invoice No</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Invoice Amount</TableCell>
                    <TableCell align="right">Return Amount</TableCell>
                    <TableCell align="right">Balance</TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Invoice No</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Invoice Amount</TableCell>
                    <TableCell align="right">Return Amount</TableCell>
                    <TableCell align="right">Received</TableCell>
                    <TableCell align="right">Balance</TableCell>
                    <TableCell>Payment Method</TableCell>
                  </TableRow>
                )}
              </TableHead>
              <TableBody>
                {isPaymentReport
                  ? reportPaymentRows.map((r, i) => (
                      <TableRow key={`${r.invoice_no}-${i}`}>
                        <TableCell>{r.date}</TableCell>
                        <TableCell>{r.invoice_no}</TableCell>
                        <TableCell>{r.customer_name}</TableCell>
                        <TableCell align="right">{money(r.cash_amount)}</TableCell>
                        <TableCell align="right">{money(r.cheque_amount)}</TableCell>
                        <TableCell align="right">{money(r.upi_amount)}</TableCell>
                        <TableCell align="right">{money(r.account_transfer_amount)}</TableCell>
                        <TableCell align="right">{money(r.amount)}</TableCell>
                        <TableCell>{r.note || "-"}</TableCell>
                      </TableRow>
                    ))
                  : isSalesReturnReport
                    ? reportSalesReturnRows.map((r, i) => (
                        <TableRow key={`${r.invoice_no}-${i}`}>
                          <TableCell>{r.date}</TableCell>
                          <TableCell>{r.invoice_no}</TableCell>
                          <TableCell>{r.customer_name}</TableCell>
                          <TableCell>{r.items || "-"}</TableCell>
                          <TableCell align="right">{money(r.return_amount)}</TableCell>
                        </TableRow>
                      ))
                    : reportSalesRows.map((r, i) => (
                        <TableRow key={`${r.invoice_no}-${i}`}>
                          <TableCell>{r.date}</TableCell>
                          <TableCell>{r.invoice_no}</TableCell>
                          <TableCell>{r.customer_name}</TableCell>
                          <TableCell align="right">{money(r.invoice_amount)}</TableCell>
                          <TableCell align="right">{money(r.return_amount)}</TableCell>
                          {!isSalesOnlyReport && (
                            <TableCell align="right">{money(r.received_amount)}</TableCell>
                          )}
                          <TableCell align="right">{money(r.balance)}</TableCell>
                          {!isSalesOnlyReport && <TableCell>{r.payment_method || "-"}</TableCell>}
                        </TableRow>
                      ))}
                {isPaymentReport && reportPaymentRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography color="text.secondary">No payment records</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {isSalesReturnReport && reportSalesReturnRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography color="text.secondary">No sales return records</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!isPaymentReport && !isSalesReturnReport && reportSalesRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isSalesOnlyReport ? 6 : 8}>
                      <Typography color="text.secondary">No sales records</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Stack>
  );
}
