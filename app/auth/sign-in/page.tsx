import { signInAction, signUpAction } from "@/app/actions";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; redirectTo?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirectTo ?? "/";

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl items-center px-4 py-10 md:px-8">
      <section className="grid w-full gap-6 md:grid-cols-2">
        <article className="app-panel p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-strong)]">Welcome Back</p>
          <h1 className="app-title mt-2 text-4xl">Sign in to your space</h1>
          <p className="muted mt-2 text-sm">Use your account to continue tracking plans and memories together.</p>

          <form action={signInAction} className="mt-6 space-y-3">
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <label className="block text-sm font-medium" htmlFor="sign-in-email">
              Email
            </label>
            <input
              id="sign-in-email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-[var(--panel-stroke)] bg-white px-3 py-2 text-sm"
            />
            <label className="block text-sm font-medium" htmlFor="sign-in-password">
              Password
            </label>
            <input
              id="sign-in-password"
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-[var(--panel-stroke)] bg-white px-3 py-2 text-sm"
            />
            <button className="w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">
              Sign In
            </button>
          </form>
        </article>

        <article className="app-panel p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-strong)]">New Here</p>
          <h2 className="app-title mt-2 text-4xl">Create account</h2>
          <p className="muted mt-2 text-sm">Sign up first, then create or join your couple space in Settings.</p>

          <form action={signUpAction} className="mt-6 space-y-3">
            <label className="block text-sm font-medium" htmlFor="sign-up-email">
              Email
            </label>
            <input
              id="sign-up-email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-[var(--panel-stroke)] bg-white px-3 py-2 text-sm"
            />
            <label className="block text-sm font-medium" htmlFor="sign-up-password">
              Password
            </label>
            <input
              id="sign-up-password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-lg border border-[var(--panel-stroke)] bg-white px-3 py-2 text-sm"
            />
            <button className="w-full rounded-lg border border-[var(--panel-stroke)] bg-white px-4 py-2 text-sm font-semibold">
              Create Account
            </button>
          </form>
        </article>
      </section>

      {(params.error || params.message) && (
        <div className="fixed bottom-4 right-4 rounded-lg border border-[var(--panel-stroke)] bg-white px-4 py-3 text-sm shadow">
          {params.error ? `Error: ${decodeURIComponent(params.error)}` : "Account created. You can now sign in."}
        </div>
      )}
    </main>
  );
}
