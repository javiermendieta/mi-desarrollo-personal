'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useStore } from '@/store/useStore'
import { prisma } from '@/lib/prisma'
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Edit,
} from 'lucide-react'

// API functions
async function fetchProyectos() {
  const res = await fetch('/api/consulting/proyectos')
  if (!res.ok) return []
  return res.json()
}

async function createProyecto(data: any) {
  const res = await fetch('/api/consulting/proyectos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

async function fetchFases(proyectoId: string) {
  const res = await fetch(`/api/consulting/fases?proyectoId=${proyectoId}`)
  if (!res.ok) return []
  return res.json()
}

async function fetchSemanas(faseId: string) {
  const res = await fetch(`/api/consulting/semanas?faseId=${faseId}`)
  if (!res.ok) return []
  return res.json()
}

async function fetchTareas(semanaId: string) {
  const res = await fetch(`/api/consulting/tareas?semanaId=${semanaId}`)
  if (!res.ok) return []
  return res.json()
}

export function ConsultingModule() {
  const {
    proyectos,
    fases,
    semanas,
    tareas,
    selectedProyectoId,
    selectedFaseId,
    setProyectos,
    setFases,
    setSemanas,
    setTareas,
    setSelectedProyectoId,
    setSelectedFaseId,
  } = useStore()

  const [showNewProyecto, setShowNewProyecto] = useState(false)
  const [newProyecto, setNewProyecto] = useState({
    nombre: '',
    cliente: '',
    fechaInicio: '',
    fechaFin: '',
    valorContrato: '',
  })

  const [expandedFases, setExpandedFases] = useState<Record<string, boolean>>({})
  const [expandedSemanas, setExpandedSemanas] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchProyectos().then(setProyectos)
  }, [])

  useEffect(() => {
    if (selectedProyectoId) {
      fetchFases(selectedProyectoId).then(setFases)
    }
  }, [selectedProyectoId])

  useEffect(() => {
    if (selectedFaseId) {
      fetchSemanas(selectedFaseId).then(setSemanas)
    }
  }, [selectedFaseId])

  const handleCreateProyecto = async () => {
    if (!newProyecto.nombre || !newProyecto.cliente) return

    const proyecto = await createProyecto({
      ...newProyecto,
      fechaInicio: newProyecto.fechaInicio || new Date().toISOString(),
      fechaFin: newProyecto.fechaFin || null,
      valorContrato: newProyecto.valorContrato ? parseFloat(newProyecto.valorContrato) : null,
    })

    setProyectos([...proyectos, proyecto])
    setShowNewProyecto(false)
    setNewProyecto({ nombre: '', cliente: '', fechaInicio: '', fechaFin: '', valorContrato: '' })
  }

  const toggleFase = (faseId: string) => {
    setExpandedFases((prev) => ({ ...prev, [faseId]: !prev[faseId] }))
    setSelectedFaseId(faseId)
  }

  const toggleSemana = async (semanaId: string) => {
    setExpandedSemanas((prev) => ({ ...prev, [semanaId]: !prev[semanaId] }))
    const tareasData = await fetchTareas(semanaId)
    setTareas(tareasData)
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado':
      case 'completada':
        return 'text-green-400'
      case 'en_progreso':
        return 'text-yellow-400'
      default:
        return 'text-dark-400'
    }
  }

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return 'bg-red-500'
      case 'media':
        return 'bg-yellow-500'
      default:
        return 'bg-green-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-dark-100">Proyectos de Consultoría</h2>
          <p className="text-dark-400 text-sm">Gestiona tus proyectos, fases y tareas</p>
        </div>
        <Button onClick={() => setShowNewProyecto(true)}>
          <Plus size={18} className="mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* New Proyecto Modal */}
      {showNewProyecto && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Nuevo Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Nombre del proyecto"
              value={newProyecto.nombre}
              onChange={(e) => setNewProyecto({ ...newProyecto, nombre: e.target.value })}
              placeholder="Ej: Optimización Olivia Pizza"
            />
            <Input
              label="Cliente"
              value={newProyecto.cliente}
              onChange={(e) => setNewProyecto({ ...newProyecto, cliente: e.target.value })}
              placeholder="Ej: Olivia"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Fecha inicio"
                type="date"
                value={newProyecto.fechaInicio}
                onChange={(e) => setNewProyecto({ ...newProyecto, fechaInicio: e.target.value })}
              />
              <Input
                label="Fecha fin"
                type="date"
                value={newProyecto.fechaFin}
                onChange={(e) => setNewProyecto({ ...newProyecto, fechaFin: e.target.value })}
              />
            </div>
            <Input
              label="Valor del contrato"
              type="number"
              value={newProyecto.valorContrato}
              onChange={(e) => setNewProyecto({ ...newProyecto, valorContrato: e.target.value })}
              placeholder="Ej: 50000"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowNewProyecto(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateProyecto}>Crear Proyecto</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proyectos List */}
      <div className="grid gap-4">
        {proyectos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Briefcase size={48} className="mx-auto text-dark-500 mb-4" />
              <p className="text-dark-400">No hay proyectos creados</p>
              <p className="text-dark-500 text-sm mt-1">
                Haz clic en "Nuevo Proyecto" para comenzar
              </p>
            </CardContent>
          </Card>
        ) : (
          proyectos.map((proyecto) => (
            <Card key={proyecto.id} className="cursor-pointer hover:border-primary-500 transition-colors">
              <CardContent
                className="p-4"
                onClick={() => setSelectedProyectoId(
                  selectedProyectoId === proyecto.id ? null : proyecto.id
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedProyectoId === proyecto.id ? (
                      <ChevronDown size={20} className="text-dark-400" />
                    ) : (
                      <ChevronRight size={20} className="text-dark-400" />
                    )}
                    <div>
                      <h3 className="font-semibold text-dark-100">{proyecto.nombre}</h3>
                      <p className="text-sm text-dark-400">Cliente: {proyecto.cliente}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      proyecto.estado === 'activo' ? 'bg-green-600 text-white' :
                      proyecto.estado === 'completado' ? 'bg-blue-600 text-white' :
                      'bg-dark-600 text-dark-300'
                    }`}>
                      {proyecto.estado}
                    </span>
                    {proyecto.valorContrato && (
                      <span className="text-dark-300 text-sm">
                        ${proyecto.valorContrato.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Fases */}
                {selectedProyectoId === proyecto.id && (
                  <div className="mt-4 ml-8 space-y-2">
                    {fases.filter(f => f.proyectoId === proyecto.id).map((fase) => (
                      <div key={fase.id} className="border-l-2 border-dark-600 pl-4 py-2">
                        <div
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFase(fase.id)
                          }}
                        >
                          {expandedFases[fase.id] ? (
                            <ChevronDown size={16} className="text-dark-400" />
                          ) : (
                            <ChevronRight size={16} className="text-dark-400" />
                          )}
                          <span className="font-medium text-dark-200">{fase.nombre}</span>
                          <span className={`text-xs ${getEstadoColor(fase.estado)}`}>
                            ({fase.estado})
                          </span>
                        </div>

                        {/* Semanas */}
                        {expandedFases[fase.id] && (
                          <div className="mt-2 ml-6 space-y-2">
                            {semanas.filter(s => s.faseId === fase.id).map((semana) => (
                              <div key={semana.id} className="border-l border-dark-700 pl-3 py-1">
                                <div
                                  className="flex items-center gap-2 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleSemana(semana.id)
                                  }}
                                >
                                  {expandedSemanas[semana.id] ? (
                                    <ChevronDown size={14} className="text-dark-500" />
                                  ) : (
                                    <ChevronRight size={14} className="text-dark-500" />
                                  )}
                                  <Calendar size={14} className="text-dark-400" />
                                  <span className="text-sm text-dark-300">
                                    Semana {semana.numero}
                                  </span>
                                  <span className={`text-xs ${getEstadoColor(semana.estado)}`}>
                                    ({semana.estado})
                                  </span>
                                </div>

                                {/* Tareas */}
                                {expandedSemanas[semana.id] && (
                                  <div className="mt-2 ml-5 space-y-1">
                                    {tareas.filter(t => t.semanaId === semana.id).map((tarea) => (
                                      <div
                                        key={tarea.id}
                                        className="flex items-center gap-2 py-1"
                                      >
                                        <div className={`w-2 h-2 rounded-full ${getPrioridadColor(tarea.prioridad)}`} />
                                        {tarea.estado === 'completada' ? (
                                          <CheckCircle size={14} className="text-green-400" />
                                        ) : (
                                          <Clock size={14} className="text-dark-400" />
                                        )}
                                        <span className="text-sm text-dark-200">{tarea.titulo}</span>
                                      </div>
                                    ))}
                                    {tareas.filter(t => t.semanaId === semana.id).length === 0 && (
                                      <p className="text-xs text-dark-500 ml-4">Sin tareas</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                            {semanas.filter(s => s.faseId === fase.id).length === 0 && (
                              <p className="text-xs text-dark-500 ml-4">Sin semanas definidas</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {fases.filter(f => f.proyectoId === proyecto.id).length === 0 && (
                      <p className="text-xs text-dark-500">Sin fases definidas</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

function Briefcase(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}
