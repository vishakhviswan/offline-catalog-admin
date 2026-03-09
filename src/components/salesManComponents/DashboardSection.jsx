import { Button, Card, Chip, Stack, Typography } from "@mui/material";

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const money = (v) => num(v).toFixed(2);

function MetricCard({ title, value, tone = "default" }) {
  const bgMap = {
    primary: "linear-gradient(120deg, #dbeafe 0%, #bfdbfe 100%)",
    success: "linear-gradient(120deg, #dcfce7 0%, #bbf7d0 100%)",
    warning: "linear-gradient(120deg, #fef3c7 0%, #fde68a 100%)",
    info: "linear-gradient(120deg, #cffafe 0%, #a5f3fc 100%)",
    default: "linear-gradient(120deg, #f8fafc 0%, #e2e8f0 100%)",
  };
  return (
    <Card
      sx={{
        p: 1.5,
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: "divider",
        background: bgMap[tone] || bgMap.default,
      }}
    >
      <Typography color="text.secondary" fontSize={12}>
        {title}
      </Typography>
      <Typography fontWeight={800} fontSize={22}>
        {value}
      </Typography>
    </Card>
  );
}

export default function DashboardSection({
  metrics,
  quickFilters,
  onOpenSection,
}) {
  return (
    <Stack spacing={1.5}>
      <Card
        sx={{
          p: { xs: 1.4, md: 2 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          background:
            "linear-gradient(120deg, #f8fafc 0%, #e0f2fe 52%, #dbeafe 100%)",
        }}
      >
        <Typography fontWeight={800} fontSize={{ xs: 19, md: 23 }}>
          Salesman Dashboard
        </Typography>
        <Typography color="text.secondary" fontSize={13}>
          Daily summary, collection status, and quick access panels
        </Typography>
      </Card>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        flexWrap="wrap"
        useFlexGap
      >
        <MetricCard title="Invoices" value={metrics.invoiceCount} tone="primary" />
        <MetricCard title="Supplied" value={metrics.suppliedCount} tone="success" />
        <MetricCard title="Pending" value={metrics.pendingCount} tone="warning" />
        <MetricCard title="Sales Amount" value={money(metrics.salesAmount)} tone="info" />
        <MetricCard title="Collected" value={money(metrics.collectedAmount)} tone="success" />
        <MetricCard title="Balance" value={money(metrics.balanceAmount)} tone="warning" />
      </Stack>

      <Card sx={{ p: 1.4, borderRadius: 3 }}>
        <Typography fontWeight={700} mb={1}>
          Quick Actions
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
          <Button variant="contained" onClick={() => onOpenSection("supply")}>
            Start Supply
          </Button>
          <Button variant="outlined" onClick={() => onOpenSection("invoices")}>
            Open Invoices
          </Button>
          <Button variant="outlined" onClick={() => onOpenSection("reports")}>
            Open Reports
          </Button>
          <Button variant="outlined" onClick={() => onOpenSection("returns")}>
            Open Sales Return
          </Button>
        </Stack>
      </Card>

      <Card sx={{ p: 1.4, borderRadius: 3 }}>
        <Typography fontWeight={700} mb={1}>
          Quick Date Filters
        </Typography>
        <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
          {quickFilters.map((x) => (
            <Chip key={x.id} label={x.label} variant="outlined" />
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}
