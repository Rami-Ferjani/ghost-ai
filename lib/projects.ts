import { getPrismaClient } from "@/lib/prisma";
import { slugFromName } from "@/lib/slug";
import type { Project } from "@/types/project";

export async function getProjectsForUser(userId: string, email?: string) {
  const prisma = getPrismaClient();

  const normalizedEmail = email ? email.trim().toLowerCase() : "";

  const [ownedProjects, collaboratorRows] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
    }),
    // Query collaborator relation directly, matching collaboratorEmail to current user email if provided, else userId
    prisma.projectCollaborator.findMany({
      where: { collaboratorEmail: normalizedEmail || userId },
      include: { project: true },
    }),
  ]);

  const transformProject = (project: {
    id: string;
    name: string;
    ownerId: string;
  }): Project => ({
    id: project.id,
    name: project.name,
    slug: slugFromName(project.name),
    ownerId: project.ownerId,
  });

  // Shared projects are those the user is a collaborator on but does not own.
  const sharedProjects: Project[] = collaboratorRows
    .filter((row) => row.project.ownerId !== userId)
    .map((row) => transformProject(row.project));

  return {
    ownedProjects: ownedProjects.map(transformProject),
    sharedProjects,
  };
}
