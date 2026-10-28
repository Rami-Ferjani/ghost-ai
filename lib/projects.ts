import { getPrismaClient } from "@/lib/prisma";
import { slugFromName } from "@/lib/slug";
import type { Project } from "@/types/project";

export async function getProjectsForUser(userId: string) {
  const prisma = getPrismaClient();

  const [ownedProjects, collaboratorRows] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
    }),
    // The collaborator model stores per-user rows on each project; when no
    // collaborators exist yet the table is empty and returns [].
    prisma.projectCollaborator.findMany(),
  ]);

  const ownedIds = new Set(ownedProjects.map((project) => project.id));
  const collaboratorIds = new Set(collaboratorRows.map((row) => row.projectId));

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

  const sharedProjects: Project[] = ownedProjects
    // Shared projects are those the user is a collaborator on but does not own.
    .filter((project) => !ownedIds.has(project.id) && collaboratorIds.has(project.id))
    .map(transformProject);

  return {
    ownedProjects: ownedProjects.map(transformProject),
    sharedProjects,
  };
}
