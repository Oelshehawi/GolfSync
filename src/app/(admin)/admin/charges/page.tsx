import { type Metadata } from "next";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { PageHeader } from "~/components/ui/page-header";
import { PendingChargesList } from "~/components/charges/PendingChargesList";
import { ChargeHistoryList } from "~/components/charges/ChargeHistoryList";
import {
  getPendingPowerCartCharges,
  getPendingGeneralCharges,
  getFilteredCharges,
} from "~/server/charges/data";
import { addDays, format } from "date-fns";
import { getBCToday } from "~/lib/dates";

export const metadata: Metadata = {
  title: "Charges Dashboard",
};

interface PageProps {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    search?: string;
    type?: string;
    page?: string;
  }>;
}

export default async function ChargesDashboard({ searchParams }: PageProps) {
  // Await search params
  const params = await searchParams;

  const today = getBCToday();
  const thirtyDaysAgo = addDays(today, -30);

  // Parse search params
  const filters = {
    startDate: params.startDate || format(thirtyDaysAgo, "yyyy-MM-dd"),
    endDate: params.endDate || format(today, "yyyy-MM-dd"),
    search: params.search,
    chargeType: params.type,
    page: params.page ? parseInt(params.page) : 1,
    pageSize: 10,
  };

  // Fetch data
  const [powerCartCharges, generalCharges, chargeHistory] = await Promise.all([
    getPendingPowerCartCharges(),
    getPendingGeneralCharges(),
    getFilteredCharges(filters),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Charges Dashboard"
        description="Manage power cart and general charges"
      />

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Charges</TabsTrigger>
          <TabsTrigger value="history">Charge History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <h3 className="text-2xl leading-none font-semibold tracking-tight">
                  Pending Charges
                </h3>
                <p className="text-muted-foreground text-sm">
                  View and manage all pending charges
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <PendingChargesList
                powerCartCharges={powerCartCharges}
                generalCharges={generalCharges}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <ChargeHistoryList
            initialPowerCartCharges={chargeHistory.powerCartCharges}
            initialGeneralCharges={chargeHistory.generalCharges}
            initialPagination={chargeHistory.pagination}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
