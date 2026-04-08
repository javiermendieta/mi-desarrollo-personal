'use client'

import { useStore } from '@/store/useStore'
import { Bell, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const moduleTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  consulting: 'Consultoría',
  forecast: 'Forecast de Ventas',
  pl: 'Estado de Resultados (P&L)',
  config: 'Configuración',
}

export function Header() {
  const { activeModule } = useStore()

  return (
    <header className="h-16 bg-dark-900 border-b border-dark-700 flex items-center justify-between px-6">
      <h2 className="text-xl font-semibold text-dark-100">
        {moduleTitles[activeModule]}
      </h2>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="p-2">
          <Bell size={20} />
        </Button>
        <div className="flex items-center gap-2 text-dark-300">
          <User size={20} />
          <span className="text-sm">Usuario</span>
        </div>
      </div>
    </header>
  )
}
