/*
 * Project Sidebar component
 *
 * - Slides in from the left, floating over the editor canvas (does not push content)
 * - Accepts `isOpen` prop to control visibility
 * - Header with `Projects` title and close button
 * - `My Projects` tab lists projects owned by the current user; `Shared` tab lists the rest
 * - Owned rows show rename/delete action buttons; shared rows show none
 * - Selected row is highlighted via the accent color
 * - Footer `New Project` button opens the Create dialog
 */

"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { X, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Project } from "@/types/project";

const isOwnedProject = (project: Project, currentUserId: string | undefined) =>
  project.ownerId === currentUserId;

export interface ProjectRowProps {
  project: Project;
  currentUserId: string | undefined;
  selectedProjectId: string | null;
  onSelect: (project: Project) => void;
  onRename: (project: Project) => void;
  onDelete: (project: Project) => void;
}

const ProjectRow: React.FC<ProjectRowProps> = ({ project, currentUserId, selectedProjectId, onSelect, onRename, onDelete }) => {
  return (
    <div
      className={cn(
        "w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
        "hover:bg-surface-hover",
        project.id === selectedProjectId ? "bg-accent-dim" : ""
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(project)}
        className="flex-1 min-w-0"
      >
        <span className="font-medium">{project.name}</span>
      </button>

      {isOwnedProject(project, currentUserId) && (
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRename(project);
            }}
            className="rounded p-1 hover:bg-surface-hover"
            aria-label={`Rename ${project.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(project);
            }}
            className="rounded p-1 hover:bg-surface-hover"
            aria-label={`Delete ${project.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </span>
      )}
    </div>
  );
};

export interface ProjectSidebarProps {
  /** Whether the sidebar is visible */
  isOpen: boolean;
  /** Callback to close the sidebar */
  onClose: () => void;
  /** Projects available for the sidebar */
  projects: Project[];
  /** Current user id for ownership filtering (undefined if not loaded yet) */
  currentUserId: string | undefined;
  /** Currently selected project id (null when none) */
  selectedProjectId: string | null;
  /** Select a project from the sidebar */
  onSelectProject: (project: Project) => void;
  /** Open the create-project dialog */
  onOpenCreate: () => void;
  /** Open the rename-project dialog for the given project */
  onOpenRename: (project: Project) => void;
  /** Open the delete-project dialog for the given project */
  onOpenDelete: (project: Project) => void;
}

/**
 * Floating sidebar that appears over the editor canvas. It slides in from the left.
 */
export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  isOpen,
  onClose,
  projects,
  currentUserId,
  selectedProjectId,
  onSelectProject,
  onOpenCreate,
  onOpenRename,
  onOpenDelete,
}) => {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <>
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 w-80 transform transition-transform duration-300 ease-in-out",
        "bg-base border-r border-surface-border shadow-lg",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
      aria-hidden={!isOpen}
      onClick={(event) => event.stopPropagation()}
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
            {projects
              .filter((project) => isOwnedProject(project, currentUserId))
              .map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  currentUserId={currentUserId}
                  selectedProjectId={selectedProjectId}
                  onSelect={onSelectProject}
                  onRename={onOpenRename}
                  onDelete={onOpenDelete}
                />
              ))}
            {projects.filter((project) => isOwnedProject(project, currentUserId)).length === 0 && (
              <p className="text-muted-foreground">No projects yet.</p>
            )}
          </TabsContent>
          <TabsContent value="shared">
            {projects
              .filter((project) => !isOwnedProject(project, currentUserId))
              .map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  currentUserId={currentUserId}
                  selectedProjectId={selectedProjectId}
                  onSelect={onSelectProject}
                  onRename={onOpenRename}
                  onDelete={onOpenDelete}
                />
              ))}
            {projects.filter((project) => !isOwnedProject(project, currentUserId)).length === 0 && (
              <p className="text-muted-foreground">No shared projects.</p>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* New Project button – sticks to bottom */}
      <footer className="p-4 border-t border-surface-border">
        <Button variant="default" className="w-full" onClick={onOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </footer>
    </aside>

      {isOpen && <div className="fixed inset-0 z-20 bg-black/40 backdrop-blur-xs" aria-hidden="true" onClick={onClose} />}
    </>
  );
};
