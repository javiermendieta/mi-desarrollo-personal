-- Crear tablas para Mi Desarrollo Personal

CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Settings" (
  id TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE REFERENCES "User"(id),
  theme TEXT DEFAULT 'system',
  language TEXT DEFAULT 'es',
  notifications BOOLEAN DEFAULT true,
  "weekStartsOn" INTEGER DEFAULT 1,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "AIProfile" (
  id TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE REFERENCES "User"(id),
  personality TEXT,
  "lifeGoals" TEXT,
  "currentChallenges" TEXT,
  values TEXT,
  interests TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "CalendarEvent" (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"(id),
  title TEXT NOT NULL,
  description TEXT,
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP,
  color TEXT DEFAULT '#3b82f6',
  category TEXT DEFAULT 'Personal',
  "isRecurring" BOOLEAN DEFAULT false,
  "recurrencePattern" TEXT,
  "recurrenceEnd" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Sport" (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"(id),
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'dumbbell',
  color TEXT DEFAULT '#22c55e',
  "isActive" BOOLEAN DEFAULT true,
  routines JSONB,
  sessions JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "YogaExercise" (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"(id),
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER DEFAULT 10,
  difficulty TEXT DEFAULT 'beginner',
  category TEXT,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "MeditationSession" (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"(id),
  date TIMESTAMP NOT NULL,
  duration INTEGER NOT NULL,
  type TEXT DEFAULT 'mindfulness',
  notes TEXT,
  completed BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "YogaSession" (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"(id),
  date TIMESTAMP NOT NULL,
  duration INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Book" (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"(id),
  title TEXT NOT NULL,
  author TEXT,
  "totalPages" INTEGER NOT NULL,
  "currentPage" INTEGER DEFAULT 0,
  "startDate" TIMESTAMP DEFAULT NOW(),
  "finishDate" TIMESTAMP,
  status TEXT DEFAULT 'reading',
  notes JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "DiaryEntry" (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"(id),
  date TIMESTAMP NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  mood TEXT DEFAULT 'good',
  tags JSONB,
  gratitude JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "LimitingBelief" (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"(id),
  belief TEXT NOT NULL,
  explanation TEXT,
  "dailyWork" TEXT,
  progress INTEGER DEFAULT 0,
  "isOvercome" BOOLEAN DEFAULT false,
  reflections JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Goal" (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"(id),
  title TEXT NOT NULL,
  description TEXT,
  timeframe TEXT DEFAULT 'short',
  category TEXT DEFAULT 'personal',
  deadline TIMESTAMP,
  progress INTEGER DEFAULT 0,
  "isCompleted" BOOLEAN DEFAULT false,
  milestones JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Habit" (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"(id),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'check',
  color TEXT DEFAULT '#22c55e',
  frequency TEXT DEFAULT 'daily',
  "customDays" JSONB,
  "isActive" BOOLEAN DEFAULT true,
  logs JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Transaction" (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"(id),
  type TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  category TEXT DEFAULT 'other',
  description TEXT,
  date TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "SavingsGoal" (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"(id),
  name TEXT NOT NULL,
  "targetAmount" DOUBLE PRECISION NOT NULL,
  "currentAmount" DOUBLE PRECISION DEFAULT 0,
  deadline TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Budget" (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"(id),
  category TEXT NOT NULL,
  "limitAmount" DOUBLE PRECISION NOT NULL,
  month TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "SleepLog" (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"(id),
  date TIMESTAMP NOT NULL,
  "sleepTime" TEXT,
  "wakeTime" TEXT,
  quality INTEGER DEFAULT 3,
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "HydrationLog" (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"(id),
  date TIMESTAMP NOT NULL,
  glasses INTEGER DEFAULT 0,
  target INTEGER DEFAULT 8,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "HealthEntry" (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"(id),
  date TIMESTAMP NOT NULL,
  weight DOUBLE PRECISION,
  steps INTEGER,
  calories INTEGER,
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "QuickNote" (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"(id),
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'Otros',
  color TEXT DEFAULT '#ffffff',
  "isPinned" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Conversation" (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"(id),
  title TEXT DEFAULT 'Nueva conversación',
  messages JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
