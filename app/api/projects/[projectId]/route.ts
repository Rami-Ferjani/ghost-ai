import { auth } from "@clerk/nextjs/server";
import { getPrismaClient } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const prisma = getPrismaClient();
  const project = await prisma.project.findUnique({
    where: { id: projectId, ownerId: userId },
  });

  if (!project) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = (await req.json()) as unknown;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate body is a non-null object
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate name if present - must be a string
  const bodyName = (body as { name?: string }).name;
  if (bodyName !== undefined && typeof bodyName !== "string") {
    return Response.json({ error: "Project name must be a string" }, { status: 400 });
  }

  // Reject empty names before updating; keep existing name if no bodyName
  if (bodyName !== undefined && bodyName.trim() === "") {
    return Response.json({ error: "Project name cannot be empty" }, { status: 400 });
  }

  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: { name: bodyName ?? project.name },
  });

  return Response.json(updatedProject);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const prisma = getPrismaClient();
  const project = await prisma.project.findUnique({
    where: { id: projectId, ownerId: userId },
  });

  if (!project) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.project.delete({
    where: { id: projectId },
  });

  return Response.json({ success: true });
}