# TowerOfJoy

TowerOfJoy is a planner App

## Current MVP Foundation

- Next.js App Router + TypeScript project initialized.
- Desktop-first UI shell with routes for:
	- Overview
	- Board
	- Calendar
	- Memories
	- Settings
- Supabase auth and server actions wired for sign in, sign up, sign out, couple setup, and CRUD.
- App now reads live data from Supabase when env vars are configured.

## Tech Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- Supabase (`@supabase/supabase-js` and `@supabase/ssr`)
- date-fns

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create your env file:

```bash
cp .env.example .env.local
```

3. Fill in Supabase values in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Apply DB schema in Supabase SQL editor:

- Run the SQL in `supabase/migrations/202603130001_init.sql`.

5. Run dev server:

```bash
npm run dev
```

Open http://localhost:3000.

## Implemented Workflows

1. Auth: sign in, sign up, sign out.
2. Couple setup: create space, join via invite code, regenerate invite code.
3. Board CRUD: create task, move task status, delete task.
4. Calendar CRUD: create and list activities.
5. Memories CRUD: create and list memory entries with optional image URL.

## Next Implementation Steps

1. Add Supabase Storage upload flow for memory photos (file uploads, not just URLs).
2. Add drag-and-drop board interactions.
3. Add timezone-delta calculation between both profiles.
4. Add integration tests for auth, pairing, and CRUD paths.
