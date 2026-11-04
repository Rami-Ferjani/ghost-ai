import { redirect } from "next/navigation";
import { getProjectsForUser } from "@/lib/projects";
import { getCurrentClerkIdentity } from "@/lib/project-access";
import { EditorClient } from "@/components/editor/editor-client";


export default async function EditorPage() {
  const { userId, email } = await getCurrentClerkIdentity();
  if (!userId) {
    redirect("/sign-in");
  }

  const { ownedProjects, sharedProjects } = await getProjectsForUser(userId, email);

  return (
    <EditorClient
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
      currentUserId={userId}
      currentEmail={email}
    />
  );
}