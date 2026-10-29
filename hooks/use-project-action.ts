"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/types/project";

export interface UseProjectActionOptions {
  /** Current user id (used for ownership-aware navigation). */
  currentUserId?: string;
  /** Currently selected project id (active workspace). */
  activeProjectId?: string | null;
}

/**
 * Custom hook managing project dialog state, form values, and API mutations
 * (POST create, PATCH rename, DELETE). The owning client shell drives dialog
 * visibility and wires the dialog components to these actions.
 */
export function useProjectAction({
  currentUserId,
  activeProjectId,
}: UseProjectActionOptions) {
  const router = useRouter();

  const [activeDialog, setActiveDialog] = useState<"create" | "rename" | "delete" | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [createName, setCreateName] = useState("");
  const [renameName, setRenameName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreate = () => {
    setCreateName("");
    setError(null);
    setActiveDialog("create");
  };

  const openRename = (project: Project) => {
    setSelectedProject(project);
    setRenameName(project.name);
    setError(null);
    setActiveDialog("rename");
  };

  const openDelete = (project: Project) => {
    setSelectedProject(project);
    setError(null);
    setActiveDialog("delete");
  };

  const closeDialog = () => {
    setActiveDialog(null);
    setError(null);
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: createName }),
      });
      if (!res.ok) {
        setError("Failed to create project");
        return;
      }
      const newProject = await res.json();
      closeDialog();
      router.push(`/editor/${newProject.id}`);
      router.refresh();
    } catch {
      setError("Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRename = async () => {
    if (!selectedProject) return;
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: renameName }),
      });
      if (!res.ok) {
        setError("Failed to rename project");
        return;
      }
      closeDialog();
      router.refresh();
    } catch {
      setError("Failed to rename project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError("Failed to delete project");
        return;
      }
      closeDialog();
      if (selectedProject.id === activeProjectId) {
        router.push("/editor");
      }
      router.refresh();
    } catch {
      setError("Failed to delete project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    activeDialog,
    selectedProject,
    createName,
    setCreateName,
    renameName,
    setRenameName,
    isSubmitting,
    error,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    handleCreate,
    handleRename,
    handleDelete,
  };
}
