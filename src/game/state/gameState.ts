export type UpgradeId = 'efficiency' | 'quality' | 'flattery' | 'lifeManagement' | 'slacking';
export type PermanentId = 'workEfficiency' | 'workQuality' | 'workReward' | 'lifeManagement' | 'lunchOutput' | 'projectReward' | 'bossTaskReward' | 'startingMoney';
export type Phase = 'BREAKFAST' | 'MORNING' | 'LUNCH_FOOD' | 'LUNCH' | 'AFTERNOON' | 'DINNER' | 'ENTERTAINMENT' | 'SLEEP' | 'WAIT';
export type FollowUpType = 'REWORK' | 'CORRECTION' | 'MISSING_INFO' | 'CLIENT_REPLY' | 'NEW_REQUEST' | 'PROJECT_NEXT_STEP';
export type SourceType = 'NORMAL' | 'FOLLOW_UP' | 'PROJECT' | 'BOSS' | 'EVENT';
export interface Todo { bossSeverity?: number; mandatoryOvertime?: boolean; id: string; name: string; type: string; sourceType: SourceType; sourceId: string; rootId: string; projectId?: string; subtaskId?: string; baseWorkload: number; ageWorkloadMultiplierAtCreation: number; rankWorkloadMultiplierAtCreation: number; workload: number; baseReward: number; tags: string[]; priority: number; qualityRequirement: number; createdAt: number; createdAtWorldTime: number | null; assignmentWorkdayIndex: number | null; deadlineWorkdays: number | null; dueWorkdayIndex: number | null; deadlineProfileId: string; followUpDepth: number; followUpType?: FollowUpType }
export interface PendingFollowUp { id: string; sourceWorkId: string; sourceProjectId?: string; triggerAtWorldTime: number; followUpType: FollowUpType; tasksToCreate: Todo[]; depth: number }
export interface ProjectSubtask { baseWorkload?: number; rankWorkloadMultiplierAtCreation?: number; deadlineProfileId?: string; deadlineWorkdays?: number | null; id: string; name: string; dependencies: string[]; workload: number; reward: number; qualityRequirement: number; status: 'LOCKED' | 'QUEUED' | 'DONE' }
export interface Project { id: string; templateId: string; name: string; status: 'ACTIVE' | 'DELIVERED' | 'CLOSED'; tier: number; reward: number; subtasks: ProjectSubtask[]; completedSubtasks: number; dependencies: Record<string, string[]>; createdAt: number; deadline?: number }
export interface Modifiers { workSpeed?: number; quality?: number; lifeSpeed?: number; lunchOutput?: number; catchChance?: number; escapeChance?: number }
export interface Buff { id: string; name: string; expiresAt: number; modifiers: Modifiers; protectionTag?: string; eventChanceMultiplier?: number }
export interface Debuff { id: string; type: string; name: string; sourceEvent: string; duration: number; remainingDuration: number; expiresAt: number; modifiers: Modifiers; resolvableByProductTag: string; severity: number; createdAt: number }
export interface ProgressBase { id: string; name: string; requirement: number; progress: number; createdAt: number }
export interface MeetingTarget {
  id: string; meetingId: string; type: 'MEETING'; name: string; source: 'NORMAL' | 'BOSS';
  createdAtWorldTime: number; scheduledStartWorldTime: number | null; startedAtWorldTime: number | null;
  remainingDuration: number; totalDuration: number; rankAtCreation: number; compensation: number; isBossMeeting: boolean;
  crossedAnchors: string[];
}
export interface MeetingStatistics {
  normalMeetingRolls: number; normalMeetingsTriggered: number; bossMeetingRolls: number; bossMeetingsTriggered: number;
  meetingCount: number; normalMeetingCount: number; bossMeetingCount: number;
  meetingSeconds: number; normalMeetingSeconds: number; bossMeetingSeconds: number; meetingCompensation: number;
  meetingCrossLunchCount: number; meetingCrossEntertainmentCount: number; meetingCrossSleepCount: number; meetingCrossWorkStartCount: number;
  workInterruptedByMeetingCount: number;
  // Counterfactual entertainment/sleep losses are measured by matched replay, never guessed here.
}
export interface PromotionTarget extends ProgressBase { type:'PROMOTION'; fromRank:number; toRank:number; startedAt:number; deadlineWorldTime:number }
export type PromotionStatus = 'NOT_ELIGIBLE'|'ELIGIBLE'|'SCHEDULED'|'ACTIVE'|'COOLDOWN'|'MAX_RANK'|'FAILED_REQUIREMENT';
export interface PromotionState { lowProfileEnabled:boolean; status:PromotionStatus; lastCheckedWorkday:number|null; scheduledWorkday:number|null; fromRank:number|null; toRank:number|null; assignmentId:string|null; createdAt:number|null; startedAt:number|null; deadlineWorldTime:number|null; requirement:number; progress:number; retryAvailableWorkday:number|null; failureReason:string|null; pending:boolean }
export type Target = PromotionTarget | MeetingTarget | (ProgressBase & { type: 'WORK'; todo: Todo }) | (ProgressBase & { type: 'FOOD'; foodId: string; productId?: string; meal: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'EXTRA' }) | (ProgressBase & { type: 'ENTERTAINMENT' | 'SLEEP' }) | (ProgressBase & { type: 'PROBLEM'; debuffId: string; productId: string; eventType: string; originalRemaining: number }) | { id: string; type: 'LUNCH'; name: string; windowStart: number; windowEnd: number; accumulatedRestOutput: number; createdAt: number };
export type ProductEffectType = 'FOOD_OPTION' | 'PROBLEM_RESOLVER' | 'OFFLINE_AGE_PROTECTION' | 'TAGGED_WORK_REWARD' | 'SLEEP_MODIFIER';
export interface ProductStats { activationCount: number; totalSpent: number; billingSpent: number; problemTriggeredCount?: number; problemResolvedCount?: number; debuffSecondsSaved?: number; foodUses?: number; foodSecondsSaved?: number; offlineAgeDaysProtected?: number; bonusIncome?: number }
export interface Subscription { id: string; active: boolean; pricePerBillingPeriod: number; billingPeriodDays: number; nextBillingWorldTime: number | null; effectType: ProductEffectType; contributionStats: ProductStats }
export interface OfflineSummary { realOfflineMinutes: number; gameDays: number; grossIncome: number; productSpending: number; netMoneyChange: number; ageBefore: number; ageAfter: number; ageProgressDays: number; todoBefore: number; todoAfter: number; projects: { id: string; name: string; before: number; after: number; status: Project['status'] }[]; products: { id: string; stats: ProductStats; billingSpend: number }[] }
export type NoticeType = '工作' | '飲食' | '老闆' | '娛樂' | '睡眠' | 'Buff' | 'Debuff' | '產品' | '升職' | 'Prestige' | '專案' | '離線' | '開會';
export interface Notice { id: string; time: number; day: number; type: NoticeType; text: string; sourceId?: string; productId?: string; workId?: string; projectId?: string }
export interface RunStatistics { activeSeconds: number; earned: number; completedWork: number; reworkCount: number; projectsCompleted: number; highestProjectTier: number; peakIncome: number; incomeSamples: { time: number; amount: number }[]; rootExtraTasks: Record<string, number>; offlineDays: number }
export interface GameState {
  saveVersion: 2; coreVersion: 'todo-v2';
  world: { totalWorldTime: number; dayIndex: number; timeOfDay: number; rng: number; sequence: number; nextEventAt: number; lastDeadlineNoticeWorkday?: number };
  player: { money: number; age: number; ageProgressDays: number; upgrades: Record<UpgradeId, number>; settings: { speed: number; defaultFoodId: string; reducedMotion: boolean } };
  career: { rank: number; highestRank: number };
  stats: { workSpeed: number; workQuality: number; lifeSpeed: number; restOutput: number };
  todoQueue: Todo[]; pendingFollowUps: PendingFollowUp[]; projects: Project[];
  currentTarget: Target | null; suspendedTargets: { target: Target; phase: Phase }[];
  promotion: PromotionState;
  meetings: { lastScheduledWorkday: number | null; scheduledNormal: MeetingTarget | null; pendingBoss: MeetingTarget | null; statistics: MeetingStatistics };
  needs: { breakfastAnchorEligible?: boolean; phase: Phase; routineDay: number; bossChecked: boolean; lunchSettled: boolean; lunchRest: number; satietyUntil: number; sleep: { windowStart: number; windowEnd: number; duration: number; output: number; settled: boolean; lastRatio: number; speedModifier: number; qualityModifier: number }; pendingBossId: string | null; breakfastState: 'PENDING' | 'STARTED' | 'COMPLETED' | 'MISSED'; projectRollProcessedRoutineId: number | null };
  buffs: Buff[]; debuffs: Debuff[]; products: Record<string, Subscription>;
  prestige: { clarity: number; levels: Record<PermanentId, number>; forcedReady: boolean };
  notifications: Notice[]; eventLog: Notice[];
  runStatistics: RunStatistics; permanentStatistics: { runs: number; clarityEarned: number; completedWork: number; projectsCompleted: number };
  offline: { lastSeenAt: number; offlineCarryMinutes: number; lastSettlement: { days: number; earned: number; ageDays: number } | null; lastOfflineSummary: OfflineSummary | null; summaryDismissed: boolean };
}
export type State = GameState;
export type Action = { type:'lowProfile'; value:boolean } | { type: 'dismissOffline' } | { type: 'upgrade'; id: UpgradeId } | { type: 'permanent'; id: PermanentId } | { type: 'promote' } | { type: 'product'; id: string } | { type: 'food'; id: string } | { type: 'speed'; value: number } | { type: 'motion'; value: boolean } | { type: 'prestige' } | { type: 'debug'; command: string; value?: number; id?: string };
