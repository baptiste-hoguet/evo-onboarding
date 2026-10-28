"use client";

import { useEffect, useRef } from "react";
import { mountQuestionnaire } from "./engine";

type Initial = { id: string; answers: Record<string, unknown>; section: number; submitted: boolean } | null;

async function call(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    keepalive: method === "PATCH",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function Questionnaire({ initial, preview }: { initial: Initial; preview: boolean }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current) return;
    const suffix = preview ? "?apercu=1" : "";
    return mountQuestionnaire(root.current, {
      initial,
      preview,
      // Premier clic sur « Commencer » : crée le brouillon et donne au client son lien personnel
      onStart: async () => {
        const { id } = await call("/api/questionnaire", "POST");
        window.history.replaceState(null, "", `/questionnaire/${id}${suffix}`);
        return id;
      },
      onSave: (id: string, data: unknown) => call(`/api/questionnaire/${id}`, "PATCH", data),
      onSubmit: (id: string, data: unknown) => call(`/api/questionnaire/${id}/submit`, "POST", data),
    });
  }, [initial, preview]);

  return <div ref={root} />;
}
