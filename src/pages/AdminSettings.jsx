import { useEffect, useState } from "react";
import {
  Box,
  Card,
  Typography,
  Switch,
  Stack,
  Divider,
  CircularProgress,
} from "@mui/material";
import toast from "react-hot-toast";
import { apiGet, apiPost } from "../api/api";
import { useSettings } from "../context/SettingsContext";

/* ================= PAGE ================= */

export default function AdminSettings() {
  const { settings, loading, savingKey, updateSetting } = useSettings();
  if (loading || !settings) {
    return (
      <Box
        height="60vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress />
      </Box>
    );
  }

  /* ================= UPDATE SETTING ================= */
  //   async function updateSetting(path, value) {
  //     try {
  //       setSavingKey(path);

  //       await apiPost("/api/settings", {
  //         key: path,
  //         value,
  //       });

  //       // update local state
  //         setSettings((prev) => {
  //           if (!prev) return prev;

  //           const copy = structuredClone(prev);
  //           const parts = path.split(".");
  //           let obj = copy;

  //           for (let i = 0; i < parts.length - 1; i++) {
  //             if (!obj[parts[i]]) {
  //               obj[parts[i]] = {};
  //             }
  //             obj = obj[parts[i]];
  //           }

  //           obj[parts[parts.length - 1]] = value;
  //           return copy;
  //         });

  //       toast.success("Setting updated");
  //     } catch {
  //       toast.error("Update failed");
  //     } finally {
  //       setSavingKey("");
  //     }
  //   }

  if (!settings) {
    return (
      <Box
        height="60vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box maxWidth={900} mx="auto">
      <Typography variant="h5" fontWeight={700} mb={2}>
        Admin Settings
      </Typography>

      {/* ================= PRODUCT SETTINGS ================= */}
      <SettingsCard title="Product Settings">
        <SettingRow
          label="Enable Stock"
          checked={!!settings?.product_features?.enable_stock}
          loading={savingKey === "product_features.enable_stock"}
          onChange={(v) => updateSetting("product_features.enable_stock", v)}
        />

        <SettingRow
          label="Enable Vendor"
          checked={!!settings?.product_features?.enable_vendor}
          loading={savingKey === "product_features.enable_vendor"}
          onChange={(v) => updateSetting("product_features.enable_vendor", v)}
        />

        <SettingRow
          label="Enable Purchase Rate"
          checked={!!settings?.product_features?.enable_purchase_rate}
          loading={savingKey === "product_features.enable_purchase_rate"}
          onChange={(v) =>
            updateSetting("product_features.enable_purchase_rate", v)
          }
        />

        <SettingRow
          label="Enable Multiple Units"
          checked={!!settings?.product_features?.enable_multiple_units}
          loading={savingKey === "product_features.enable_multiple_units"}
          onChange={(v) =>
            updateSetting("product_features.enable_multiple_units", v)
          }
        />
      </SettingsCard>

      {/* ================= CUSTOMER FEATURES ================= */}
      <SettingsCard title="Customer Features">
        <SettingRow
          label="Enable Customer Login"
          checked={!!settings?.customer_features?.enable_customer_login}
          loading={savingKey === "customer_features.enable_customer_login"}
          onChange={(v) =>
            updateSetting("customer_features.enable_customer_login", v)
          }
        />

        <SettingRow
          label="Enable Coupons"
          checked={!!settings?.customer_features?.enable_coupons}
          loading={savingKey === "customer_features.enable_coupons"}
          onChange={(v) => updateSetting("customer_features.enable_coupons", v)}
        />

        <SettingRow
          label="Enable Customer Discount"
          checked={!!settings?.customer_features?.enable_customer_discount}
          loading={savingKey === "customer_features.enable_customer_discount"}
          onChange={(v) =>
            updateSetting("customer_features.enable_customer_discount", v)
          }
        />
      </SettingsCard>

      {/* ================= UI SETTINGS ================= */}
      <SettingsCard title="UI Settings">
        <SettingRow
          label="Show Out of Stock Products"
          checked={!!settings?.ui?.show_out_of_stock}
          loading={savingKey === "ui.show_out_of_stock"}
          onChange={(v) => updateSetting("ui.show_out_of_stock", v)}
        />

        <SettingRow
          label="Show Product Images"
          checked={!!settings?.ui?.show_product_images}
          loading={savingKey === "ui.show_product_images"}
          onChange={(v) => updateSetting("ui.show_product_images", v)}
        />
      </SettingsCard>
    </Box>
  );
}

/* ================= COMPONENTS ================= */

function SettingsCard({ title, children }) {
  return (
    <Card sx={{ p: 2.5, mb: 3 }}>
      <Typography fontWeight={700} mb={1.5}>
        {title}
      </Typography>
      <Divider sx={{ mb: 1.5 }} />
      <Stack spacing={1.5}>{children}</Stack>
    </Card>
  );
}

function SettingRow({ label, checked, onChange, loading }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography fontSize={14}>{label}</Typography>

      <Switch
        checked={checked}
        disabled={loading}
        onChange={(e) => {
          if (loading) return;
          onChange(e.target.checked);
        }}
      />
    </Stack>
  );
}
