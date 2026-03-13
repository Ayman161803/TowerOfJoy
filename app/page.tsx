import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export default async function Home() {
  let totalTasks = 0;
  let completed = 0;
  let totalMemories = 0;
  let timezoneGap = "Set timezone in Settings";

  if (hasSupabaseConfig()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/auth/sign-in");
    }

    const { data: member } = await supabase
      .from("couple_members")
      .select("space_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (member?.space_id) {
      const [{ count: taskCount }, { count: doneCount }, { count: memoryCount }, { data: profile }] =
        await Promise.all([
          supabase.from("tasks").select("id", { count: "exact", head: true }).eq("space_id", member.space_id),
          supabase
            .from("tasks")
            .select("id", { count: "exact", head: true })
            .eq("space_id", member.space_id)
            .eq("status", "done"),
          supabase.from("memories").select("id", { count: "exact", head: true }).eq("space_id", member.space_id),
          supabase.from("profiles").select("timezone").eq("id", user.id).maybeSingle(),
        ]);

      totalTasks = taskCount ?? 0;
      completed = doneCount ?? 0;
      totalMemories = memoryCount ?? 0;
      timezoneGap = profile?.timezone ? `Your zone: ${profile.timezone}` : "Set timezone in Settings";
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-10 pt-6 md:px-8">
      <section className="app-panel p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-strong)]">
          Relationship HQ
        </p>
        <h1 className="app-title mt-2 text-4xl leading-tight md:text-5xl">
          Build your distance-proof routine.
        </h1>
        <p className="muted mt-3 max-w-3xl text-sm md:text-base">
          TowerOfJoy is your planning board, date calendar, and memory timeline in one shared
          space for two.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <StatCard label="Shared Goals" value={String(totalTasks)} />
          <StatCard label="Completed" value={String(completed)} />
          <StatCard label="Memories" value={String(totalMemories)} />
          <StatCard label="Timezone" value={timezoneGap} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
          <Link
            href="/board"
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-white transition hover:bg-[var(--accent-strong)]"
          >
            Open Board
          </Link>
          <Link href="/calendar" className="rounded-xl border border-[var(--panel-stroke)] px-4 py-2">
            Open Calendar
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <QuickLink
          href="/board"
          title="Jira-style Board"
          text="Track planned, in-progress, and done moments together."
        />
        <QuickLink
          href="/calendar"
          title="Shared Calendar"
          text="Schedule calls, movie nights, and visits in one timeline."
        />
        <QuickLink
          href="/memories"
          title="Memory Journal"
          text="Capture stories and photos so they stay easy to revisit."
        />
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--panel-stroke)] bg-white/70 p-3">
      <p className="muted text-xs uppercase tracking-[0.15em]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  text,
}: {
  href: string;
  title: string;
  text: string;
}) {
  return (
    <Link href={href} className="app-panel block p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <h2 className="app-title text-2xl">{title}</h2>
      <p className="muted mt-2 text-sm">{text}</p>
    </Link>
  );
}
