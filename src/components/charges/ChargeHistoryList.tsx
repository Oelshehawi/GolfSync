"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { formatCalendarDate } from "~/lib/utils";
import {
  type PowerCartChargeWithRelations,
  type GeneralChargeWithRelations,
} from "~/app/types/ChargeTypes";
import { DateRangePicker } from "~/components/ui/date-range-picker";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Label } from "~/components/ui/label";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { addDays, format } from "date-fns";
import { type DateRange } from "~/app/types/UITypes";
import { fetchFilteredCharges } from "~/server/charges/actions";
import { type ChargeFilters } from "~/server/charges/data";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

interface ChargeHistoryListProps {
  initialPowerCartCharges: PowerCartChargeWithRelations[];
  initialGeneralCharges: GeneralChargeWithRelations[];
  initialPagination: {
    total: number;
    pageSize: number;
    currentPage: number;
  };
}

export function ChargeHistoryList({
  initialPowerCartCharges,
  initialGeneralCharges,
  initialPagination,
}: ChargeHistoryListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();
  const [powerCartCharges, setPowerCartCharges] = useState(
    initialPowerCartCharges,
  );
  const [generalCharges, setGeneralCharges] = useState(initialGeneralCharges);
  const [pagination, setPagination] = useState(initialPagination);

  const [dateRange, setDateRange] = useState<DateRange>({
    from: searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : addDays(new Date(), -30),
    to: searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : new Date(),
  });
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [chargeType, setChargeType] = useState(
    searchParams.get("type") || "all",
  );

  // Create URL search params
  const createQueryString = useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      });

      return newSearchParams.toString();
    },
    [searchParams],
  );

  // Debounced search function
  const debouncedSearch = useDebounce(search, 300);

  // Handle filter changes
  const handleFilterChange = useCallback(async () => {
    try {
      const filters: ChargeFilters = {
        startDate: dateRange.from
          ? format(dateRange.from, "yyyy-MM-dd")
          : undefined,
        endDate: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        search: debouncedSearch || undefined,
        chargeType: chargeType === "all" ? undefined : chargeType,
        page: Number(searchParams.get("page")) || 1,
        pageSize: 10,
      };

      const result = await fetchFilteredCharges(filters);

      startTransition(() => {
        setPowerCartCharges(result.powerCartCharges);
        setGeneralCharges(result.generalCharges);
        setPagination(result.pagination);

        // Update URL with formatted dates
        const queryString = createQueryString({
          startDate: dateRange.from
            ? format(dateRange.from, "yyyy-MM-dd")
            : null,
          endDate: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : null,
          search: debouncedSearch || null,
          type: chargeType === "all" ? null : chargeType,
          page: filters.page || null,
        });

        router.push(`${pathname}?${queryString}`, { scroll: false });
      });
    } catch (error) {
      console.error("Error fetching filtered charges:", error);
      toast.error("Failed to fetch charges");
    }
  }, [
    dateRange,
    debouncedSearch,
    chargeType,
    searchParams,
    pathname,
    router,
    createQueryString,
  ]);

  // Effect to handle filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleFilterChange();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [handleFilterChange]);

  const renderName = (
    charge: PowerCartChargeWithRelations | GeneralChargeWithRelations,
  ) => {
    if (charge.member?.firstName && charge.member?.lastName) {
      return `${charge.member.firstName} ${charge.member.lastName}`;
    }
    if (charge.guest?.firstName && charge.guest?.lastName) {
      return `${charge.guest.firstName} ${charge.guest.lastName} (Guest)`;
    }
    return "-";
  };

  const renderSplitMember = (
    member: {
      firstName: string | null;
      lastName: string | null;
    } | null,
  ) => {
    if (member?.firstName && member?.lastName) {
      return `${member.firstName} ${member.lastName}`;
    }
    return "-";
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="w-full">
          <Label>Date Range</Label>
          <div className="h-10">
            <DateRangePicker
              dateRange={dateRange}
              setDateRange={setDateRange}
              className="h-full [&>button]:h-full [&>button]:w-full [&>button]:justify-start"
            />
          </div>
        </div>
        <div>
          <Label>Search</Label>
          <Input
            placeholder="Search charges..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10"
          />
        </div>
        <div>
          <Label>Charge Type</Label>
          <Select value={chargeType} onValueChange={setChargeType}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="power-cart">Power Cart</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading state */}
      {isPending && (
        <div className="flex justify-center py-8">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      )}

      {/* Results */}
      <div className={isPending ? "pointer-events-none opacity-50" : ""}>
        {/* Power Cart Charges */}
        {(chargeType === "all" || chargeType === "power-cart") && (
          <div>
            <h3 className="mb-4 text-lg font-medium">Power Cart Charges</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Split With</TableHead>
                  <TableHead>Medical</TableHead>
                  <TableHead>Staff</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {powerCartCharges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No power cart charges found
                    </TableCell>
                  </TableRow>
                ) : (
                  powerCartCharges.map((charge) => (
                    <TableRow key={charge.id}>
                      <TableCell>{formatCalendarDate(charge.date)}</TableCell>
                      <TableCell>{renderName(charge)}</TableCell>
                      <TableCell>
                        {renderSplitMember(charge.splitWithMember)}
                      </TableCell>
                      <TableCell>{charge.isMedical ? "Yes" : "No"}</TableCell>
                      <TableCell>{charge.staffInitials || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* General Charges */}
        {(chargeType === "all" || chargeType === "general") && (
          <div>
            <h3 className="mb-4 text-lg font-medium">General Charges</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Sponsor</TableHead>
                  <TableHead>Staff</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generalCharges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No general charges found
                    </TableCell>
                  </TableRow>
                ) : (
                  generalCharges.map((charge) => (
                    <TableRow key={charge.id}>
                      <TableCell>{formatCalendarDate(charge.date)}</TableCell>
                      <TableCell>{renderName(charge)}</TableCell>
                      <TableCell>{charge.chargeType}</TableCell>
                      <TableCell>{charge.paymentMethod || "-"}</TableCell>
                      <TableCell>
                        {charge.sponsorMember
                          ? `${charge.sponsorMember.firstName} ${charge.sponsorMember.lastName}`
                          : "-"}
                      </TableCell>
                      <TableCell>{charge.staffInitials || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Showing {pagination.pageSize * (pagination.currentPage - 1) + 1} to{" "}
            {Math.min(
              pagination.pageSize * pagination.currentPage,
              pagination.total,
            )}{" "}
            of {pagination.total} results
          </p>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage === 1}
              onClick={() => {
                const newPage = pagination.currentPage - 1;
                router.push(
                  `${pathname}?${createQueryString({ page: newPage })}`,
                );
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={
                pagination.currentPage >=
                Math.ceil(pagination.total / pagination.pageSize)
              }
              onClick={() => {
                const newPage = pagination.currentPage + 1;
                router.push(
                  `${pathname}?${createQueryString({ page: newPage })}`,
                );
              }}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
