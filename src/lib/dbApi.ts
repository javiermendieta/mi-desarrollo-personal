// API helper functions for database synchronization

// Account Plan API
export async function saveAccountPlanToDB(account: {
  id?: string;
  code?: string;
  name: string;
  type: string;
  category: string;
  subcategory?: string;
  order?: number;
  isActive?: boolean;
}) {
  const method = account.id ? 'PUT' : 'POST';
  const res = await fetch('/api/account-plan', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(account),
  });
  if (!res.ok) throw new Error('Error saving account plan');
  return res.json();
}

export async function deleteAccountPlanFromDB(id: string) {
  const res = await fetch(`/api/account-plan?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error deleting account plan');
  return res.json();
}

// P&L API
export async function savePNLToDB(data: {
  id?: string;
  period: string;
  accountPlans: { accountId: string; theoretical: number }[];
}) {
  const res = await fetch('/api/pnl', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error saving P&L');
  return res.json();
}

export async function deletePNLFromDB(id: string) {
  const res = await fetch(`/api/pnl?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error deleting P&L');
  return res.json();
}

// Projects API
export async function saveProjectToDB(project: {
  id?: string;
  name: string;
  description?: string;
  client?: string;
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  color?: string;
  tasks?: unknown[];
  milestones?: unknown[];
  documents?: unknown[];
  meetings?: unknown[];
}) {
  const method = project.id ? 'PUT' : 'POST';
  const res = await fetch('/api/projects', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error('Error saving project');
  return res.json();
}

export async function deleteProjectFromDB(id: string) {
  const res = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error deleting project');
  return res.json();
}

// Commercial Leads API
export async function saveCommercialLeadToDB(lead: {
  id?: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  value?: number;
  probability?: number;
  notes?: string;
}) {
  const method = lead.id ? 'PUT' : 'POST';
  const res = await fetch('/api/commercial-leads', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  });
  if (!res.ok) throw new Error('Error saving lead');
  return res.json();
}

export async function deleteCommercialLeadFromDB(id: string) {
  const res = await fetch(`/api/commercial-leads?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error deleting lead');
  return res.json();
}

// Transactions API
export async function saveTransactionToDB(transaction: {
  id?: string;
  type: string;
  amount: number;
  category?: string;
  description?: string;
  date: string;
  accountId?: string;
}) {
  const method = transaction.id ? 'PUT' : 'POST';
  const res = await fetch('/api/transactions', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction),
  });
  if (!res.ok) throw new Error('Error saving transaction');
  return res.json();
}

export async function deleteTransactionFromDB(id: string) {
  const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error deleting transaction');
  return res.json();
}

// Events API
export async function saveEventToDB(event: {
  id?: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  color?: string;
  category?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
}) {
  const method = event.id ? 'PUT' : 'POST';
  const res = await fetch('/api/events', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error('Error saving event');
  return res.json();
}

export async function deleteEventFromDB(id: string) {
  const res = await fetch(`/api/events?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error deleting event');
  return res.json();
}

// Goals API
export async function saveGoalToDB(goal: {
  id?: string;
  title: string;
  description?: string;
  timeframe?: string;
  category?: string;
  deadline?: string;
  progress?: number;
  isCompleted?: boolean;
  milestones?: unknown[];
}) {
  const method = goal.id ? 'PUT' : 'POST';
  const res = await fetch('/api/goals', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal),
  });
  if (!res.ok) throw new Error('Error saving goal');
  return res.json();
}

export async function deleteGoalFromDB(id: string) {
  const res = await fetch(`/api/goals?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error deleting goal');
  return res.json();
}

// Habits API
export async function saveHabitToDB(habit: {
  id?: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  frequency?: string;
  customDays?: number[];
  isActive?: boolean;
  logs?: { date: string; completed: boolean }[];
}) {
  const method = habit.id ? 'PUT' : 'POST';
  const res = await fetch('/api/habits', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(habit),
  });
  if (!res.ok) throw new Error('Error saving habit');
  return res.json();
}

export async function deleteHabitFromDB(id: string) {
  const res = await fetch(`/api/habits?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error deleting habit');
  return res.json();
}

// Sports API
export async function saveSportToDB(sport: {
  id?: string;
  name: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  routines?: unknown[];
  sessions?: unknown[];
}) {
  const method = sport.id ? 'PUT' : 'POST';
  const res = await fetch('/api/sports', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sport),
  });
  if (!res.ok) throw new Error('Error saving sport');
  return res.json();
}

export async function deleteSportFromDB(id: string) {
  const res = await fetch(`/api/sports?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error deleting sport');
  return res.json();
}

// Books API
export async function saveBookToDB(book: {
  id?: string;
  title: string;
  author?: string;
  totalPages: number;
  currentPage?: number;
  startDate?: string;
  finishDate?: string;
  status?: string;
  notes?: unknown[];
  pdfUrl?: string;
  pdfName?: string;
}) {
  const method = book.id ? 'PUT' : 'POST';
  const res = await fetch('/api/books', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book),
  });
  if (!res.ok) throw new Error('Error saving book');
  return res.json();
}

export async function deleteBookFromDB(id: string) {
  const res = await fetch(`/api/books?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error deleting book');
  return res.json();
}

// Diary API
export async function saveDiaryEntryToDB(entry: {
  id?: string;
  date: string;
  title?: string;
  content: string;
  mood?: string;
  tags?: string[];
  gratitude?: string[];
}) {
  const method = entry.id ? 'PUT' : 'POST';
  const res = await fetch('/api/diary', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error('Error saving diary entry');
  return res.json();
}

export async function deleteDiaryEntryFromDB(id: string) {
  const res = await fetch(`/api/diary?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error deleting diary entry');
  return res.json();
}

// Meditation API
export async function saveMeditationToDB(session: {
  id?: string;
  date: string;
  duration: number;
  type?: string;
  notes?: string;
  completed?: boolean;
}) {
  const method = session.id ? 'PUT' : 'POST';
  const res = await fetch('/api/meditation', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  });
  if (!res.ok) throw new Error('Error saving meditation session');
  return res.json();
}

// Health API
export async function saveSleepLogToDB(log: {
  id?: string;
  date: string;
  sleepTime?: string;
  wakeTime?: string;
  quality?: number;
  notes?: string;
}) {
  const method = log.id ? 'PUT' : 'POST';
  const res = await fetch('/api/sleep', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log),
  });
  if (!res.ok) throw new Error('Error saving sleep log');
  return res.json();
}

export async function saveHydrationLogToDB(log: {
  id?: string;
  date: string;
  glasses: number;
  target?: number;
}) {
  const method = log.id ? 'PUT' : 'POST';
  const res = await fetch('/api/hydration', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log),
  });
  if (!res.ok) throw new Error('Error saving hydration log');
  return res.json();
}

export async function saveHealthEntryToDB(entry: {
  id?: string;
  date: string;
  weight?: number;
  steps?: number;
  calories?: number;
  notes?: string;
}) {
  const method = entry.id ? 'PUT' : 'POST';
  const res = await fetch('/api/health', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error('Error saving health entry');
  return res.json();
}
