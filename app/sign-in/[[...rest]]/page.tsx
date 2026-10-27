"use client";

import { SignIn } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Page background with subtle vertical guide lines
const PAGE_STYLES = `
  .ghost-signin-page-bg {
    background-color: var(--bg-charcoal);
    position: relative;
    overflow: hidden;
  }

  .ghost-signin-page-bg::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: repeating-linear-gradient(
      90deg,
      transparent 0%,
      var(--guide-line) 1px,
      transparent 100%
    );
    opacity: 0.6;
    pointer-events: none;
  }

  .ghost-signin-left-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 4rem 3rem;
    max-width: 42ch;
  }

  .ghost-signin-left-content h1 {
    font-family: var(--font-inter), var(--font-sans);
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.75rem;
    line-height: 1.2;
  }

  .ghost-signin-left-content p.subtitle {
    font-size: 1rem;
    color: var(--text-secondary);
    margin-bottom: 2.5rem;
    line-height: 1.5;
  }

  .ghost-signin-left-content .features {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .ghost-signin-left-content .features li {
    color: var(--text-muted);
    font-size: 0.95rem;
    line-height: 1.6;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .ghost-signin-left-content .features li::before {
    content: "—";
    color: var(--accent-primary);
    font-weight: 500;
    flex-shrink: 0;
  }

  .ghost-signin-left-content .cursor-icon {
    width: 18px;
    height: 18px;
    color: var(--accent-primary);
    opacity: 0.7;
    margin-bottom: 1.5rem;
  }

  /* Clerk SignIn card wrapper */
  .ghost-signin-card-wrapper {
    position: relative;
    width: 420px;
    min-height: 560px;
    display: flex;
    flex-direction: column;
  }

  /* Card footer with pattern */
  .ghost-signin-card-footer {
    margin-top: auto;
    padding: 1rem 2rem;
    background-color: var(--footer-bg);
    background-image: repeating-linear-gradient(
      45deg,
      transparent 0%,
      var(--footer-stripe) 1px,
      transparent 3px
    );
    border-top: 1px solid var(--border-default);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .ghost-signin-card-footer .secured-text {
    font-size: 0.75rem;
    color: var(--footer-text);
    opacity: 0.8;
  }

  .ghost-signin-card-footer .mode-text {
    font-size: 0.75rem;
    color: var(--footer-mode);
    opacity: 0.9;
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
    <section
      className="flex min-h-screen items-center justify-center ghost-signin-page-bg"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Left column: brand text and features */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center">
        <div className="ghost-signin-left-content">
          {/* Cursor icon */}
          <svg
            className="cursor-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3l7.07 13.07 1.41-1.41L5.89 16.29 8.89 19.29 11.89 16.29 10.48 14.88 13.48 17.88 16.48 14.88 15.07 13.47 18.07 16.47 21.07 13.47 19.66 12.06 22.66 15.06 19.66 12.06 18.25 10.65 21.25 13.65 18.25 10.65 16.84 9.24 19.84 12.24 16.84 9.24 15.43 7.83 18.43 10.83 15.43 7.83 14.02 6.42 17.02 9.42 14.02 6.42 12.61 5.01 15.61 8.01 12.61 5.01 11.2 3.6 14.2 6.6 11.2 3.6 9.79 2.19 12.79 5.19 9.79 2.19 8.38 0.78 11.38 3.78 8.38 0.78" />
          </svg>

          <h1 className="ghost-signin-left-content h1">Ghost AI</h1>
          <p className="ghost-signin-left-content subtitle">Design systems, in seconds.</p>
          <ul className="ghost-signin-left-content features">
            <li>AI-generated system designs from plain language</li>
            <li>Real-time collaborative canvas with live cursors</li>
            <li>One-click technical spec export</li>
          </ul>
        </div>
      </div>

      {/* Right column: login card */}
      <div className="flex w-full flex-1 items-center justify-center p-4 lg:p-8">
        <div className="ghost-signin-card-wrapper">
          {/* Clerk SignIn form */}
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
              },
            }}
          />

          {/* Card footer with pattern */}
          <div className="ghost-signin-card-footer">
            <span className="secured-text">Secured by Clerk</span>
            <span className="mode-text">Development mode</span>
          </div>
        </div>
      </div>

      {/* Custom CSS injected into the page */}
      <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />
    </section>
  );
}