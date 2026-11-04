"use client";

import { useUser } from "@clerk/nextjs";
import { useProjectAction } from "@/hooks/use-project-action"
import { MOCK_PROJECTS } from "@/lib/mock-projects"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectSidebar } from "@/components/editor/project-sidebar"
import { useState } from "react"
import { CreateProjectDialog } from "@/components/editor/create-project-dialog"
import { RenameProjectDialog } from "@/components/editor/rename-project-dialog"
import { DeleteProjectDialog } from "@/components/editor/delete-project-dialog"
import { ShareDialog } from "@/components/editor/share-dialog"
import type { CollaboratorEnrichment } from "@/lib/share-dialog-helpers"

export default function TestEditorChrome() {
  const { user } = useUser();
  const currentUserId = user?.id;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const action = useProjectAction({ currentUserId, activeProjectId: selectedProjectId });
  const [role, setRole] = useState<"owner" | "collaborator">("owner");

  // Share-dialog test vehicle: mock enriched collaborators for the owner view,
  // plus local state to drive the owner/collaborator share views and copy feedback.
  const MOCK_COLLABORATORS: CollaboratorEnrichment[] = [
    { name: "Alice", avatarUrl: null, email: "alice@example.com" },
    { name: "Bob", avatarUrl: null, email: "bob@example.com" },
  ];
  const [ownerShareInviteEmail, setOwnerShareInviteEmail] = useState("");
  const [ownerShareCopied, setOwnerShareCopied] = useState(false);
  const [collabShareInviteEmail, setCollabShareInviteEmail] = useState("");
  const [collabShareCopied, setCollabShareCopied] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background">
      <EditorNavbar
        isSidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        projectId={selectedProjectId ?? "test-project"}
        projectName={selectedProjectId ? "Test Project" : "Demo"}
        userId={currentUserId ?? "test-user"}
      />
      <div className="flex-1 overflow-hidden">
        <ProjectSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          projects={MOCK_PROJECTS}
          currentUserId={currentUserId}
          selectedProjectId={selectedProjectId}
          onSelectProject={(project) => setSelectedProjectId(project.id)}
          onOpenCreate={action.openCreate}
          onOpenRename={(project) => action.openRename(project)}
          onOpenDelete={(project) => action.openDelete(project)}
        />
        <main className="p-6">
          <h1 className="text-2xl font-bold mb-4">Editor Chrome Demo</h1>
          <p className="text-muted-foreground">
            Toggle the sidebar using the button in the top-left corner.
          </p>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Role:</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "owner" | "collaborator")}
              className="border rounded px-2 py-1"
            >
              <option value="owner">Owner</option>
              <option value="collaborator">Collaborator</option>
            </select>
          </div>
        </main>
      </div>

      {/* Dialogs render once at the page level, driven by the activeDialog state */}
      <CreateProjectDialog
        open={action.activeDialog === "create"}
        createName={action.createName}
        setCreateName={action.setCreateName}
        onClose={action.closeDialog}
        onSubmit={action.handleCreate}
      />
      <RenameProjectDialog
        open={action.activeDialog === "rename"}
        project={action.selectedProject}
        renameName={action.renameName}
        setRenameName={action.setRenameName}
        onClose={action.closeDialog}
        onSubmit={action.handleRename}
      />
      <DeleteProjectDialog
        open={action.activeDialog === "delete"}
        project={action.selectedProject}
        onClose={action.closeDialog}
        onConfirm={action.handleDelete}
      />

      {/* ShareDialog test views: owner (invite form + remove + copy-link) and
          collaborator (read-only list + copy-link) for the same project. */}
      {role === "owner" && (
        <ShareDialog
          open={true}
          onClose={() => {}}
          project={MOCK_PROJECTS[0]}
          role="owner"
          currentEmail="user_1"
          collaborators={MOCK_COLLABORATORS}
          inviteEmail={ownerShareInviteEmail}
          setInviteEmail={setOwnerShareInviteEmail}
          onInvite={async () => {}}
          onRemove={async () => {}}
          copyUrl="https://ghost-ai.app/phoenix-architecture"
          isCopied={ownerShareCopied}
          onCopyLink={async () => { setOwnerShareCopied(true); }}
        />
      )}
      {role === "collaborator" && (
        <ShareDialog
          open={true}
          onClose={() => {}}
          project={MOCK_PROJECTS[0]}
          role="collaborator"
          currentEmail="alice@example.com"
          collaborators={MOCK_COLLABORATORS}
          inviteEmail={collabShareInviteEmail}
          setInviteEmail={setCollabShareInviteEmail}
          onInvite={async () => {}}
          onRemove={async () => {}}
          copyUrl="https://ghost-ai.app/phoenix-architecture"
          isCopied={collabShareCopied}
          onCopyLink={async () => { setCollabShareCopied(true); }}
        />
      )}
    </div>
  )
}

// Add to app/layout.tsx's metadata to make this page accessible
// You can test by visiting /test-components
