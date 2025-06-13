"use client";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem("installPromptDismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
      return;
    }

    // Check if iOS
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check if already installed
    const isInstalled =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isInstalled);

    // For browsers that don't support beforeinstallprompt, show install instructions
    if (isIOSDevice || !isInstalled) {
      setCanInstall(true);
    }

    // Listen for beforeinstallprompt event (Chrome Android mainly)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      setIsInstalling(true);
      try {
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;

        if (outcome === "accepted") {
          setInstallPrompt(null);
          setCanInstall(false);
        }
      } catch (error) {
        // Silently handle errors
      } finally {
        setIsInstalling(false);
      }
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("installPromptDismissed", "true");
    setInstallPrompt(null);
  };

  // Don't show if already installed or dismissed
  if (isStandalone || isDismissed || !canInstall) {
    return null;
  }

  // Show compact install button for Chrome Android with beforeinstallprompt
  if (installPrompt) {
    return (
      <div className="fixed right-4 bottom-4 z-50">
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 pr-2 shadow-lg">
          <Download className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">Install App</span>
          <Button
            onClick={handleInstallClick}
            disabled={isInstalling}
            size="sm"
            className="h-6 px-2 text-xs"
          >
            {isInstalling ? "..." : "Add"}
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  // Show compact iOS instructions
  if (isIOS) {
    return (
      <div className="fixed right-4 bottom-4 z-50">
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 pr-2 shadow-lg">
          <Download className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">
            Tap <span className="font-mono">⎋</span> then "Add to Home Screen"
          </span>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  // For other browsers, show generic install hint
  return (
    <div className="fixed right-4 bottom-4 z-50">
      <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 pr-2 shadow-lg">
        <Download className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-gray-900">
          Add to home screen for better experience
        </span>
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-gray-100"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
