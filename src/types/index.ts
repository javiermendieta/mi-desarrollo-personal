// ==================== CALENDAR ====================
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  color: string;
  category: string;
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceEnd?: string;
}

// ==================== SPORTS ====================
export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
  completed: boolean;
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  exercises: Exercise[];
  createdAt: string;
}

export interface WorkoutSession {
  id: string;
  routineId: string;
  sportId: string;
  date: string;
  exercises: Exercise[];
  duration: number;
  notes?: string;
}

export interface Sport {
  id: string;
  name: string;
  icon: string;
  color: string;
  isActive: boolean;
  routines: WorkoutRoutine[];
  sessions: WorkoutSession[];
}

// ==================== YOGA & MEDITATION ====================
export interface YogaExercise {
  id: string;
  name: string;
  description: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  image?: string;
}

export interface MeditationSession {
  id: string;
  date: string;
  duration: number;
  type: 'mindfulness' | 'breathing' | 'guided' | 'body-scan';
  notes?: string;
  completed: boolean;
}

export interface YogaSession {
  id: string;
  date: string;
  exercises: string[];
  duration: number;
  completed: boolean;
}

// ==================== READING ====================
export interface BookNote {
  id: string;
  page: number;
  content: string;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  totalPages: number;
  currentPage: number;
  startDate: string;
  finishDate?: string;
  notes: BookNote[];
  status: 'reading' | 'completed' | 'paused';
  pdfUrl?: string;
  pdfName?: string;
  pdfData?: string;
}

// ==================== DIARY ====================
export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

export interface DiaryEntry {
  id: string;
  date: string;
  title?: string;
  content: string;
  mood: Mood;
  tags: string[];
  gratitude?: string[];
  createdAt: string;
}

export interface LimitingBelief {
  id: string;
  belief: string;
  explanation: string;
  dailyWork: string;
  createdAt: string;
  progress: number;
  isOvercome: boolean;
  reflections: { date: string; note: string }[];
}

// ==================== GOALS ====================
export type GoalTimeframe = 'short' | 'medium' | 'long';
export type GoalCategory = 'health' | 'career' | 'finance' | 'relationships' | 'personal' | 'education' | 'other';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  timeframe: GoalTimeframe;
  category: GoalCategory;
  deadline?: string;
  progress: number;
  milestones: { id: string; title: string; completed: boolean }[];
  createdAt: string;
  isCompleted: boolean;
}

// ==================== HABITS ====================
export interface HabitLog {
  date: string;
  completed: boolean;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekdays' | 'weekends' | 'custom';
  customDays?: number[];
  logs: HabitLog[];
  createdAt: string;
  isActive: boolean;
}

// ==================== FINANCES ====================
export type TransactionType = 'income' | 'expense';
export type TransactionCategory = 'salary' | 'freelance' | 'investment' | 'food' | 'transport' | 'entertainment' | 'health' | 'education' | 'shopping' | 'bills' | 'other';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  description: string;
  date: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: TransactionCategory;
  limit: number;
  month: string;
}

// ==================== P&L (Profit & Loss) ====================
export type PNLSectionType = 'gross_sales' | 'cost_of_sales' | 'cmv' | 'operating_expenses';

export interface PNLLineItem {
  id: string;
  name: string;
  theoretical: number; // Valor presupuesto/teórico
  real: number; // Valor real
  order: number;
}

export interface PNLSection {
  id: string;
  type: PNLSectionType;
  name: string;
  lineItems: PNLLineItem[];
  order: number;
}

export interface PNLData {
  id: string;
  period: string; // yyyy-MM
  sections: PNLSection[];
  createdAt: string;
  updatedAt: string;
}

// ==================== HEALTH ====================
export interface SleepLog {
  id: string;
  date: string;
  sleepTime: string;
  wakeTime: string;
  quality: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export interface HydrationLog {
  id: string;
  date: string;
  glasses: number;
  target: number;
}

export interface HealthEntry {
  id: string;
  date: string;
  weight?: number;
  steps?: number;
  calories?: number;
  notes?: string;
}

// ==================== MEDICAL ====================
export interface MedicalAppointment {
  id: string;
  title: string;
  doctor?: string;
  specialty?: string;
  location?: string;
  date: string;
  time: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  reminder?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalTask {
  id: string;
  title: string;
  category: 'checkup' | 'exam' | 'medication' | 'specialist' | 'other';
  dueDate?: string;
  notes?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== NOTES ====================
export interface QuickNote {
  id: string;
  title: string;
  content: string;
  category: string;
  color: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==================== AI AGENT ====================
export interface AIProfile {
  personality: string;
  lifeGoals: string;
  currentChallenges: string;
  values: string;
  interests: string;
  additionalInfo?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// ==================== PROJECTS ====================
export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type ProjectType = 'client' | 'internal';

// Client info for consulting projects
export interface ClientInfo {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  industry?: string;
  notes?: string;
}

// Project document with file upload support
export interface ProjectDocument {
  id: string;
  name: string;
  type: string;
  description?: string;
  date: string;
  version?: string;
  fileName?: string;
  fileData?: string; // Base64 encoded file
  fileSize?: number;
  status: 'draft' | 'review' | 'final';
  createdAt: string;
  updatedAt: string;
}

// Project meeting
export interface ProjectMeeting {
  id: string;
  title: string;
  date: string;
  time?: string;
  duration?: number;
  type: 'kickoff' | 'followup' | 'review' | 'delivery' | 'other';
  agenda: string[];
  attendees: string[];
  notes?: string;
  actionItems: { id: string; task: string; assigned: string; completed: boolean }[];
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// Social media post
export interface SocialMediaPost {
  id: string;
  platform: 'instagram' | 'linkedin' | 'twitter' | 'facebook' | 'youtube' | 'tiktok' | 'other';
  content: string;
  hashtags?: string[];
  scheduledDate?: string;
  scheduledTime?: string;
  status: 'idea' | 'draft' | 'scheduled' | 'published' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Commercial lead
export interface CommercialLead {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  value?: number;
  probability?: number;
  notes?: string;
  nextFollowUp?: string;
  createdAt: string;
  updatedAt: string;
}

// Alert/Notification
export interface ProjectAlert {
  id: string;
  type: 'meeting' | 'deadline' | 'followup' | 'task';
  title: string;
  description?: string;
  date: string;
  projectId?: string;
  leadId?: string;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedAt?: string;
  assignee?: string;
  tags: string[];
  subtasks: { id: string; title: string; completed: boolean }[];
  milestoneId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  type: ProjectType;
  status: ProjectStatus;
  priority: ProjectPriority;
  color: string;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  progress: number;
  client?: ClientInfo;
  documents: ProjectDocument[];
  meetings: ProjectMeeting[];
  tasks: ProjectTask[];
  milestones: Milestone[];
  tags: string[];
  notes?: string;
  links: { title: string; url: string }[];
  files: { name: string; url: string; type: string; uploadedAt: string }[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// ==================== APP STATE ====================
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export interface AppData {
  settings: AppSettings;
  aiProfile: AIProfile;
  events: CalendarEvent[];
  sports: Sport[];
  yogaExercises: YogaExercise[];
  meditationSessions: MeditationSession[];
  yogaSessions: YogaSession[];
  books: Book[];
  diaryEntries: DiaryEntry[];
  limitingBeliefs: LimitingBelief[];
  goals: Goal[];
  habits: Habit[];
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  budgets: Budget[];
  pnlData: PNLData[];
  sleepLogs: SleepLog[];
  hydrationLogs: HydrationLog[];
  healthEntries: HealthEntry[];
  medicalAppointments: MedicalAppointment[];
  medicalTasks: MedicalTask[];
  quickNotes: QuickNote[];
  conversations: AIConversation[];
  projects: Project[];
  socialMediaPosts: SocialMediaPost[];
  commercialLeads: CommercialLead[];
  projectAlerts: ProjectAlert[];
}
