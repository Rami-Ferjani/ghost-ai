"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { PanelLeftOpen, PanelLeftClose, Share2, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";

export interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  projectId: string;
  projectName: string;
  userId: string;
}

export const EditorNavbar: React.FC<EditorNavbarProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  projectId,
  projectName,
  userId,
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

      {/* Center section – project name */}
      <div className="flex-1 flex justify-center">
        <span className="text-lg font-medium">{projectName}</span>
      </div>

      {/* Right section – share and AI toggles */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-1">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button variant="ghost" size="sm" className="gap-1">
          <PanelRightOpen className="h-4 w-4" />
          AI
        </Button>
        <UserButton />
      </div>
    </header>
  );
};