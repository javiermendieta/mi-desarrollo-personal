// API helper functions to sync data with the server

const API_BASE = '/api';

// Generic fetch helper
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return res.json();
}

// Goals API
export const goalsApi = {
  getAll: () => apiFetch('/goals'),
  add: (goal: any) => apiFetch('/goals', { method: 'POST', body: JSON.stringify(goal) }),
  update: (id: string, data: any) => apiFetch('/goals', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
  delete: (id: string) => apiFetch('/goals', { method: 'DELETE', body: JSON.stringify({ id }) }),
};

// Habits API
export const habitsApi = {
  getAll: () => apiFetch('/habits'),
  add: (habit: any) => apiFetch('/habits', { method: 'POST', body: JSON.stringify(habit) }),
  update: (id: string, data: any) => apiFetch('/habits', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
  delete: (id: string) => apiFetch('/habits', { method: 'DELETE', body: JSON.stringify({ id }) }),
};

// Events API
export const eventsApi = {
  getAll: () => apiFetch('/events'),
  add: (event: any) => apiFetch('/events', { method: 'POST', body: JSON.stringify(event) }),
  update: (id: string, data: any) => apiFetch('/events', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
  delete: (id: string) => apiFetch('/events', { method: 'DELETE', body: JSON.stringify({ id }) }),
};

// Transactions API
export const transactionsApi = {
  getAll: () => apiFetch('/transactions'),
  add: (transaction: any) => apiFetch('/transactions', { method: 'POST', body: JSON.stringify(transaction) }),
  update: (id: string, data: any) => apiFetch('/transactions', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
  delete: (id: string) => apiFetch('/transactions', { method: 'DELETE', body: JSON.stringify({ id }) }),
};

// Savings Goals API
export const savingsApi = {
  getAll: () => apiFetch('/savings'),
  add: (goal: any) => apiFetch('/savings', { method: 'POST', body: JSON.stringify(goal) }),
  update: (id: string, data: any) => apiFetch('/savings', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
  delete: (id: string) => apiFetch('/savings', { method: 'DELETE', body: JSON.stringify({ id }) }),
};

// Diary API
export const diaryApi = {
  getAll: () => apiFetch('/diary'),
  add: (entry: any) => apiFetch('/diary', { method: 'POST', body: JSON.stringify(entry) }),
  update: (id: string, data: any) => apiFetch('/diary', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
  delete: (id: string) => apiFetch('/diary', { method: 'DELETE', body: JSON.stringify({ id }) }),
};

// Books API
export const booksApi = {
  getAll: () => apiFetch('/books'),
  add: (book: any) => apiFetch('/books', { method: 'POST', body: JSON.stringify(book) }),
  update: (id: string, data: any) => apiFetch('/books', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
  delete: (id: string) => apiFetch('/books', { method: 'DELETE', body: JSON.stringify({ id }) }),
};

// Notes API
export const notesApi = {
  getAll: () => apiFetch('/notes'),
  add: (note: any) => apiFetch('/notes', { method: 'POST', body: JSON.stringify(note) }),
  update: (id: string, data: any) => apiFetch('/notes', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
  delete: (id: string) => apiFetch('/notes', { method: 'DELETE', body: JSON.stringify({ id }) }),
};

// Health APIs
export const healthApi = {
  getSleepLogs: () => apiFetch('/sleep'),
  addSleepLog: (log: any) => apiFetch('/sleep', { method: 'POST', body: JSON.stringify(log) }),
  getHydrationLogs: () => apiFetch('/hydration'),
  addHydrationLog: (log: any) => apiFetch('/hydration', { method: 'POST', body: JSON.stringify(log) }),
  getHealthEntries: () => apiFetch('/health'),
  addHealthEntry: (entry: any) => apiFetch('/health', { method: 'POST', body: JSON.stringify(entry) }),
};

// Sports API
export const sportsApi = {
  getAll: () => apiFetch('/sports'),
  add: (sport: any) => apiFetch('/sports', { method: 'POST', body: JSON.stringify(sport) }),
  update: (id: string, data: any) => apiFetch('/sports', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
  delete: (id: string) => apiFetch('/sports', { method: 'DELETE', body: JSON.stringify({ id }) }),
};

// Yoga API
export const yogaApi = {
  getExercises: () => apiFetch('/yoga'),
  addExercise: (exercise: any) => apiFetch('/yoga', { method: 'POST', body: JSON.stringify(exercise) }),
  updateExercise: (id: string, data: any) => apiFetch('/yoga', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
  deleteExercise: (id: string) => apiFetch('/yoga', { method: 'DELETE', body: JSON.stringify({ id }) }),
};

// Meditation API
export const meditationApi = {
  getSessions: () => apiFetch('/meditation'),
  addSession: (session: any) => apiFetch('/meditation', { method: 'POST', body: JSON.stringify(session) }),
};

// AI Profile API
export const aiProfileApi = {
  get: () => apiFetch('/ai-profile'),
  update: (data: any) => apiFetch('/ai-profile', { method: 'PUT', body: JSON.stringify(data) }),
};

// Conversations API
export const conversationsApi = {
  getAll: () => apiFetch('/conversations'),
  add: (conv: any) => apiFetch('/conversations', { method: 'POST', body: JSON.stringify(conv) }),
  update: (id: string, data: any) => apiFetch('/conversations', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
  delete: (id: string) => apiFetch('/conversations', { method: 'DELETE', body: JSON.stringify({ id }) }),
};

// Load all data at once
export async function loadAllData() {
  try {
    const res = await apiFetch('/data');
    return res;
  } catch (error) {
    console.error('Error loading data:', error);
    return null;
  }
}
