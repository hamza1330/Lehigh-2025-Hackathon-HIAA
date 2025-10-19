import { Ionicons } from "@expo/vector-icons";

export type GroupStatus = "active" | "cooldown" | "paused";
export type MemberStatus = "active" | "paused" | "behind";

export type GroupMember = {
  id: string;
  name: string;
  avatarColor: string;
  iconName: keyof typeof Ionicons.glyphMap;
  loggedMinutes: number;
  targetMinutes: number;
  remainingMinutes: number;
  status: MemberStatus;
  progressColor: string;
};

export type GroupDetail = {
  id: string;
  name: string;
  description: string;
  status: GroupStatus;
  targetPerMemberMinutes: number;
  focusMemberId: string;
  members: GroupMember[];
  sessions: {
    scheduled: SessionItem[];
    past: SessionItem[];
  };
};

export type GroupSummary = {
  id: string;
  name: string;
  goalPerMember: number;
  unit: "hours";
  youLogged: number;
  teamLogged: number;
  teamTarget: number;
  status: GroupStatus;
};

export type SessionItem = {
  id: string;
  memberId: string;
  memberName: string;
  avatarColor: string;
  iconName: keyof typeof Ionicons.glyphMap;
  status: "scheduled" | "completed";
  start: string;
  end?: string;
  durationMinutes?: number;
  note?: string;
};

const GROUPS: GroupDetail[] = [
  {
    id: "midterm-study-squad",
    name: "Midterm Study Squad",
    description: "Let’s ace these exams together!",
    status: "active",
    targetPerMemberMinutes: 300,
    focusMemberId: "hamza",
    members: [
      {
        id: "hamza",
        name: "Hamza",
        avatarColor: "#FEE7AE",
        iconName: "school",
        loggedMinutes: 255,
        targetMinutes: 300,
        remainingMinutes: 45,
        status: "active",
        progressColor: "#3D7BFF",
      },
      {
        id: "sara",
        name: "Sara",
        avatarColor: "#D9F2E5",
        iconName: "person-circle",
        loggedMinutes: 210,
        targetMinutes: 300,
        remainingMinutes: 90,
        status: "paused",
        progressColor: "#27AE60",
      },
      {
        id: "ada",
        name: "Ada",
        avatarColor: "#FCD5CE",
        iconName: "bulb-outline",
        loggedMinutes: 165,
        targetMinutes: 300,
        remainingMinutes: 135,
        status: "paused",
        progressColor: "#FF6B6B",
      },
      {
        id: "jake",
        name: "Jake",
        avatarColor: "#D8ECFF",
        iconName: "person",
        loggedMinutes: 85,
        targetMinutes: 300,
        remainingMinutes: 215,
        status: "active",
        progressColor: "#F4C542",
      },
    ],
    sessions: {
      scheduled: [
        {
          id: "midterm-hamza-evening",
          memberId: "hamza",
          memberName: "Hamza",
          avatarColor: "#FEE7AE",
          iconName: "school",
          status: "scheduled",
          start: "2025-10-19T19:00:00-04:00",
          end: "2025-10-19T21:00:00-04:00",
          note: "Practice problems marathon",
        },
        {
          id: "midterm-sara-morning",
          memberId: "sara",
          memberName: "Sara",
          avatarColor: "#D9F2E5",
          iconName: "person-circle",
          status: "scheduled",
          start: "2025-10-20T09:00:00-04:00",
          end: "2025-10-20T11:30:00-04:00",
          note: "Chem review session",
        },
      ],
      past: [
        {
          id: "midterm-hamza-1",
          memberId: "hamza",
          memberName: "Hamza",
          avatarColor: "#FEE7AE",
          iconName: "school",
          status: "completed",
          start: "2025-10-18T12:00:00-04:00",
          end: "2025-10-18T14:00:00-04:00",
          durationMinutes: 120,
          note: "Group focus on chapters 5-6",
        },
        {
          id: "midterm-hamza-2",
          memberId: "hamza",
          memberName: "Hamza",
          avatarColor: "#FEE7AE",
          iconName: "school",
          status: "completed",
          start: "2025-10-18T17:00:00-04:00",
          end: "2025-10-18T19:15:00-04:00",
          durationMinutes: 135,
          note: "Practice exam + review",
        },
        {
          id: "midterm-sara-1",
          memberId: "sara",
          memberName: "Sara",
          avatarColor: "#D9F2E5",
          iconName: "person-circle",
          status: "completed",
          start: "2025-10-18T10:30:00-04:00",
          end: "2025-10-18T13:00:00-04:00",
          durationMinutes: 150,
          note: "Bio flashcards",
        },
        {
          id: "midterm-ada-1",
          memberId: "ada",
          memberName: "Ada",
          avatarColor: "#FCD5CE",
          iconName: "bulb-outline",
          status: "completed",
          start: "2025-10-18T08:00:00-04:00",
          end: "2025-10-18T09:45:00-04:00",
          durationMinutes: 105,
        },
      ],
    },
  },
  {
    id: "workout-buddies",
    name: "Workout Buddies",
    description: "Sweat goals, shared accountability.",
    status: "cooldown",
    targetPerMemberMinutes: 600,
    focusMemberId: "maya",
    members: [
      {
        id: "maya",
        name: "Maya",
        avatarColor: "#FDE2F3",
        iconName: "walk",
        loggedMinutes: 420,
        targetMinutes: 600,
        remainingMinutes: 180,
        status: "active",
        progressColor: "#3ED598",
      },
      {
        id: "leo",
        name: "Leo",
        avatarColor: "#FFF4CC",
        iconName: "bicycle",
        loggedMinutes: 360,
        targetMinutes: 600,
        remainingMinutes: 240,
        status: "active",
        progressColor: "#58B8FF",
      },
      {
        id: "kim",
        name: "Kim",
        avatarColor: "#E2E5FF",
        iconName: "barbell-outline",
        loggedMinutes: 200,
        targetMinutes: 600,
        remainingMinutes: 400,
        status: "behind",
        progressColor: "#FFB547",
      },
    ],
    sessions: {
      scheduled: [
        {
          id: "workout-group-class",
          memberId: "maya",
          memberName: "Maya",
          avatarColor: "#FDE2F3",
          iconName: "walk",
          status: "scheduled",
          start: "2025-10-19T18:00:00-04:00",
          end: "2025-10-19T19:30:00-04:00",
          note: "HIIT class downtown",
        },
      ],
      past: [
        {
          id: "workout-leo-1",
          memberId: "leo",
          memberName: "Leo",
          avatarColor: "#FFF4CC",
          iconName: "bicycle",
          status: "completed",
          start: "2025-10-18T06:30:00-04:00",
          end: "2025-10-18T08:00:00-04:00",
          durationMinutes: 90,
          note: "Morning ride",
        },
        {
          id: "workout-maya-1",
          memberId: "maya",
          memberName: "Maya",
          avatarColor: "#FDE2F3",
          iconName: "walk",
          status: "completed",
          start: "2025-10-18T19:00:00-04:00",
          end: "2025-10-18T20:20:00-04:00",
          durationMinutes: 80,
          note: "Strength circuit",
        },
        {
          id: "workout-kim-1",
          memberId: "kim",
          memberName: "Kim",
          avatarColor: "#E2E5FF",
          iconName: "barbell-outline",
          status: "completed",
          start: "2025-10-18T17:00:00-04:00",
          end: "2025-10-18T17:45:00-04:00",
          durationMinutes: 45,
          note: "Short lift",
        },
      ],
    },
  },
  {
    id: "coders-unite",
    name: "Coders Unite",
    description: "Shipping features and grinding bugs.",
    status: "active",
    targetPerMemberMinutes: 480,
    focusMemberId: "devon",
    members: [
      {
        id: "devon",
        name: "Devon",
        avatarColor: "#E8D5FF",
        iconName: "code-slash",
        loggedMinutes: 300,
        targetMinutes: 480,
        remainingMinutes: 180,
        status: "active",
        progressColor: "#9C6BFF",
      },
      {
        id: "priya",
        name: "Priya",
        avatarColor: "#FFE5D9",
        iconName: "terminal-outline",
        loggedMinutes: 270,
        targetMinutes: 480,
        remainingMinutes: 210,
        status: "active",
        progressColor: "#5BC0DE",
      },
      {
        id: "omar",
        name: "Omar",
        avatarColor: "#DFF8E7",
        iconName: "bug-outline",
        loggedMinutes: 120,
        targetMinutes: 480,
        remainingMinutes: 360,
        status: "behind",
        progressColor: "#FF6B6B",
      },
    ],
    sessions: {
      scheduled: [
        {
          id: "coders-sprint",
          memberId: "devon",
          memberName: "Devon",
          avatarColor: "#E8D5FF",
          iconName: "code-slash",
          status: "scheduled",
          start: "2025-10-19T13:00:00-04:00",
          end: "2025-10-19T15:30:00-04:00",
          note: "Sprint planning",
        },
        {
          id: "coders-priya-debug",
          memberId: "priya",
          memberName: "Priya",
          avatarColor: "#FFE5D9",
          iconName: "terminal-outline",
          status: "scheduled",
          start: "2025-10-20T09:30:00-04:00",
          end: "2025-10-20T11:00:00-04:00",
          note: "Debug session",
        },
      ],
      past: [
        {
          id: "coders-devon-1",
          memberId: "devon",
          memberName: "Devon",
          avatarColor: "#E8D5FF",
          iconName: "code-slash",
          status: "completed",
          start: "2025-10-18T11:00:00-04:00",
          end: "2025-10-18T13:30:00-04:00",
          durationMinutes: 150,
          note: "Implemented new feature",
        },
        {
          id: "coders-priya-1",
          memberId: "priya",
          memberName: "Priya",
          avatarColor: "#FFE5D9",
          iconName: "terminal-outline",
          status: "completed",
          start: "2025-10-18T14:00:00-04:00",
          end: "2025-10-18T16:15:00-04:00",
          durationMinutes: 135,
          note: "Bug bash",
        },
        {
          id: "coders-omar-1",
          memberId: "omar",
          memberName: "Omar",
          avatarColor: "#DFF8E7",
          iconName: "bug-outline",
          status: "completed",
          start: "2025-10-18T20:00:00-04:00",
          end: "2025-10-18T21:10:00-04:00",
          durationMinutes: 70,
        },
      ],
    },
  },
];

const minutesToHours = (minutes: number) => minutes / 60;

const roundHours = (hours: number) => {
  const rounded = Math.round(hours * 10) / 10;
  return rounded;
};

export const computeSummary = (group: GroupDetail): GroupSummary => {
  const totalLoggedMinutes = group.members.reduce(
    (sum, member) => sum + member.loggedMinutes,
    0
  );
  const totalTargetMinutes = group.members.reduce(
    (sum, member) => sum + member.targetMinutes,
    0
  );
  const focusMember =
    group.members.find((member) => member.id === group.focusMemberId) ??
    group.members[0];

  return {
    id: group.id,
    name: group.name,
    goalPerMember: roundHours(minutesToHours(group.targetPerMemberMinutes)),
    unit: "hours",
    youLogged: roundHours(minutesToHours(focusMember.loggedMinutes)),
    teamLogged: roundHours(minutesToHours(totalLoggedMinutes)),
    teamTarget: roundHours(minutesToHours(totalTargetMinutes)),
    status: group.status,
  };
};

export const groupSummaries: GroupSummary[] = GROUPS.map(computeSummary);

const groupMap = new Map(GROUPS.map((group) => [group.id, group]));

export const getGroupDetail = (id: string) => groupMap.get(id);

export const getGroupSummaryById = (id: string) =>
  groupSummaries.find((summary) => summary.id === id);

export const cloneGroupDetail = (id: string): GroupDetail | undefined => {
  const detail = getGroupDetail(id);
  if (!detail) return undefined;
  return {
    ...detail,
    members: detail.members.map((member) => ({ ...member })),
    sessions: {
      scheduled: detail.sessions.scheduled.map((session) => ({ ...session })),
      past: detail.sessions.past.map((session) => ({ ...session })),
    },
  };
};

export const applyGroupDetailUpdate = (
  updated: GroupDetail
): GroupSummary | null => {
  const index = GROUPS.findIndex((group) => group.id === updated.id);
  if (index >= 0) {
    GROUPS[index] = updated;
  } else {
    GROUPS.push(updated);
  }
  groupMap.set(updated.id, updated);

  const summary = computeSummary(updated);
  const summaryIndex = groupSummaries.findIndex(
    (existing) => existing.id === updated.id
  );
  if (summaryIndex >= 0) {
    groupSummaries[summaryIndex] = summary;
  } else {
    groupSummaries.push(summary);
  }
  return summary;
};

export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins}m`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
};
