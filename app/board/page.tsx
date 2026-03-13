import { format } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";
import { advanceTaskStatusAction, createTaskAction, deleteTaskAction } from "@/app/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import type { TaskStatus } from "@/lib/types";

const boardColumns: { key: TaskStatus; title: string }[] = [
  { key: "planned", title: "Planned" },
  { key: "in_progress", title: "In Progress" },
  { key: "done", title: "Done" },
];

export default async function BoardPage() {
  let boardTasks: Array<{
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    dueDate: string;
    activityType: "call" | "watch-party" | "game-night" | "visit";
    assignee: "You" | "Partner" | "Both";
  }> = [];
  let hasSpace = true;

  if (hasSupabaseConfig()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/auth/sign-in?redirectTo=/board");
    }

    const { data: member } = await supabase
      .from("couple_members")
      .select("space_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!member?.space_id) {
      hasSpace = false;
      boardTasks = [];
    } else {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, description, status, due_date, activity_type, assignee")
        .eq("space_id", member.space_id)
        .order("created_at", { ascending: false });

      boardTasks = (data ?? []).map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status as TaskStatus,
        dueDate: task.due_date ?? new Date().toISOString().slice(0, 10),
        activityType: (task.activity_type ?? "call") as "call" | "watch-party" | "game-night" | "visit",
        assignee: (task.assignee ?? "Both") as "You" | "Partner" | "Both",
      }));
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-10 pt-6 md:px-8">
      <section>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-strong)]">Planning Board</p>
        <h1 className="app-title mt-2 text-4xl">Your Couple Sprint</h1>
        <p className="muted mt-2 text-sm">Move activities from planned to done as you build shared routines.</p>
      </section>

      {!hasSpace && (
        <section className="app-panel p-5">
          <p className="text-sm">Create or join a couple space first to start tracking tasks.</p>
          <Link href="/settings" className="mt-3 inline-block rounded-lg bg-[var(--accent)] px-3 py-2 text-sm text-white">
            Open Settings
          </Link>
        </section>
      )}

      {hasSpace && (
        <section className="app-panel p-5">
          <h2 className="app-title text-2xl">Add New Task</h2>
          <form action={createTaskAction} className="mt-4 grid gap-3 md:grid-cols-6">
            <input
              name="title"
              required
              placeholder="Plan Sunday call"
              className="rounded-lg border border-[var(--panel-stroke)] bg-white px-3 py-2 text-sm md:col-span-2"
            />
            <input
              name="description"
              placeholder="What you want to cover"
              className="rounded-lg border border-[var(--panel-stroke)] bg-white px-3 py-2 text-sm md:col-span-2"
            />
            <input
              name="dueDate"
              type="date"
              className="rounded-lg border border-[var(--panel-stroke)] bg-white px-3 py-2 text-sm"
            />
            <select name="assignee" className="rounded-lg border border-[var(--panel-stroke)] bg-white px-3 py-2 text-sm">
              <option>Both</option>
              <option>You</option>
              <option>Partner</option>
            </select>
            <select name="activityType" className="rounded-lg border border-[var(--panel-stroke)] bg-white px-3 py-2 text-sm md:col-span-2">
              <option value="call">call</option>
              <option value="watch-party">watch-party</option>
              <option value="game-night">game-night</option>
              <option value="visit">visit</option>
            </select>
            <button className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white md:col-span-1">
              Add
            </button>
          </form>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {boardColumns.map((column) => {
          const columnTasks = boardTasks.filter((task) => task.status === column.key);

          return (
            <div key={column.key} className="app-panel flex min-h-72 flex-col p-4">
              <div className="flex items-center justify-between border-b border-[var(--panel-stroke)] pb-3">
                <h2 className="app-title text-2xl">{column.title}</h2>
                <span className="rounded-full bg-[#f2e5d7] px-2 py-0.5 text-xs font-semibold">{columnTasks.length}</span>
              </div>
              <div className="mt-3 flex flex-col gap-3">
                {columnTasks.map((task) => (
                  <article key={task.id} className="rounded-xl border border-[var(--panel-stroke)] bg-white/80 p-3">
                    <p className="text-xs uppercase tracking-[0.08em] text-[var(--accent-strong)]">
                      {task.activityType} · {task.assignee}
                    </p>
                    <h3 className="mt-1 font-semibold">{task.title}</h3>
                    <p className="muted mt-1 text-sm">{task.description}</p>
                    <p className="mt-3 text-xs text-[#4f5358]">Due {format(new Date(task.dueDate), "MMM d, yyyy")}</p>
                    <div className="mt-3 flex gap-2">
                      {task.status !== "done" && (
                        <form action={advanceTaskStatusAction}>
                          <input type="hidden" name="taskId" value={task.id} />
                          <input type="hidden" name="currentStatus" value={task.status} />
                          <button className="rounded-md border border-[var(--panel-stroke)] bg-white px-2 py-1 text-xs font-semibold">
                            Move Forward
                          </button>
                        </form>
                      )}
                      <form action={deleteTaskAction}>
                        <input type="hidden" name="taskId" value={task.id} />
                        <button className="rounded-md border border-[var(--panel-stroke)] bg-white px-2 py-1 text-xs font-semibold">
                          Delete
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
                {columnTasks.length === 0 && <p className="muted text-sm">No items yet.</p>}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
