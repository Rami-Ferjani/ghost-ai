"use client";

import { useCallback, useState } from "react";
import type { Project } from "@/types/project";

export type ProjectDialogId = "create" | "rename" | "delete" | null;

export interface ProjectDialogsState {
  /** Active dialog, or null when no dialog is open */
  activeDialog: ProjectDialogId;
  /** Open the Create Project dialog */
  openCreate: () => void;
  /** Open the Rename Project dialog for the given project */
  openRename: (project: Project) => void;
  /** Open the Delete Project dialog for the given project */
  openDelete: (project: Project) => void;
  /** Close the active dialog */
  closeDialog: () => void;
  /** Currently selected project, or null */
  selectedProject: Project | null;
  /** Create dialog input value */
  createName: string;
  setCreateName: (name: string) => void;
  /** Rename dialog input value (mirrors the selected project's current name) */
  renameName: string;
  setRenameName: (name: string) => void;
  /** Whether the selected project belongs to the current user (ownership gate) */
  selectedIsOwned: boolean;
}

export function useProjectDialogs(currentUserId?: string): ProjectDialogsState {
  const [activeDialog, setActiveDialog] = useState<ProjectDialogId>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [createName, setCreateName] = useState("");
  const [renameName, setRenameName] = useState("");

  const openCreate = useCallback(() => {
    setSelectedProject(null);
    setActiveDialog("create");
  }, []);

  const openRename = useCallback((project: Project) => {
    setSelectedProject(project);
    // Reset form state to the project's CURRENT name, never a previously typed value.
    setRenameName(project.name);
    setActiveDialog("rename");
  }, []);

  const openDelete = useCallback((project: Project) => {
    setSelectedProject(project);
    setActiveDialog("delete");
  }, []);

  const closeDialog = useCallback(() => {
    setActiveDialog(null);
  }, []);

  const selectedIsOwned =
    selectedProject != null && selectedProject.ownerId === currentUserId;

  return {
    activeDialog,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    selectedProject,
    createName,
    setCreateName,
    renameName,
    setRenameName,
    selectedIsOwned,
  };
}
