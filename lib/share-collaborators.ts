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
 * Enforce access for read operations: allow owners OR collaborators.
 * Returns 403 otherwise.
 */
async function assertCanReadProject(
  projectId: string,
  userId: string,
  email: string,
  prisma: PrismaClient
): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new CollaboratorServiceError(403, "Forbidden");
  }

  // Owners have explicit access to all project operations
  const isOwner = project.ownerId === userId;

  // Only collaborators have explicit access to list collaborators
  const isCollaborator = await prisma.projectCollaborator.findUnique({
    where: { projectId_collaboratorEmail: { projectId, collaboratorEmail: email } },
  });

  if (!isOwner && !isCollaborator) {
    throw new CollaboratorServiceError(403, "Forbidden");
  }
}

/**
 * Enforce server-side ownership for mutations: caller must own the project.
 * Returns 403 otherwise.
 */
async function assertCanMutateProject(
  projectId: string,
  userId: string,
  email: string,
  prisma: PrismaClient
): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new CollaboratorServiceError(403, "Forbidden");
  }

  // Only owners can invite or remove collaborators
  const isOwner = project.ownerId === userId;

  if (!isOwner) {
    throw new CollaboratorServiceError(403, "Forbidden");
  }
}

/**
 * List collaborators of a project the caller may access (owner or collaborator).
 */
export async function getCollaborators(
  projectId: string,
  userId: string,
  email: string,
  prisma: PrismaClient
): Promise<CollaboratorRow[]> {
  await assertCanReadProject(projectId, userId, email, prisma);

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
  userId: string,
  email: string,
  bodyEmail: string,
  prisma: PrismaClient
): Promise<CollaboratorRow> {
  await assertCanMutateProject(projectId, userId, email, prisma);

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

  try {
    const row = await prisma.projectCollaborator.create({
      data: { projectId, collaboratorEmail: normalizedEmail },
    });
    return {
      id: row.id,
      projectId: row.projectId,
      collaboratorEmail: row.collaboratorEmail,
    };
  } catch (err) {
    // Handle Prisma P2002 unique-constraint failure (duplicate email)
    const prismaErr = err as { code?: string };
    if (prismaErr.code === "P2002") {
      throw new CollaboratorServiceError(409, "Collaborator email already invited");
    }
    throw err;
  }
}

/**
 * Remove a collaborator by email on a project the caller owns or is a collaborator of.
 * Validates ownership (403) first, then looks up and deletes the collaborator row by email.
 */
export async function removeCollaborator(
  projectId: string,
  userId: string,
  email: string,
  bodyEmail: string,
  prisma: PrismaClient
): Promise<void> {
  await assertCanMutateProject(projectId, userId, email, prisma);

  const normalizedEmail = normalizeEmail(bodyEmail);
  const row = await prisma.projectCollaborator.findUnique({
    where: { projectId_collaboratorEmail: { projectId, collaboratorEmail: normalizedEmail } },
  });

  if (!row) {
    throw new CollaboratorServiceError(404, "Collaborator not found");
  }

  await prisma.projectCollaborator.delete({ where: { id: row.id } });
}