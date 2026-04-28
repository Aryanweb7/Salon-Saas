"use client";

import { useState } from "react";
import { createVisitAction, type VisitFormData } from "@/app/actions/visits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  birthday?: string;
  gender?: string;
  lastVisit?: string;
  preferredStylist?: string;
}

interface VisitFormProps {
  customers: Customer[];
  onSuccess?: () => void;
}

const SERVICES = ["Haircut", "Facial"];

export function VisitForm({ customers, onSuccess }: VisitFormProps) {
  const [formData, setFormData] = useState<VisitFormData>({
    customerId: "",
    services: [],
    amount: "",
    visitedAt: new Date().toISOString().split("T")[0],
    staffId: "",
    paymentMethod: "",
    notes: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceChange = (service: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      services: checked
        ? [...prev.services, service]
        : prev.services.filter((s) => s !== service),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.customerId) {
      toast.error("Please select a customer");
      return;
    }

    if (formData.services.length === 0) {
      toast.error("Please select at least one service");
      return;
    }

    if (!formData.amount) {
      toast.error("Please enter an amount");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createVisitAction(formData);

      if (result.success) {
        toast.success("Visit recorded successfully");
        setFormData({
          customerId: "",
          services: [],
          amount: "",
          visitedAt: new Date().toISOString().split("T")[0],
          staffId: "",
          paymentMethod: "",
          notes: "",
        });
        onSuccess?.();
      } else {
        toast.error(result.error || "Something went wrong");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customerId">Customer *</Label>
          <Select value={formData.customerId} onValueChange={(value) => handleSelectChange("customerId", value)}>
            <SelectTrigger id="customerId">
              <SelectValue placeholder="Select a customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name} {customer.phone && `(${customer.phone})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="visitedAt">Date *</Label>
          <Input
            id="visitedAt"
            name="visitedAt"
            type="date"
            value={formData.visitedAt}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (₹) *</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select value={formData.paymentMethod} onValueChange={(value) => handleSelectChange("paymentMethod", value)}>
            <SelectTrigger id="paymentMethod">
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Card">Card</SelectItem>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="Check">Check</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Services *</Label>
        <div className="space-y-2">
          {SERVICES.map((service) => (
            <div key={service} className="flex items-center space-x-2">
              <Checkbox
                id={service}
                checked={formData.services.includes(service)}
                onCheckedChange={(checked) => handleServiceChange(service, !!checked)}
              />
              <Label htmlFor={service} className="font-normal cursor-pointer">
                {service}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Add notes about this visit..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Record Visit"}
        </Button>
      </div>
    </form>
  );
}
