"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook that checks if a media query matches
 * Defaults to false when rendering on the server to avoid hydration mismatch
 */
export function useMediaQuery(query: string): boolean {
  // Default to false on the server to prevent hydration mismatch
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Create a MediaQueryList object
    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Define listener function to update state
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add event listener for changes
    mediaQuery.addEventListener("change", handleChange);

    // Clean up event listener on unmount
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}
