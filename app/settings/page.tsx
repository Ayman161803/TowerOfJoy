import { redirect } from "next/navigation";
import {
  createCoupleSpaceAction,
  joinCoupleWithCodeAction,
  regenerateInviteCodeAction,
  signOutAction,
} from "@/app/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const snapshot = {
    coupleName: "Our Space",
    yourTimezone: "UTC",
    partnerTimezone: "Partner not set",
    timezoneGap: "Set with your partner",
    hasSpace: false,
    inviteCode: "Not generated",
    inviteExpiresAt: "",
    userEmail: "",
  };

  if (hasSupabaseConfig()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/auth/sign-in?redirectTo=/settings");
    }

    snapshot.userEmail = user.email ?? "";

    const [{ data: profile }, { data: member }] = await Promise.all([
      supabase.from("profiles").select("timezone").eq("id", user.id).maybeSingle(),
      supabase.from("couple_members").select("space_id").eq("user_id", user.id).maybeSingle(),
    ]);

    if (profile?.timezone) {
      snapshot.yourTimezone = profile.timezone;
    }

    if (member?.space_id) {
      snapshot.hasSpace = true;

      const [{ data: space }, { data: members }, { data: invite }] = await Promise.all([
        supabase.from("couple_spaces").select("couple_name").eq("id", member.space_id).single(),
        supabase
          .from("couple_members")
          .select("profiles:profiles!inner(timezone)")
          .eq("space_id", member.space_id),
        supabase
          .from("couple_invites")
          .select("invite_code, expires_at")
          .eq("space_id", member.space_id)
          .is("used_at", null)
          .order("created_at", { ascending: false })
          .maybeSingle(),
      ]);

      snapshot.coupleName = space?.couple_name ?? snapshot.coupleName;
      snapshot.inviteCode = invite?.invite_code ?? snapshot.inviteCode;
      snapshot.inviteExpiresAt = invite?.expires_at ? new Date(invite.expires_at).toLocaleString() : "";

      const zones = (members ?? [])
        .map((m) => {
          const item = (m as { profiles?: { timezone?: string } }).profiles;
          return item?.timezone;
        })
        .filter(Boolean) as string[];

      snapshot.partnerTimezone = zones.find((zone) => zone !== snapshot.yourTimezone) ?? "Partner not set";
      snapshot.timezoneGap = "Set with your partner";
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-10 pt-6 md:px-8">
      <section>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-strong)]">Workspace Settings</p>
        <h1 className="app-title mt-2 text-4xl">Couple Space</h1>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="app-panel p-5">
          <h2 className="app-title text-2xl">Profile Snapshot</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4 border-b border-[var(--panel-stroke)] pb-2">
              <dt className="muted">Couple Name</dt>
              <dd className="font-semibold">{snapshot.coupleName}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-[var(--panel-stroke)] pb-2">
              <dt className="muted">Your Timezone</dt>
              <dd className="font-semibold">{snapshot.yourTimezone}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-[var(--panel-stroke)] pb-2">
              <dt className="muted">Partner Timezone</dt>
              <dd className="font-semibold">{snapshot.partnerTimezone}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="muted">Gap</dt>
              <dd className="font-semibold">{snapshot.timezoneGap}</dd>
            </div>
            {snapshot.userEmail && (
              <div className="flex justify-between gap-4 border-t border-[var(--panel-stroke)] pt-2">
                <dt className="muted">Signed In</dt>
                <dd className="font-semibold">{snapshot.userEmail}</dd>
              </div>
            )}
          </dl>
          <form action={signOutAction} className="mt-4">
            <button className="rounded-lg border border-[var(--panel-stroke)] bg-white px-4 py-2 text-sm font-semibold">
              Sign Out
            </button>
          </form>
        </div>

        <div className="app-panel p-5">
          <h2 className="app-title text-2xl">Invite & Access</h2>
          <p className="muted mt-2 text-sm">This workspace supports exactly two members.</p>
          <div className="mt-4 rounded-lg border border-[var(--panel-stroke)] bg-white p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--accent-strong)]">Active Invite Code</p>
            <p className="mt-2 text-2xl font-semibold tracking-[0.15em]">{snapshot.inviteCode}</p>
            <p className="muted mt-1 text-xs">
              {snapshot.inviteExpiresAt ? `Expires at ${snapshot.inviteExpiresAt}` : "Generate a code to invite your partner."}
            </p>
          </div>

          {snapshot.hasSpace ? (
            <form action={regenerateInviteCodeAction} className="mt-4">
              <button className="rounded-lg border border-[var(--panel-stroke)] bg-white px-4 py-2 text-sm font-semibold">
                Regenerate Code
              </button>
            </form>
          ) : (
            <div className="mt-4 space-y-4">
              <form action={createCoupleSpaceAction} className="space-y-2 rounded-lg border border-[var(--panel-stroke)] bg-white p-3">
                <h3 className="font-semibold">Create Couple Space</h3>
                <input
                  name="coupleName"
                  placeholder="A + B"
                  required
                  className="w-full rounded-lg border border-[var(--panel-stroke)] px-3 py-2 text-sm"
                />
                <input
                  name="yourTimezone"
                  placeholder="America/Los_Angeles"
                  required
                  className="w-full rounded-lg border border-[var(--panel-stroke)] px-3 py-2 text-sm"
                />
                <button className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">
                  Create Space
                </button>
              </form>

              <form action={joinCoupleWithCodeAction} className="space-y-2 rounded-lg border border-[var(--panel-stroke)] bg-white p-3">
                <h3 className="font-semibold">Join With Invite Code</h3>
                <input
                  name="inviteCode"
                  placeholder="LDR-1234"
                  required
                  className="w-full rounded-lg border border-[var(--panel-stroke)] px-3 py-2 text-sm uppercase"
                />
                <button className="rounded-lg border border-[var(--panel-stroke)] bg-white px-4 py-2 text-sm font-semibold">
                  Join Space
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      {(params.error || params.message) && (
        <section className="app-panel p-4 text-sm">
          {params.error ? `Error: ${decodeURIComponent(params.error)}` : `Success: ${decodeURIComponent(params.message ?? "")}`}
        </section>
      )}
    </main>
  );
}
