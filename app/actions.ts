"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";

type TaskStatus = "planned" | "in_progress" | "done";

async function getRequiredUserAndSpaceId() {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const { data: member, error } = await supabase
    .from("couple_members")
    .select("space_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    supabase,
    user,
    spaceId: member?.space_id as string | undefined,
  };
}

function toDateInput(value: FormDataEntryValue | null) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function toText(value: FormDataEntryValue | null, fallback = "") {
  if (!value || typeof value !== "string") {
    return fallback;
  }

  return value.trim();
}

export async function signInAction(formData: FormData) {
  if (!hasSupabaseConfig()) {
    redirect("/auth/sign-in?error=missing_env");
  }

  const email = toText(formData.get("email"));
  const password = toText(formData.get("password"));
  const redirectTo = toText(formData.get("redirectTo"), "/");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/auth/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  redirect(redirectTo || "/");
}

export async function signUpAction(formData: FormData) {
  if (!hasSupabaseConfig()) {
    redirect("/auth/sign-in?error=missing_env");
  }

  const email = toText(formData.get("email"));
  const password = toText(formData.get("password"));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/auth/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/auth/sign-in?message=account_created");
}

export async function signOutAction() {
  if (!hasSupabaseConfig()) {
    redirect("/");
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/auth/sign-in");
}

export async function createCoupleSpaceAction(formData: FormData) {
  const { supabase, user, spaceId } = await getRequiredUserAndSpaceId();
  if (spaceId) {
    redirect("/settings?error=already_in_space");
  }

  const coupleName = toText(formData.get("coupleName"), "Our Space");
  const yourTimezone = toText(formData.get("yourTimezone"), "UTC");

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: user.email,
    timezone: yourTimezone,
  });

  if (profileError) {
    redirect(`/settings?error=${encodeURIComponent(profileError.message)}`);
  }

  const { data: createdSpace, error: spaceError } = await supabase
    .from("couple_spaces")
    .insert({
      couple_name: coupleName,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (spaceError || !createdSpace) {
    redirect(`/settings?error=${encodeURIComponent(spaceError?.message ?? "space_failed")}`);
  }

  const { error: memberError } = await supabase.from("couple_members").insert({
    space_id: createdSpace.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    redirect(`/settings?error=${encodeURIComponent(memberError.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/settings");
  redirect("/settings?message=space_created");
}

export async function joinCoupleWithCodeAction(formData: FormData) {
  const { supabase, user, spaceId } = await getRequiredUserAndSpaceId();
  if (spaceId) {
    redirect("/settings?error=already_in_space");
  }

  const inviteCode = toText(formData.get("inviteCode")).toUpperCase();

  const { data: invite, error: inviteError } = await supabase
    .from("couple_invites")
    .select("id, space_id, expires_at, used_at")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (inviteError || !invite) {
    redirect("/settings?error=invalid_invite");
  }

  const isExpired = new Date(invite.expires_at).getTime() < Date.now();
  if (isExpired || invite.used_at) {
    redirect("/settings?error=invite_expired");
  }

  const { count } = await supabase
    .from("couple_members")
    .select("id", { count: "exact", head: true })
    .eq("space_id", invite.space_id);

  if ((count ?? 0) >= 2) {
    redirect("/settings?error=space_full");
  }

  const { error: memberError } = await supabase.from("couple_members").insert({
    space_id: invite.space_id,
    user_id: user.id,
    role: "member",
  });

  if (memberError) {
    redirect(`/settings?error=${encodeURIComponent(memberError.message)}`);
  }

  await supabase
    .from("couple_invites")
    .update({ used_by: user.id, used_at: new Date().toISOString() })
    .eq("id", invite.id);

  revalidatePath("/");
  revalidatePath("/settings");
  redirect("/settings?message=joined_space");
}

export async function regenerateInviteCodeAction() {
  const { supabase, spaceId } = await getRequiredUserAndSpaceId();
  if (!spaceId) {
    redirect("/settings?error=no_space");
  }

  const inviteCode = `LDR-${Math.floor(1000 + Math.random() * 9000)}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error: clearError } = await supabase
    .from("couple_invites")
    .delete()
    .eq("space_id", spaceId)
    .is("used_at", null);

  if (clearError) {
    redirect(`/settings?error=${encodeURIComponent(clearError.message)}`);
  }

  const { error: createError } = await supabase.from("couple_invites").insert({
    space_id: spaceId,
    invite_code: inviteCode,
    expires_at: expiresAt,
  });

  if (createError) {
    redirect(`/settings?error=${encodeURIComponent(createError.message)}`);
  }

  revalidatePath("/settings");
  redirect("/settings?message=invite_refreshed");
}

export async function createTaskAction(formData: FormData) {
  const { supabase, user, spaceId } = await getRequiredUserAndSpaceId();
  if (!spaceId) {
    redirect("/settings?error=no_space");
  }

  const title = toText(formData.get("title"));
  const description = toText(formData.get("description"));
  const dueDate = toDateInput(formData.get("dueDate"));
  const activityType = toText(formData.get("activityType"), "call");
  const assignee = toText(formData.get("assignee"), "Both");

  const { error } = await supabase.from("tasks").insert({
    space_id: spaceId,
    title,
    description,
    due_date: dueDate,
    status: "planned",
    activity_type: activityType,
    assignee,
    created_by: user.id,
  });

  if (error) {
    redirect(`/board?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/board");
  redirect("/board?message=task_created");
}

export async function advanceTaskStatusAction(formData: FormData) {
  const { supabase, spaceId } = await getRequiredUserAndSpaceId();
  if (!spaceId) {
    redirect("/settings?error=no_space");
  }

  const taskId = toText(formData.get("taskId"));
  const currentStatus = toText(formData.get("currentStatus")) as TaskStatus;

  const nextStatus: TaskStatus =
    currentStatus === "planned"
      ? "in_progress"
      : currentStatus === "in_progress"
        ? "done"
        : "done";

  const { error } = await supabase
    .from("tasks")
    .update({ status: nextStatus })
    .eq("id", taskId)
    .eq("space_id", spaceId);

  if (error) {
    redirect(`/board?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/board");
  redirect("/board?message=task_updated");
}

export async function deleteTaskAction(formData: FormData) {
  const { supabase, spaceId } = await getRequiredUserAndSpaceId();
  if (!spaceId) {
    redirect("/settings?error=no_space");
  }

  const taskId = toText(formData.get("taskId"));
  const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("space_id", spaceId);

  if (error) {
    redirect(`/board?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/board");
  redirect("/board?message=task_deleted");
}

export async function createActivityAction(formData: FormData) {
  const { supabase, user, spaceId } = await getRequiredUserAndSpaceId();
  if (!spaceId) {
    redirect("/settings?error=no_space");
  }

  const title = toText(formData.get("title"));
  const activityDate = toDateInput(formData.get("activityDate"));
  const activityType = toText(formData.get("activityType"), "call");

  const { error } = await supabase.from("activities").insert({
    space_id: spaceId,
    title,
    activity_date: activityDate,
    activity_type: activityType,
    created_by: user.id,
  });

  if (error) {
    redirect(`/calendar?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/calendar");
  redirect("/calendar?message=activity_created");
}

export async function createMemoryAction(formData: FormData) {
  const { supabase, user, spaceId } = await getRequiredUserAndSpaceId();
  if (!spaceId) {
    redirect("/settings?error=no_space");
  }

  const title = toText(formData.get("title"));
  const body = toText(formData.get("body"));
  const entryDate = toDateInput(formData.get("entryDate"));
  const imageUrl = toText(formData.get("imageUrl"));
  const tagsRaw = toText(formData.get("tags"));
  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  const { error } = await supabase.from("memories").insert({
    space_id: spaceId,
    title,
    body,
    entry_date: entryDate,
    image_url: imageUrl || null,
    tags,
    created_by: user.id,
  });

  if (error) {
    redirect(`/memories?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/memories");
  redirect("/memories?message=memory_created");
}
