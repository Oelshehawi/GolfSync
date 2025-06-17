import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { BaggageClaim, Printer } from "lucide-react";
import type { TimeBlockWithMembers } from "~/app/types/TeeSheetTypes";
import { formatTimeStringTo12Hour } from "~/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Label } from "~/components/ui/label";

interface BagReportDialogProps {
  timeBlocks: TimeBlockWithMembers[];
}

export function BagReportDialog({ timeBlocks = [] }: BagReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showPrintView, setShowPrintView] = useState(false);
  const printViewRef = useRef<HTMLDivElement>(null);

  // Ensure timeBlocks is an array and sort by startTime
  const safeData = Array.isArray(timeBlocks)
    ? [...timeBlocks].sort((a, b) => a.startTime.localeCompare(b.startTime))
    : [];

  // Generate unique time options from timeblocks
  const timeOptions = [
    ...new Set(safeData.flatMap((block) => [block.startTime, block.endTime])),
  ]
    .sort()
    .map((time) => ({
      value: time,
      label: formatTimeStringTo12Hour(time),
    }));

  // Find all bag numbers within the selected time range
  const getBagNumbersInRange = () => {
    if (!startTime || !endTime) return [];

    // Filter timeblocks that fall within the selected range
    const blocksInRange = safeData.filter((block) => {
      return block.startTime >= startTime && block.startTime <= endTime;
    });

    // Extract bag numbers from all members in those blocks
    const bagNumbers = blocksInRange.flatMap((block) =>
      block.members
        .filter((member) => member.bagNumber) // Only include members with bag numbers
        .map((member) => member.bagNumber!),
    );

    // Sort alphabetically
    return bagNumbers.sort();
  };

  // Format bag numbers into two columns for printing
  const formatBagNumbersForPrinting = () => {
    const bagNumbers = getBagNumbersInRange();

    if (bagNumbers.length === 0) return [];

    // Calculate how many items go in each column (roughly half)
    const itemsPerColumn = Math.ceil(bagNumbers.length / 2);

    // Create two columns
    const column1 = bagNumbers.slice(0, itemsPerColumn);
    const column2 = bagNumbers.slice(itemsPerColumn);

    // Combine into rows
    return column1.map((bag, index) => ({
      left: bag,
      right: column2[index] || "", // Second column might have fewer items
    }));
  };

  // Handle printing
  const handlePrint = () => {
    if (!startTime || !endTime) {
      alert("Please select both start and end times");
      return;
    }

    // Show print view
    setShowPrintView(true);

    // Use setTimeout to ensure the print view is rendered
    setTimeout(() => {
      if (printViewRef.current) {
        // Create a new window for printing
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          alert("Please allow popups to print");
          setShowPrintView(false);
          return;
        }

        // Format bag numbers for thermal printer (TM-T88V)
        const bagNumbers = getBagNumbersInRange();
        const formattedBagReport = formatBagNumbersForPrinting()
          .map((row) => {
            // Use simple space-based padding like the header - left side gets enough spaces to reach position 16
            const leftSide = row.left || "";
            const rightSide = row.right || "";
            const spacesNeeded = Math.max(1, 16 - leftSide.length);
            const spaces = " ".repeat(spacesNeeded);
            return `${leftSide}${spaces}${rightSide}`;
          })
          .join("\n");

        // Write the print content to the new window
        printWindow.document.write(`
          <html>
            <head>
              <title>Bag Report</title>
              <style>
                @media print {
                  * {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                  }
                }
                body {
                  font-family: 'Courier New', monospace !important;
                  width: 3in;
                  margin: 0;
                  padding: 8px;
                  font-size: 12px;
                  line-height: 1.2;
                }
                pre {
                  font-family: 'Courier New', monospace !important;
                  font-size: 12px;
                  margin: 0;
                  white-space: pre;
                  letter-spacing: 0;
                }
              </style>
            </head>
            <body>
              <pre>Bag Report ${formatTimeStringTo12Hour(startTime)} - ${formatTimeStringTo12Hour(endTime)}
${"=".repeat(32)}
${formattedBagReport}</pre>
            </body>
          </html>
        `);

        // Print and close
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();

        setShowPrintView(false);
      }
    }, 500);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <BaggageClaim className="mr-2 h-4 w-4" />
            Bag Report
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bag Report</DialogTitle>
          </DialogHeader>

          {/* Print Controls */}
          <div className="mb-4 flex flex-col space-y-4 border-b pb-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="start-time">Start Time</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger id="start-time">
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-1">
              <Label htmlFor="end-time">End Time</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger id="end-time">
                  <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={handlePrint} disabled={!startTime || !endTime}>
                <Printer className="mr-2 h-4 w-4" />
                Print Bag Numbers
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <div className="space-y-4">
              {safeData.length === 0 ? (
                <p className="text-muted-foreground text-center">
                  No timeblocks available for this date.
                </p>
              ) : (
                safeData.map((block) => (
                  <div key={block.id} className="rounded-md border p-3">
                    <div className="mb-2 flex items-center justify-between border-b pb-2">
                      <span className="text-lg font-medium">
                        {formatTimeStringTo12Hour(block.startTime)}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {block.members.length}/4 bags
                      </span>
                    </div>

                    {block.members.length === 0 ? (
                      <p className="text-muted-foreground text-sm italic">
                        No bags assigned
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {block.members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between rounded bg-gray-50 px-2 py-1"
                          >
                            <span>
                              {member.firstName} {member.lastName} (
                              {member.memberNumber})
                            </span>
                            <span className="font-semibold">
                              Bag #{member.bagNumber || "N/A"}
                            </span>
                          </div>
                        ))}

                        {/* Show empty slots if not at capacity */}
                        {Array.from({
                          length: Math.max(0, 4 - block.members.length),
                        }).map((_, i) => (
                          <div
                            key={`empty-${i}`}
                            className="flex items-center justify-center rounded border border-dashed bg-gray-50 px-2 py-1 text-gray-400"
                          >
                            <span>Empty slot</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden print view reference */}
      <div ref={printViewRef} className="hidden" />
    </>
  );
}
