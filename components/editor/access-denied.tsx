import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center h-screen text-center px-6">
    <Lock className="h-12 w-12 text-muted-foreground mb-4" />
    <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
    <p className="text-muted-foreground mb-6 max-w-sm">
      You do not have permission to access this project.
    </p>
    <Link
      href="/editor"
      className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Projects
    </Link>
  </div>
);