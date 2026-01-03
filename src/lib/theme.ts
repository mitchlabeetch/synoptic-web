// src/lib/theme.ts
// PURPOSE: Dark mode theme management utilities
// ACTION: Provides consistent theme switching with localStorage persistence
// MECHANISM: Reads/writes to localStorage and syncs with document class

const STORAGE_KEY = 'synoptic-theme';
type Theme = 'light' | 'dark' | 'system';

/**
 * Get the current theme preference
 */
export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem(STORAGE_KEY) as Theme) || 'system';
}

/**
 * Check if dark mode is currently active
 */
export function isDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

/**
 * Set the theme preference and apply it
 */
export function setTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;

  // Store preference
  if (theme === 'system') {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, theme);
  }

  // Apply the theme
  applyTheme(theme);
}

/**
 * Apply a theme without changing the stored preference
 */
export function applyTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;

  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldBeDark = theme === 'dark' || (theme === 'system' && systemDark);

  if (shouldBeDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

/**
 * Toggle between light and dark (ignores system)
 */
export function toggleTheme(): Theme {
  const current = isDarkMode();
  const newTheme: Theme = current ? 'light' : 'dark';
  setTheme(newTheme);
  return newTheme;
}

/**
 * Initialize theme from storage/system preference
 * This should be called on app mount (already done via inline script in layout)
 */
export function initializeTheme(): void {
  if (typeof window === 'undefined') return;
  
  const stored = getTheme();
  applyTheme(stored);

  // Listen for system preference changes when in "system" mode
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = () => {
    if (getTheme() === 'system') {
      applyTheme('system');
    }
  };

  mediaQuery.addEventListener('change', handleChange);
}

/**
 * React hook for theme management
 */
export function useTheme() {
  if (typeof window === 'undefined') {
    return {
      theme: 'system' as Theme,
      isDark: false,
      setTheme: () => {},
      toggleTheme: () => 'light' as Theme,
    };
  }

  return {
    theme: getTheme(),
    isDark: isDarkMode(),
    setTheme,
    toggleTheme,
  };
}
