// Event colors for calendar
export const EVENT_COLORS = [
  { name: 'Rojo', value: '#ef4444' },
  { name: 'Naranja', value: '#f97316' },
  { name: 'Amarillo', value: '#eab308' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Índigo', value: '#6366f1' },
  { name: 'Púrpura', value: '#a855f7' },
  { name: 'Rosa', value: '#ec4899' },
];

// Event categories
export const EVENT_CATEGORIES = [
  'Trabajo',
  'Ejercicio',
  'Salud',
  'Personal',
  'Familia',
  'Educación',
  'Social',
  'Otros',
];

// Default sports
export const DEFAULT_SPORTS = [
  { name: 'Calistenia', icon: 'dumbbell', color: '#22c55e' },
  { name: 'Gimnasio', icon: 'weight', color: '#3b82f6' },
  { name: 'Natación', icon: 'waves', color: '#06b6d4' },
  { name: 'Correr', icon: 'run', color: '#f97316' },
  { name: 'Ciclismo', icon: 'bike', color: '#8b5cf6' },
  { name: 'Yoga', icon: 'yoga', color: '#ec4899' },
];

// Yoga categories
export const YOGA_CATEGORIES = [
  'Vinyasa',
  'Hatha',
  'Ashtanga',
  'Yin',
  'Restaurativo',
  'Power Yoga',
  'Kundalini',
];

// Meditation types
export const MEDITATION_TYPES = [
  { value: 'mindfulness', label: 'Mindfulness' },
  { value: 'breathing', label: 'Respiración' },
  { value: 'guided', label: 'Guiada' },
  { value: 'body-scan', label: 'Body Scan' },
];

// Mood options
export const MOOD_OPTIONS = [
  { value: 'great', label: 'Genial', emoji: '😄', color: '#22c55e' },
  { value: 'good', label: 'Bien', emoji: '🙂', color: '#84cc16' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', color: '#eab308' },
  { value: 'bad', label: 'Mal', emoji: '😔', color: '#f97316' },
  { value: 'terrible', label: 'Terrible', emoji: '😢', color: '#ef4444' },
];

// Goal categories
export const GOAL_CATEGORIES = [
  { value: 'health', label: 'Salud', icon: 'heart' },
  { value: 'career', label: 'Carrera', icon: 'briefcase' },
  { value: 'finance', label: 'Finanzas', icon: 'wallet' },
  { value: 'relationships', label: 'Relaciones', icon: 'users' },
  { value: 'personal', label: 'Personal', icon: 'user' },
  { value: 'education', label: 'Educación', icon: 'book' },
  { value: 'other', label: 'Otros', icon: 'star' },
];

// Goal timeframes
export const GOAL_TIMEFRAMES = [
  { value: 'short', label: 'Corto plazo (< 3 meses)' },
  { value: 'medium', label: 'Mediano plazo (3-12 meses)' },
  { value: 'long', label: 'Largo plazo (> 1 año)' },
];

// Transaction categories
export const TRANSACTION_CATEGORIES = {
  income: [
    { value: 'salary', label: 'Salario', icon: 'briefcase' },
    { value: 'freelance', label: 'Freelance', icon: 'laptop' },
    { value: 'investment', label: 'Inversión', icon: 'trending-up' },
    { value: 'other', label: 'Otros', icon: 'plus' },
  ],
  expense: [
    { value: 'food', label: 'Comida', icon: 'utensils' },
    { value: 'transport', label: 'Transporte', icon: 'car' },
    { value: 'entertainment', label: 'Entretenimiento', icon: 'film' },
    { value: 'health', label: 'Salud', icon: 'heart' },
    { value: 'education', label: 'Educación', icon: 'book' },
    { value: 'shopping', label: 'Compras', icon: 'shopping-bag' },
    { value: 'bills', label: 'Facturas', icon: 'file-text' },
    { value: 'other', label: 'Otros', icon: 'more-horizontal' },
  ],
};

// Note categories
export const NOTE_CATEGORIES = [
  'Ideas',
  'Trabajo',
  'Personal',
  'Proyectos',
  'Lista de tareas',
  'Recordatorios',
  'Otros',
];

// Note colors
export const NOTE_COLORS = [
  { name: 'Blanco', value: '#ffffff' },
  { name: 'Rojo', value: '#fef2f2' },
  { name: 'Naranja', value: '#fff7ed' },
  { name: 'Amarillo', value: '#fefce8' },
  { name: 'Verde', value: '#f0fdf4' },
  { name: 'Azul', value: '#eff6ff' },
  { name: 'Púrpura', value: '#faf5ff' },
  { name: 'Rosa', value: '#fdf2f8' },
];

// Habit icons
export const HABIT_ICONS = [
  'sun',
  'moon',
  'droplet',
  'dumbbell',
  'book',
  'pen',
  'heart',
  'brain',
  'music',
  'leaf',
  'coffee',
  'bed',
];

// Habit colors
export const HABIT_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#6366f1',
  '#a855f7',
  '#ec4899',
];

// Biblical verses for AI agent
export const BIBLICAL_VERSES = {
  anxiety: [
    { verse: 'No se inquieten por nada; más bien, en toda ocasión, con oración y ruego, presenten sus peticiones a Dios y denle gracias.', reference: 'Filipenses 4:6' },
    { verse: 'Echa sobre el Señor tu carga, y él te sustentará.', reference: 'Salmos 55:22' },
  ],
  fear: [
    { verse: 'Porque Dios no nos ha dado un espíritu de cobardía, sino de poder, de amor y de dominio propio.', reference: '2 Timoteo 1:7' },
    { verse: 'El Señor es mi luz y mi salvación; ¿a quién temeré? El Señor es el baluarte de mi vida; ¿quién podrá amedrentarme?', reference: 'Salmos 27:1' },
  ],
  hope: [
    { verse: 'Porque yo sé muy bien los planes que tengo para ustedes, planes de bienestar y no de calamidad, a fin de darles un futuro y una esperanza.', reference: 'Jeremías 29:11' },
    { verse: 'Los que confían en el Señor renovarán sus fuerzas; levantarán alas como las águilas; correrán, y no se cansarán; caminarán, y no se fatigarán.', reference: 'Isaías 40:31' },
  ],
  strength: [
    { verse: 'Todo lo puedo en Cristo que me fortalece.', reference: 'Filipenses 4:13' },
    { verse: 'El Señor es mi fuerza y mi escudo; mi corazón en él confía; de él recibo ayuda.', reference: 'Salmos 28:7' },
  ],
  love: [
    { verse: 'Ámense los unos a los otros con amor fraternal, respetando cada uno a los demás.', reference: 'Romanos 12:10' },
    { verse: 'El amor es paciente, es bondadoso. El amor no es envidioso ni jactancioso ni orgulloso.', reference: '1 Corintios 13:4' },
  ],
  wisdom: [
    { verse: 'El temor del Señor es el principio de la sabiduría, y el conocimiento del Santísimo es la inteligencia.', reference: 'Proverbios 9:10' },
    { verse: 'Si alguno de ustedes carece de sabiduría, pídala a Dios, y él se la dará, pues Dios da a todos generosamente sin menospreciar a nadie.', reference: 'Santiago 1:5' },
  ],
};

// Sleep quality labels
export const SLEEP_QUALITY_LABELS = [
  { value: 1, label: 'Muy malo' },
  { value: 2, label: 'Malo' },
  { value: 3, label: 'Regular' },
  { value: 4, label: 'Bueno' },
  { value: 5, label: 'Excelente' },
];
