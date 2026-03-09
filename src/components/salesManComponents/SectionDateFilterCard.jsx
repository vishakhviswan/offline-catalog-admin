import { Card, Chip, Stack, TextField, Typography } from "@mui/material";

export default function SectionDateFilterCard({
  title,
  presets,
  filter,
  onChangePreset,
  onChangeFrom,
  onChangeTo,
  showCustomWarning,
}) {
  return (
    <Card
      sx={{
        p: { xs: 1.2, md: 1.4 },
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: "divider",
        background:
          "linear-gradient(120deg, #f8fafc 0%, #eff6ff 55%, #e0f2fe 100%)",
      }}
    >
      <Stack spacing={1}>
        <Typography fontWeight={700} fontSize={14}>
          {title} Date Filter
        </Typography>
        <Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap>
          {presets.map((p) => (
            <Chip
              key={p.id}
              size="small"
              label={p.label}
              color={filter?.preset === p.id ? "primary" : "default"}
              variant={filter?.preset === p.id ? "filled" : "outlined"}
              onClick={() => onChangePreset(p.id)}
            />
          ))}
        </Stack>
        {filter?.preset === "custom" && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              size="small"
              type="date"
              label="From"
              value={filter?.from || ""}
              onChange={(e) => onChangeFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size="small"
              type="date"
              label="To"
              value={filter?.to || ""}
              onChange={(e) => onChangeTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        )}
        {showCustomWarning && (
          <Typography color="warning.main" fontSize={12}>
            From and To date select cheyyuka.
          </Typography>
        )}
      </Stack>
    </Card>
  );
}
