import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <section className="flex min-h-screen bg-background text-foreground">
      {/* Large‑screen two‑panel layout */}
      <div className="hidden w-1/2 items-center justify-center bg-sidebar lg:flex lg:flex-col p-8">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold mb-4">Ghost AI</h1>
          <p className="mb-6">Real‑time collaborative system design workspace.</p>
          <ul className="list-disc list-inside space-y-2">
            <li>AI‑generated architecture</li>
            <li>Live collaboration</li>
            <li>Instant spec export</li>
          </ul>
        </div>
      </div>

      {/* Right – form only on small screens or centered on large */}
      <div className="flex w-full flex-1 items-center justify-center p-8">
        <SignIn
          redirectUrl="/editor"
          appearance={{ baseTheme: "dark" }}
        />
      </div>
    </section>
  );
}
