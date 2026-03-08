'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useStore } from '@/store/useStore'
import { formatCurrency, getWeekNumber, getQuarter } from '@/lib/utils'
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  RefreshCw,
  Save,
  Plus,
} from 'lucide-react'

const TIPOS_DIA_DEFAULT = [
  { id: '1', codigo: 'NORMAL', nombre: 'Normal', color: '#22c55e', icono: '🟢' },
  { id: '2', codigo: 'FERIADO', nombre: 'Feriado', color: '#ef4444', icono: '🔴' },
  { id: '3', codigo: 'PRE_FERIADO', nombre: 'Pre-feriado', color: '#eab308', icono: '🟡' },
  { id: '4', codigo: 'POST_FERIADO', nombre: 'Post-feriado', color: '#3b82f6', icono: '🔵' },
]

const TURNOS_DEFAULT = [
  { id: '1', nombre: 'AM', codigo: 'AM' },
  { id: '2', nombre: 'PM', codigo: 'PM' },
  { id: '3', nombre: 'Noche', codigo: 'NOCHE' },
]

const CANALES_DEFAULT = [
  { id: '1', nombre: 'Delivery', codigo: 'DEL' },
  { id: '2', nombre: 'Salon', codigo: 'SAL' },
  { id: '3', nombre: 'Takeaway', codigo: 'TAKE' },
  { id: '4', nombre: 'Apps', codigo: 'APP' },
]

const RESTAURANTES_DEFAULT = [
  { id: '1', nombre: 'Olivia Pizza', codigo: 'OLI' },
]

export function ForecastModule() {
  const {
    restaurantes,
    canales,
    turnos,
    tiposDia,
    forecastEntries,
    setRestaurantes,
    setCanales,
    setTurnos,
    setTiposDia,
    setForecastEntries,
  } = useStore()

  const [selectedFecha, setSelectedFecha] = useState(new Date().toISOString().slice(0, 10))
  const [selectedTurno, setSelectedTurno] = useState('')
  const [selectedRestaurante, setSelectedRestaurante] = useState('')
  const [selectedCanal, setSelectedCanal] = useState('')
  const [selectedTipoDia, setSelectedTipoDia] = useState('NORMAL')

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  // Initialize defaults
  useEffect(() => {
    if (restaurantes.length === 0) {
      setRestaurantes(RESTAURANTES_DEFAULT)
      setCanales(CANALES_DEFAULT)
      setTurnos(TURNOS_DEFAULT)
      setTiposDia(TIPOS_DIA_DEFAULT)
    }
  }, [])

  const toggleRow = (rowId: string) => {
    setExpandedRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }))
  }

  // Generate week dates
  const generateWeekDates = () => {
    const dates = []
    const start = new Date(selectedFecha)
    const dayOfWeek = start.getDay()
    const diff = start.getDate() - dayOfWeek
    const sunday = new Date(start.setDate(diff))

    for (let i = 0; i < 7; i++) {
      const date = new Date(sunday)
      date.setDate(sunday.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const formatDate = (date: Date) => {
    const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`
  }

  const getTipoDiaInfo = (codigo: string) => {
    return tiposDia.find(t => t.codigo === codigo) || TIPOS_DIA_DEFAULT[0]
  }

  const calculateGap = (real: number, teorico: number) => {
    return real - teorico
  }

  const calculateGapPercentage = (real: number, teorico: number) => {
    if (teorico === 0) return 0
    return ((real - teorico) / teorico) * 100
  }

  // Summary calculations
  const summary = forecastEntries.reduce((acc, entry) => {
    acc.paxTeorico += entry.paxTeorico
    acc.paxReal += entry.paxReal
    acc.ventaTeorica += entry.ventaTeorica
    acc.ventaReal += entry.ventaReal
    return acc
  }, { paxTeorico: 0, paxReal: 0, ventaTeorica: 0, ventaReal: 0 })

  const weekDates = generateWeekDates()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-dark-100">Forecast vs Real</h2>
          <p className="text-dark-400 text-sm">Gestión completa de presupuesto por canal</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <RefreshCw size={16} className="mr-2" />
            Actualizar
          </Button>
          <Button>
            <Save size={16} className="mr-2" />
            Guardar Todo
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm text-dark-400 block mb-1">Desde</label>
              <input
                type="date"
                value={selectedFecha}
                onChange={(e) => setSelectedFecha(e.target.value)}
                className="px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-dark-100"
              />
            </div>
            <div>
              <label className="text-sm text-dark-400 block mb-1">Hasta</label>
              <input
                type="date"
                value={selectedFecha}
                onChange={(e) => setSelectedFecha(e.target.value)}
                className="px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-dark-100"
              />
            </div>
            <Select
              label="Restaurante"
              options={[
                { value: '', label: 'Todos los restaurantes' },
                ...restaurantes.map(r => ({ value: r.id, label: r.nombre }))
              ]}
              value={selectedRestaurante}
              onChange={(e) => setSelectedRestaurante(e.target.value)}
            />
            <Select
              label="Canal"
              options={[
                { value: '', label: 'Todos los canales' },
                ...canales.map(c => ({ value: c.id, label: c.nombre }))
              ]}
              value={selectedCanal}
              onChange={(e) => setSelectedCanal(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="text-center py-3">
            <p className="text-dark-400 text-xs">Pax Forecast</p>
            <p className="text-lg font-bold text-dark-100">{summary.paxTeorico.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-3">
            <p className="text-dark-400 text-xs">Pax Real</p>
            <p className="text-lg font-bold text-dark-100">{summary.paxReal.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-3">
            <p className="text-dark-400 text-xs">Gap Pax</p>
            <p className={`text-lg font-bold ${summary.paxReal >= summary.paxTeorico ? 'text-green-400' : 'text-red-400'}`}>
              {summary.paxReal >= summary.paxTeorico ? '+' : ''}{(summary.paxReal - summary.paxTeorico).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-3">
            <p className="text-dark-400 text-xs">Venta Forecast</p>
            <p className="text-lg font-bold text-dark-100">{formatCurrency(summary.ventaTeorica)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-3">
            <p className="text-dark-400 text-xs">Venta Real</p>
            <p className="text-lg font-bold text-dark-100">{formatCurrency(summary.ventaReal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-3">
            <p className="text-dark-400 text-xs">Gap Venta</p>
            <p className={`text-lg font-bold ${summary.ventaReal >= summary.ventaTeorica ? 'text-green-400' : 'text-red-400'}`}>
              {summary.ventaReal >= summary.ventaTeorica ? '+' : ''}{formatCurrency(summary.ventaReal - summary.ventaTeorica)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Table */}
      <Card>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left py-3 px-2 text-dark-400 font-medium">Fecha / Turno</th>
                <th className="text-left py-3 px-2 text-dark-400 font-medium">Tipo Día</th>
                <th className="text-center py-3 px-2 text-dark-400 font-medium" colSpan={3}>Pax</th>
                <th className="text-center py-3 px-2 text-dark-400 font-medium" colSpan={3}>Ticket</th>
                <th className="text-center py-3 px-2 text-dark-400 font-medium" colSpan={3}>Venta</th>
              </tr>
              <tr className="border-b border-dark-700 text-xs">
                <th></th>
                <th></th>
                <th className="text-center py-2 px-2 text-dark-500">Fc</th>
                <th className="text-center py-2 px-2 text-dark-500">Re</th>
                <th className="text-center py-2 px-2 text-dark-500">Gap</th>
                <th className="text-center py-2 px-2 text-dark-500">Fc</th>
                <th className="text-center py-2 px-2 text-dark-500">Re</th>
                <th className="text-center py-2 px-2 text-dark-500">Gap</th>
                <th className="text-center py-2 px-2 text-dark-500">Fc</th>
                <th className="text-center py-2 px-2 text-dark-500">Re</th>
                <th className="text-center py-2 px-2 text-dark-500">Gap</th>
              </tr>
            </thead>
            <tbody>
              {weekDates.map((date, dateIdx) => {
                const dateStr = date.toISOString().slice(0, 10)
                const rowId = `date-${dateIdx}`
                const isExpanded = expandedRows[rowId]

                return (
                  <>
                    {/* Date Row */}
                    <tr
                      key={rowId}
                      className="border-b border-dark-800 hover:bg-dark-800/50 cursor-pointer"
                      onClick={() => toggleRow(rowId)}
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          <span className="font-medium text-dark-200">{formatDate(date)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <select
                          className="bg-dark-700 border border-dark-600 rounded px-2 py-1 text-dark-200 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {tiposDia.map(tipo => (
                            <option key={tipo.id} value={tipo.codigo}>
                              {tipo.icono} {tipo.nombre}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="text-center py-3 px-2 text-dark-300">0</td>
                      <td className="text-center py-3 px-2 text-dark-300">0</td>
                      <td className="text-center py-3 px-2 text-dark-400">0</td>
                      <td className="text-center py-3 px-2 text-dark-300">$0</td>
                      <td className="text-center py-3 px-2 text-dark-300">$0</td>
                      <td className="text-center py-3 px-2 text-dark-400">$0</td>
                      <td className="text-center py-3 px-2 text-dark-300">$0</td>
                      <td className="text-center py-3 px-2 text-dark-300">$0</td>
                      <td className="text-center py-3 px-2 text-dark-400">$0</td>
                    </tr>

                    {/* Expanded Rows: Restaurantes */}
                    {isExpanded && restaurantes.map((restaurante) => {
                      const restRowId = `rest-${dateIdx}-${restaurante.id}`
                      const isRestExpanded = expandedRows[restRowId]

                      return (
                        <>
                          <tr
                            key={restRowId}
                            className="border-b border-dark-800 bg-dark-800/30 hover:bg-dark-800/50 cursor-pointer"
                            onClick={() => toggleRow(restRowId)}
                          >
                            <td className="py-2 px-2 pl-8">
                              <div className="flex items-center gap-2">
                                {isRestExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                <span className="text-dark-300">{restaurante.nombre}</span>
                              </div>
                            </td>
                            <td></td>
                            <td className="text-center py-2 px-2 text-dark-400">0</td>
                            <td className="text-center py-2 px-2 text-dark-400">0</td>
                            <td className="text-center py-2 px-2 text-dark-500">0</td>
                            <td className="text-center py-2 px-2 text-dark-400">$0</td>
                            <td className="text-center py-2 px-2 text-dark-400">$0</td>
                            <td className="text-center py-2 px-2 text-dark-500">$0</td>
                            <td className="text-center py-2 px-2 text-dark-400">$0</td>
                            <td className="text-center py-2 px-2 text-dark-400">$0</td>
                            <td className="text-center py-2 px-2 text-dark-500">$0</td>
                          </tr>

                          {/* Canal Rows */}
                          {isRestExpanded && canales.map((canal) => (
                            <tr
                              key={`canal-${dateIdx}-${restaurante.id}-${canal.id}`}
                              className="border-b border-dark-800 bg-dark-900/50"
                            >
                              <td className="py-2 px-2 pl-16">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-primary-500" />
                                  <span className="text-dark-400 text-xs">{canal.nombre}</span>
                                </div>
                              </td>
                              <td></td>
                              <td className="text-center py-2 px-2">
                                <input
                                  type="number"
                                  className="w-12 bg-dark-700 border border-dark-600 rounded px-1 py-0.5 text-center text-dark-300 text-xs"
                                  placeholder="0"
                                />
                              </td>
                              <td className="text-center py-2 px-2">
                                <input
                                  type="number"
                                  className="w-12 bg-dark-700 border border-dark-600 rounded px-1 py-0.5 text-center text-dark-300 text-xs"
                                  placeholder="0"
                                />
                              </td>
                              <td className="text-center py-2 px-2 text-dark-500 text-xs">0</td>
                              <td className="text-center py-2 px-2">
                                <input
                                  type="number"
                                  className="w-14 bg-dark-700 border border-dark-600 rounded px-1 py-0.5 text-center text-dark-300 text-xs"
                                  placeholder="$0"
                                />
                              </td>
                              <td className="text-center py-2 px-2">
                                <input
                                  type="number"
                                  className="w-14 bg-dark-700 border border-dark-600 rounded px-1 py-0.5 text-center text-dark-300 text-xs"
                                  placeholder="$0"
                                />
                              </td>
                              <td className="text-center py-2 px-2 text-dark-500 text-xs">$0</td>
                              <td className="text-center py-2 px-2">
                                <input
                                  type="number"
                                  className="w-16 bg-dark-700 border border-dark-600 rounded px-1 py-0.5 text-center text-dark-300 text-xs"
                                  placeholder="$0"
                                />
                              </td>
                              <td className="text-center py-2 px-2">
                                <input
                                  type="number"
                                  className="w-16 bg-dark-700 border border-dark-600 rounded px-1 py-0.5 text-center text-dark-300 text-xs"
                                  placeholder="$0"
                                />
                              </td>
                              <td className="text-center py-2 px-2 text-dark-500 text-xs">$0</td>
                            </tr>
                          ))}
                        </>
                      )
                    })}
                  </>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
