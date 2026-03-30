"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Client {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  offer: string | null;
  videoWatched: boolean;
  paymentSent: boolean;
  paymentConfirmed: boolean;
  contractSigned: boolean;
  callBooked: boolean;
  currentStep: number;
  createdAt: string;
}

const STEPS = [
  "Inscription",
  "Vidéo",
  "Virement",
  "Confirmation",
  "Contrat",
  "Appel",
  "Terminé",
];

function getProgression(client: Client): number {
  let count = 0;
  if (client.offer) count++;
  if (client.videoWatched) count++;
  if (client.paymentSent) count++;
  if (client.paymentConfirmed) count++;
  if (client.contractSigned) count++;
  if (client.callBooked) count++;
  return Math.round((count / 6) * 100);
}

function getStepLabel(client: Client): string {
  if (client.callBooked) return STEPS[6];
  if (client.contractSigned) return STEPS[5];
  if (client.paymentConfirmed) return STEPS[4];
  if (client.paymentSent) return STEPS[3];
  if (client.videoWatched) return STEPS[2];
  if (client.offer) return STEPS[1];
  return STEPS[0];
}

const offerColors: Record<string, string> = {
  AGORA: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  NEXUS: "bg-[#C9A84C]/20 text-[#E8C97A] border-[#C9A84C]/30",
  ATLAS: "bg-violet-500/20 text-violet-400 border-violet-500/30",
};

export default function DashboardPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [offerFilter, setOfferFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    if (offerFilter !== "all" && client.offer !== offerFilter) return false;
    if (statusFilter === "completed" && !client.callBooked) return false;
    if (statusFilter === "in_progress" && client.callBooked) return false;
    if (statusFilter === "payment_pending" && (client.paymentConfirmed || !client.paymentSent))
      return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Clients</h1>
        <Button
          onClick={() => router.push("/admin/clients/new")}
          className="bg-[#C9A84C] text-[#0A0F1E] hover:bg-[#E8C97A] rounded-lg font-semibold"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau client
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={offerFilter} onValueChange={(v) => setOfferFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-[180px] bg-[#111827] border-[#1E2D45] text-white rounded-lg">
            <SelectValue placeholder="Offre" />
          </SelectTrigger>
          <SelectContent className="bg-[#111827] border-[#1E2D45]">
            <SelectItem value="all">Toutes les offres</SelectItem>
            <SelectItem value="AGORA">AGORA</SelectItem>
            <SelectItem value="NEXUS">NEXUS</SelectItem>
            <SelectItem value="ATLAS">ATLAS</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-[200px] bg-[#111827] border-[#1E2D45] text-white rounded-lg">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent className="bg-[#111827] border-[#1E2D45]">
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="completed">Terminé</SelectItem>
            <SelectItem value="payment_pending">Virement en attente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="evo-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-[#94A3B8]">Chargement...</div>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#94A3B8]">
            <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p>Aucun client trouv&eacute;</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-[#1E2D45] hover:bg-transparent">
                <TableHead className="text-[#94A3B8]">Nom</TableHead>
                <TableHead className="text-[#94A3B8]">Offre</TableHead>
                <TableHead className="text-[#94A3B8]">Progression</TableHead>
                <TableHead className="text-[#94A3B8] hidden md:table-cell">
                  &Eacute;tape
                </TableHead>
                <TableHead className="text-[#94A3B8] hidden lg:table-cell">
                  Virement
                </TableHead>
                <TableHead className="text-[#94A3B8] hidden lg:table-cell">
                  Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => {
                const progression = getProgression(client);
                return (
                  <TableRow
                    key={client.id}
                    onClick={() => router.push(`/admin/clients/${client.id}`)}
                    className="border-[#1E2D45] cursor-pointer hover:bg-[#1A2438] transition-colors"
                  >
                    <TableCell className="text-white font-medium">
                      {client.firstName || client.lastName
                        ? `${client.firstName || ""} ${client.lastName || ""}`.trim()
                        : client.email}
                    </TableCell>
                    <TableCell>
                      {client.offer ? (
                        <Badge
                          variant="outline"
                          className={`${offerColors[client.offer] || ""} rounded-md`}
                        >
                          {client.offer}
                        </Badge>
                      ) : (
                        <span className="text-[#475569]">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-[#1A2438] rounded-full overflow-hidden">
                          <div
                            className="h-full progress-gradient rounded-full transition-all"
                            style={{ width: `${progression}%` }}
                          />
                        </div>
                        <span className="text-sm text-[#94A3B8]">{progression}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#94A3B8] hidden md:table-cell">
                      {getStepLabel(client)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {client.paymentConfirmed ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 rounded-md">
                          Confirm&eacute;
                        </Badge>
                      ) : client.paymentSent ? (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 rounded-md">
                          En attente
                        </Badge>
                      ) : (
                        <span className="text-[#475569]">--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[#94A3B8] hidden lg:table-cell">
                      {new Date(client.createdAt).toLocaleDateString("fr-FR")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
