"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { ChargeHistoryList } from "./ChargeHistoryList";
import { isWithinInterval, parseISO } from "date-fns";
import {
  type PowerCartChargeWithRelations,
  type GeneralChargeWithRelations,
} from "~/app/types/ChargeTypes";

interface ChargeHistoryTabProps {
  initialPowerCartCharges: PowerCartChargeWithRelations[];
  initialGeneralCharges: GeneralChargeWithRelations[];
  initialPagination: {
    total: number;
    pageSize: number;
    currentPage: number;
  };
}

export function ChargeHistoryTab({
  initialPowerCartCharges,
  initialGeneralCharges,
  initialPagination,
}: ChargeHistoryTabProps) {
  const [powerCartCharges, setPowerCartCharges] = useState(
    initialPowerCartCharges,
  );
  const [generalCharges, setGeneralCharges] = useState(initialGeneralCharges);

  const handleFilter = (filters: {
    startDate?: Date;
    endDate?: Date;
    search?: string;
    chargeType?: string;
  }) => {
    // Filter power cart charges
    const filteredPowerCart = initialPowerCartCharges.filter((charge) => {
      let shouldInclude = true;

      // Date range filter
      if (filters.startDate && filters.endDate && charge.date) {
        try {
          const chargeDate = parseISO(charge.date);
          shouldInclude = isWithinInterval(chargeDate, {
            start: filters.startDate,
            end: filters.endDate,
          });
        } catch (error) {
          console.error("Error parsing date:", error);
          shouldInclude = false;
        }
      }

      // Name search filter
      if (shouldInclude && filters.search) {
        const searchLower = filters.search.toLowerCase();
        const memberName = charge.member
          ? `${charge.member.firstName} ${charge.member.lastName}`.toLowerCase()
          : "";
        const guestName = charge.guest
          ? `${charge.guest.firstName} ${charge.guest.lastName}`.toLowerCase()
          : "";

        shouldInclude =
          memberName.includes(searchLower) || guestName.includes(searchLower);
      }

      // Only show power cart charges when type filter is power-cart or all
      if (shouldInclude && filters.chargeType && filters.chargeType !== "all") {
        shouldInclude = filters.chargeType === "power-cart";
      }

      return shouldInclude;
    });

    // Filter general charges
    const filteredGeneral = initialGeneralCharges.filter((charge) => {
      let shouldInclude = true;

      // Date range filter
      if (filters.startDate && filters.endDate && charge.date) {
        try {
          const chargeDate = parseISO(charge.date);
          shouldInclude = isWithinInterval(chargeDate, {
            start: filters.startDate,
            end: filters.endDate,
          });
        } catch (error) {
          console.error("Error parsing date:", error);
          shouldInclude = false;
        }
      }

      // Charge type filter
      if (shouldInclude && filters.chargeType && filters.chargeType !== "all") {
        shouldInclude = filters.chargeType === charge.chargeType;
      }

      // Name search filter
      if (shouldInclude && filters.search) {
        const searchLower = filters.search.toLowerCase();
        const memberName = charge.member
          ? `${charge.member.firstName} ${charge.member.lastName}`.toLowerCase()
          : "";
        const guestName = charge.guest
          ? `${charge.guest.firstName} ${charge.guest.lastName}`.toLowerCase()
          : "";

        shouldInclude =
          memberName.includes(searchLower) || guestName.includes(searchLower);
      }

      return shouldInclude;
    });

    setPowerCartCharges(filteredPowerCart);
    setGeneralCharges(filteredGeneral);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <h3 className="text-2xl leading-none font-semibold tracking-tight">
            Charge History
          </h3>
          <p className="text-muted-foreground text-sm">
            View completed charges and payment history
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <ChargeHistoryList
          initialPowerCartCharges={initialPowerCartCharges}
          initialGeneralCharges={initialGeneralCharges}
          initialPagination={initialPagination}
        />
      </CardContent>
    </Card>
  );
}
