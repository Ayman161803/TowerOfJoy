import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { redirect } from "next/navigation";
import { createActivityAction } from "@/app/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function CalendarPage() {
  const viewDate = new Date();
  let pageActivities: Array<{
    id: string;
    date: string;
    title: string;
    type: "call" | "watch-party" | "game-night" | "visit";
  }> = [];

  if (hasSupabaseConfig()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/auth/sign-in?redirectTo=/calendar");
    }

    const { data: member } = await supabase
      .from("couple_members")
      .select("space_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (member?.space_id) {
      const { data } = await supabase
        .from("activities")
        .select("id, activity_date, title, activity_type")
        .eq("space_id", member.space_id)
        .order("activity_date", { ascending: true });

      pageActivities = (data ?? []).map((activity) => ({
        id: activity.id,
        date: activity.activity_date,
        title: activity.title,
        type: (activity.activity_type ?? "call") as "call" | "watch-party" | "game-night" | "visit",
      }));
    } else {
      pageActivities = [];
    }
  }

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-10 pt-6 md:px-8">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-strong)]">Shared Calendar</p>
          <h1 className="app-title mt-2 text-4xl">{format(viewDate, "MMMM yyyy")}</h1>
        </div>
        <form action={createActivityAction} className="flex flex-wrap gap-2">
          <input
            name="title"
            required
            placeholder="Movie night"
            className="rounded-xl border border-[var(--panel-stroke)] bg-white px-3 py-2 text-sm"
          />
          <input
            name="activityDate"
            type="date"
            required
            className="rounded-xl border border-[var(--panel-stroke)] bg-white px-3 py-2 text-sm"
          />
          <select name="activityType" className="rounded-xl border border-[var(--panel-stroke)] bg-white px-3 py-2 text-sm">
            <option value="call">call</option>
            <option value="watch-party">watch-party</option>
            <option value="game-night">game-night</option>
            <option value="visit">visit</option>
          </select>
          <button className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">+ Add</button>
        </form>
      </section>

      <section className="app-panel overflow-hidden p-4">
        <div className="mb-2 grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <p key={day} className="px-2 text-xs uppercase tracking-[0.14em] text-[#6f6558]">
              {day}
            </p>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const dayActivities = pageActivities.filter((activity) => activity.date === dayKey);

            return (
              <div
                key={dayKey}
                className="min-h-28 rounded-lg border border-[var(--panel-stroke)] bg-white/75 p-2"
              >
                <p
                  className={[
                    "w-fit rounded-full px-2 text-xs",
                    isToday(day)
                      ? "bg-[var(--accent)] text-white"
                      : isSameMonth(day, viewDate)
                        ? "bg-[#efe6d8]"
                        : "bg-[#e8e8e8] text-[#868686]",
                  ].join(" ")}
                >
                  {format(day, "d")}
                </p>
                <div className="mt-2 flex flex-col gap-1">
                  {dayActivities.map((activity) => (
                    <p key={activity.id} className="rounded-md bg-[#f2dfd7] px-2 py-1 text-[11px] leading-tight">
                      {activity.title}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="app-panel p-4">
        <h2 className="app-title text-2xl">Upcoming in 14 Days</h2>
        <div className="mt-3 grid gap-2">
          {pageActivities
            .filter((activity) => {
              const date = new Date(activity.date);
              return date <= addDays(viewDate, 14) && date >= viewDate;
            })
            .map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between rounded-lg border border-[var(--panel-stroke)] bg-white/70 px-3 py-2"
              >
                <p className="font-medium">{activity.title}</p>
                <p className="text-sm text-[#6f6558]">{format(new Date(activity.date), "EEE, MMM d")}</p>
              </div>
            ))}
        </div>
      </section>
    </main>
  );
}
