import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getProjectsForUser } from "@/lib/projects";
import { EditorClient } from "@/components/editor/editor-client";

export default async function EditorPage() {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) {
    redirect("/sign-in");
  }

  const { ownedProjects, sharedProjects } = await getProjectsForUser(userId);

  return (
    <EditorClient
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
      currentUserId={userId}
    />
  );
}
