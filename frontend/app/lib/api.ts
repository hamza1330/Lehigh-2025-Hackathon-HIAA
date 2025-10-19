const API_BASE =
  (process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:8000") + "/api";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
}

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

type ApiErrorPayload = {
  detail?: string | { msg?: string }[] | Record<string, unknown>;
  error?: string;
  message?: string;
};

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type GroupStatus = "pending" | "active" | "archived";
export type GoalPeriod = "daily" | "weekly";
export type MemberRole = "owner" | "admin" | "member";
export type ParticipantRole = "host" | "participant";
export type SessionStatus =
  | "scheduled"
  | "running"
  | "paused"
  | "ended"
  | "cancelled";

export type GroupListItem = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  start_at: string;
  end_at: string;
  timezone: string;
  period: GoalPeriod;
  period_target_minutes: number;
  status: GroupStatus;
  created_at: string;
  updated_at: string;
};

export type ProfileSummary = Profile;

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  role: MemberRole;
  override_period_target_minutes: number | null;
  user: ProfileSummary | null;
};

export type SessionParticipant = {
  id: string;
  session_id: string;
  user_id: string;
  role: ParticipantRole;
  user: ProfileSummary | null;
};

export type SessionRead = {
  id: string;
  group_id: string | null;
  creator_id: string;
  status: SessionStatus;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  participants: SessionParticipant[];
};

export type GroupRead = GroupListItem & {
  members: GroupMember[];
  sessions: SessionRead[];
};

export type GroupProgressRow = {
  group_id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  seconds_done: number;
  target_minutes: number;
  goal_met: boolean;
};

export type NotificationKind =
  | "group_invite"
  | "milestone_member"
  | "milestone_group"
  | "session_reminder"
  | "generic";

export type NotificationStatus = "pending" | "accepted" | "declined" | "read";

export type NotificationRead = {
  id: string;
  recipient_id: string;
  kind: NotificationKind;
  status: NotificationStatus;
  title: string | null;
  body: string | null;
  group_id: string | null;
  created_at: string;
  read_at: string | null;
  group: GroupListItem | null;
};

type ApiListResponse<T> = T[];

type FetchOptions = RequestInit & {
  method?: HttpMethod;
};

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { headers, method = "GET", body, ...rest } = options;
  const finalHeaders = new Headers(headers ?? {});
  finalHeaders.set("Accept", "application/json");
  if (body && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (authToken && !finalHeaders.has("Authorization")) {
    finalHeaders.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body,
    ...rest,
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const payload = (await response.json()) as ApiErrorPayload;
      if (typeof payload.detail === "string") {
        message = payload.detail;
      } else if (Array.isArray(payload.detail) && payload.detail.length > 0) {
        const first = payload.detail[0];
        if (typeof first === "string") {
          message = first;
        } else if (first && typeof first.msg === "string") {
          message = first.msg;
        }
      } else if (typeof payload.error === "string") {
        message = payload.error;
      } else if (typeof payload.message === "string") {
        message = payload.message;
      }
    } catch {
      // Ignore JSON parsing issues, keep default message.
    }
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getProfile(): Promise<Profile> {
  return apiFetch<Profile>("/me");
}

export async function updateProfile(payload: {
  display_name?: string | null;
  avatar_url?: string | null;
}): Promise<Profile> {
  return apiFetch<Profile>("/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function listGroups(status?: GroupStatus): Promise<ApiListResponse<GroupListItem>> {
  const search = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<ApiListResponse<GroupListItem>>(`/groups${search}`);
}

export async function getGroup(groupId: string): Promise<GroupRead> {
  return apiFetch<GroupRead>(`/groups/${groupId}`);
}

export async function getGroupMembers(groupId: string): Promise<ApiListResponse<GroupMember>> {
  return apiFetch<ApiListResponse<GroupMember>>(`/groups/${groupId}/members`);
}

export async function getGroupProgress(groupId: string): Promise<ApiListResponse<GroupProgressRow>> {
  return apiFetch<ApiListResponse<GroupProgressRow>>(`/groups/${groupId}/progress/current`);
}

export async function createGroup(payload: {
  name: string;
  description?: string | null;
  start_at: string;
  end_at: string;
  timezone: string;
  period: GoalPeriod;
  period_target_minutes: number;
}): Promise<GroupRead> {
  return apiFetch<GroupRead>("/groups", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function cloneGroup(groupId: string): Promise<GroupRead> {
  return apiFetch<GroupRead>(`/groups/${groupId}:clone`, {
    method: "POST",
  });
}

export async function createSession(payload: {
  group_id?: string | null;
  scheduled_start?: string | null;
}): Promise<SessionRead> {
  return apiFetch<SessionRead>("/sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSessionStatus(
  sessionId: string,
  payload: { status: SessionStatus; timestamp?: string | null },
): Promise<SessionRead> {
  return apiFetch<SessionRead>(`/sessions/${sessionId}:status`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function ensureSessionParticipant(sessionId: string): Promise<SessionParticipant> {
  return apiFetch<SessionParticipant>(`/sessions/${sessionId}/participants`, {
    method: "POST",
  });
}

export async function createTimeLog(
  sessionId: string,
  payload: { user_id: string; started_at: string; ended_at: string },
): Promise<void> {
  await apiFetch(`/sessions/${sessionId}/logs`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listNotifications(params?: {
  unread?: boolean;
  cursor_created_at?: string;
  cursor_id?: string;
  limit?: number;
}): Promise<ApiListResponse<NotificationRead>> {
  const search = new URLSearchParams();
  if (params?.unread !== undefined) {
    search.set("unread", String(params.unread));
  }
  if (params?.cursor_created_at) {
    search.set("cursor_created_at", params.cursor_created_at);
  }
  if (params?.cursor_id) {
    search.set("cursor_id", params.cursor_id);
  }
  if (params?.limit) {
    search.set("limit", String(params.limit));
  }
  const query = search.toString();
  return apiFetch<ApiListResponse<NotificationRead>>(
    `/notifications${query ? `?${query}` : ""}`,
  );
}

export async function getNotificationDetail(
  notificationId: string,
): Promise<NotificationRead> {
  return apiFetch<NotificationRead>(`/notifications/${notificationId}`);
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<NotificationRead> {
  return apiFetch<NotificationRead>(`/notifications/${notificationId}:read`, {
    method: "POST",
  });
}

export async function acceptInvite(notificationId: string): Promise<NotificationRead> {
  return apiFetch<NotificationRead>(`/notifications/${notificationId}:accept`, {
    method: "POST",
  });
}

export async function declineInvite(notificationId: string): Promise<NotificationRead> {
  return apiFetch<NotificationRead>(`/notifications/${notificationId}:decline`, {
    method: "POST",
  });
}

export async function archiveExpiredGroups(): Promise<{ archived: number }> {
  return apiFetch<{ archived: number }>(`/maintenance/archive-expired-groups`, {
    method: "POST",
  });
}
