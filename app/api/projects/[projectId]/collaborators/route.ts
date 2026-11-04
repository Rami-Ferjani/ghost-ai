import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPrismaClient } from "@/lib/prisma";
import { fetchCollaboratorByEmail } from "@/lib/share-dialog-helpers";
import {
  CollaboratorServiceError,
  getCollaborators,
  inviteCollaborator,
  removeCollaborator,
} from "@/lib/share-collaborators";

export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clerkClient();
  const user = userId ? await client.users.getUser(userId) : null;
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  const { projectId } = await params;
  const prisma = getPrismaClient();

  try {
    const rows = await getCollaborators(projectId, userId, email, prisma);

    const enriched = await Promise.all(
      rows.map((row) => fetchCollaboratorByEmail(row.collaboratorEmail)),
    );

    return Response.json({ collaborators: enriched });
  } catch (err) {
    if (err instanceof CollaboratorServiceError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clerkClient();
  const user = userId ? await client.users.getUser(userId) : null;
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  const { projectId } = await params;
  const prisma = getPrismaClient();

  let body: unknown;
  try {
    body = (await req.json()) as unknown;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const bodyEmail = (body as { email?: unknown }).email;
  if (typeof bodyEmail !== "string") {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const collaborator = await inviteCollaborator(
      projectId,
      userId,
      email,
      bodyEmail,
      prisma,
    );
    return Response.json({ collaborator });
  } catch (err) {
    if (err instanceof CollaboratorServiceError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clerkClient();
  const user = userId ? await client.users.getUser(userId) : null;
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  const { projectId } = await params;
  const prisma = getPrismaClient();

  let body: unknown;
  try {
    body = (await req.json()) as unknown;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const bodyEmail = (body as { email?: unknown }).email;
  if (typeof bodyEmail !== "string") {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    await removeCollaborator(projectId, userId, email, bodyEmail, prisma);
    return Response.json({ success: true });
  } catch (err) {
    if (err instanceof CollaboratorServiceError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}