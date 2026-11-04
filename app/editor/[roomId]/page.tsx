import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentClerkIdentity, getAccessibleProject } from "@/lib/project-access";
import { getCollaborators } from "@/lib/share-collaborators";
import { fetchCollaboratorByEmail } from "@/lib/share-dialog-helpers";
import { getPrismaClient } from "@/lib/prisma";
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
  const project = await getAccessibleProject(userId, email, roomId);
  if (!project) {
    return <AccessDenied />;
  }

  // Step 3: Fetch collaborator list and enrich with Clerk display data
  const collaborators = await getCollaborators(project.id, email, getPrismaClient());
  const enriched = await Promise.all(
    collaborators.map((c) => fetchCollaboratorByEmail(c.collaboratorEmail))
  );

  // Derive the current user's role for the project. The collaborator match
  // uses the current user's email (not the Clerk user id) and compares case-
  // insensitively, matching normalizeEmail applied to stored collaborator emails.
  const isCollaborator =
    email !== undefined &&
    email !== "" &&
    enriched.some((c) => c.email.toLowerCase() === email.trim().toLowerCase());
  const role: "owner" | "collaborator" | null =
    project.ownerId === userId
      ? "owner"
      : isCollaborator
        ? "collaborator"
        : null;

  // Step 4: Render workspace
  return (
    <WorkspaceLayout
      project={project}
      userId={userId}
      role={role}
      currentEmail={email}
      collaborators={enriched}
    />
  );
}
