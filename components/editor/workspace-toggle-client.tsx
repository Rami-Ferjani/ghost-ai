"use client";
import { useState, useCallback } from "react";
import { EditorNavbar } from "@/components/editor/editor-navbar";
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
  const handleToggleSidebar = useCallback(
    () => setSidebarOpen((open) => !open),
    []
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top navbar */}
      <EditorNavbar
        isSidebarOpen={sidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        projectId={project.id}
        projectName={project.name}
        userId={userId}
      />
      {/* Body: left sidebar, right AI sidebar, central canvas */}
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
    </div>
  );
};
