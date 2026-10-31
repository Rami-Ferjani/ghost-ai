import { WorkspaceToggleClient } from "@/components/editor/workspace-toggle-client";

export interface WorkspaceLayoutProps {
  project: {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
  };
  userId: string;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  project,
  userId,
}) => {
  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex-1 overflow-hidden">
        <WorkspaceToggleClient
          project={project}
          userId={userId}
        />
      </div>
    </div>
  );
};