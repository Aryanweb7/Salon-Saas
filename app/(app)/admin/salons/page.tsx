import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { listSalons } from "@/lib/db/salons";

export default async function AdminSalonsPage() {
  const salons = await listSalons();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Client Management
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
            All Salons
          </h1>
          <p className="mt-2 text-gray-400">
            Searchable platform client list with renewal and usage visibility.
          </p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search salons..."
              className="pl-10"
            />
          </div>
          <Input placeholder="Filter by plan..." />
          <Input placeholder="Filter by status..." />
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-x-auto">
        <Table>
          <THead>
            <TR>
              <TH>Salon Name</TH>
              <TH>Owner</TH>
              <TH>City</TH>
              <TH>Plan</TH>
              <TH>Status</TH>
              <TH>Renewal Date</TH>
              <TH>Last Login</TH>
              <TH>Usage Score</TH>
            </TR>
          </THead>
          <TBody>
            {salons.map((salon) => (
              <TR key={salon.id} className="hover:bg-gray-900/50">
                <TD className="font-semibold text-white">{salon.name}</TD>
                <TD className="text-gray-400">{salon.owner}</TD>
                <TD className="text-gray-400">{salon.city}</TD>
                <TD>
                  <Badge tone="default">{salon.plan}</Badge>
                </TD>
                <TD>
                  <Badge
                    tone={
                      salon.status === "active"
                        ? "success"
                        : salon.status === "overdue"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {salon.status}
                  </Badge>
                </TD>
                <TD className="text-sm text-gray-400">{salon.renewalDate}</TD>
                <TD className="text-sm text-gray-400">{salon.lastLogin}</TD>
                <TD>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-16 rounded-full bg-gray-700">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: "75%" }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-300">75%</span>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      {/* Summary Footer */}
      <Card className="bg-gray-900/30 backdrop-blur">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-gray-400">Total Salons</p>
            <p className="mt-1 text-2xl font-bold text-white">{salons.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Active</p>
            <p className="mt-1 text-2xl font-bold text-green-400">
              {salons.filter((s) => s.status === "active").length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">At Risk</p>
            <p className="mt-1 text-2xl font-bold text-yellow-400">
              {salons.filter((s) => s.status === "trial").length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Overdue</p>
            <p className="mt-1 text-2xl font-bold text-red-400">
              {salons.filter((s) => s.status === "overdue").length}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
