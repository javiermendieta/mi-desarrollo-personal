import { create } from 'zustand'

// Types
export interface Proyecto {
  id: string
  nombre: string
  cliente: string
  fechaInicio: string
  fechaFin: string | null
  estado: string
  valorContrato: number | null
  notas: string | null
}

export interface Fase {
  id: string
  proyectoId: string
  nombre: string
  orden: number
  fechaInicio: string
  fechaFin: string
  estado: string
}

export interface Semana {
  id: string
  faseId: string
  numero: number
  fechaInicio: string
  fechaFin: string
  estado: string
  notas: string | null
}

export interface Tarea {
  id: string
  semanaId: string
  titulo: string
  descripcion: string | null
  estado: string
  prioridad: string
  fechaLimite: string | null
  responsable: string | null
}

export interface Entregable {
  id: string
  proyectoId: string
  nombre: string
  tipo: string
  estado: string
}

export interface Restaurante {
  id: string
  nombre: string
  codigo: string | null
  activo: boolean
}

export interface Canal {
  id: string
  nombre: string
  codigo: string | null
  activo: boolean
}

export interface Turno {
  id: string
  nombre: string
  codigo: string | null
}

export interface TipoDia {
  id: string
  nombre: string
  codigo: string
  color: string | null
  icono: string | null
}

export interface ForecastEntry {
  id: string
  fecha: string
  turnoId: string
  restauranteId: string
  canalId: string
  tipoDiaId: string
  paxTeorico: number
  paxReal: number
  ventaTeorica: number
  ventaReal: number
  ticketTeorico: number
  ticketReal: number
  semana: number
  mes: number
  trimestre: number
  año: number
}

export interface CuentaPL {
  id: string
  nivelId: string
  nombre: string
  codigo: string | null
  padreId: string | null
  orden: number
  esSubtotal: boolean
  esResultado: boolean
  activo: boolean
}

export interface PLValor {
  id: string
  cuentaId: string
  periodo: string
  tipoVista: string
  forecastMonto: number
  forecastPorcentaje: number
  realMonto: number
  realPorcentaje: number
  atribucion: string | null
}

// Store State
interface AppState {
  // Navigation
  activeModule: 'dashboard' | 'consulting' | 'forecast' | 'pl' | 'config'
  setActiveModule: (module: 'dashboard' | 'consulting' | 'forecast' | 'pl' | 'config') => void

  // Consulting
  proyectos: Proyecto[]
  fases: Fase[]
  semanas: Semana[]
  tareas: Tarea[]
  entregables: Entregable[]
  selectedProyectoId: string | null
  selectedFaseId: string | null
  setProyectos: (proyectos: Proyecto[]) => void
  setFases: (fases: Fase[]) => void
  setSemanas: (semanas: Semana[]) => void
  setTareas: (tareas: Tarea[]) => void
  setEntregables: (entregables: Entregable[]) => void
  setSelectedProyectoId: (id: string | null) => void
  setSelectedFaseId: (id: string | null) => void

  // Forecast
  restaurantes: Restaurante[]
  canales: Canal[]
  turnos: Turno[]
  tiposDia: TipoDia[]
  forecastEntries: ForecastEntry[]
  selectedRestauranteId: string | null
  setRestaurantes: (restaurantes: Restaurante[]) => void
  setCanales: (canales: Canal[]) => void
  setTurnos: (turnos: Turno[]) => void
  setTiposDia: (tiposDia: TipoDia[]) => void
  setForecastEntries: (entries: ForecastEntry[]) => void
  setSelectedRestauranteId: (id: string | null) => void

  // P&L
  nivelesPL: { id: string; codigo: string; nombre: string; orden: number }[]
  cuentasPL: CuentaPL[]
  plValores: PLValor[]
  selectedPeriodo: string
  selectedTipoVista: 'mensual' | 'trimestral' | 'anual'
  setNivelesPL: (niveles: { id: string; codigo: string; nombre: string; orden: number }[]) => void
  setCuentasPL: (cuentas: CuentaPL[]) => void
  setPLValores: (valores: PLValor[]) => void
  setSelectedPeriodo: (periodo: string) => void
  setSelectedTipoVista: (vista: 'mensual' | 'trimestral' | 'anual') => void

  // UI
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useStore = create<AppState>((set) => ({
  // Navigation
  activeModule: 'dashboard',
  setActiveModule: (module) => set({ activeModule: module }),

  // Consulting
  proyectos: [],
  fases: [],
  semanas: [],
  tareas: [],
  entregables: [],
  selectedProyectoId: null,
  selectedFaseId: null,
  setProyectos: (proyectos) => set({ proyectos }),
  setFases: (fases) => set({ fases }),
  setSemanas: (semanas) => set({ semanas }),
  setTareas: (tareas) => set({ tareas }),
  setEntregables: (entregables) => set({ entregables }),
  setSelectedProyectoId: (id) => set({ selectedProyectoId: id }),
  setSelectedFaseId: (id) => set({ selectedFaseId: id }),

  // Forecast
  restaurantes: [],
  canales: [],
  turnos: [],
  tiposDia: [],
  forecastEntries: [],
  selectedRestauranteId: null,
  setRestaurantes: (restaurantes) => set({ restaurantes }),
  setCanales: (canales) => set({ canales }),
  setTurnos: (turnos) => set({ turnos }),
  setTiposDia: (tiposDia) => set({ tiposDia }),
  setForecastEntries: (entries) => set({ forecastEntries: entries }),
  setSelectedRestauranteId: (id) => set({ selectedRestauranteId: id }),

  // P&L
  nivelesPL: [],
  cuentasPL: [],
  plValores: [],
  selectedPeriodo: new Date().toISOString().slice(0, 7),
  selectedTipoVista: 'mensual',
  setNivelesPL: (niveles) => set({ nivelesPL: niveles }),
  setCuentasPL: (cuentas) => set({ cuentasPL: cuentas }),
  setPLValores: (valores) => set({ plValores: valores }),
  setSelectedPeriodo: (periodo) => set({ selectedPeriodo: periodo }),
  setSelectedTipoVista: (vista) => set({ selectedTipoVista: vista }),

  // UI
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))
