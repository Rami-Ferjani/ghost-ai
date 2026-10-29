import { auth } from "@clerk/nextjs/server";
import { getPrismaClient } from "@/lib/prisma";

export async function POST(req: Request) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrismaClient();

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

  const projectName = bodyName !== undefined ? bodyName.trim() : "";
  const project = await prisma.project.create({
    data: {
      ownerId: userId,
      name: projectName || "Untitled Project",
      canvasJsonPath: "",
    },
  });

  return Response.json(project, { status: 201 });
}