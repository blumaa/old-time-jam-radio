"use client";

import type { ReactNode } from "react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Root data-testid; the backdrop is `${testId}-backdrop`. */
  testId?: string;
}

/**
 * Reusable bottom-sheet shell: dimmed backdrop + panel that slides up from the
 * bottom of the radio facade. Content-specific drawers (search, queue) compose
 * this and provide their own body.
 */
export default function Drawer({
  isOpen,
  onClose,
  children,
  testId = "drawer",
}: DrawerProps) {
  return (
    <div
      className={`drawer ${isOpen ? "drawer--open" : ""}`}
      data-testid={testId}
    >
      <div
        className="drawer__backdrop"
        data-testid={`${testId}-backdrop`}
        onClick={onClose}
      />
      <div className="drawer__panel" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
