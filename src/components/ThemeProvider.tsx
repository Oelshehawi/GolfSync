"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getOrganizationColors } from "~/lib/utils";

// Define theme context type
type ThemeContextType = {
  theme: {
    primary: string;
    secondary: string;
    tertiary: string;
    text: {
      primary: string;
      secondary: string;
    };
    background: {
      primary: string;
      secondary: string;
    };
  };
};

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: {
    primary: "#000000",
    secondary: "#f3f4f6",
    tertiary: "#9ca3af",
    text: {
      primary: "#000000",
      secondary: "#4B5563",
    },
    background: {
      primary: "#FFFFFF",
      secondary: "#f3f4f6",
    },
  },
});

// Hook to use theme context
export const useTheme = () => useContext(ThemeContext);

export interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  // Get organization colors using the utility function
  const theme = getOrganizationColors(initialTheme);

  // Apply CSS variables to document root on component mount
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty(
        "--org-primary",
        theme.primary,
      );
      document.documentElement.style.setProperty(
        "--org-secondary",
        theme.secondary,
      );
      document.documentElement.style.setProperty(
        "--org-tertiary",
        theme.tertiary,
      );
      document.documentElement.style.setProperty(
        "--org-background-primary",
        theme.background.primary,
      );
      document.documentElement.style.setProperty(
        "--org-border-primary",
        theme.primary,
      );
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>
  );
}
