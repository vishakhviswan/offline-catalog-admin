import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiGet, apiPost } from "../api/api";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");

  /* ===== LOAD SETTINGS ONCE ===== */
  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const data = await apiGet("/api/settings");
      setSettings(data);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  /* ===== UPDATE SETTING ===== */
  async function updateSetting(path, value) {
    try {
      setSavingKey(path);

      await apiPost("/api/settings", {
        key: path,
        value,
      });

      // SAFE local update
      setSettings((prev) => {
        if (!prev) return prev;

        const copy = structuredClone(prev);
        const parts = path.split(".");
        let obj = copy;

        for (let i = 0; i < parts.length - 1; i++) {
          if (!obj[parts[i]]) obj[parts[i]] = {};
          obj = obj[parts[i]];
        }

        obj[parts[parts.length - 1]] = value;
        return copy;
      });
    } catch {
      toast.error("Update failed");
    } finally {
      setSavingKey("");
    }
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        savingKey,
        reloadSettings: loadSettings,
        updateSetting,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

/* ===== CUSTOM HOOK ===== */
export function useSettings() {
  return useContext(SettingsContext);
}
