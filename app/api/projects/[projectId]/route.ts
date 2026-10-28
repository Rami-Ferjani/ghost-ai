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

  let body: { name?: string };
  try {
    body = (await req.json()) as { name?: string };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: { name: body.name || project.name },
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