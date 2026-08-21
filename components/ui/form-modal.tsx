"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";

/**
 * Reusable modal that wraps a form.
 * Receives the form as children along with the open state and the title;
 * used the same way for creating and editing across all screens.
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