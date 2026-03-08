'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useStore } from '@/store/useStore'
import { formatCurrency } from '@/lib/utils'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Save,
  Download,
  Trash2,
  Edit,
} from 'lucide-react'

// Estructura fija del P&L
const NIVELES_PL = [
  { codigo: 'VENTA_BRUTA', nombre: 'VENTA BRUTA', orden: 1 },
  { codigo: 'COSTO_VENTA', nombre: 'COSTOS DE VENTA', orden: 2 },
  { codigo: 'CMV', nombre: 'CMV', orden: 3 },
  { codigo: 'GASTOS_OP', nombre: 'GASTOS OPERATIVOS', orden: 4 },
]

// Plan de cuentas por defecto
const CUENTAS_DEFAULT = [
  // Venta Bruta
  { nivelCodigo: 'VENTA_BRUTA', nombre: 'Restaurante', orden: 1, esSubtotal: false },
  { nivelCodigo: 'VENTA_BRUTA', nombre: 'Salon', orden: 2, esSubtotal: false },
  { nivelCodigo: 'VENTA_BRUTA', nombre: 'Delivery', orden: 3, esSubtotal: false },
  { nivelCodigo: 'VENTA_BRUTA', nombre: 'Takeaway', orden: 4, esSubtotal: false },
  { nivelCodigo: 'VENTA_BRUTA', nombre: 'Apps', orden: 5, esSubtotal: false },

  // Costos de Venta
  { nivelCodigo: 'COSTO_VENTA', nombre: 'Comisión tarjetas', orden: 1, esSubtotal: false },
  { nivelCodigo: 'COSTO_VENTA', nombre: 'Comisión delivery', orden: 2, esSubtotal: false },
  { nivelCodigo: 'COSTO_VENTA', nombre: 'IVA Débito', orden: 3, esSubtotal: false },
  { nivelCodigo: 'COSTO_VENTA', nombre: 'Descuentos', orden: 4, esSubtotal: false },

  // CMV
  { nivelCodigo: 'CMV', nombre: 'Proteínas', orden: 1, esSubtotal: false },
  { nivelCodigo: 'CMV', nombre: 'Vegetales', orden: 2, esSubtotal: false },
  { nivelCodigo: 'CMV', nombre: 'Lácteos', orden: 3, esSubtotal: false },
  { nivelCodigo: 'CMV', nombre: 'Packaging', orden: 4, esSubtotal: false },
  { nivelCodigo: 'CMV', nombre: 'Bebidas', orden: 5, esSubtotal: false },
  { nivelCodigo: 'CMV', nombre: 'Insumos varios', orden: 6, esSubtotal: false },

  // Gastos Operativos
  { nivelCodigo: 'GASTOS_OP', nombre: 'Personal', orden: 1, esSubtotal: true },
  { nivelCodigo: 'GASTOS_OP', nombre: 'Sueldos y Jornales', orden: 2, padre: 'Personal', esSubtotal: false },
  { nivelCodigo: 'GASTOS_OP', nombre: 'Cargas Sociales', orden: 3, padre: 'Personal', esSubtotal: false },

  { nivelCodigo: 'GASTOS_OP', nombre: 'Estructura', orden: 4, esSubtotal: true },
  { nivelCodigo: 'GASTOS_OP', nombre: 'Alquiler', orden: 5, padre: 'Estructura', esSubtotal: false },
  { nivelCodigo: 'GASTOS_OP', nombre: 'Servicios', orden: 6, padre: 'Estructura', esSubtotal: false },
  { nivelCodigo: 'GASTOS_OP', nombre: 'Mantenimiento', orden: 7, padre: 'Estructura', esSubtotal: false },

  { nivelCodigo: 'GASTOS_OP', nombre: 'Comercialización', orden: 8, esSubtotal: true },
  { nivelCodigo: 'GASTOS_OP', nombre: 'Marketing', orden: 9, padre: 'Comercialización', esSubtotal: false },
  { nivelCodigo: 'GASTOS_OP', nombre: 'Publicidad', orden: 10, padre: 'Comercialización', esSubtotal: false },

  { nivelCodigo: 'GASTOS_OP', nombre: 'Administración', orden: 11, esSubtotal: true },
  { nivelCodigo: 'GASTOS_OP', nombre: 'Honorarios Profesionales', orden: 12, padre: 'Administración', esSubtotal: false },
  { nivelCodigo: 'GASTOS_OP', nombre: 'Insumos Administrativos', orden: 13, padre: 'Administración', esSubtotal: false },
]

// Valores de ejemplo (vacíos)
const VALORES_EJEMPLO: Record<string, { forecast: number; real: number; fcPct: number; rePct: number }> = {}

export function PLModule() {
  const {
    selectedPeriodo,
    selectedTipoVista,
    setSelectedPeriodo,
    setSelectedTipoVista,
  } = useStore()

  const [expandedNiveles, setExpandedNiveles] = useState<Record<string, boolean>>({
    VENTA_BRUTA: true,
    COSTO_VENTA: true,
    CMV: true,
    GASTOS_OP: true,
  })

  const [valores, setValores] = useState<Record<string, { forecast: number; real: number }>>({})
  const [showAddCuenta, setShowAddCuenta] = useState<string | null>(null)
  const [newCuentaNombre, setNewCuentaNombre] = useState('')

  // Generate period options
  const generatePeriodOptions = () => {
    const options = []
    const now = new Date()

    for (let i = -12; i <= 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const value = date.toISOString().slice(0, 7)
      const label = date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
      options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
    }

    return options
  }

  const toggleNivel = (codigo: string) => {
    setExpandedNiveles((prev) => ({ ...prev, [codigo]: !prev[codigo] }))
  }

  const handleValorChange = (cuentaNombre: string, campo: 'forecast' | 'real', valor: number) => {
    setValores((prev) => ({
      ...prev,
      [cuentaNombre]: {
        ...prev[cuentaNombre],
        [campo]: valor,
      },
    }))
  }

  const calcularDiferencia = (cuentaNombre: string) => {
    const v = valores[cuentaNombre] || { forecast: 0, real: 0 }
    return v.real - v.forecast
  }

  const calcularImpacto = (cuentaNombre: string, totalVenta: number) => {
    const v = valores[cuentaNombre] || { forecast: 0, real: 0 }
    if (totalVenta === 0) return 0
    const fcPct = (v.forecast / totalVenta) * 100
    const rePct = (v.real / totalVenta) * 100
    return rePct - fcPct
  }

  // Calculate totals
  const calcularTotalNivel = (nivelCodigo: string) => {
    const cuentasNivel = CUENTAS_DEFAULT.filter(c => c.nivelCodigo === nivelCodigo && !c.esSubtotal && !c.padre)
    return cuentasNivel.reduce((acc, cuenta) => {
      const v = valores[cuenta.nombre] || { forecast: 0, real: 0 }
      return {
        forecast: acc.forecast + v.forecast,
        real: acc.real + v.real,
      }
    }, { forecast: 0, real: 0 })
  }

  // Resultados calculados
  const ventaBruta = calcularTotalNivel('VENTA_BRUTA')
  const costoVenta = calcularTotalNivel('COSTO_VENTA')
  const ventaNeta = {
    forecast: ventaBruta.forecast - costoVenta.forecast,
    real: ventaBruta.real - costoVenta.real,
  }
  const cmv = calcularTotalNivel('CMV')
  const contribucionMarginal = {
    forecast: ventaNeta.forecast - cmv.forecast,
    real: ventaNeta.real - cmv.real,
  }
  const gastosOp = calcularTotalNivel('GASTOS_OP')
  const profit = {
    forecast: contribucionMarginal.forecast - gastosOp.forecast,
    real: contribucionMarginal.real - gastosOp.real,
  }

  const totalVentaBruta = ventaBruta.forecast || 1 // Para evitar división por 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-dark-100">Estado de Resultados</h2>
          <p className="text-dark-400 text-sm">P&L Principal - {selectedPeriodo}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <Download size={16} className="mr-2" />
            Exportar Excel
          </Button>
          <Button>
            <Save size={16} className="mr-2" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 items-end">
            <Select
              label="Año"
              options={[
                { value: '2025', label: '2025' },
                { value: '2026', label: '2026' },
                { value: '2027', label: '2027' },
              ]}
              value={selectedPeriodo.slice(0, 4)}
              onChange={(e) => setSelectedPeriodo(e.target.value + selectedPeriodo.slice(4))}
            />
            <Select
              label="Mes"
              options={generatePeriodOptions()}
              value={selectedPeriodo}
              onChange={(e) => setSelectedPeriodo(e.target.value)}
            />
            <Select
              label="Vista"
              options={[
                { value: '$', label: '$' },
                { value: '%', label: '%' },
                { value: 'ambos', label: '$ % Ambos' },
              ]}
              value={selectedTipoVista}
              onChange={(e) => setSelectedTipoVista(e.target.value as any)}
            />
          </div>
        </CardContent>
      </Card>

      {/* P&L Table */}
      <Card>
        <CardContent className="overflow-x-auto">
          {/* Legend */}
          <div className="flex gap-4 mb-4 text-xs text-dark-400">
            <span>= categoría</span>
            <span>= línea</span>
            <span>Todos los valores son manuales</span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left py-3 px-2 text-dark-400 font-medium">Concepto</th>
                <th className="text-right py-3 px-2 text-dark-400 font-medium">Forecast $</th>
                <th className="text-right py-3 px-2 text-dark-400 font-medium">Fc %</th>
                <th className="text-right py-3 px-2 text-dark-400 font-medium">Real $</th>
                <th className="text-right py-3 px-2 text-dark-400 font-medium">Re %</th>
                <th className="text-right py-3 px-2 text-dark-400 font-medium">Dif $</th>
                <th className="text-right py-3 px-2 text-dark-400 font-medium">Impacto</th>
                <th className="text-left py-3 px-2 text-dark-400 font-medium">Atribución</th>
                <th className="text-center py-3 px-2 text-dark-400 font-medium">Acc.</th>
              </tr>
            </thead>
            <tbody>
              {/* VENTA BRUTA */}
              <PLNivelRow
                codigo="VENTA_BRUTA"
                nombre="VENTA BRUTA"
                total={ventaBruta}
                porcentajeVenta={100}
                isExpanded={expandedNiveles['VENTA_BRUTA']}
                onToggle={() => toggleNivel('VENTA_BRUTA')}
              />
              {expandedNiveles['VENTA_BRUTA'] && CUENTAS_DEFAULT
                .filter(c => c.nivelCodigo === 'VENTA_BRUTA')
                .map((cuenta, idx) => (
                  <PLCuentaRow
                    key={idx}
                    cuenta={cuenta}
                    valor={valores[cuenta.nombre] || { forecast: 0, real: 0 }}
                    totalVentaBruta={totalVentaBruta}
                    onValorChange={handleValorChange}
                  />
                ))}

              {/* Línea de resultado: VENTA NETA */}
              <PLResultadoRow
                nombre="VENTA NETA"
                valor={ventaNeta}
                totalVentaBruta={totalVentaBruta}
              />

              {/* COSTOS DE VENTA */}
              <PLNivelRow
                codigo="COSTO_VENTA"
                nombre="COSTOS DE VENTA"
                total={costoVenta}
                porcentajeVenta={(costoVenta.forecast / totalVentaBruta) * 100}
                isExpanded={expandedNiveles['COSTO_VENTA']}
                onToggle={() => toggleNivel('COSTO_VENTA')}
                esNegativo
              />
              {expandedNiveles['COSTO_VENTA'] && CUENTAS_DEFAULT
                .filter(c => c.nivelCodigo === 'COSTO_VENTA')
                .map((cuenta, idx) => (
                  <PLCuentaRow
                    key={idx}
                    cuenta={cuenta}
                    valor={valores[cuenta.nombre] || { forecast: 0, real: 0 }}
                    totalVentaBruta={totalVentaBruta}
                    onValorChange={handleValorChange}
                    esNegativo
                  />
                ))}

              {/* Línea de resultado: CONTRIBUCIÓN MARGINAL */}
              <PLResultadoRow
                nombre="CONTRIBUCIÓN MARGINAL"
                valor={contribucionMarginal}
                totalVentaBruta={totalVentaBruta}
              />

              {/* CMV */}
              <PLNivelRow
                codigo="CMV"
                nombre="CMV"
                total={cmv}
                porcentajeVenta={(cmv.forecast / totalVentaBruta) * 100}
                isExpanded={expandedNiveles['CMV']}
                onToggle={() => toggleNivel('CMV')}
                esNegativo
              />
              {expandedNiveles['CMV'] && CUENTAS_DEFAULT
                .filter(c => c.nivelCodigo === 'CMV')
                .map((cuenta, idx) => (
                  <PLCuentaRow
                    key={idx}
                    cuenta={cuenta}
                    valor={valores[cuenta.nombre] || { forecast: 0, real: 0 }}
                    totalVentaBruta={totalVentaBruta}
                    onValorChange={handleValorChange}
                    esNegativo
                  />
                ))}

              {/* Línea de resultado: CONTRIBUCIÓN MARGINAL después de CMV */}
              <PLResultadoRow
                nombre="CONTRIBUCIÓN MARGINAL"
                valor={contribucionMarginal}
                totalVentaBruta={totalVentaBruta}
              />

              {/* GASTOS OPERATIVOS */}
              <PLNivelRow
                codigo="GASTOS_OP"
                nombre="GASTOS OPERATIVOS"
                total={gastosOp}
                porcentajeVenta={(gastosOp.forecast / totalVentaBruta) * 100}
                isExpanded={expandedNiveles['GASTOS_OP']}
                onToggle={() => toggleNivel('GASTOS_OP')}
                esNegativo
              />
              {expandedNiveles['GASTOS_OP'] && CUENTAS_DEFAULT
                .filter(c => c.nivelCodigo === 'GASTOS_OP')
                .map((cuenta, idx) => (
                  <PLCuentaRow
                    key={idx}
                    cuenta={cuenta}
                    valor={valores[cuenta.nombre] || { forecast: 0, real: 0 }}
                    totalVentaBruta={totalVentaBruta}
                    onValorChange={handleValorChange}
                    esSubtotal={cuenta.esSubtotal}
                    indent={cuenta.padre ? 1 : 0}
                    esNegativo
                  />
                ))}

              {/* Línea de resultado: PROFIT */}
              <PLResultadoRow
                nombre="★ PROFIT"
                valor={profit}
                totalVentaBruta={totalVentaBruta}
                isProfit
              />
            </tbody>
          </table>

          {/* Add new cuenta */}
          <div className="mt-4 pt-4 border-t border-dark-700">
            <Button variant="ghost" size="sm">
              <Plus size={16} className="mr-2" />
              Agregar línea
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente para fila de nivel (categoría)
function PLNivelRow({
  codigo,
  nombre,
  total,
  porcentajeVenta,
  isExpanded,
  onToggle,
  esNegativo = false,
}: {
  codigo: string
  nombre: string
  total: { forecast: number; real: number }
  porcentajeVenta: number
  isExpanded: boolean
  onToggle: () => void
  esNegativo?: boolean
}) {
  return (
    <tr
      className="border-b border-dark-800 bg-dark-800/30 hover:bg-dark-800/50 cursor-pointer"
      onClick={onToggle}
    >
      <td className="py-3 px-2">
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="font-semibold text-dark-100">{nombre}</span>
        </div>
      </td>
      <td className="text-right py-3 px-2 font-medium text-dark-200">
        {formatCurrency(esNegativo ? -total.forecast : total.forecast)}
      </td>
      <td className="text-right py-3 px-2 text-dark-400">
        {porcentajeVenta.toFixed(1)}%
      </td>
      <td className="text-right py-3 px-2 font-medium text-dark-200">
        {formatCurrency(esNegativo ? -total.real : total.real)}
      </td>
      <td className="text-right py-3 px-2 text-dark-400">
        {porcentajeVenta.toFixed(1)}%
      </td>
      <td className={`text-right py-3 px-2 font-medium ${total.real - total.forecast >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {formatCurrency(esNegativo ? -(total.real - total.forecast) : total.real - total.forecast)}
      </td>
      <td className="text-right py-3 px-2 text-dark-400">
        -
      </td>
      <td className="py-3 px-2">
        <select className="bg-dark-700 border border-dark-600 rounded px-2 py-1 text-xs text-dark-300">
          <option value="">-</option>
          <option value="falla">Falla de Venta</option>
          <option value="mejora">Mejora vs Plan</option>
          <option value="estacional">Estacionalidad</option>
        </select>
      </td>
      <td className="text-center py-3 px-2">
        <Button variant="ghost" size="sm" className="p-1">
          <Edit size={14} />
        </Button>
      </td>
    </tr>
  )
}

// Componente para fila de cuenta (línea)
function PLCuentaRow({
  cuenta,
  valor,
  totalVentaBruta,
  onValorChange,
  esSubtotal = false,
  indent = 0,
  esNegativo = false,
}: {
  cuenta: any
  valor: { forecast: number; real: number }
  totalVentaBruta: number
  onValorChange: (nombre: string, campo: 'forecast' | 'real', valor: number) => void
  esSubtotal?: boolean
  indent?: number
  esNegativo?: boolean
}) {
  const fcPct = totalVentaBruta > 0 ? (valor.forecast / totalVentaBruta) * 100 : 0
  const rePct = totalVentaBruta > 0 ? (valor.real / totalVentaBruta) * 100 : 0
  const dif = valor.real - valor.forecast
  const impacto = rePct - fcPct

  return (
    <tr className={`border-b border-dark-800 ${esSubtotal ? 'bg-dark-800/20' : ''}`}>
      <td className="py-2 px-2" style={{ paddingLeft: `${16 + indent * 16}px` }}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${esSubtotal ? 'bg-yellow-500' : 'bg-primary-500'}`} />
          <span className={esSubtotal ? 'font-medium text-dark-200' : 'text-dark-300'}>
            {cuenta.nombre}
          </span>
        </div>
      </td>
      <td className="text-right py-2 px-2">
        <input
          type="number"
          className="w-20 bg-dark-700 border border-dark-600 rounded px-2 py-1 text-right text-dark-300 text-sm"
          value={valor.forecast || ''}
          onChange={(e) => onValorChange(cuenta.nombre, 'forecast', parseFloat(e.target.value) || 0)}
        />
      </td>
      <td className="text-right py-2 px-2 text-dark-400 text-xs">
        {fcPct.toFixed(1)}%
      </td>
      <td className="text-right py-2 px-2">
        <input
          type="number"
          className="w-20 bg-dark-700 border border-dark-600 rounded px-2 py-1 text-right text-dark-300 text-sm"
          value={valor.real || ''}
          onChange={(e) => onValorChange(cuenta.nombre, 'real', parseFloat(e.target.value) || 0)}
        />
      </td>
      <td className="text-right py-2 px-2 text-dark-400 text-xs">
        {rePct.toFixed(1)}%
      </td>
      <td className={`text-right py-2 px-2 text-xs ${dif >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {formatCurrency(esNegativo ? -dif : dif)}
      </td>
      <td className={`text-right py-2 px-2 text-xs ${impacto >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {impacto >= 0 ? '+' : ''}{impacto.toFixed(1)}pp
      </td>
      <td className="py-2 px-2">
        <select className="bg-dark-700 border border-dark-600 rounded px-2 py-1 text-xs text-dark-400">
          <option value="">-</option>
          <option value="falla">Falla</option>
          <option value="mejora">Mejora</option>
        </select>
      </td>
      <td className="text-center py-2 px-2">
        <Button variant="ghost" size="sm" className="p-1 text-dark-500 hover:text-red-400">
          <Trash2 size={14} />
        </Button>
      </td>
    </tr>
  )
}

// Componente para fila de resultado
function PLResultadoRow({
  nombre,
  valor,
  totalVentaBruta,
  isProfit = false,
}: {
  nombre: string
  valor: { forecast: number; real: number }
  totalVentaBruta: number
  isProfit?: boolean
}) {
  const fcPct = totalVentaBruta > 0 ? (valor.forecast / totalVentaBruta) * 100 : 0
  const rePct = totalVentaBruta > 0 ? (valor.real / totalVentaBruta) * 100 : 0
  const dif = valor.real - valor.forecast
  const impacto = rePct - fcPct

  return (
    <tr className={`border-b border-dark-700 ${isProfit ? 'bg-primary-900/20' : 'bg-dark-700/50'}`}>
      <td className="py-3 px-2">
        <span className={`font-bold ${isProfit ? 'text-primary-400 text-lg' : 'text-dark-100'}`}>
          {nombre}
        </span>
      </td>
      <td className={`text-right py-3 px-2 font-bold ${isProfit ? 'text-lg text-dark-100' : 'text-dark-100'}`}>
        {formatCurrency(valor.forecast)}
      </td>
      <td className="text-right py-3 px-2 text-dark-300 font-medium">
        {fcPct.toFixed(1)}%
      </td>
      <td className={`text-right py-3 px-2 font-bold ${isProfit ? 'text-lg text-dark-100' : 'text-dark-100'}`}>
        {formatCurrency(valor.real)}
      </td>
      <td className="text-right py-3 px-2 text-dark-300 font-medium">
        {rePct.toFixed(1)}%
      </td>
      <td className={`text-right py-3 px-2 font-bold ${dif >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {formatCurrency(dif)}
      </td>
      <td className={`text-right py-3 px-2 font-medium ${impacto >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {impacto >= 0 ? '+' : ''}{impacto.toFixed(1)}pp
      </td>
      <td className="py-3 px-2">
        <span className="text-dark-500">-</span>
      </td>
      <td className="py-3 px-2"></td>
    </tr>
  )
}
