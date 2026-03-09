import { useEffect, useRef } from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  LinearProgress,
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
import PaymentsIcon from "@mui/icons-material/Payments";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SupplyDateFilterCard from "./SupplyDateFilterCard";

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const money = (v) => num(v).toFixed(2);

export default function SupplySection({
  isMobile,
  supplyDate,
  onChangeSupplyDate,
  onClearSupplyDate,
  current,
  currentMetrics,
  orderOf,
  currentIndex,
  pendingCount,
  supplyProgress,
  prevShop,
  nextShop,
  onGoPrev,
  onGoNext,
  showSupplyItems,
  onToggleSupplyItems,
  itemsByInvoice,
  returnsOf,
  onToggleReturnItem,
  onChangeReturnQty,
  onConfirmReturn,
  onShareReturn,
  showPaymentForm,
  onTogglePaymentForm,
  payment,
  onSetPayment,
  onAddPayment,
  latestPayments,
  onMarkSuppliedAndShare,
  sharePreviewOpen,
  sharePreviewType,
  sharePreviewEditMode,
  sharePreviewMessage,
  onEditSharePreview,
  onChangeSharePreviewMessage,
  onConfirmSharePreview,
  onCancelSharePreview,
  onToggleNotSupplied,
  showNotSuppliedReason,
  reasonType,
  onSetReasonType,
  reasonNote,
  onSetReasonNote,
  onConfirmNotSupplied,
  reassignNo,
  onSetReassignNo,
  onReassign,
  reasonOptions,
}) {
  const sharePreviewRef = useRef(null);
  const isNotSuppliedPreview = sharePreviewType === "not_supplied";
  const inputsLocked = sharePreviewOpen && !sharePreviewEditMode;
  const lockedAreaSx = inputsLocked
    ? {
        filter: "grayscale(0.9) blur(1.2px)",
        opacity: 0.5,
        pointerEvents: "none",
        userSelect: "none",
        transition: "all 0.2s ease",
      }
    : { transition: "all 0.2s ease" };

  useEffect(() => {
    if (!sharePreviewOpen || !sharePreviewRef.current) return;
    const timer = window.setTimeout(() => {
      sharePreviewRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }, 90);
    return () => window.clearTimeout(timer);
  }, [sharePreviewOpen]);

  return (
    <Stack spacing={1.5}>
      <Box sx={lockedAreaSx}>
        <SupplyDateFilterCard
          dateValue={supplyDate}
          onChangeDate={onChangeSupplyDate}
          onClear={onClearSupplyDate}
          disabled={inputsLocked}
        />
      </Box>

      {!current || !currentMetrics ? (
        <Card sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography>No pending invoices for selected date</Typography>
        </Card>
      ) : (
        <Stack spacing={1.6}>
          <Box sx={lockedAreaSx}>
            <Card sx={{ p: { xs: 1.4, md: 2 }, borderRadius: 3 }}>
              <Stack spacing={1.2}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1}
                  justifyContent="space-between"
                >
                  <Box>
                    <Typography color="text.secondary" fontSize={12}>
                      Current Shop
                    </Typography>
                    <Typography fontWeight={800} fontSize={{ xs: 18, md: 22 }}>
                      #{orderOf(current.id)} {current.customer_name || "-"}
                    </Typography>
                    <Typography color="text.secondary" fontSize={13}>
                      Invoice: {current.invoice_no || "-"}
                    </Typography>
                  </Box>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Chip color="primary" label={`${currentIndex + 1} / ${pendingCount}`} />
                    <Chip color="success" label={`Invoice ${money(currentMetrics.invoiceAmount)}`} />
                    <Chip
                      color={currentMetrics.balance > 0 ? "warning" : "success"}
                      label={`Balance ${money(currentMetrics.balance)}`}
                    />
                  </Stack>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={supplyProgress}
                  sx={{ height: 8, borderRadius: 999 }}
                />
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1}
                  justifyContent="space-between"
                  alignItems={{ md: "center" }}
                >
                  <Typography color="text.secondary" fontSize={13}>
                    Prev: {prevShop?.customer_name || "None"} | Next: {nextShop?.customer_name || "None"}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={onGoPrev} disabled={!prevShop}>
                      <span aria-hidden="true">{"< "}</span>
                      Prev Shop
                    </Button>
                    <Button variant="contained" onClick={onGoNext} disabled={!nextShop}>
                      Next Shop
                      <span aria-hidden="true">{" >"}</span>
                    </Button>
                  </Stack>
                </Stack>
                <Box>
                  <Button variant="text" onClick={onToggleSupplyItems} sx={{ px: 0.3 }}>
                    {showSupplyItems ? "Hide Items" : "Show Items"}
                  </Button>
                </Box>
              </Stack>
            </Card>
          </Box>

          {showSupplyItems && (
            <Box sx={lockedAreaSx}>
              <Card sx={{ p: 1.2, borderRadius: 3 }}>
                {isMobile ? (
                  <Stack spacing={1}>
                    {(itemsByInvoice[current.id] || []).map((it) => {
                      const ret = returnsOf(current.id)[it.id];
                      return (
                        <Card key={it.id} variant="outlined" sx={{ p: 1.1, borderRadius: 2 }}>
                          <Stack spacing={1}>
                            <Typography fontWeight={700}>{it.product_name || "-"}</Typography>
                            <Typography fontSize={13} color="text.secondary">
                              Qty: {num(it.qty)} | Price: {money(it.price)}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Button
                                size="small"
                                variant={ret ? "contained" : "outlined"}
                                onClick={() => onToggleReturnItem(current.id, it)}
                              >
                                {ret ? "Undo" : "Return"}
                              </Button>
                              {ret && (
                                <TextField
                                  size="small"
                                  type="number"
                                  label="Adj Qty"
                                  value={ret.removed ? 0 : ret.qty}
                                  onChange={(e) => onChangeReturnQty(current.id, it.id, e.target.value)}
                                  sx={{ width: 120 }}
                                />
                              )}
                            </Stack>
                          </Stack>
                        </Card>
                      );
                    })}
                  </Stack>
                ) : (
                  <TableContainer sx={{ overflowX: "auto" }}>
                    <Table size="small" sx={{ minWidth: 680 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell align="right">Qty</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell>Return</TableCell>
                          <TableCell align="right">Adj Qty</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(itemsByInvoice[current.id] || []).map((it) => {
                          const ret = returnsOf(current.id)[it.id];
                          return (
                            <TableRow key={it.id}>
                              <TableCell>{it.product_name || "-"}</TableCell>
                              <TableCell align="right">{num(it.qty)}</TableCell>
                              <TableCell align="right">{money(it.price)}</TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  variant={ret ? "contained" : "outlined"}
                                  onClick={() => onToggleReturnItem(current.id, it)}
                                >
                                  {ret ? "Undo" : "Return"}
                                </Button>
                              </TableCell>
                              <TableCell align="right">
                                {ret ? (
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={ret.removed ? 0 : ret.qty}
                                    onChange={(e) =>
                                      onChangeReturnQty(current.id, it.id, e.target.value)
                                    }
                                    sx={{ width: 90 }}
                                  />
                                ) : (
                                  num(it.qty)
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                <Button
                  variant="contained"
                  onClick={onConfirmReturn}
                  disabled={currentMetrics.returnAmount <= 0}
                >
                  Confirm Return
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<WhatsAppIcon />}
                  onClick={onShareReturn}
                  disabled={currentMetrics.returnAmount <= 0}
                >
                  Share Return
                </Button>
              </Card>
            </Box>
          )}

          <Box sx={lockedAreaSx}>
            <Card sx={{ p: { xs: 1.4, md: 1.8 }, borderRadius: 3 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                justifyContent="space-between"
                alignItems={{ sm: "center" }}
              >
                <Box>
                  <Typography fontWeight={800} mb={0.2}>
                    Collections
                  </Typography>
                  <Typography color="text.secondary" fontSize={13}>
                    Collected: {money(currentMetrics.received)} | Balance: {money(currentMetrics.balance)}
                  </Typography>
                </Box>
                <Button
                  variant={showPaymentForm ? "contained" : "outlined"}
                  startIcon={<PaymentsIcon />}
                  onClick={onTogglePaymentForm}
                  disabled={inputsLocked}
                >
                  {showPaymentForm ? "Close Payment" : "Payment"}
                </Button>
              </Stack>

              {showPaymentForm && (
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} mt={1.2}>
                  <TextField
                    size="small"
                    type="number"
                    label="Amount"
                    value={payment.amount}
                    onChange={(e) => onSetPayment({ ...payment, amount: e.target.value })}
                    disabled={inputsLocked}
                  />
                  <Select
                    size="small"
                    value={payment.method}
                    onChange={(e) => onSetPayment({ ...payment, method: e.target.value })}
                    sx={{ minWidth: 170 }}
                    disabled={inputsLocked}
                  >
                    <MenuItem value="cash">cash</MenuItem>
                    <MenuItem value="cheque">cheque</MenuItem>
                    <MenuItem value="upi">upi</MenuItem>
                    <MenuItem value="account_transfer">account_transfer</MenuItem>
                    <MenuItem value="credit_sales">credit_sales</MenuItem>
                  </Select>
                  <TextField
                    size="small"
                    label="Note"
                    value={payment.note}
                    onChange={(e) => onSetPayment({ ...payment, note: e.target.value })}
                    disabled={inputsLocked}
                  />
                  <Button variant="outlined" onClick={onAddPayment} disabled={inputsLocked}>
                    Add Payment
                  </Button>
                </Stack>
              )}

              {latestPayments.length > 0 && (
                <Stack direction="row" spacing={0.7} mt={1.2} flexWrap="wrap" useFlexGap>
                  {latestPayments.map((p) => (
                    <Chip
                      key={p.id}
                      size="small"
                      variant="outlined"
                      label={`${money(p.amount)} ${p.method}`}
                    />
                  ))}
                </Stack>
              )}
            </Card>
          </Box>

          <Card sx={{ p: { xs: 1.4, md: 1.8 }, borderRadius: 3 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} mb={1} sx={lockedAreaSx}>
              <Button
                variant="contained"
                color="success"
                startIcon={<WhatsAppIcon />}
                onClick={onMarkSuppliedAndShare}
                disabled={inputsLocked}
              >
                Mark Supplied
              </Button>
              <Button
                variant="outlined"
                color="warning"
                onClick={onToggleNotSupplied}
                disabled={inputsLocked}
              >
                Not Supplied
              </Button>
            </Stack>

            {sharePreviewOpen && (
              <Card
                ref={sharePreviewRef}
                variant="outlined"
                sx={{
                  p: 1.2,
                  mb: 1,
                  borderRadius: 2,
                  borderColor: "success.light",
                  background:
                    "linear-gradient(120deg, #ecfdf5 0%, #dcfce7 50%, #f0fdf4 100%)",
                }}
              >
                <Typography fontWeight={800} mb={0.6}>
                  {isNotSuppliedPreview ? "Share Preview - Not Supplied" : "Share Preview"}
                </Typography>
                {sharePreviewEditMode ? (
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    size="small"
                    value={sharePreviewMessage}
                    onChange={(e) => onChangeSharePreviewMessage(e.target.value)}
                  />
                ) : (
                  <Typography fontSize={14} whiteSpace="pre-line">
                    {sharePreviewMessage}
                  </Typography>
                )}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mt={1}>
                  <Button variant="outlined" onClick={onEditSharePreview}>
                    {sharePreviewEditMode ? "Done Edit" : "Edit"}
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<WhatsAppIcon />}
                    onClick={onConfirmSharePreview}
                  >
                    {isNotSuppliedPreview ? "Confirm Not Supplied & Share" : "Confirm & Share"}
                  </Button>
                  <Button variant="text" color="inherit" onClick={onCancelSharePreview}>
                    Cancel
                  </Button>
                </Stack>
              </Card>
            )}

            {showNotSuppliedReason && (
              <Card
                variant="outlined"
                sx={{
                  ...lockedAreaSx,
                  p: { xs: 1.2, md: 1.5 },
                  borderRadius: 2.5,
                  borderColor: "warning.light",
                  background:
                    "linear-gradient(120deg, #fff7ed 0%, #fffbeb 55%, #fefce8 100%)",
                }}
              >
                <Typography fontSize={13} fontWeight={700} color="text.secondary" mb={1}>
                  Not Supplied Details
                </Typography>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems="stretch">
                  <Select
                    size="small"
                    value={reasonType}
                    onChange={(e) => onSetReasonType(e.target.value)}
                    sx={{ minWidth: 180, width: { xs: "100%", md: 220 } }}
                    disabled={inputsLocked}
                  >
                    {reasonOptions.map((r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))}
                  </Select>
                  <TextField
                    size="small"
                    label="Reason note"
                    value={reasonNote}
                    onChange={(e) => onSetReasonNote(e.target.value)}
                    sx={{ minWidth: 220, flex: 1 }}
                    disabled={inputsLocked}
                  />
                  <TextField
                    size="small"
                    type="number"
                    label="Reassign No"
                    value={reassignNo}
                    onChange={(e) => onSetReassignNo(e.target.value)}
                    sx={{ width: { xs: "100%", md: 140 } }}
                    disabled={inputsLocked}
                  />
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mt={1.2}>
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={onConfirmNotSupplied}
                    disabled={inputsLocked}
                  >
                    Preview Not Supplied
                  </Button>
                  <Button variant="outlined" onClick={onReassign} disabled={inputsLocked}>
                    Reassign
                  </Button>
                </Stack>
              </Card>
            )}
          </Card>
        </Stack>
      )}
    </Stack>
  );
}
