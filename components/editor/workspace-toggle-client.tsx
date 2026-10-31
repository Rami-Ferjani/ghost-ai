"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { CanvasPlaceholder } from "@/components/editor/canvas-placeholder";
import { AISidebarPlaceholder } from "@/components/editor/ai-sidebar-placeholder";

export interface WorkspaceToggleClientProps {
  project: {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
  };
  userId: string;
}

export const WorkspaceToggleClient: React.FC<WorkspaceToggleClientProps> = ({
  project,
  userId,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left sidebar */}
      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        projects={[project]}
        currentUserId={userId}
        selectedProjectId={project.id}
        onSelectProject={() => setSidebarOpen(true)}
        onOpenCreate={() => {}}
        onOpenRename={() => {}}
        onOpenDelete={() => {}}
      />
      {/* Right AI sidebar */}
      <AISidebarPlaceholder />
      {/* Central canvas placeholder */}
      <main className="flex-1 overflow-hidden">
        <CanvasPlaceholder />
      </main>
    </div>
  );
};