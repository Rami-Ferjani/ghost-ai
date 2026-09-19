import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <section className="flex min-h-screen bg-background text-foreground">
      {/* Large‑screen two‑panel layout */}
      <div className="hidden w-1/2 items-center justify-center bg-sidebar lg:flex lg:flex-col p-8">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold mb-4">Join Ghost AI</h1>
          <p className="mb-6">Create your account to start designing systems with AI.</p>
        </div>
      </div>

      {/* Right – form only on small screens or centered on large */}
      <div className="flex w-full flex-1 items-center justify-center p-8">
        <SignUp
          redirectUrl="/editor"
          appearance={{ baseTheme: "dark" }}
        />
      </div>
    </section>
  );
}
