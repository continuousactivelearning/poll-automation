// AccessibilityContext.tsx

import { createContext, useContext, useState, useCallback, useMemo } from "react"; // FIXED: Removed unused useEffect
import type { ReactNode } from "react"; // FIXED: Changed to type-only import for ReactNode

type AccessibilitySettings = {
  highContrast: boolean;
  reducedMotion: boolean;
};

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
};

const AccessibilityContext = createContext<{
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
}>({
  settings: defaultSettings,
  updateSetting: () => {},
});

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => { // FIXED: Changed to ReactNode
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem("accessibilitySettings");
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem("accessibilitySettings", JSON.stringify(updated));
  }, [settings]);

  const contextValue = useMemo(() => ({
    settings,
    updateSetting,
  }), [settings, updateSetting]);

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => useContext(AccessibilityContext);
