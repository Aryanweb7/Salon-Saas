import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listSupportTickets } from "@/lib/db/support";
import { AlertCircle, Clock, MessageCircle } from "lucide-react";

export default async function AdminSupportPage() {
  const tickets = await listSupportTickets();

  // Group tickets by priority
  const highPriority = tickets.filter((t) => t.priority === "High");
  const mediumPriority = tickets.filter((t) => t.priority === "Medium");
  const lowPriority = tickets.filter((t) => t.priority === "Low");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Support Management
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
          Support Queue
        </h1>
        <p className="mt-2 text-gray-400">
          Triage owner requests, billing issues, and onboarding questions from one panel.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-red-500/5 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <div>
              <p className="text-sm text-gray-400">High Priority</p>
              <p className="text-2xl font-bold text-red-400">{highPriority.length}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-400" />
            <div>
              <p className="text-sm text-gray-400">Medium Priority</p>
              <p className="text-2xl font-bold text-yellow-400">{mediumPriority.length}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-sm text-gray-400">Total Tickets</p>
              <p className="text-2xl font-bold text-blue-400">{tickets.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* High Priority Section */}
      {highPriority.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            High Priority ({highPriority.length})
          </h2>
          <div className="grid gap-4">
            {highPriority.map((ticket) => (
              <Card
                key={`${ticket.salon}-${ticket.issue}`}
                className="border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge tone="danger">{ticket.priority}</Badge>
                      <p className="font-semibold text-white">{ticket.salon}</p>
                    </div>
                    <p className="text-gray-400">{ticket.issue}</p>
                  </div>
                  <Button variant="outline" className="whitespace-nowrap">
                    Respond
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Medium Priority Section */}
      {mediumPriority.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-400" />
            Medium Priority ({mediumPriority.length})
          </h2>
          <div className="grid gap-4">
            {mediumPriority.map((ticket) => (
              <Card
                key={`${ticket.salon}-${ticket.issue}`}
                className="border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge tone="warning">{ticket.priority}</Badge>
                      <p className="font-semibold text-white">{ticket.salon}</p>
                    </div>
                    <p className="text-gray-400">{ticket.issue}</p>
                  </div>
                  <Button variant="outline" className="whitespace-nowrap">
                    Respond
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Low Priority Section */}
      {lowPriority.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-400" />
            Low Priority ({lowPriority.length})
          </h2>
          <div className="grid gap-4">
            {lowPriority.map((ticket) => (
              <Card
                key={`${ticket.salon}-${ticket.issue}`}
                className="border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge tone="success">{ticket.priority}</Badge>
                      <p className="font-semibold text-white">{ticket.salon}</p>
                    </div>
                    <p className="text-gray-400">{ticket.issue}</p>
                  </div>
                  <Button variant="ghost" className="whitespace-nowrap">
                    View
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {tickets.length === 0 && (
        <Card className="py-12 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-gray-500 mb-3" />
          <p className="text-gray-400">No support tickets at the moment.</p>
          <p className="text-sm text-gray-500">All issues are resolved!</p>
        </Card>
      )}
    </div>
  );
}

