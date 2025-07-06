import { useState } from "react";
import { type RestrictionViolation } from "~/app/types/RestrictionTypes";

export function useRestrictionHandling() {
  const [violations, setViolations] = useState<RestrictionViolation[]>([]);
  const [showRestrictionAlert, setShowRestrictionAlert] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    (() => Promise<void>) | null
  >(null);

  const handleOverrideContinue = async () => {
    if (pendingAction) {
      await pendingAction();
      setPendingAction(null);
    }
    setShowRestrictionAlert(false);
  };

  const handleRestrictionCancel = () => {
    setPendingAction(null);
    setShowRestrictionAlert(false);
  };

  const handleRestrictionViolation = (violations: RestrictionViolation[]) => {
    if (violations.length > 0) {
      setViolations(violations);
      setShowRestrictionAlert(true);
    }
  };

  return {
    violations,
    showRestrictionAlert,
    setShowRestrictionAlert,
    pendingAction,
    setPendingAction,
    handleOverrideContinue,
    handleRestrictionCancel,
    handleRestrictionViolation,
  };
}
