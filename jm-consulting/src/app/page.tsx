'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { DashboardView } from '@/components/modules/DashboardView'
import { ConsultingModule } from '@/components/modules/ConsultingModule'
import { ForecastModule } from '@/components/modules/ForecastModule'
import { PLModule } from '@/components/modules/PLModule'
import { ConfigModule } from '@/components/modules/ConfigModule'
import { useStore } from '@/store/useStore'

export default function Home() {
  const { activeModule } = useStore()

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardView />
      case 'consulting':
        return <ConsultingModule />
      case 'forecast':
        return <ForecastModule />
      case 'pl':
        return <PLModule />
      case 'config':
        return <ConfigModule />
      default:
        return <DashboardView />
    }
  }

  return (
    <div className="flex h-screen bg-dark-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 bg-dark-950">
          {renderModule()}
        </main>
      </div>
    </div>
  )
}
