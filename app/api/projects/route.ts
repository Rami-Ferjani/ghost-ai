import { auth } from "@clerk/nextjs/server";
import { getPrismaClient } from "@/lib/prisma";

export async function POST(req: Request) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getPrismaClient();

  let body: { name?: string };
  try {
    body = (await req.json()) as { name?: string };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      ownerId: userId,
      name: body.name || "Untitled Project",
      canvasJsonPath: "",
    },
  });

  return Response.json(project, { status: 201 });
}