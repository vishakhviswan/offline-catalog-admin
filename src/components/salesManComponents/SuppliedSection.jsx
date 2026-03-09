import { Card, Stack } from "@mui/material";
import SectionDateFilterCard from "./SectionDateFilterCard";
import SimpleInvoiceTable from "./SimpleInvoiceTable";

export default function SuppliedSection({
  sectionDatePresets,
  filter,
  showCustomWarning,
  onChangePreset,
  onChangeFrom,
  onChangeTo,
  rows,
  orderOf,
  statusOf,
}) {
  return (
    <Stack spacing={1.5}>
      <SectionDateFilterCard
        title="Supplied Invoices"
        presets={sectionDatePresets}
        filter={filter}
        showCustomWarning={showCustomWarning}
        onChangePreset={onChangePreset}
        onChangeFrom={onChangeFrom}
        onChangeTo={onChangeTo}
      />
      <Card sx={{ p: 1, borderRadius: 3 }}>
        <SimpleInvoiceTable rows={rows} orderOf={orderOf} statusOf={statusOf} />
      </Card>
    </Stack>
  );
}
