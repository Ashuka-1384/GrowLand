export type Skill = { id: string; name: string; category: string; xp: number };
export type Member = {
  id: string; fullName: string; age: number; phone: string; city: string; focus: string; level: string;
  goal: string; time: string; threeMonthGoal: string; whyGrowland: string; about: string;
  skills: Skill[]; xp: number; levelNumber: number; readyForWork: boolean; roadmap: string;
  growth: number[]; isAdmin: boolean; active: boolean; hiddenFromPublic: boolean; createdAt: string;
};
export type Report = { id: string; memberId: string; text: string; createdAt: string; status: 'new'|'reviewed' };
export type Announcement = { id: string; title: string; body: string; createdAt: string };
export type Store = { members: Member[]; reports: Report[]; announcements: Announcement[] };
