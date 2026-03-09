import { Button, Card, Stack, TextField, Typography } from "@mui/material";

export default function SupplyDateFilterCard({
  dateValue,
  onChangeDate,
  onClear,
  disabled = false,
}) {
  return (
    <Card
      sx={{
        p: { xs: 1.2, md: 1.4 },
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: "divider",
        background:
          "linear-gradient(120deg, #f8fafc 0%, #f0fdf4 55%, #dcfce7 100%)",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
      >
        <Typography fontWeight={700} fontSize={14}>
          Supply Single Date Filter
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField
            size="small"
            type="date"
            label="Supply Date"
            value={dateValue || ""}
            onChange={(e) => onChangeDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={disabled}
          />
          <Button variant="outlined" onClick={onClear} disabled={disabled}>
            Clear
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}
