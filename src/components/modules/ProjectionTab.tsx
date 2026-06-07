'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Edit,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  Loader2,
  CalendarDays,
  Wallet,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { saveProjectionToDB, deleteProjectionFromDB } from '@/lib/dbApi';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CashFlowProjection, ProjectionStatus } from '@/types';

// ---------- Helpers ----------

function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date();
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(value);
};

// ---------- Status badge config ----------

const STATUS_CONFIG: Record<ProjectionStatus, { label: string; className: string }> = {
  projected: { label: 'Proyectado', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  partial: { label: 'Parcial', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  confirmed: { label: 'Confirmado', className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
};

// ---------- Component ----------

export function ProjectionTab() {
  const {
    cashFlowProjections,
    addCashFlowProjection,
    updateCashFlowProjection,
    deleteCashFlowProjection,
  } = useAppStore();

  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProjection, setEditingProjection] = useState<CashFlowProjection | null>(null);

  // Form state
  const [formType, setFormType] = useState<'income' | 'expense'>('income');
  const [formDescription, setFormDescription] = useState('');
  const [formProjectedAmount, setFormProjectedAmount] = useState('');
  const [formRealAmount, setFormRealAmount] = useState('');
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formStatus, setFormStatus] = useState<ProjectionStatus>('projected');
  const [formCategory, setFormCategory] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // ---------- Computed data ----------

  const sortedProjections = useMemo(() => {
    return [...cashFlowProjections].sort(
      (a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime()
    );
  }, [cashFlowProjections]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, CashFlowProjection[]> = {};
    sortedProjections.forEach((p) => {
      if (!groups[p.date]) groups[p.date] = [];
      groups[p.date].push(p);
    });
    return Object.entries(groups).sort(
      ([a], [b]) => parseLocalDate(a).getTime() - parseLocalDate(b).getTime()
    );
  }, [sortedProjections]);

  const totalProjectedIncome = useMemo(
    () =>
      cashFlowProjections
        .filter((p) => p.type === 'income')
        .reduce((sum, p) => sum + p.projectedAmount, 0),
    [cashFlowProjections]
  );

  const totalProjectedExpense = useMemo(
    () =>
      cashFlowProjections
        .filter((p) => p.type === 'expense')
        .reduce((sum, p) => sum + p.projectedAmount, 0),
    [cashFlowProjections]
  );

  const totalRealIncome = useMemo(
    () =>
      cashFlowProjections
        .filter((p) => p.type === 'income')
        .reduce((sum, p) => sum + (p.realAmount ?? 0), 0),
    [cashFlowProjections]
  );

  const totalRealExpense = useMemo(
    () =>
      cashFlowProjections
        .filter((p) => p.type === 'expense')
        .reduce((sum, p) => sum + (p.realAmount ?? 0), 0),
    [cashFlowProjections]
  );

  const projectedBalance = totalProjectedIncome - totalProjectedExpense;
  const marginPercent =
    totalProjectedIncome !== 0
      ? ((projectedBalance / totalProjectedIncome) * 100).toFixed(1)
      : '0.0';

  // Running cumulative balance & risk calculation
  const { cumulativeByDate, riskDate } = useMemo(() => {
    let cumulative = 0;
    const cumMap: Record<string, number> = {};
    let firstRisk: string | null = null;
    const threshold = totalProjectedIncome * 0.1;

    groupedByDate.forEach(([date, projections]) => {
      const dayNet = projections.reduce((sum, p) => {
        const amount = p.realAmount ?? p.projectedAmount;
        return sum + (p.type === 'income' ? amount : -amount);
      }, 0);
      cumulative += dayNet;
      cumMap[date] = cumulative;
      if (firstRisk === null && cumulative < threshold) {
        firstRisk = date;
      }
    });

    return { cumulativeByDate: cumMap, riskDate: firstRisk };
  }, [groupedByDate, totalProjectedIncome]);

  const finalCumulative = useMemo(() => {
    const dates = Object.keys(cumulativeByDate);
    if (dates.length === 0) return 0;
    const lastDate = dates.sort(
      (a, b) => parseLocalDate(b).getTime() - parseLocalDate(a).getTime()
    )[0];
    return cumulativeByDate[lastDate];
  }, [cumulativeByDate]);

  // ---------- Dialog helpers ----------

  const openDialog = (projection: CashFlowProjection | null = null) => {
    setEditingProjection(projection);
    if (projection) {
      setFormType(projection.type);
      setFormDescription(projection.description);
      setFormProjectedAmount(projection.projectedAmount.toString());
      setFormRealAmount(projection.realAmount != null ? projection.realAmount.toString() : '');
      setFormDate(projection.date);
      setFormStatus(projection.status);
      setFormCategory(projection.category || '');
      setFormNotes(projection.notes || '');
    } else {
      setFormType('income');
      setFormDescription('');
      setFormProjectedAmount('');
      setFormRealAmount('');
      setFormDate(format(new Date(), 'yyyy-MM-dd'));
      setFormStatus('projected');
      setFormCategory('');
      setFormNotes('');
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formDescription.trim() || !formProjectedAmount || !formDate) return;
    setIsSaving(true);
    const now = new Date().toISOString();

    const projectionData = {
      description: formDescription.trim(),
      type: formType,
      projectedAmount: parseFloat(formProjectedAmount) || 0,
      realAmount: formStatus !== 'projected' && formRealAmount ? parseFloat(formRealAmount) || 0 : undefined,
      date: formDate,
      status: formStatus,
      category: formCategory.trim() || undefined,
      notes: formNotes.trim() || undefined,
    };

    if (editingProjection) {
      updateCashFlowProjection(editingProjection.id, {
        ...projectionData,
        updatedAt: now,
      });
      try {
        await saveProjectionToDB({
          id: editingProjection.id,
          ...projectionData,
        });
      } catch (e) {
        console.error('Error saving projection to DB:', e);
      }
    } else {
      const newId = uuidv4();
      addCashFlowProjection({
        id: newId,
        ...projectionData,
        createdAt: now,
        updatedAt: now,
      });
      try {
        await saveProjectionToDB({
          id: newId,
          ...projectionData,
        });
      } catch (e) {
        console.error('Error saving projection to DB:', e);
      }
    }

    setIsSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    deleteCashFlowProjection(id);
    try {
      await deleteProjectionFromDB(id);
    } catch (e) {
      console.error('Error deleting projection from DB:', e);
    }
  };

  // ---------- Render ----------

  // Empty state
  if (cashFlowProjections.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Proyección</h2>
            <p className="text-muted-foreground">Cashflow Proyección • Ingresos y Egresos futuros</p>
          </div>
          <Button onClick={() => openDialog(null)} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Nueva Proyección
          </Button>
        </div>

        <Card>
          <CardContent className="py-16 text-center">
            <CalendarDays className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin proyecciones</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Las proyecciones de cashflow te permiten planificar ingresos y egresos futuros,
              visualizar tu saldo acumulado día a día y detectar riesgos de liquidez antes de que ocurran.
            </p>
            <Button onClick={() => openDialog(null)} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Crear primera proyección
            </Button>
          </CardContent>
        </Card>

        {/* Dialog */}
        {renderDialog()}
      </div>
    );
  }

  // ---------- Main render with data ----------

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Proyección</h2>
          <p className="text-muted-foreground">Cashflow Proyección • Ingresos y Egresos futuros</p>
        </div>
        <Button onClick={() => openDialog(null)} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Nueva Proyección
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Ingresos Proyectados */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos Proyectados</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalProjectedIncome)}</p>
                <p className="text-xs text-muted-foreground mt-1">Real: {formatCurrency(totalRealIncome)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        {/* Egresos Proyectados */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Egresos Proyectados</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalProjectedExpense)}</p>
                <p className="text-xs text-muted-foreground mt-1">Real: {formatCurrency(totalRealExpense)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        {/* Saldo Proyectado */}
        <Card
          className={cn(
            'bg-gradient-to-br',
            projectedBalance >= 0
              ? 'from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900'
              : 'from-red-50 to-red-100 dark:from-red-950 dark:to-red-900'
          )}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Proyectado</p>
                <p
                  className={cn(
                    'text-2xl font-bold',
                    projectedBalance >= 0 ? 'text-emerald-600' : 'text-red-600'
                  )}
                >
                  {formatCurrency(projectedBalance)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Margen: {marginPercent}%</p>
              </div>
              <Wallet className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        {/* Próximo Riesgo */}
        <Card
          className={cn(
            'bg-gradient-to-br',
            riskDate
              ? 'from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900'
              : 'from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900'
          )}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Próximo Riesgo</p>
                {riskDate ? (
                  <>
                    <p className="text-2xl font-bold text-orange-600">
                      {format(parseLocalDate(riskDate), "d MMM", { locale: es })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Saldo: {formatCurrency(cumulativeByDate[riskDate])}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-teal-600">Sin riesgo</p>
                    <p className="text-xs text-muted-foreground mt-1">Saldo siempre positivo</p>
                  </>
                )}
              </div>
              <AlertTriangle
                className={cn(
                  'h-8 w-8',
                  riskDate ? 'text-orange-400' : 'text-teal-400'
                )}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Línea de Tiempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {groupedByDate.map(([date, projections]) => {
              const dayProjectedIncome = projections
                .filter((p) => p.type === 'income')
                .reduce((sum, p) => sum + p.projectedAmount, 0);
              const dayProjectedExpense = projections
                .filter((p) => p.type === 'expense')
                .reduce((sum, p) => sum + p.projectedAmount, 0);
              const dayNet = dayProjectedIncome - dayProjectedExpense;

              const dayRealIncome = projections
                .filter((p) => p.type === 'income')
                .reduce((sum, p) => sum + (p.realAmount ?? p.projectedAmount), 0);
              const dayRealExpense = projections
                .filter((p) => p.type === 'expense')
                .reduce((sum, p) => sum + (p.realAmount ?? p.projectedAmount), 0);
              const dayRealNet = dayRealIncome - dayRealExpense;

              const cumulative = cumulativeByDate[date];
              const isRiskZone = cumulative < totalProjectedIncome * 0.1;

              return (
                <div key={date} className="space-y-2">
                  {/* Date header */}
                  <div className="flex items-center gap-2 pt-2">
                    <div className="h-px bg-border flex-1" />
                    <span className="text-sm font-semibold text-muted-foreground px-3 py-1 bg-muted rounded-full">
                      {format(parseLocalDate(date), "d MMM — EEEE", { locale: es })}
                    </span>
                    <div className="h-px bg-border flex-1" />
                  </div>

                  {/* Projection rows */}
                  <div className="space-y-1">
                    {projections.map((p) => {
                      const statusCfg = STATUS_CONFIG[p.status];
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted"
                        >
                          <div className="flex items-center gap-3">
                            {p.type === 'income' ? (
                              <ArrowUpCircle className="h-5 w-5 text-green-500 shrink-0" />
                            ) : (
                              <ArrowDownCircle className="h-5 w-5 text-red-500 shrink-0" />
                            )}
                            <div>
                              <p className="font-medium">{p.description}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge className={cn('text-xs', statusCfg.className)}>
                                  {statusCfg.label}
                                </Badge>
                                {p.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {p.category}
                                  </Badge>
                                )}
                                {p.notes && (
                                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                    {p.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p
                                className={cn(
                                  'font-semibold',
                                  p.type === 'income' ? 'text-green-600' : 'text-red-600'
                                )}
                              >
                                {p.type === 'income' ? '+' : '-'}
                                {formatCurrency(p.projectedAmount)}
                              </p>
                              {p.realAmount != null && p.status !== 'projected' && (
                                <p className="text-xs text-muted-foreground">
                                  Real: {p.type === 'income' ? '+' : '-'}
                                  {formatCurrency(p.realAmount)}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => openDialog(p)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-destructive"
                              onClick={() => handleDelete(p.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Saldo del día */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-background border">
                    <span className="text-sm font-medium text-muted-foreground">Saldo del día</span>
                    <div className="flex items-center gap-4">
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          dayNet >= 0 ? 'text-green-600' : 'text-red-600'
                        )}
                      >
                        Proy: {dayNet >= 0 ? '+' : ''}
                        {formatCurrency(dayNet)}
                      </span>
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          dayRealNet >= 0 ? 'text-green-600' : 'text-red-600'
                        )}
                      >
                        Real: {dayRealNet >= 0 ? '+' : ''}
                        {formatCurrency(dayRealNet)}
                      </span>
                    </div>
                  </div>

                  {/* Saldo acumulado warning */}
                  {isRiskZone && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                        ⚠ Saldo acumulado: {formatCurrency(cumulative)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Saldo acumulado total */}
            {groupedByDate.length > 0 && (
              <div className="flex items-center justify-between p-4 rounded-lg border-2 bg-background mt-4">
                <span className="font-bold text-base">Saldo acumulado total</span>
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      'font-bold text-base',
                      projectedBalance >= 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    Proy: {projectedBalance >= 0 ? '+' : ''}
                    {formatCurrency(projectedBalance)}
                  </span>
                  <span
                    className={cn(
                      'font-bold text-base',
                      finalCumulative >= 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    Real: {finalCumulative >= 0 ? '+' : ''}
                    {formatCurrency(finalCumulative)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      {renderDialog()}
    </div>
  );

  // ---------- Dialog renderer ----------

  function renderDialog() {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProjection ? 'Editar Proyección' : 'Nueva Proyección'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Type toggle */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formType === 'income' ? 'default' : 'outline'}
                  className={cn(
                    'flex-1',
                    formType === 'income' &&
                      'bg-green-600 hover:bg-green-700 text-white'
                  )}
                  onClick={() => setFormType('income')}
                >
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  Ingreso
                </Button>
                <Button
                  type="button"
                  variant={formType === 'expense' ? 'default' : 'outline'}
                  className={cn(
                    'flex-1',
                    formType === 'expense' &&
                      'bg-red-600 hover:bg-red-700 text-white'
                  )}
                  onClick={() => setFormType('expense')}
                >
                  <ArrowDownCircle className="h-4 w-4 mr-2" />
                  Egreso
                </Button>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="projection-description">Descripción</Label>
              <Input
                id="projection-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Ej: Sueldo mensual, Alquiler..."
              />
            </div>

            {/* Monto Proyectado */}
            <div className="space-y-2">
              <Label htmlFor="projection-amount">Monto Proyectado</Label>
              <Input
                id="projection-amount"
                type="number"
                value={formProjectedAmount}
                onChange={(e) => setFormProjectedAmount(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            {/* Monto Real — only when status !== 'projected' */}
            {formStatus !== 'projected' && (
              <div className="space-y-2">
                <Label htmlFor="projection-real-amount">Monto Real</Label>
                <Input
                  id="projection-real-amount"
                  type="number"
                  value={formRealAmount}
                  onChange={(e) => setFormRealAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            {/* Fecha */}
            <div className="space-y-2">
              <Label htmlFor="projection-date">Fecha</Label>
              <Input
                id="projection-date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={formStatus}
                onValueChange={(value) => setFormStatus(value as ProjectionStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="projected">Proyectado</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <Label htmlFor="projection-category">Categoría</Label>
              <Input
                id="projection-category"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="Ej: Sueldo, Alquiler, Servicios... (opcional)"
              />
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="projection-notes">Notas</Label>
              <Input
                id="projection-notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Notas adicionales (opcional)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !formDescription.trim() || !formProjectedAmount || !formDate}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {editingProjection ? 'Guardar Cambios' : 'Crear Proyección'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
}

export default ProjectionTab;
