import { useState } from "react";
import { RestrictionViolation } from "~/app/types/RestrictionTypes";
import { RestrictionViolationAlert } from "~/components/settings/timeblock-restrictions/RestrictionViolationAlert";

interface RestrictionViolationHandlerProps {
  children: (handlers: {
    handleRestrictionViolations: (violations: RestrictionViolation[]) => void;
    setPendingAction: React.Dispatch<
      React.SetStateAction<(() => Promise<void>) | null>
    >;
    violations: RestrictionViolation[];
    showRestrictionAlert: boolean;
    setShowRestrictionAlert: (show: boolean) => void;
    pendingAction: (() => Promise<void>) | null;
    handleOverrideContinue: () => Promise<void>;
    handleRestrictionCancel: () => void;
  }) => React.ReactNode;
}

export function RestrictionViolationHandler({
  children,
}: RestrictionViolationHandlerProps) {
  const [violations, setViolations] = useState<RestrictionViolation[]>([]);
  const [showRestrictionAlert, setShowRestrictionAlert] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    (() => Promise<void>) | null
  >(null);

  // Handle restriction alerts for admins
  const handleRestrictionViolations = (violations: RestrictionViolation[]) => {
    if (violations.length > 0) {
      setViolations(violations);
      setShowRestrictionAlert(true);
    }
  };

  // Handle admin override continuation
  const handleOverrideContinue = async () => {
    if (pendingAction) {
      await pendingAction();
      setPendingAction(null);
    }
    setShowRestrictionAlert(false);
  };

  // Handle cancellation of restriction alert
  const handleRestrictionCancel = () => {
    setPendingAction(null);
    setShowRestrictionAlert(false);
  };

  return (
    <>
      {children({
        handleRestrictionViolations,
        setPendingAction,
        violations,
        showRestrictionAlert,
        setShowRestrictionAlert,
        pendingAction,
        handleOverrideContinue,
        handleRestrictionCancel,
      })}

      <RestrictionViolationAlert
        open={showRestrictionAlert}
        onOpenChange={setShowRestrictionAlert}
        violations={violations}
        onCancel={handleRestrictionCancel}
        onContinue={handleOverrideContinue}
      />
    </>
  );
}
