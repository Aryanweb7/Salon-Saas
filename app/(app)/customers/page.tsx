"use client";

import { useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { useCallback, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { CustomerModal } from "@/components/customer-modal";
import { deleteCustomerAction } from "@/app/actions/customers";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  phone: string;
  birthday: string;
  gender: string;
  lastVisit: string;
  preferredStylist: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await fetch("/api/customers");
        const data = await response.json();
        setCustomers(data);
        setFilteredCustomers(data);
      } catch (error) {
        toast.error("Failed to load customers");
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomers();
  }, []);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(query.toLowerCase()) ||
          customer.phone.includes(query)
      );
      setFilteredCustomers(filtered);
    },
    [customers]
  );

  const handleDelete = async (customerId: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) {
      return;
    }

    setIsDeleting(customerId);
    try {
      const result = await deleteCustomerAction(customerId);
      if (result.success) {
        setCustomers((prev) => prev.filter((c) => c.id !== customerId));
        setFilteredCustomers((prev) => prev.filter((c) => c.id !== customerId));
        toast.success("Customer deleted");
      } else {
        toast.error(result.error || "Failed to delete customer");
      }
    } catch {
      toast.error("Failed to delete customer");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCustomerAdded = async () => {
    try {
      const response = await fetch("/api/customers");
      const data = await response.json();
      setCustomers(data);
      setFilteredCustomers(data);
      toast.success("Customer added successfully");
    } catch {
      toast.error("Failed to refresh customers");
    }
  };

  const handleCustomerUpdated = async () => {
    try {
      const response = await fetch("/api/customers");
      const data = await response.json();
      setCustomers(data);
      setFilteredCustomers(data);
      toast.success("Customer updated successfully");
    } catch {
      toast.error("Failed to refresh customers");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-4xl font-semibold">Customer CRM</h1>
          <p className="mt-2 text-[var(--muted-foreground)]">Search, filter, and retain every guest with visit context and automation triggers.</p>
        </div>
        <CustomerModal
          trigger={<Button>Add Customer</Button>}
          title="Add New Customer"
          description="Create a new customer profile"
        />
      </div>
      <Card>
        <div className="mb-5 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-[var(--muted-foreground)]" />
            <Input
              className="pl-10"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
        <CardTitle>Customer list</CardTitle>
        <CardDescription className="mb-4">
          {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? "s" : ""}
        </CardDescription>
        <div className="overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Phone</TH>
                <TH>Birthday</TH>
                <TH>Gender</TH>
                <TH>Last visit</TH>
                <TH>Preferred stylist</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {isLoading ? (
                <TR>
                  <TD colSpan={7} className="text-center py-4">
                    Loading customers...
                  </TD>
                </TR>
              ) : filteredCustomers.length === 0 ? (
                <TR>
                  <TD colSpan={7} className="text-center py-4">
                    No customers found
                  </TD>
                </TR>
              ) : (
                filteredCustomers.map((customer) => (
                  <TR key={customer.id}>
                    <TD className="font-medium">{customer.name}</TD>
                    <TD>{customer.phone}</TD>
                    <TD>{customer.birthday}</TD>
                    <TD>
                      <Badge>{customer.gender}</Badge>
                    </TD>
                    <TD>{customer.lastVisit}</TD>
                    <TD>{customer.preferredStylist}</TD>
                    <TD className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <CustomerModal
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              Edit
                            </Button>
                          }
                          customerId={customer.id}
                          initialData={{
                            name: customer.name,
                            phone: customer.phone,
                            birthday: customer.birthday,
                            gender: customer.gender,
                          }}
                          title="Edit Customer"
                          description="Update customer information"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(customer.id)}
                          disabled={isDeleting === customer.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
