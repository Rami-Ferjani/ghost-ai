import type { CollaboratorEnrichment } from "@/lib/share-dialog-helpers";
import { WorkspaceToggleClient } from "@/components/editor/workspace-toggle-client";

export interface WorkspaceLayoutProps {
  project: {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
  };
  userId: string;
  role: "owner" | "collaborator" | null;
  currentEmail: string;
  collaborators: CollaboratorEnrichment[];
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  project,
  userId,
  role,
  currentEmail,
  collaborators,
}) => {
  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex-1 overflow-hidden">
        <WorkspaceToggleClient
          project={project}
          userId={userId}
          role={role}
          currentEmail={currentEmail}
          collaborators={collaborators}
        />
      </div>
    </div>
  );
};
