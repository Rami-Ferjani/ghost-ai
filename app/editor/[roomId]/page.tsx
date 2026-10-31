import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentClerkIdentity, getAccessibleProject } from "@/lib/project-access";
import { WorkspaceLayout } from "@/components/editor/workspace-layout";
import { AccessDenied } from "@/components/editor/access-denied";

export default async function EditorWorkspacePage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  // Step 1: Authenticate
  const { userId, email } = await getCurrentClerkIdentity();
  if (!userId) {
    redirect("/sign-in");
  }

  // Step 2: Verify access
  const project = await getAccessibleProject(userId, roomId);
  if (!project) {
    return <AccessDenied />;
  }

  // Step 3: Render workspace
  return <WorkspaceLayout project={project} userId={userId} />;
}