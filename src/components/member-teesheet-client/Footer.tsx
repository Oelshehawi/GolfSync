import React from "react";

interface FooterProps {
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

const defaultTheme = {
  primary: "#10b981",
  secondary: "#d1fae5",
  tertiary: "#f0fdfa",
};

export const Footer = ({ theme }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  const themeStyles = {
    ["--org-primary" as string]: theme?.primary || defaultTheme.primary,
    ["--org-secondary" as string]: theme?.secondary || defaultTheme.secondary,
    ["--org-tertiary" as string]: theme?.tertiary || defaultTheme.tertiary,
  } as React.CSSProperties;

  return (
    <footer
      className="bg-gray-100 p-4 text-center text-sm text-gray-600"
      style={themeStyles}
    >
      &copy; {currentYear} GolfSync. All rights reserved.
    </footer>
  );
};
