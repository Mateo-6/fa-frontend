"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";

/**
 * Modal reutilizable que envuelve un formulario.
 * Recibe el form como children junto con el estado de apertura y el título;
 * se usa igual para crear y para editar en todas las pantallas.
 */
interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function FormModal({ open, onClose, title, description, children }: FormModalProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      {children}
    </Dialog>
  );
}