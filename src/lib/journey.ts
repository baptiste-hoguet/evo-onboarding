import { prisma } from "@/lib/prisma";

export const DELIVERABLE_STATUS: Record<string, string> = {
  a_faire: "À faire",
  deposee: "Déposée",
  en_revue: "En revue",
  validee: "Validée",
  a_corriger: "À corriger",
};

export type Version = { id: string; number: number; fileName: string; size: number; uploadedAt: string };
export type ItemState = {
  id: string;
  key: string;
  type: "link" | "checkbox" | "deliverable" | "booking" | "validation";
  label: string;
  config: Record<string, unknown>;
  done: boolean;
  doneAt: string | null;
  locked: boolean;
  deliverable?: { status: string; comment: string | null; versions: Version[] };
  checks?: { label: string; done: boolean }[];
};
export type BlockState = { id: string; key: string; title: string; description: string | null; items: ItemState[] };
export type StepState = {
  id: string; key: string; order: number; title: string; subtitle: string | null;
  unlocked: boolean; completed: boolean; progress: number; blocks: BlockState[];
};

const parse = (s: string) => { try { return JSON.parse(s) ?? {}; } catch { return {}; } };

// État complet du parcours d'un client : déverrouillages, statuts, progression
export async function getJourney(accountId: string): Promise<StepState[]> {
  const account = await prisma.clientAccount.findUniqueOrThrow({
    where: { id: accountId },
    include: {
      steps: true,
      progress: true,
      deliverables: { include: { versions: { orderBy: { number: "desc" } } } },
      template: {
        include: {
          steps: {
            orderBy: { order: "asc" },
            include: { blocks: { orderBy: { order: "asc" }, include: { items: { orderBy: { order: "asc" } } } } },
          },
        },
      },
    },
  });

  const prog = new Map(account.progress.map((p) => [p.itemId, p]));
  const deliv = new Map(account.deliverables.map((d) => [d.itemId, d]));
  const completed = new Set(account.steps.filter((s) => s.completedAt).map((s) => s.stepId));

  let previousDone = true;
  return account.template.steps.map((step) => {
    const unlocked = previousDone;
    const isCompleted = completed.has(step.id);
    previousDone = isCompleted;

    const allDelivs = step.blocks.flatMap((b) => b.items).filter((i) => i.type === "deliverable");
    const allSubmitted = allDelivs.every((i) => (deliv.get(i.id)?.status ?? "a_faire") !== "a_faire");

    let score = 0, total = 0;
    const blocks: BlockState[] = step.blocks.map((b) => ({
      id: b.id, key: b.key, title: b.title, description: b.description,
      items: b.items.map((it) => {
        const config = parse(it.config);
        const p = prog.get(it.id);
        const base: ItemState = {
          id: it.id, key: it.key, type: it.type as ItemState["type"], label: it.label, config,
          done: !!p?.doneAt, doneAt: p?.doneAt?.toISOString() ?? null, locked: !unlocked,
        };
        if (it.type === "checkbox" || it.type === "booking") {
          total += 1; score += base.done ? 1 : 0;
          if (it.type === "booking") base.locked = !unlocked || !allSubmitted;
        }
        if (it.type === "deliverable") {
          const d = deliv.get(it.id);
          const status = d?.status ?? "a_faire";
          base.deliverable = {
            status,
            comment: d?.coachComment ?? null,
            versions: (d?.versions ?? []).map((v) => ({ id: v.id, number: v.number, fileName: v.fileName, size: v.size, uploadedAt: v.uploadedAt.toISOString() })),
          };
          base.done = status === "validee";
          total += 1; score += status === "validee" ? 1 : status === "a_faire" ? 0 : 0.5;
        }
        if (it.type === "validation") {
          const labels = Array.isArray(config.checks) ? (config.checks as string[]) : [];
          const data = parse(p?.data ?? "{}");
          base.checks = labels.map((l) => ({ label: l, done: !!data[l] }));
          const n = base.checks.filter((c) => c.done).length;
          total += 1; score += labels.length ? n / labels.length : 0;
          base.done = labels.length > 0 && n === labels.length;
        }
        return base;
      }),
    }));

    const progress = isCompleted ? 100 : total ? Math.round((score / total) * 100) : 0;
    return { id: step.id, key: step.key, order: step.order, title: step.title, subtitle: step.subtitle, unlocked, completed: isCompleted, progress, blocks };
  });
}

// Élément du parcours d'un client, avec l'état calculé (pour valider les actions côté API)
export async function getItemForAccount(accountId: string, itemId: string) {
  const steps = await getJourney(accountId);
  for (const s of steps) for (const b of s.blocks) for (const i of b.items) if (i.id === itemId) return { step: s, item: i };
  return null;
}

export async function defaultTemplateId() {
  const t = await prisma.journeyTemplate.findUnique({ where: { key: "evo-accompagnement" }, select: { id: true } });
  if (!t) throw new Error("Parcours « evo-accompagnement » introuvable : lance prisma/seed-journey.ts");
  return t.id;
}
