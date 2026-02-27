'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AppData, AppSettings, AIProfile, CalendarEvent, Sport, YogaExercise,
  MeditationSession, YogaSession, Book, DiaryEntry, LimitingBelief,
  Goal, Habit, Transaction, SavingsGoal, Budget, SleepLog, HydrationLog,
  HealthEntry, QuickNote, AIConversation, Project, ProjectTask, Milestone,
  SocialMediaPost, CommercialLead, ProjectDocument, ProjectMeeting, ProjectAlert,
  MedicalAppointment, MedicalTask,
} from '@/types';

const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'es',
  notifications: true,
  weekStartsOn: 1,
};

const defaultAIProfile: AIProfile = {
  personality: '',
  lifeGoals: '',
  currentChallenges: '',
  values: '',
  interests: '',
};

const defaultData: Omit<AppData, 'settings' | 'aiProfile'> = {
  events: [],
  sports: [],
  yogaExercises: [],
  meditationSessions: [],
  yogaSessions: [],
  books: [],
  diaryEntries: [],
  limitingBeliefs: [],
  goals: [],
  habits: [],
  transactions: [],
  savingsGoals: [],
  budgets: [],
  sleepLogs: [],
  hydrationLogs: [],
  healthEntries: [],
  medicalAppointments: [],
  medicalTasks: [],
  quickNotes: [],
  conversations: [],
  projects: [],
  socialMediaPosts: [],
  commercialLeads: [],
  projectAlerts: [],
};

interface AppState extends AppData {
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateAIProfile: (profile: Partial<AIProfile>) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  addSport: (sport: Sport) => void;
  updateSport: (id: string, sport: Partial<Sport>) => void;
  deleteSport: (id: string) => void;
  addRoutine: (sportId: string, routine: Sport['routines'][0]) => void;
  updateRoutine: (sportId: string, routineId: string, routine: Partial<Sport['routines'][0]>) => void;
  deleteRoutine: (sportId: string, routineId: string) => void;
  addWorkoutSession: (session: Sport['sessions'][0]) => void;
  addYogaExercise: (exercise: YogaExercise) => void;
  updateYogaExercise: (id: string, exercise: Partial<YogaExercise>) => void;
  deleteYogaExercise: (id: string) => void;
  addMeditationSession: (session: MeditationSession) => void;
  addYogaSession: (session: YogaSession) => void;
  addBook: (book: Book) => void;
  updateBook: (id: string, book: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  addBookNote: (bookId: string, note: Book['notes'][0]) => void;
  updateBookNote: (bookId: string, noteId: string, note: Partial<Book['notes'][0]>) => void;
  deleteBookNote: (bookId: string, noteId: string) => void;
  addDiaryEntry: (entry: DiaryEntry) => void;
  updateDiaryEntry: (id: string, entry: Partial<DiaryEntry>) => void;
  deleteDiaryEntry: (id: string) => void;
  addLimitingBelief: (belief: LimitingBelief) => void;
  updateLimitingBelief: (id: string, belief: Partial<LimitingBelief>) => void;
  deleteLimitingBelief: (id: string) => void;
  addBeliefReflection: (id: string, reflection: { date: string; note: string }) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, habit: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  logHabit: (id: string, date: string, completed: boolean) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addSavingsGoal: (goal: SavingsGoal) => void;
  updateSavingsGoal: (id: string, goal: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, budget: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  addSleepLog: (log: SleepLog) => void;
  updateSleepLog: (id: string, log: Partial<SleepLog>) => void;
  addHydrationLog: (log: HydrationLog) => void;
  updateHydrationLog: (id: string, log: Partial<HydrationLog>) => void;
  addHealthEntry: (entry: HealthEntry) => void;
  updateHealthEntry: (id: string, entry: Partial<HealthEntry>) => void;
  addMedicalAppointment: (appointment: MedicalAppointment) => void;
  updateMedicalAppointment: (id: string, appointment: Partial<MedicalAppointment>) => void;
  deleteMedicalAppointment: (id: string) => void;
  addMedicalTask: (task: MedicalTask) => void;
  updateMedicalTask: (id: string, task: Partial<MedicalTask>) => void;
  deleteMedicalTask: (id: string) => void;
  toggleMedicalTask: (id: string) => void;
  addQuickNote: (note: QuickNote) => void;
  updateQuickNote: (id: string, note: Partial<QuickNote>) => void;
  deleteQuickNote: (id: string) => void;
  addConversation: (conversation: AIConversation) => void;
  updateConversation: (id: string, conversation: Partial<AIConversation>) => void;
  deleteConversation: (id: string) => void;
  addMessageToConversation: (conversationId: string, message: AIConversation['messages'][0]) => void;
  // Projects
  addProject: (project: Project) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addTaskToProject: (projectId: string, task: ProjectTask) => void;
  updateTaskInProject: (projectId: string, taskId: string, task: Partial<ProjectTask>) => void;
  deleteTaskFromProject: (projectId: string, taskId: string) => void;
  addMilestoneToProject: (projectId: string, milestone: Milestone) => void;
  updateMilestoneInProject: (projectId: string, milestoneId: string, milestone: Partial<Milestone>) => void;
  deleteMilestoneFromProject: (projectId: string, milestoneId: string) => void;
  // Project Documents
  addDocumentToProject: (projectId: string, document: ProjectDocument) => void;
  updateDocumentInProject: (projectId: string, documentId: string, document: Partial<ProjectDocument>) => void;
  deleteDocumentFromProject: (projectId: string, documentId: string) => void;
  // Project Meetings
  addMeetingToProject: (projectId: string, meeting: ProjectMeeting) => void;
  updateMeetingInProject: (projectId: string, meetingId: string, meeting: Partial<ProjectMeeting>) => void;
  deleteMeetingFromProject: (projectId: string, meetingId: string) => void;
  // Social Media
  addSocialMediaPost: (post: SocialMediaPost) => void;
  updateSocialMediaPost: (id: string, post: Partial<SocialMediaPost>) => void;
  deleteSocialMediaPost: (id: string) => void;
  // Commercial Leads
  addCommercialLead: (lead: CommercialLead) => void;
  updateCommercialLead: (id: string, lead: Partial<CommercialLead>) => void;
  deleteCommercialLead: (id: string) => void;
  // Alerts
  addProjectAlert: (alert: ProjectAlert) => void;
  updateProjectAlert: (id: string, alert: Partial<ProjectAlert>) => void;
  deleteProjectAlert: (id: string) => void;
  dismissProjectAlert: (id: string) => void;
  markAlertAsRead: (id: string) => void;
  // Data management
  importAllData: (data: AppData) => void;
  resetAllData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      aiProfile: defaultAIProfile,
      ...defaultData,

      updateSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),
      updateAIProfile: (profile) => set((state) => ({ aiProfile: { ...state.aiProfile, ...profile } })),

      // Events
      addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
      updateEvent: (id, event) => set((state) => ({ events: state.events.map((e) => (e.id === id ? { ...e, ...event } : e)) })),
      deleteEvent: (id) => set((state) => ({ events: state.events.filter((e) => e.id !== id) })),

      // Sports
      addSport: (sport) => set((state) => ({ sports: [...state.sports, sport] })),
      updateSport: (id, sport) => set((state) => ({ sports: state.sports.map((s) => (s.id === id ? { ...s, ...sport } : s)) })),
      deleteSport: (id) => set((state) => ({ sports: state.sports.filter((s) => s.id !== id) })),
      addRoutine: (sportId, routine) => set((state) => ({ sports: state.sports.map((s) => s.id === sportId ? { ...s, routines: [...s.routines, routine] } : s) })),
      updateRoutine: (sportId, routineId, routine) => set((state) => ({ sports: state.sports.map((s) => s.id === sportId ? { ...s, routines: s.routines.map((r) => r.id === routineId ? { ...r, ...routine } : r) } : s) })),
      deleteRoutine: (sportId, routineId) => set((state) => ({ sports: state.sports.map((s) => s.id === sportId ? { ...s, routines: s.routines.filter((r) => r.id !== routineId) } : s) })),
      addWorkoutSession: (session) => set((state) => ({ sports: state.sports.map((s) => s.id === session.sportId ? { ...s, sessions: [...s.sessions, session] } : s) })),

      // Yoga & Meditation
      addYogaExercise: (exercise) => set((state) => ({ yogaExercises: [...state.yogaExercises, exercise] })),
      updateYogaExercise: (id, exercise) => set((state) => ({ yogaExercises: state.yogaExercises.map((e) => e.id === id ? { ...e, ...exercise } : e) })),
      deleteYogaExercise: (id) => set((state) => ({ yogaExercises: state.yogaExercises.filter((e) => e.id !== id) })),
      addMeditationSession: (session) => set((state) => ({ meditationSessions: [...state.meditationSessions, session] })),
      addYogaSession: (session) => set((state) => ({ yogaSessions: [...state.yogaSessions, session] })),

      // Books
      addBook: (book) => set((state) => ({ books: [...state.books, book] })),
      updateBook: (id, book) => set((state) => ({ books: state.books.map((b) => b.id === id ? { ...b, ...book } : b) })),
      deleteBook: (id) => set((state) => ({ books: state.books.filter((b) => b.id !== id) })),
      addBookNote: (bookId, note) => set((state) => ({ books: state.books.map((b) => b.id === bookId ? { ...b, notes: [...b.notes, note] } : b) })),
      updateBookNote: (bookId, noteId, note) => set((state) => ({ books: state.books.map((b) => b.id === bookId ? { ...b, notes: b.notes.map((n) => n.id === noteId ? { ...n, ...note } : n) } : b) })),
      deleteBookNote: (bookId, noteId) => set((state) => ({ books: state.books.map((b) => b.id === bookId ? { ...b, notes: b.notes.filter((n) => n.id !== noteId) } : b) })),

      // Diary
      addDiaryEntry: (entry) => set((state) => ({ diaryEntries: [...state.diaryEntries, entry] })),
      updateDiaryEntry: (id, entry) => set((state) => ({ diaryEntries: state.diaryEntries.map((e) => e.id === id ? { ...e, ...entry } : e) })),
      deleteDiaryEntry: (id) => set((state) => ({ diaryEntries: state.diaryEntries.filter((e) => e.id !== id) })),

      // Limiting Beliefs
      addLimitingBelief: (belief) => set((state) => ({ limitingBeliefs: [...state.limitingBeliefs, belief] })),
      updateLimitingBelief: (id, belief) => set((state) => ({ limitingBeliefs: state.limitingBeliefs.map((b) => b.id === id ? { ...b, ...belief } : b) })),
      deleteLimitingBelief: (id) => set((state) => ({ limitingBeliefs: state.limitingBeliefs.filter((b) => b.id !== id) })),
      addBeliefReflection: (id, reflection) => set((state) => ({ limitingBeliefs: state.limitingBeliefs.map((b) => b.id === id ? { ...b, reflections: [...b.reflections, reflection] } : b) })),

      // Goals
      addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),
      updateGoal: (id, goal) => set((state) => ({ goals: state.goals.map((g) => g.id === id ? { ...g, ...goal } : g) })),
      deleteGoal: (id) => set((state) => ({ goals: state.goals.filter((g) => g.id !== id) })),

      // Habits
      addHabit: (habit) => set((state) => ({ habits: [...state.habits, habit] })),
      updateHabit: (id, habit) => set((state) => ({ habits: state.habits.map((h) => h.id === id ? { ...h, ...habit } : h) })),
      deleteHabit: (id) => set((state) => ({ habits: state.habits.filter((h) => h.id !== id) })),
      logHabit: (id, date, completed) => set((state) => ({
        habits: state.habits.map((h) => {
          if (h.id !== id) return h;
          const idx = h.logs.findIndex((l) => l.date === date);
          if (idx >= 0) {
            const newLogs = [...h.logs];
            newLogs[idx] = { date, completed };
            return { ...h, logs: newLogs };
          }
          return { ...h, logs: [...h.logs, { date, completed }] };
        }),
      })),

      // Transactions
      addTransaction: (transaction) => set((state) => ({ transactions: [...state.transactions, transaction] })),
      updateTransaction: (id, transaction) => set((state) => ({ transactions: state.transactions.map((t) => t.id === id ? { ...t, ...transaction } : t) })),
      deleteTransaction: (id) => set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) })),

      // Savings Goals
      addSavingsGoal: (goal) => set((state) => ({ savingsGoals: [...state.savingsGoals, goal] })),
      updateSavingsGoal: (id, goal) => set((state) => ({ savingsGoals: state.savingsGoals.map((g) => g.id === id ? { ...g, ...goal } : g) })),
      deleteSavingsGoal: (id) => set((state) => ({ savingsGoals: state.savingsGoals.filter((g) => g.id !== id) })),

      // Budgets
      addBudget: (budget) => set((state) => ({ budgets: [...state.budgets, budget] })),
      updateBudget: (id, budget) => set((state) => ({ budgets: state.budgets.map((b) => b.id === id ? { ...b, ...budget } : b) })),
      deleteBudget: (id) => set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) })),

      // Health
      addSleepLog: (log) => set((state) => ({ sleepLogs: [...state.sleepLogs, log] })),
      updateSleepLog: (id, log) => set((state) => ({ sleepLogs: state.sleepLogs.map((l) => l.id === id ? { ...l, ...log } : l) })),
      addHydrationLog: (log) => set((state) => ({ hydrationLogs: [...state.hydrationLogs, log] })),
      updateHydrationLog: (id, log) => set((state) => ({ hydrationLogs: state.hydrationLogs.map((l) => l.id === id ? { ...l, ...log } : l) })),
      addHealthEntry: (entry) => set((state) => ({ healthEntries: [...state.healthEntries, entry] })),
      updateHealthEntry: (id, entry) => set((state) => ({ healthEntries: state.healthEntries.map((e) => e.id === id ? { ...e, ...entry } : e) })),

      // Medical Appointments
      addMedicalAppointment: (appointment) => set((state) => ({ medicalAppointments: [...state.medicalAppointments, appointment] })),
      updateMedicalAppointment: (id, appointment) => set((state) => ({ medicalAppointments: state.medicalAppointments.map((a) => a.id === id ? { ...a, ...appointment, updatedAt: new Date().toISOString() } : a) })),
      deleteMedicalAppointment: (id) => set((state) => ({ medicalAppointments: state.medicalAppointments.filter((a) => a.id !== id) })),

      // Medical Tasks
      addMedicalTask: (task) => set((state) => ({ medicalTasks: [...state.medicalTasks, task] })),
      updateMedicalTask: (id, task) => set((state) => ({ medicalTasks: state.medicalTasks.map((t) => t.id === id ? { ...t, ...task, updatedAt: new Date().toISOString() } : t) })),
      deleteMedicalTask: (id) => set((state) => ({ medicalTasks: state.medicalTasks.filter((t) => t.id !== id) })),
      toggleMedicalTask: (id) => set((state) => ({ medicalTasks: state.medicalTasks.map((t) => t.id === id ? { ...t, completed: !t.completed, updatedAt: new Date().toISOString() } : t) })),

      // Quick Notes
      addQuickNote: (note) => set((state) => ({ quickNotes: [...state.quickNotes, note] })),
      updateQuickNote: (id, note) => set((state) => ({ quickNotes: state.quickNotes.map((n) => n.id === id ? { ...n, ...note } : n) })),
      deleteQuickNote: (id) => set((state) => ({ quickNotes: state.quickNotes.filter((n) => n.id !== id) })),

      // Conversations
      addConversation: (conversation) => set((state) => ({ conversations: [...state.conversations, conversation] })),
      updateConversation: (id, conversation) => set((state) => ({ conversations: state.conversations.map((c) => c.id === id ? { ...c, ...conversation } : c) })),
      deleteConversation: (id) => set((state) => ({ conversations: state.conversations.filter((c) => c.id !== id) })),
      addMessageToConversation: (conversationId, message) => set((state) => ({
        conversations: state.conversations.map((c) => c.id === conversationId ? { ...c, messages: [...c.messages, message], updatedAt: new Date().toISOString() } : c),
      })),

      // Projects
      addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
      updateProject: (id, project) => set((state) => ({ projects: state.projects.map((p) => p.id === id ? { ...p, ...project, updatedAt: new Date().toISOString() } : p) })),
      deleteProject: (id) => set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),

      // Project Tasks
      addTaskToProject: (projectId, task) => set((state) => ({
        projects: state.projects.map((p) => p.id === projectId ? { ...p, tasks: [...p.tasks, task] } : p),
      })),
      updateTaskInProject: (projectId, taskId, task) => set((state) => ({
        projects: state.projects.map((p) => p.id === projectId ? { ...p, tasks: p.tasks.map((t) => t.id === taskId ? { ...t, ...task, updatedAt: new Date().toISOString() } : t) } : p),
      })),
      deleteTaskFromProject: (projectId, taskId) => set((state) => ({
        projects: state.projects.map((p) => p.id === projectId ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p),
      })),

      // Project Milestones
      addMilestoneToProject: (projectId, milestone) => set((state) => ({
        projects: state.projects.map((p) => p.id === projectId ? { ...p, milestones: [...p.milestones, milestone] } : p),
      })),
      updateMilestoneInProject: (projectId, milestoneId, milestone) => set((state) => ({
        projects: state.projects.map((p) => p.id === projectId ? { ...p, milestones: p.milestones.map((m) => m.id === milestoneId ? { ...m, ...milestone, updatedAt: new Date().toISOString() } : m) } : p),
      })),
      deleteMilestoneFromProject: (projectId, milestoneId) => set((state) => ({
        projects: state.projects.map((p) => p.id === projectId ? { ...p, milestones: p.milestones.filter((m) => m.id !== milestoneId) } : p),
      })),

      // Project Documents
      addDocumentToProject: (projectId, document) => set((state) => ({
        projects: state.projects.map((p) => p.id === projectId ? { ...p, documents: [...(p.documents || []), document] } : p),
      })),
      updateDocumentInProject: (projectId, documentId, document) => set((state) => ({
        projects: state.projects.map((p) => p.id === projectId ? { ...p, documents: (p.documents || []).map((d) => d.id === documentId ? { ...d, ...document, updatedAt: new Date().toISOString() } : d) } : p),
      })),
      deleteDocumentFromProject: (projectId, documentId) => set((state) => ({
        projects: state.projects.map((p) => p.id === projectId ? { ...p, documents: (p.documents || []).filter((d) => d.id !== documentId) } : p),
      })),

      // Project Meetings
      addMeetingToProject: (projectId, meeting) => set((state) => ({
        projects: state.projects.map((p) => p.id === projectId ? { ...p, meetings: [...(p.meetings || []), meeting] } : p),
      })),
      updateMeetingInProject: (projectId, meetingId, meeting) => set((state) => ({
        projects: state.projects.map((p) => p.id === projectId ? { ...p, meetings: (p.meetings || []).map((m) => m.id === meetingId ? { ...m, ...meeting, updatedAt: new Date().toISOString() } : m) } : p),
      })),
      deleteMeetingFromProject: (projectId, meetingId) => set((state) => ({
        projects: state.projects.map((p) => p.id === projectId ? { ...p, meetings: (p.meetings || []).filter((m) => m.id !== meetingId) } : p),
      })),

      // Social Media Posts
      addSocialMediaPost: (post) => set((state) => ({ socialMediaPosts: [...state.socialMediaPosts, post] })),
      updateSocialMediaPost: (id, post) => set((state) => ({ socialMediaPosts: state.socialMediaPosts.map((p) => p.id === id ? { ...p, ...post, updatedAt: new Date().toISOString() } : p) })),
      deleteSocialMediaPost: (id) => set((state) => ({ socialMediaPosts: state.socialMediaPosts.filter((p) => p.id !== id) })),

      // Commercial Leads
      addCommercialLead: (lead) => set((state) => ({ commercialLeads: [...state.commercialLeads, lead] })),
      updateCommercialLead: (id, lead) => set((state) => ({ commercialLeads: state.commercialLeads.map((l) => l.id === id ? { ...l, ...lead, updatedAt: new Date().toISOString() } : l) })),
      deleteCommercialLead: (id) => set((state) => ({ commercialLeads: state.commercialLeads.filter((l) => l.id !== id) })),

      // Project Alerts
      addProjectAlert: (alert) => set((state) => ({ projectAlerts: [...state.projectAlerts, alert] })),
      updateProjectAlert: (id, alert) => set((state) => ({ projectAlerts: state.projectAlerts.map((a) => a.id === id ? { ...a, ...alert } : a) })),
      deleteProjectAlert: (id) => set((state) => ({ projectAlerts: state.projectAlerts.filter((a) => a.id !== id) })),
      dismissProjectAlert: (id) => set((state) => ({ projectAlerts: state.projectAlerts.map((a) => a.id === id ? { ...a, isDismissed: true } : a) })),
      markAlertAsRead: (id) => set((state) => ({ projectAlerts: state.projectAlerts.map((a) => a.id === id ? { ...a, isRead: true } : a) })),

      // Data management
      importAllData: (data) => set(() => ({
        settings: data.settings || defaultSettings,
        aiProfile: data.aiProfile || defaultAIProfile,
        events: data.events || [],
        sports: data.sports || [],
        yogaExercises: data.yogaExercises || [],
        meditationSessions: data.meditationSessions || [],
        yogaSessions: data.yogaSessions || [],
        books: data.books || [],
        diaryEntries: data.diaryEntries || [],
        limitingBeliefs: data.limitingBeliefs || [],
        goals: data.goals || [],
        habits: data.habits || [],
        transactions: data.transactions || [],
        savingsGoals: data.savingsGoals || [],
        budgets: data.budgets || [],
        sleepLogs: data.sleepLogs || [],
        hydrationLogs: data.hydrationLogs || [],
        healthEntries: data.healthEntries || [],
        medicalAppointments: data.medicalAppointments || [],
        medicalTasks: data.medicalTasks || [],
        quickNotes: data.quickNotes || [],
        conversations: data.conversations || [],
        projects: data.projects || [],
        socialMediaPosts: data.socialMediaPosts || [],
        commercialLeads: data.commercialLeads || [],
        projectAlerts: data.projectAlerts || [],
      })),
      resetAllData: () => set(() => ({ settings: defaultSettings, aiProfile: defaultAIProfile, ...defaultData })),
    }),
    {
      name: 'personal-dev-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
