'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useStore } from '@/store/useStore'
import {
  Settings,
  Building2,
  Radio,
  Clock,
  Calendar,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit,
} from 'lucide-react'

const tabs = [
  { id: 'restaurantes', label: 'Restaurantes', icon: Building2 },
  { id: 'canales', label: 'Canales', icon: Radio },
  { id: 'turnos', label: 'Turnos', icon: Clock },
  { id: 'tipos-dia', label: 'Tipos de Día', icon: Calendar },
  { id: 'plantillas', label: 'Plantillas Excel', icon: FileSpreadsheet },
]

export function ConfigModule() {
  const {
    restaurantes,
    canales,
    turnos,
    tiposDia,
    setRestaurantes,
    setCanales,
    setTurnos,
    setTiposDia,
  } = useStore()

  const [activeTab, setActiveTab] = useState('restaurantes')
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState('')

  const handleAdd = () => {
    if (!newItem.trim()) return

    switch (activeTab) {
      case 'restaurantes':
        setRestaurantes([...restaurantes, {
          id: Date.now().toString(),
          nombre: newItem,
          codigo: null,
          activo: true,
        }])
        break
      case 'canales':
        setCanales([...canales, {
          id: Date.now().toString(),
          nombre: newItem,
          codigo: null,
          activo: true,
        }])
        break
      case 'turnos':
        setTurnos([...turnos, {
          id: Date.now().toString(),
          nombre: newItem,
          codigo: null,
        }])
        break
      case 'tipos-dia':
        setTiposDia([...tiposDia, {
          id: Date.now().toString(),
          nombre: newItem,
          codigo: newItem.toUpperCase().replace(/\s+/g, '_'),
          color: null,
          icono: null,
        }])
        break
    }

    setNewItem('')
    setShowAdd(false)
  }

  const handleDelete = (id: string) => {
    switch (activeTab) {
      case 'restaurantes':
        setRestaurantes(restaurantes.filter(r => r.id !== id))
        break
      case 'canales':
        setCanales(canales.filter(c => c.id !== id))
        break
      case 'turnos':
        setTurnos(turnos.filter(t => t.id !== id))
        break
      case 'tipos-dia':
        setTiposDia(tiposDia.filter(t => t.id !== id))
        break
    }
  }

  const getCurrentItems = () => {
    switch (activeTab) {
      case 'restaurantes':
        return restaurantes.map(r => ({ id: r.id, nombre: r.nombre, codigo: r.codigo }))
      case 'canales':
        return canales.map(c => ({ id: c.id, nombre: c.nombre, codigo: c.codigo }))
      case 'turnos':
        return turnos.map(t => ({ id: t.id, nombre: t.nombre, codigo: t.codigo }))
      case 'tipos-dia':
        return tiposDia.map(t => ({ id: t.id, nombre: t.nombre, codigo: t.codigo }))
      default:
        return []
    }
  }

  const currentItems = getCurrentItems()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-dark-100">Configuración</h2>
        <p className="text-dark-400 text-sm">Administra las opciones del sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs */}
        <Card className="lg:col-span-1">
          <CardContent className="py-2">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-600 text-white'
                        : 'text-dark-300 hover:bg-dark-800 hover:text-dark-100'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {tabs.find(t => t.id === activeTab)?.label}
              </CardTitle>
              <Button size="sm" onClick={() => setShowAdd(true)}>
                <Plus size={16} className="mr-2" />
                Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Add Form */}
            {showAdd && (
              <div className="flex gap-2 mb-4 p-4 bg-dark-700 rounded-lg">
                <Input
                  placeholder="Nombre..."
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAdd}>Agregar</Button>
                <Button variant="secondary" onClick={() => setShowAdd(false)}>
                  Cancelar
                </Button>
              </div>
            )}

            {/* Items List */}
            <div className="space-y-2">
              {currentItems.length === 0 ? (
                <p className="text-dark-500 text-center py-8">
                  No hay elementos. Haz clic en "Agregar" para añadir uno nuevo.
                </p>
              ) : (
                currentItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary-500" />
                      <div>
                        <p className="font-medium text-dark-200">{item.nombre}</p>
                        {item.codigo && (
                          <p className="text-xs text-dark-500">{item.codigo}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="p-1">
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 text-dark-500 hover:text-red-400"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-dark-700 rounded-lg">
              <p className="text-dark-400 text-sm">Versión</p>
              <p className="text-dark-100 font-medium">1.0.0</p>
            </div>
            <div className="p-4 bg-dark-700 rounded-lg">
              <p className="text-dark-400 text-sm">Base de datos</p>
              <p className="text-dark-100 font-medium">SQLite</p>
            </div>
            <div className="p-4 bg-dark-700 rounded-lg">
              <p className="text-dark-400 text-sm">Última actualización</p>
              <p className="text-dark-100 font-medium">{new Date().toLocaleDateString('es-AR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
