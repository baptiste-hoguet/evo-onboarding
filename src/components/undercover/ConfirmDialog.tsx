"use client";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="evo-card max-w-sm w-full p-6 evo-glow"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-xl font-semibold text-gold mb-2">{title}</h3>
        {description && (
          <p className="text-white-muted text-sm mb-6">{description}</p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors font-medium"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              destructive
                ? "flex-1 px-4 py-3 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors font-medium"
                : "flex-1 px-4 py-3 rounded-lg bg-gold text-black hover:bg-gold-light transition-colors font-semibold"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
