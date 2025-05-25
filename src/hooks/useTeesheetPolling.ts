import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Poll interval in milliseconds
const POLL_INTERVAL = 60000;

export function useTeesheetPolling(isAdmin: boolean) {
  const router = useRouter();

  useEffect(() => {
    // Only poll if this is the admin view
    if (!isAdmin) return;

    // Set up polling interval
    const interval = setInterval(() => {
      router.refresh();
    }, POLL_INTERVAL);

    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [router, isAdmin]);
}
