import { describe, it } from "node:test";
import assert from "node:assert";
import type { PrismaClient } from "@/app/generated/prisma/client";
import {
  CollaboratorServiceError,
  getCollaborators,
  inviteCollaborator,
  removeCollaborator,
} from "../lib/share-collaborators";
import { MOCK_USER_ID, MOCK_SHARED_USER_ID } from "../lib/mock-projects";

interface MockRow {
  id: string;
  projectId: string;
  collaboratorEmail: string;
}

/**
 * Minimal in-memory mock of the collaborator-facing Prisma surface used by the
 * service. Cast to the real PrismaClient type so the service's DI signature
 * (PrismaClient) is satisfied at compile time; only the collaborator/project
 * operations the service calls are implemented.
 */
class MockPrismaClient {
  // The service addresses collaborator/project clients as `prisma.project` /
  // `prisma.projectCollaborator`; expose the same in-memory store client so the
  // service's DI surface is satisfied without a real database. Both point at the
  // same shared data so only the collaborator/project operations are needed.
  project = this;
  projectCollaborator = this;

  private projects = new Map<string, { id: string; ownerId: string }>();
  private collaborators = new Map<string, MockRow>();
  private nextId = 1;

  constructor(projects: { id: string; ownerId: string }[] = [], collaborators: MockRow[] = []) {
    for (const project of projects) {
      this.projects.set(project.id, { id: project.id, ownerId: project.ownerId });
    }
    for (const row of collaborators) {
      this.collaborators.set(row.projectId, { ...row });
    }
  }

  /** Unwrap the Prisma call shape: `{ where }`, `{ data }`, or `{ where: { id } }` */
  private static unwrap(args: unknown): Record<string, unknown> {
    if (!args || typeof args !== "object") return {};
    return args as Record<string, unknown>;
  }

  async findUnique(args: unknown): Promise<MockRow | { id: string; ownerId: string } | null> {
    const obj = MockPrismaClient.unwrap(args);
    const where = obj.where as Record<string, unknown> | undefined;
    if (!where || typeof where !== "object") return null;

    if ("projectId_collaboratorEmail" in where) {
      const { projectId, collaboratorEmail } = where.projectId_collaboratorEmail as {
        projectId: string;
        collaboratorEmail: string;
      };
      const row = this.collaborators.get(projectId);
      if (row && row.collaboratorEmail === collaboratorEmail) return row;
      return null;
    }

    const id = where.id as string | undefined;
    if (id && this.projects.has(id)) {
      return this.projects.get(id) as { id: string; ownerId: string };
    }
    return null;
  }

  async findMany(args: unknown): Promise<MockRow[]> {
    const obj = MockPrismaClient.unwrap(args);
    const where = obj.where as Record<string, unknown> | undefined;
    if (!where || typeof where !== "object") return [];
    const projectId = where.projectId as string;
    if (!projectId) return [];
    return [...this.collaborators.values()].filter((row) => row.projectId === projectId);
  }

  async create(args: unknown): Promise<MockRow> {
    const obj = MockPrismaClient.unwrap(args);
    const data = obj.data as { projectId: string; collaboratorEmail: string };
    const id = `collab_${this.nextId++}`;
    this.collaborators.set(data.projectId, {
      id,
      projectId: data.projectId,
      collaboratorEmail: data.collaboratorEmail,
    });
    return { id, projectId: data.projectId, collaboratorEmail: data.collaboratorEmail };
  }

  async delete(args: unknown): Promise<MockRow> {
    const obj = MockPrismaClient.unwrap(args);
    const where = obj.where as Record<string, unknown> | undefined;
    if (!where || typeof where !== "object") return { id: "", projectId: "", collaboratorEmail: "" };
    const id = where.id as string | undefined;
    for (const [projectId, row] of this.collaborators) {
      if (row.id === id) {
        this.collaborators.delete(projectId);
        return { id, projectId, collaboratorEmail: row.collaboratorEmail };
      }
    }
    return { id: id ?? "", projectId: "", collaboratorEmail: "" };
  }
}

const OWNER_PROJECT = { id: "p1", ownerId: MOCK_USER_ID };
const SHARED_PROJECT = { id: "p3", ownerId: MOCK_SHARED_USER_ID };

function makeMock(): PrismaClient {
  // Owner is automatically treated as a collaborator of their own project
  // so assertCanMutateProject can recognize them as authorized.
  return new MockPrismaClient([OWNER_PROJECT, SHARED_PROJECT], [
    { id: "collab_owner_1", projectId: OWNER_PROJECT.id, collaboratorEmail: MOCK_USER_ID },
  ]) as unknown as PrismaClient;
}

describe("share-collaborators service contract", () => {
  it("lists collaborators for an owner project", async () => {
    const prisma = makeMock();

    const rows = await getCollaborators(OWNER_PROJECT.id, MOCK_USER_ID, prisma);

    assert.ok(Array.isArray(rows));
    assert.equal(rows.length, 0);
  });

  it("invites a collaborator as owner", async () => {
    const prisma = makeMock();

    const row = await inviteCollaborator(
      OWNER_PROJECT.id,
      MOCK_USER_ID,
      "alice@example.com",
      prisma
    );

    assert.equal(row.projectId, OWNER_PROJECT.id);
    assert.equal(row.collaboratorEmail, "alice@example.com");
  });

  it("rejects duplicate invite with 409", async () => {
    const prisma = makeMock();

    await inviteCollaborator(OWNER_PROJECT.id, MOCK_USER_ID, "alice@example.com", prisma);

    await assert.rejects(
      () =>
        inviteCollaborator(OWNER_PROJECT.id, MOCK_USER_ID, "alice@example.com", prisma),
      (err: CollaboratorServiceError) => err.status === 409
    );
  });

  it("rejects invalid email with 400", async () => {
    const prisma = makeMock();

    await assert.rejects(
      () =>
        inviteCollaborator(OWNER_PROJECT.id, MOCK_USER_ID, "not-an-email", prisma),
      (err: CollaboratorServiceError) => err.status === 400
    );
  });

  it("rejects invite as non-owner with 403", async () => {
    const prisma = makeMock();

    await assert.rejects(
      () =>
        inviteCollaborator(OWNER_PROJECT.id, MOCK_SHARED_USER_ID, "bob@example.com", prisma),
      (err: CollaboratorServiceError) => err.status === 403
    );
  });

  it("rejects remove as non-owner with 403", async () => {
    const prisma = makeMock();

    await inviteCollaborator(OWNER_PROJECT.id, MOCK_USER_ID, "bob@example.com", prisma);

    await assert.rejects(
      () => removeCollaborator(OWNER_PROJECT.id, MOCK_SHARED_USER_ID, "bob@example.com", prisma),
      (err: CollaboratorServiceError) => err.status === 403
    );
  });

  it("removes a collaborator as owner", async () => {
    const prisma = makeMock();

    await inviteCollaborator(OWNER_PROJECT.id, MOCK_USER_ID, "bob@example.com", prisma);

    await assert.doesNotReject(
      () => removeCollaborator(OWNER_PROJECT.id, MOCK_USER_ID, "bob@example.com", prisma)
    );
  });
});