import type { PrismaClient } from "@/app/generated/prisma/client";

/**
 * A persisted collaborator row for a project, keyed by email.
 */
export interface CollaboratorRow {
  id: string;
  projectId: string;
  collaboratorEmail: string;
}

/**
 * Error thrown by the collaborator service when a mutation violates the
 * ownership or email contract. Carries the HTTP status the route should map to.
 */
export class CollaboratorServiceError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

/**
 * Minimal email shape: a local part, an `@`, and a domain containing a dot.
 * Assumes a Clerk-style email (e.g. `user@example.com`).
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Enforce server-side ownership: the caller may invite/remove only a project
 * they own (ownerId) or a collaborator of that project.
 * Uses the caller's email to check collaborator status in projectCollaborator,
 * and the project's ownerId to check ownership.
 * Returns 403 otherwise.
 */
async function assertCanModifyProject(
  projectId: string,
  email: string,
  ownerId: string,
  prisma: PrismaClient
): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new CollaboratorServiceError(403, "Forbidden");
  }

  const isOwner = project.ownerId === ownerId;
  const isCollaborator = await prisma.projectCollaborator.findUnique({
    where: { projectId_collaboratorEmail: { projectId, collaboratorEmail: email } },
  });

  if (!isOwner && !isCollaborator) {
    throw new CollaboratorServiceError(403, "Forbidden");
  }
}

/**
 * List collaborators of a project the caller may access (owner or collaborator).
 */
export async function getCollaborators(
  projectId: string,
  email: string,
  prisma: PrismaClient
): Promise<CollaboratorRow[]> {
  // First get the project to check ownership
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new CollaboratorServiceError(403, "Forbidden");
  }

  await assertCanModifyProject(projectId, email, project.ownerId, prisma);

  const rows = await prisma.projectCollaborator.findMany({
    where: { projectId },
  });

  return rows;
}

/**
 * Invite a collaborator by email on a project the caller owns or is a collaborator of.
 * Validates the email format (400) and duplicate emails (409), after ownership (403).
 */
export async function inviteCollaborator(
  projectId: string,
  email: string,
  bodyEmail: string,
  prisma: PrismaClient
): Promise<CollaboratorRow> {
  await assertCanModifyProject(projectId, email, prisma);

  const normalizedEmail = normalizeEmail(bodyEmail);
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    throw new CollaboratorServiceError(400, "Invalid collaborator email");
  }

  const existing = await prisma.projectCollaborator.findUnique({
    where: { projectId_collaboratorEmail: { projectId, collaboratorEmail: normalizedEmail } },
  });
  if (existing) {
    throw new CollaboratorServiceError(409, "Collaborator email already invited");
  }

  const row = await prisma.projectCollaborator.create({
    data: { projectId, collaboratorEmail: normalizedEmail },
  });

  return {
    id: row.id,
    projectId: row.projectId,
    collaboratorEmail: row.collaboratorEmail,
  };
}

/**
 * Remove a collaborator by email on a project the caller owns or is a collaborator of.
 * Validates ownership (403) first, then looks up and deletes the collaborator row by email.
 */
export async function removeCollaborator(
  projectId: string,
  email: string,
  bodyEmail: string,
  prisma: PrismaClient
): Promise<void> {
  await assertCanModifyProject(projectId, email, prisma);

  const normalizedEmail = normalizeEmail(bodyEmail);
  const row = await prisma.projectCollaborator.findUnique({
    where: { projectId_collaboratorEmail: { projectId, collaboratorEmail: normalizedEmail } },
  });

  if (!row) {
    throw new CollaboratorServiceError(404, "Collaborator not found");
  }

  await prisma.projectCollaborator.delete({ where: { id: row.id } });
}
