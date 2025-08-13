import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react'; // FIXED: Changed to type-only import for ReactNode

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  accentColor: 'primary' | 'secondary' | 'accent';
  setAccentColor: (color: 'primary' | 'secondary' | 'accent') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [accentColor, setAccentColor] = useState<'primary' | 'secondary' | 'accent'>('primary');

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prevMode => !prevMode);
  }, []);

  const contextValue = useMemo(() => ({
    isDarkMode,
    toggleDarkMode,
    accentColor,
    setAccentColor,
  }), [isDarkMode, toggleDarkMode, accentColor, setAccentColor]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
