import { getOrganizationTheme } from "~/server/config/data";
import { ThemeProvider } from "./ThemeProvider";

interface ServerThemeProviderProps {
  children: React.ReactNode;
}

export async function ServerThemeProvider({
  children,
}: ServerThemeProviderProps) {
  // Fetch the organization theme from the server
  try {
    const orgTheme = await getOrganizationTheme();

    // Pass the theme to the client ThemeProvider
    return <ThemeProvider initialTheme={orgTheme}>{children}</ThemeProvider>;
  } catch (error) {
    console.error("Error fetching organization theme:", error);
    // If there's an error or no theme is available, use the default theme
    return <ThemeProvider>{children}</ThemeProvider>;
  }
}
