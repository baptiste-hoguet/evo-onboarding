"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type FlowType = "in" | "out";

interface Virement {
  id: string;
  client: string;
  amount: number; // always positive; sign derived from `type`
  type: FlowType;
  date: string; // YYYY-MM-DD
}

const STORAGE_KEY = "evo-virements-v1";

const EUR = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const MONTHS_FR = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function todayISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

function signed(v: Virement): number {
  return v.type === "out" ? -v.amount : v.amount;
}

export default function DashboardPage() {
  const [virements, setVirements] = useState<Virement[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  // Form state
  const [client, setClient] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<FlowType>("in");
  const [date, setDate] = useState(todayISO());

  // Load from localStorage on mount + register the service worker (PWA install).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // Hydration-safe: localStorage is only available after mount, so we load
      // here rather than in a lazy initializer (which would mismatch the SSR HTML).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setVirements(JSON.parse(raw));
    } catch {
      /* ignore corrupted storage */
    }
    setLoaded(true);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {});
    }
  }, []);

  // Persist on every change (once initial load is done).
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(virements));
    } catch {
      /* ignore quota errors */
    }
  }, [virements, loaded]);

  const balance = useMemo(
    () => virements.reduce((sum, v) => sum + signed(v), 0),
    [virements]
  );

  const totals = useMemo(() => {
    let inSum = 0;
    let outSum = 0;
    for (const v of virements) {
      if (v.type === "out") outSum += v.amount;
      else inSum += v.amount;
    }
    return { inSum, outSum };
  }, [virements]);

  // Net amount for each of the last 6 months (chart data).
  const monthly = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; label: string; net: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: MONTHS_FR[d.getMonth()],
        net: 0,
      });
    }
    const index = new Map(buckets.map((b, i) => [b.key, i]));
    for (const v of virements) {
      const d = new Date(v.date + "T00:00:00");
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const idx = index.get(key);
      if (idx !== undefined) buckets[idx].net += signed(v);
    }
    return buckets;
  }, [virements]);

  const maxAbs = useMemo(
    () => Math.max(1, ...monthly.map((m) => Math.abs(m.net))),
    [monthly]
  );

  const sorted = useMemo(
    () =>
      [...virements].sort((a, b) =>
        a.date === b.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date)
      ),
    [virements]
  );

  function resetForm() {
    setClient("");
    setAmount("");
    setType("in");
    setDate(todayISO());
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(",", "."));
    if (!client.trim()) {
      toast.error("Le nom du client est requis.");
      return;
    }
    if (!isFinite(parsed) || parsed <= 0) {
      toast.error("Montant invalide.");
      return;
    }
    const v: Virement = {
      id: uid(),
      client: client.trim(),
      amount: Math.round(parsed * 100) / 100,
      type,
      date: date || todayISO(),
    };
    setVirements((prev) => [...prev, v]);
    toast.success("Virement ajouté.");
    resetForm();
    setOpen(false);
  }

  function handleDelete(id: string) {
    setVirements((prev) => prev.filter((v) => v.id !== id));
    toast.success("Virement supprimé.");
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-28 pt-8">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Virements
          </h1>
          <p className="text-sm text-muted-foreground">Suivi des clients</p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 evo-glow">
          <Wallet className="size-5 text-primary" />
        </div>
      </header>

      {/* Balance card */}
      <section className="evo-card evo-glow mb-5 p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Solde du compte
        </p>
        <p
          className={`mt-1 text-4xl font-bold tabular-nums ${
            balance < 0 ? "text-destructive" : "text-primary"
          }`}
        >
          {EUR.format(balance)}
        </p>
        <div className="mt-4 flex gap-3">
          <div className="flex-1 rounded-lg bg-secondary/60 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowDownLeft className="size-3.5 text-emerald-400" />
              Entrées
            </div>
            <p className="mt-0.5 font-semibold tabular-nums text-emerald-400">
              {EUR.format(totals.inSum)}
            </p>
          </div>
          <div className="flex-1 rounded-lg bg-secondary/60 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowUpRight className="size-3.5 text-destructive" />
              Sorties
            </div>
            <p className="mt-0.5 font-semibold tabular-nums text-destructive">
              {EUR.format(totals.outSum)}
            </p>
          </div>
        </div>
      </section>

      {/* Monthly chart */}
      <section className="evo-card mb-5 p-5">
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Par mois · 6 derniers mois
        </p>
        <div className="flex h-40 items-end justify-between gap-2">
          {monthly.map((m) => {
            const h = Math.round((Math.abs(m.net) / maxAbs) * 100);
            const positive = m.net >= 0;
            return (
              <div
                key={m.key}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div className="relative flex h-28 w-full items-end justify-center">
                  <div
                    className={`w-full max-w-[28px] rounded-t-md transition-all ${
                      m.net === 0
                        ? "bg-border"
                        : positive
                          ? "bg-primary"
                          : "bg-destructive"
                    }`}
                    style={{ height: `${m.net === 0 ? 3 : Math.max(6, h)}%` }}
                    title={EUR.format(m.net)}
                  />
                </div>
                <span className="text-[10px] font-medium capitalize text-muted-foreground">
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* List */}
      <section className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Historique</h2>
        <span className="text-xs text-muted-foreground">
          {virements.length} virement{virements.length > 1 ? "s" : ""}
        </span>
      </section>

      {loaded && sorted.length === 0 && (
        <div className="evo-card flex flex-col items-center gap-2 p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <Plus className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-white">Aucun virement</p>
          <p className="text-xs text-muted-foreground">
            Ajoutez votre premier virement client.
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {sorted.map((v) => {
          const isOut = v.type === "out";
          return (
            <li
              key={v.id}
              className="evo-card flex items-center gap-3 p-3.5"
            >
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                  isOut ? "bg-destructive/15" : "bg-emerald-500/15"
                }`}
              >
                {isOut ? (
                  <ArrowUpRight className="size-5 text-destructive" />
                ) : (
                  <ArrowDownLeft className="size-5 text-emerald-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{v.client}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="size-3" />
                  {new Date(v.date + "T00:00:00").toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <p
                className={`shrink-0 font-semibold tabular-nums ${
                  isOut ? "text-destructive" : "text-emerald-400"
                }`}
              >
                {isOut ? "−" : "+"}
                {EUR.format(v.amount)}
              </p>
              <button
                type="button"
                onClick={() => handleDelete(v.id)}
                aria-label={`Supprimer le virement de ${v.client}`}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>

      {/* Add button (floating) + dialog */}
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) resetForm();
        }}
      >
        <DialogTrigger
          render={
            <Button
              size="lg"
              className="fixed bottom-6 left-1/2 z-40 h-14 -translate-x-1/2 rounded-full bg-primary px-6 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-[#E8C97A]"
            />
          }
        >
          <Plus className="mr-1 size-5" />
          Ajouter un virement
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau virement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="client">Client</Label>
              <Input
                id="client"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Nom du client"
                autoComplete="off"
              />
            </div>

            {/* Type toggle */}
            <div className="space-y-1.5">
              <Label>Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("in")}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    type === "in"
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                      : "border-border bg-secondary/40 text-muted-foreground"
                  }`}
                >
                  <ArrowDownLeft className="size-4" />
                  Entrée
                </button>
                <button
                  type="button"
                  onClick={() => setType("out")}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    type === "out"
                      ? "border-destructive/50 bg-destructive/15 text-destructive"
                      : "border-border bg-secondary/40 text-muted-foreground"
                  }`}
                >
                  <ArrowUpRight className="size-4" />
                  Sortie
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Montant (€)</Label>
                <Input
                  id="amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <DialogClose render={<Button type="button" variant="outline" />}>
                Annuler
              </DialogClose>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-[#E8C97A]"
              >
                Ajouter
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
