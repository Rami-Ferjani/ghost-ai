/*
 * Project Sidebar component
 *
 * - Slides in from the left, floating over the editor canvas (does not push content)
 * - Accepts `isOpen` prop to control visibility
 * - Header with `Projects` title and close button
 * - Uses shadcn `Tabs` with `My Projects` and `Shared` tabs (both empty placeholders)
 * - Full‑width `New Project` button at the bottom with a `Plus` icon
 */

"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export interface ProjectSidebarProps {
  /** Whether the sidebar is visible */
  isOpen: boolean;
  /** Callback to close the sidebar */
  onClose: () => void;
}

/**
 * Floating sidebar that appears over the editor canvas. It slides in from the left.
 */
export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ isOpen, onClose }) => {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 w-80 transform transition-transform duration-300 ease-in-out",
        "bg-base border-r border-surface-border shadow-lg",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
      aria-hidden={!isOpen}
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-surface-border p-4">
        <h2 className="text-lg font-medium">Projects</h2>
        <button
          type="button"
          onClick={handleClose}
          className="rounded p-1 hover:bg-surface-hover"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="my" className="flex flex-col h-[calc(100%-8rem)]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my">My Projects</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="my">
            {/* Empty placeholder for My Projects */}
            <p className="text-muted-foreground">No projects yet.</p>
          </TabsContent>
          <TabsContent value="shared">
            {/* Empty placeholder for Shared */}
            <p className="text-muted-foreground">No shared projects.</p>
          </TabsContent>
        </div>
      </Tabs>

      {/* New Project button – sticks to bottom */}
      <footer className="p-4 border-t border-surface-border">
        <Button variant="default" className="w-full" onClick={() => { /* TODO: open new project modal */ }}>
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </footer>
    </aside>
  );
};
