import { Ionicons } from "@expo/vector-icons";

export type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  ago: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  description: string;
  ctaLabel?: string;
  targetRoute: string;
  ctaTarget?: string;
};

export const notifications: NotificationItem[] = [
  {
    id: "hamza-finished",
    title: "Hamza finished 5 hours of studying!",
    detail: "Midterm Study Squad",
    ago: "2h ago",
    iconName: "school-outline",
    iconBg: "rgba(27,108,245,0.12)",
    iconColor: "#1B6CF5",
    description:
      "Hamza wrapped up five focused hours. Give them a shout-out and see how the rest of the squad is trending.",
    ctaLabel: "View circle progress",
    targetRoute: "/notification/hamza-finished",
    ctaTarget: "/(tabs)/home",
  },
  {
    id: "sara-invite",
    title: "Sara invited you to join CS Marathoners",
    detail: "CS Marathoners",
    ago: "4h ago",
    iconName: "person-add-outline",
    iconBg: "rgba(255,198,64,0.18)",
    iconColor: "#F5A21B",
    description:
      "Sara thinks you’d be a great fit for CS Marathoners. Review the invite to join their weekly sprint.",
    ctaLabel: "Review invite",
    targetRoute: "/notification/sara-invite",
    ctaTarget: "/(tabs)/create",
  },
  {
    id: "adam-goal",
    title: "Adam reached their 3-hour goal! 🎉",
    detail: "Finals Study Crew",
    ago: "2d ago",
    iconName: "trophy-outline",
    iconBg: "rgba(64,204,170,0.18)",
    iconColor: "#29B583",
    description:
      "Adam just hit their three-hour target. Keep the momentum going by lining up the next session.",
    ctaLabel: "Open Finals Study Crew",
    targetRoute: "/notification/adam-goal",
    ctaTarget: "/(tabs)/home",
  },
  {
    id: "lock-in-reminder",
    title: "Evening Lock-In starts in 15 minutes ⏰",
    detail: "Math Marathon",
    ago: "2d ago",
    iconName: "alarm-outline",
    iconBg: "rgba(28,126,214,0.18)",
    iconColor: "#1C7ED6",
    description:
      "Heads up—the evening lock-in kicks off soon. Make sure your timer is ready and share the plan with your circle.",
    ctaLabel: "View session details",
    targetRoute: "/notification/lock-in-reminder",
    ctaTarget: "/(tabs)/home",
  },
];
