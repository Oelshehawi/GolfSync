"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { DatePicker } from "~/components/ui/date-picker";
import { getTimeblockOverrides } from "~/server/timeblock-restrictions/data";
import { format } from "date-fns";
import { Search } from "lucide-react";
import toast from "react-hot-toast";

export type TimeblockOverrideWithRelations = {
  id: number;
  restrictionId: number;
  timeBlockId: number | null;
  memberId: number | null;
  guestId: number | null;
  overriddenBy: string;
  reason: string | null;
  createdAt: Date;
  restriction: {
    id: number;
    name: string;
    restrictionCategory: "MEMBER_CLASS" | "GUEST" | "COURSE_AVAILABILITY";
  };
  timeBlock?: {
    id: number;
    startTime: string;
    date: string;
  } | null;
  member?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  guest?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
};

interface OverridesSettingsProps {
  initialOverrides: TimeblockOverrideWithRelations[];
}

export function OverridesSettings({
  initialOverrides,
}: OverridesSettingsProps) {
  const [overrides, setOverrides] = useState<TimeblockOverrideWithRelations[]>(
    initialOverrides || [],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Search function
  const performSearch = async () => {
    setIsLoading(true);
    try {
      const result = await getTimeblockOverrides({
        searchTerm: searchTerm.trim() !== "" ? searchTerm : undefined,
        startDate,
        endDate,
      });

      if ("error" in result) {
        toast.error(result.error);
      } else {
        setOverrides(result as TimeblockOverrideWithRelations[]);
      }
    } catch (error) {
      console.error("Error searching overrides:", error);
      toast.error("Failed to search overrides");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger search when any filter changes
  useEffect(() => {
    // Add a small delay to prevent too many requests when typing
    const delaySearch = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchTerm, startDate, endDate]);

  const getCategoryDisplayName = (
    category: "MEMBER_CLASS" | "GUEST" | "COURSE_AVAILABILITY",
  ) => {
    switch (category) {
      case "MEMBER_CLASS":
        return "Member Class";
      case "GUEST":
        return "Guest";
      case "COURSE_AVAILABILITY":
        return "Course Availability";
      default:
        return category;
    }
  };

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Override Records</CardTitle>
        <CardDescription>
          Search and filter restriction override reasons
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pb-6">
        {/* Search and Filter Controls */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="search">Search Reason</Label>
            <div className="relative">
              <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="search"
                placeholder="Search override reasons..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <DatePicker
              date={startDate}
              setDate={setStartDate}
              placeholder="From date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <DatePicker
              date={endDate}
              setDate={setEndDate}
              placeholder="To date"
            />
          </div>
        </div>

        {/* Results Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Restriction</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Person</TableHead>
                <TableHead>Time Block</TableHead>
                <TableHead className="w-1/3">Override Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground h-24 text-center"
                  >
                    Searching...
                  </TableCell>
                </TableRow>
              ) : overrides.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground h-24 text-center"
                  >
                    No override records found
                  </TableCell>
                </TableRow>
              ) : (
                overrides.map((override) => (
                  <TableRow key={override.id}>
                    <TableCell>
                      {format(new Date(override.createdAt), "PPP p")}
                    </TableCell>
                    <TableCell>{override.restriction.name}</TableCell>
                    <TableCell>
                      {getCategoryDisplayName(
                        override.restriction.restrictionCategory,
                      )}
                    </TableCell>
                    <TableCell>
                      {override.member
                        ? `${override.member.firstName} ${override.member.lastName}`
                        : override.guest
                          ? `${override.guest.firstName} ${override.guest.lastName} (Guest)`
                          : "N/A"}
                    </TableCell>
                    <TableCell>
                      {override.timeBlock
                        ? `${format(
                            new Date(override.timeBlock.date),
                            "MMM d",
                          )} at ${override.timeBlock.startTime}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {override.reason || "No reason provided"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
