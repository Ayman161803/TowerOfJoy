export type TaskStatus = "planned" | "in_progress" | "done";

export type ActivityType = "call" | "watch-party" | "game-night" | "visit";

export interface CoupleTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  activityType: ActivityType;
  assignee: "You" | "Partner" | "Both";
}

export interface CalendarActivity {
  id: string;
  date: string;
  title: string;
  type: ActivityType;
}

export interface MemoryEntry {
  id: string;
  title: string;
  entryDate: string;
  body: string;
  tags: string[];
  imageUrl?: string;
}

export interface CoupleSummary {
  coupleName: string;
  yourTimezone: string;
  partnerTimezone: string;
  timezoneGap: string;
}
