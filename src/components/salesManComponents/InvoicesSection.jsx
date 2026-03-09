import { Card, Chip, Stack } from "@mui/material";
import SectionDateFilterCard from "./SectionDateFilterCard";
import SimpleInvoiceTable from "./SimpleInvoiceTable";

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const money = (v) => num(v).toFixed(2);

export default function InvoicesSection({
  sectionDatePresets,
  filter,
  showCustomWarning,
  onChangePreset,
  onChangeFrom,
  onChangeTo,
  invoiceCount,
  totalSalesAmount,
  pendingCount,
  rows,
  orderOf,
  statusOf,
}) {
  return (
    <Stack spacing={1.5}>
      <SectionDateFilterCard
        title="Invoices"
        presets={sectionDatePresets}
        filter={filter}
        showCustomWarning={showCustomWarning}
        onChangePreset={onChangePreset}
        onChangeFrom={onChangeFrom}
        onChangeTo={onChangeTo}
      />
      <Card sx={{ p: 1.5, borderRadius: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
          <Chip color="primary" label={`Invoice Count: ${invoiceCount}`} />
          <Chip color="success" label={`Total Sales: ${money(totalSalesAmount)}`} />
          <Chip color="warning" label={`Pending Shops: ${pendingCount}`} />
        </Stack>
      </Card>
      <Card sx={{ p: 1, borderRadius: 3 }}>
        <SimpleInvoiceTable rows={rows} orderOf={orderOf} statusOf={statusOf} />
      </Card>
    </Stack>
  );
}
