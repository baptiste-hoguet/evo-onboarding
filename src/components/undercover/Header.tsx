"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "./ConfirmDialog";

type HeaderProps = {
  subtitle?: string;
  showHomeButton?: boolean;
};

export function Header({ subtitle, showHomeButton = true }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <header className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          {showHomeButton && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Retour au menu"
              className="size-9 flex items-center justify-center rounded-lg border border-border hover:bg-secondary transition-colors text-white-muted hover:text-gold"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-base font-bold tracking-widest text-gold uppercase">
              Undercover
            </h1>
            {subtitle && (
              <p className="text-xs text-white-muted mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </header>
      <ConfirmDialog
        open={open}
        title="Quitter la partie ?"
        description="La progression sera perdue."
        confirmLabel="Quitter"
        cancelLabel="Continuer"
        destructive
        onConfirm={() => router.push("/undercover")}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
