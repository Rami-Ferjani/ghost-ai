import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPrismaClient } from "@/lib/prisma";
import { slugFromName } from "@/lib/slug";
import type { Project } from "@/types/project";

/**
 * Retrieve the current Clerk identity.
 * Returns both user ID and primary email.
 */
export async function getCurrentClerkIdentity() {
  const { userId } = await auth();
  const client = await clerkClient();
  const user = userId ? await client.users.getUser(userId) : null;
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  return { userId, email };
}

/**
 * Check whether a user has access to a specific project.
 * Returns true if the user is the owner or a collaborator.
 */
export async function hasUserAccessToProject(
  userId: string,
  projectId: string
): Promise<boolean> {
  const prisma = getPrismaClient();

  const [isOwner, isCollaborator] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId, ownerId: userId },
    }),
    prisma.projectCollaborator.findUnique({
      where: { projectId_collaboratorEmail: { projectId, collaboratorEmail: userId } },
    }),
  ]);

  return !!isOwner || !!isCollaborator;
}

/**
 * Retrieve a project if the user has access to it.
 * Returns null if the project doesn't exist or the user has no access.
 */
export async function getAccessibleProject(
  userId: string,
  projectId: string
): Promise<{
  id: string;
  name: string;
  slug: string;
  ownerId: string;
} | null> {
  const prisma = getPrismaClient();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return null;
  }

  const hasAccess = await hasUserAccessToProject(userId, projectId);

  if (!hasAccess) {
    return null;
  }

  return {
    id: project.id,
    name: project.name,
    slug: slugFromName(project.name),
    ownerId: project.ownerId,
  };
}