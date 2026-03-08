'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Briefcase, TrendingUp, FileSpreadsheet, Calendar } from 'lucide-react'

export function DashboardView() {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-100">
          Bienvenido a JM Consulting
        </h1>
        <p className="text-dark-400 mt-1">
          Sistema de gestión de consultoría para restaurantes
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 bg-primary-600 rounded-lg">
              <Briefcase size={24} className="text-white" />
            </div>
            <div>
              <p className="text-dark-400 text-sm">Proyectos Activos</p>
              <p className="text-2xl font-bold text-dark-100">0</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 bg-green-600 rounded-lg">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div>
              <p className="text-dark-400 text-sm">Forecast Este Mes</p>
              <p className="text-2xl font-bold text-dark-100">$0</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <FileSpreadsheet size={24} className="text-white" />
            </div>
            <div>
              <p className="text-dark-400 text-sm">P&L Cargado</p>
              <p className="text-2xl font-bold text-dark-100">0%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 bg-purple-600 rounded-lg">
              <Calendar size={24} className="text-white" />
            </div>
            <div>
              <p className="text-dark-400 text-sm">Tareas Pendientes</p>
              <p className="text-2xl font-bold text-dark-100">0</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors">
              <p className="font-medium text-dark-100">Crear nuevo proyecto</p>
              <p className="text-sm text-dark-400">Iniciar un nuevo proyecto de consultoría</p>
            </button>
            <button className="w-full text-left px-4 py-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors">
              <p className="font-medium text-dark-100">Cargar Forecast</p>
              <p className="text-sm text-dark-400">Ingresar proyección de ventas</p>
            </button>
            <button className="w-full text-left px-4 py-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors">
              <p className="font-medium text-dark-100">Actualizar P&L</p>
              <p className="text-sm text-dark-400">Cargar datos del estado de resultados</p>
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Módulos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-dark-700 rounded-lg text-center">
                <Briefcase size={32} className="mx-auto mb-2 text-primary-400" />
                <p className="font-medium text-dark-100">Consultoría</p>
                <p className="text-xs text-dark-400 mt-1">Proyectos y tareas</p>
              </div>
              <div className="p-4 bg-dark-700 rounded-lg text-center">
                <TrendingUp size={32} className="mx-auto mb-2 text-green-400" />
                <p className="font-medium text-dark-100">Forecast</p>
                <p className="text-xs text-dark-400 mt-1">Proyección de ventas</p>
              </div>
              <div className="p-4 bg-dark-700 rounded-lg text-center">
                <FileSpreadsheet size={32} className="mx-auto mb-2 text-blue-400" />
                <p className="font-medium text-dark-100">P&L</p>
                <p className="text-xs text-dark-400 mt-1">Estado de resultados</p>
              </div>
              <div className="p-4 bg-dark-700 rounded-lg text-center">
                <Calendar size={32} className="mx-auto mb-2 text-purple-400" />
                <p className="font-medium text-dark-100">Timeline</p>
                <p className="text-xs text-dark-400 mt-1">Cronograma</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
