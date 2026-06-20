/*
 * Editor Navbar component
 *
 * - Fixed-height top navbar
 * - Left, center, and right sections
 * - Left section contains sidebar toggle button
 * - Uses PanelLeftOpen / PanelLeftClose icons based on sidebar state
 * - Right section stays empty for now
 * - Dark background with subtle bottom border
 */

"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";

export interface EditorNavbarProps {
  /**
   * Whether the editor sidebar is currently open.
   */
  isSidebarOpen: boolean;
  /**
   * Callback to toggle the sidebar state.
   */
  onToggleSidebar: () => void;
}

/**
 * Fixed‑height, dark themed top navigation bar used across every editor page.
 */
export const EditorNavbar: React.FC<EditorNavbarProps> = ({
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const handleToggle = useCallback(() => {
    onToggleSidebar();
  }, [onToggleSidebar]);

  return (
    <header
      className={cn(
        "flex h-14 items-center justify-between bg-base border-b border-surface-border px-4",
        "shadow-sm"
      )}
    >
      {/* Left section – sidebar toggle button */}
      <button
        type="button"
        onClick={handleToggle}
        className="p-2 hover:bg-surface-hover rounded"
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isSidebarOpen ? (
          <PanelLeftClose className="h-5 w-5" />
        ) : (
          <PanelLeftOpen className="h-5 w-5" />
        )}
      </button>

      {/* Center section – placeholder for future controls */}
      <div className="flex-1 flex justify-center" />

      {/* Right section – currently empty */}
      <div className="w-8" />
    </header>
  );
};
