import Image from "next/image";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import { createMemoryAction } from "@/app/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export default async function MemoriesPage() {
  let entries: Array<{
    id: string;
    title: string;
    entryDate: string;
    body: string;
    tags: string[];
    imageUrl?: string;
  }> = [];

  if (hasSupabaseConfig()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/auth/sign-in?redirectTo=/memories");
    }

    const { data: member } = await supabase
      .from("couple_members")
      .select("space_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (member?.space_id) {
      const { data } = await supabase
        .from("memories")
        .select("id, title, entry_date, body, tags, image_url")
        .eq("space_id", member.space_id)
        .order("entry_date", { ascending: false });

      entries = (data ?? []).map((entry) => ({
        id: entry.id,
        title: entry.title,
        entryDate: entry.entry_date,
        body: entry.body,
        tags: entry.tags ?? [],
        imageUrl: entry.image_url ?? undefined,
      }));
    } else {
      entries = [];
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-10 pt-6 md:px-8">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-strong)]">Memory Journal</p>
          <h1 className="app-title mt-2 text-4xl">Stories Worth Keeping</h1>
          <p className="muted mt-2 text-sm">Capture moments with notes and photos, then revisit them together.</p>
        </div>
        <form action={createMemoryAction} className="grid gap-2 md:grid-cols-5">
          <input
            name="title"
            required
            placeholder="Title"
            className="rounded-xl border border-[var(--panel-stroke)] bg-white px-3 py-2 text-sm"
          />
          <input
            name="entryDate"
            type="date"
            required
            className="rounded-xl border border-[var(--panel-stroke)] bg-white px-3 py-2 text-sm"
          />
          <input
            name="tags"
            placeholder="tags,comma,separated"
            className="rounded-xl border border-[var(--panel-stroke)] bg-white px-3 py-2 text-sm"
          />
          <input
            name="imageUrl"
            placeholder="Image URL (optional)"
            className="rounded-xl border border-[var(--panel-stroke)] bg-white px-3 py-2 text-sm"
          />
          <button className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]">
            + New Memory
          </button>
          <textarea
            name="body"
            required
            placeholder="What happened?"
            className="rounded-xl border border-[var(--panel-stroke)] bg-white px-3 py-2 text-sm md:col-span-5"
          />
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {entries.map((entry) => (
          <article key={entry.id} className="app-panel overflow-hidden">
            {entry.imageUrl ? (
              <div className="relative h-48 w-full">
                <Image src={entry.imageUrl} alt={entry.title} fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="h-24 w-full bg-gradient-to-r from-[#f5d9ca] via-[#f0e8d9] to-[#d6e8f0]" />
            )}
            <div className="p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-[var(--accent-strong)]">
                {format(new Date(entry.entryDate), "MMM d, yyyy")}
              </p>
              <h2 className="app-title mt-2 text-2xl">{entry.title}</h2>
              <p className="muted mt-2 text-sm">{entry.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--panel-stroke)] bg-white px-2 py-0.5 text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
