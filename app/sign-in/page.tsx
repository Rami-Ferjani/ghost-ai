"use client";

import { SignIn } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Custom left panel styles - does not modify Clerk's SignInProps at all
const LEFT_PANEL_STYLES = `
  .ghost-signin-left-panel {
    background: linear-gradient(135deg, var(--bg-base) 0%, var(--border-default) 100%);
    backdrop-filter: blur(8px);
    border-right: 1px solid var(--border-default);
  }

  .ghost-signin-left-panel-content {
    padding: 2.5rem;
    max-width: 34ch;
  }

  .ghost-signin-left-panel h2 {
    font-size: var(--copy-primary-lg);
    font-weight: bold;
    color: var(--text-primary);
    margin-bottom: 1.75rem;
    line-height: var(--line-160);
  }

  .ghost-signin-left-panel ul {
    list-style: none;
    padding: 0;
    margin-top: 2rem;
  }

  .ghost-signin-left-panel li {
    color: var(--text-muted);
    font-size: var(--copy-base);
    line-height: var(--line-24);
    margin-bottom: var(--space-md);
    padding-left: var(--indenter-sm);
  }

  .ghost-signin-left-panel li:last-child {
    margin-bottom: 0;
  }
`;

export default function SignInPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.replace("/editor");
    }
  }, [isSignedIn, router]);

  return (
    <section className="flex min-h-screen bg-background text-foreground" style={{ fontFamily: "var(--font-body)" }}>
      {/* Large-screen two-panel layout */}
      <div className="hidden w-1/2 flex items-center justify-center bg-surface lg:flex lg:flex-col p-8">
        <div
          id="ghost-signin-left-panel"
          className="rounded-2xl p-8 border-surface-border bg-gradient-to-br from-surface/90 to-background shadow-sm backdrop-blur-sm w-full h-full flex items-center justify-center relative overflow-hidden"
          style={{ backgroundImage: "linear-gradient(135deg, var(--bg-base) 45%, transparent 50%)", backgroundBlendMode: "overlay" }}
        >
          <div id="ghost-signin-left-panel-content" className="w-full max-w-md">
            <h2 className="mb-0 text-copy-primary-lg leading-relaxed font-bold text-text-primary">
              Ghost AI — real‑time collaborative system design.
            </h2>
            <ul className="mt-5 space-y-4 text-copy-muted">
              <li>AI-generated architecture</li>
              <li>Live collaboration</li>
              <li>Instant spec export</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Form panel — visible on all screen sizes, centered on large */}
      <div className="flex w-full flex-1 items-center justify-center p-8">
        <SignIn
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

      {/* Custom CSS injected into the page for left panel styling */}
      <style dangerouslySetInnerHTML={{ __html: LEFT_PANEL_STYLES }} />
    </section>
  );
}