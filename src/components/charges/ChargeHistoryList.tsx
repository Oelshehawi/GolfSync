"use client";

import {
  useState,
  useCallback,
  useEffect,
  useTransition,
  useRef,
  useMemo,
} from "react";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { formatCalendarDate } from "~/lib/utils";
import {
  type PowerCartChargeWithRelations,
  type GeneralChargeWithRelations,
} from "~/app/types/ChargeTypes";
import { DateRangePicker } from "~/components/ui/date-range-picker";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { type DateRange } from "~/app/types/UITypes";
import { fetchFilteredCharges } from "~/server/charges/actions";
import { type ChargeFilters } from "~/server/charges/data";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { ManualChargeDialog } from "./ManualChargeDialog";
import { preserveDate } from "~/lib/utils";
import { useDebounce } from "use-debounce";

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
  const isInitialMount = useRef(true);
  const lastAppliedFilters = useRef<ChargeFilters | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [powerCartCharges, setPowerCartCharges] = useState(
    initialPowerCartCharges,
  );
  const [generalCharges, setGeneralCharges] = useState(initialGeneralCharges);
  const [pagination, setPagination] = useState(initialPagination);
  const [activeTab, setActiveTab] = useState<"power-cart" | "general">(
    searchParams.get("type") === "general" ? "general" : "power-cart",
  );

  // Initialize date range with timezone-safe dates
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    return {
      from: startDate
        ? preserveDate(startDate)
        : preserveDate(startOfMonth(new Date())),
      to: endDate
        ? preserveDate(endDate)
        : preserveDate(endOfMonth(new Date())),
    };
  });

  const [search, setSearch] = useState(searchParams.get("search") || "");

  // Update URL with proper space handling in createQueryString
  const createQueryString = useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          newSearchParams.delete(key);
        } else {
          // Preserve spaces in search parameter
          newSearchParams.set(key, String(value));
        }
      });

      return newSearchParams.toString();
    },
    [searchParams],
  );

  // Replace custom debounce with use-debounce
  const [debouncedSearch] = useDebounce(search, 300);

  // Memoize current filters with proper space handling
  const currentFilters: ChargeFilters = useMemo(
    () => ({
      startDate: dateRange.from
        ? formatCalendarDate(dateRange.from)
        : undefined,
      endDate: dateRange.to ? formatCalendarDate(dateRange.to) : undefined,
      search: debouncedSearch?.trim() || undefined,
      chargeType: activeTab,
      page: Number(searchParams.get("page")) || 1,
      pageSize: 10,
    }),
    [dateRange.from, dateRange.to, debouncedSearch, activeTab, searchParams],
  );

  // Memoize filter change check
  const haveFiltersChanged = useCallback((newFilters: ChargeFilters) => {
    if (!lastAppliedFilters.current) return true;

    const oldFilters = lastAppliedFilters.current;
    return (
      oldFilters.startDate !== newFilters.startDate ||
      oldFilters.endDate !== newFilters.endDate ||
      oldFilters.search !== newFilters.search ||
      oldFilters.chargeType !== newFilters.chargeType ||
      oldFilters.page !== newFilters.page
    );
  }, []);

  // Optimized filter change handler
  const handleFilterChange = useCallback(async () => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      lastAppliedFilters.current = currentFilters;
      return;
    }

    if (!haveFiltersChanged(currentFilters)) {
      return;
    }

    try {
      setIsFiltering(true);

      const result = await fetchFilteredCharges(currentFilters);

      // Batch state updates in a transition
      startTransition(() => {
        setPowerCartCharges(
          result.powerCartCharges as PowerCartChargeWithRelations[],
        );
        setGeneralCharges(
          result.generalCharges as GeneralChargeWithRelations[],
        );
        setPagination(result.pagination);

        // Update URL
        const queryString = createQueryString({
          startDate: dateRange.from ? formatCalendarDate(dateRange.from) : null,
          endDate: dateRange.to ? formatCalendarDate(dateRange.to) : null,
          search: debouncedSearch || null,
          type: activeTab,
          page: currentFilters.page || null,
        });

        router.push(`${pathname}?${queryString}`, { scroll: false });
      });

      lastAppliedFilters.current = currentFilters;
    } catch (error) {
      console.error("Error fetching filtered charges:", error);
      toast.error("Failed to fetch charges");
    } finally {
      setIsFiltering(false);
    }
  }, [
    currentFilters,
    dateRange,
    debouncedSearch,
    activeTab,
    pathname,
    router,
    haveFiltersChanged,
    createQueryString,
  ]);

  // Effect to handle filter changes with cleanup
  useEffect(() => {
    const abortController = new AbortController();
    void handleFilterChange();
    return () => {
      abortController.abort();
    };
  }, [handleFilterChange]);

  // Memoized render functions
  const renderName = useCallback(
    (
      charge: PowerCartChargeWithRelations | GeneralChargeWithRelations,
    ): React.ReactNode => {
      if (charge.member?.firstName && charge.member?.lastName) {
        return (
          <>
            {charge.member.firstName} {charge.member.lastName}
            {charge.member.memberNumber && (
              <>
                {" "}
                (<strong>{charge.member.memberNumber}</strong>)
              </>
            )}
          </>
        );
      }
      if (charge.guest?.firstName && charge.guest?.lastName) {
        return `${charge.guest.firstName} ${charge.guest.lastName} (Guest)`;
      }
      return "-";
    },
    [],
  );

  const renderSplitMember = useCallback(
    (
      member: {
        firstName: string | null;
        lastName: string | null;
        memberNumber: string | null;
      } | null,
    ): React.ReactNode => {
      if (member?.firstName && member?.lastName) {
        return (
          <>
            {member.firstName} {member.lastName}
            {member.memberNumber && (
              <>
                {" "}
                (<strong>{member.memberNumber}</strong>)
              </>
            )}
          </>
        );
      }
      return "-";
    },
    [],
  );

  // Memoize pagination handlers
  const handlePreviousPage = useCallback(() => {
    const newPage = pagination.currentPage - 1;
    router.push(`${pathname}?${createQueryString({ page: newPage })}`);
  }, [pagination.currentPage, router, pathname, createQueryString]);

  const handleNextPage = useCallback(() => {
    const newPage = pagination.currentPage + 1;
    router.push(`${pathname}?${createQueryString({ page: newPage })}`);
  }, [pagination.currentPage, router, pathname, createQueryString]);

  // Memoize tab change handler
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as typeof activeTab);
  }, []);

  return (
    <Card>
      <CardContent className="space-y-4">
        {/* Header with Add Charge Button */}
        <div className="flex items-center justify-between">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-0">
            <div className="space-y-1">
              <h3 className="text-2xl leading-none font-semibold tracking-tight">
                Charge History
              </h3>
              <p className="text-muted-foreground text-sm">
                View completed charges and payment history
              </p>
            </div>
          </CardHeader>
          <ManualChargeDialog onSuccess={handleFilterChange} />
        </div>

        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-2">
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
        </div>

        {/* Loading state */}
        {isFiltering && (
          <div className="flex justify-center py-8">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        )}

        {/* Results */}
        <div className={isFiltering ? "pointer-events-none opacity-50" : ""}>
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="power-cart">Power Cart Charges</TabsTrigger>
              <TabsTrigger value="general">General Charges</TabsTrigger>
            </TabsList>

            <TabsContent value="power-cart">
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
            </TabsContent>

            <TabsContent value="general">
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
                            ? renderSplitMember(charge.sponsorMember)
                            : "-"}
                        </TableCell>
                        <TableCell>{charge.staffInitials || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Showing {pagination.pageSize * (pagination.currentPage - 1) + 1}{" "}
              to{" "}
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
                onClick={handlePreviousPage}
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
                onClick={handleNextPage}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
