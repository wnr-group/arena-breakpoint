"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: "text-red-500",
      confirmButton: "bg-red-500 hover:bg-red-600 text-white",
      border: "border-red-900/20",
      bg: "bg-red-950/10",
    },
    warning: {
      icon: "text-amber-500",
      confirmButton: "bg-amber-500 hover:bg-amber-600 text-black",
      border: "border-amber-900/20",
      bg: "bg-amber-950/10",
    },
    info: {
      icon: "text-primary",
      confirmButton: "bg-primary hover:bg-primary-hover text-black",
      border: "border-[#e4e4e7]",
      bg: "bg-white",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card
        className={`w-full max-w-md ${styles.bg} border ${styles.border} rounded-2xl shadow-2xl animate-in zoom-in-95 duration-250`}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-full ${styles.bg} border ${styles.border}`}>
              <AlertTriangle className={`h-6 w-6 ${styles.icon}`} />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-base font-black text-[#111115] uppercase tracking-tight">
                {title}
              </h3>
              <p className="text-sm text-[#52525b]">{description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#52525b] hover:text-[#111115] hover:bg-[#e4e4e7] transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-[#e4e4e7] text-[#52525b] hover:text-[#111115] hover:bg-[#e4e4e7]"
            >
              {cancelText}
            </Button>
            <Button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 font-black uppercase ${styles.confirmButton}`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
