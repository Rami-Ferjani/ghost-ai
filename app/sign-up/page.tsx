"use client";

import { SignUp } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.replace("/editor");
    }
  }, [isSignedIn, router]);

  return (
    <section className="flex min-h-screen bg-background text-foreground">
      {/* Large‑screen two‑panel layout */}
      <div className="hidden w-1/2 flex items-center justify-center bg-surface lg:flex lg:flex-col p-8">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold mb-4 text-primary">Join Ghost AI</h1>
          <p className="mb-6 text-secondary">Create your account to start designing systems with AI.</p>
        </div>
      </div>

      {/* Right – form only on small screens or centered on large */}
      <div className="flex w-full flex-1 items-center justify-center p-8">
        <SignUp
          appearance={{
            variables: {
              colorBackground: "var(--bg-base)",
              colorForeground: "var(--text-primary)",
              colorPrimary: "var(--accent-primary)",
              colorPrimaryForeground: "var(--bg-base)",
              colorBorder: "var(--border-default)",
              colorInput: "var(--bg-surface)",
              colorInputForeground: "var(--text-primary)",
            }
          }}
        />
      </div>
    </section>
  );
}
