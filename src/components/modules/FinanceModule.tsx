'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Wallet, Plus, Trash2, TrendingUp, TrendingDown, PiggyBank, Target, DollarSign,
  Edit, Save, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { PNLData, PNLSection, PNLLineItem, PNLSectionType } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const SECTION_CONFIG: Record<PNLSectionType, { label: string; color: string; sign: 'positive' | 'negative' }> = {
  gross_sales: { label: 'Venta Bruta', color: 'bg-green-50 dark:bg-green-950/30', sign: 'positive' },
  cost_of_sales: { label: 'Costo de Ventas', color: 'bg-red-50 dark:bg-red-950/30', sign: 'negative' },
  cmv: { label: 'CMV', color: 'bg-orange-50 dark:bg-orange-950/30', sign: 'negative' },
  operating_expenses: { label: 'Gastos Operativos', color: 'bg-yellow-50 dark:bg-yellow-950/30', sign: 'negative' },
};

const CALCULATED_SECTIONS = [
  { id: 'net_sales', label: 'Venta Neta', formula: 'gross_sales - cost_of_sales', color: 'bg-blue-50 dark:bg-blue-950/30' },
  { id: 'contribution_margin', label: 'Margen de Contribución', formula: 'net_sales - cmv', color: 'bg-purple-50 dark:bg-purple-950/30' },
  { id: 'profit', label: 'Profit', formula: 'contribution_margin - operating_expenses', color: 'bg-emerald-50 dark:bg-emerald-950/30' },
];

export function FinanceModule() {
  const { 
    pnlData, addPNLData, updatePNLData, deletePNLData,
    addPNLSection, updatePNLSection, deletePNLSection,
    addPNLLineItem, updatePNLLineItem, deletePNLLineItem,
    transactions, addTransaction, deleteTransaction,
    savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
    budgets, addBudget, updateBudget, deleteBudget,
  } = useAppStore();

  const currentMonth = format(new Date(), 'yyyy-MM');
  
  // Get or create P&L for current month
  const currentPNL = useMemo(() => {
    return pnlData.find(p => p.period === currentMonth);
  }, [pnlData, currentMonth]);

  // Calculate section totals
  const sectionTotals = useMemo(() => {
    if (!currentPNL) return {};
    
    const totals: Record<string, { theoretical: number; real: number }> = {};
    
    currentPNL.sections.forEach(section => {
      const theoretical = section.lineItems.reduce((sum, item) => sum + item.theoretical, 0);
      const real = section.lineItems.reduce((sum, item) => sum + item.real, 0);
      totals[section.type] = { theoretical, real };
    });
    
    return totals;
  }, [currentPNL]);

  // Calculate derived values
  const calculatedValues = useMemo(() => {
    const grossSales = sectionTotals['gross_sales'] || { theoretical: 0, real: 0 };
    const costOfSales = sectionTotals['cost_of_sales'] || { theoretical: 0, real: 0 };
    const cmv = sectionTotals['cmv'] || { theoretical: 0, real: 0 };
    const operatingExpenses = sectionTotals['operating_expenses'] || { theoretical: 0, real: 0 };

    const netSales = {
      theoretical: grossSales.theoretical - costOfSales.theoretical,
      real: grossSales.real - costOfSales.real,
    };

    const contributionMargin = {
      theoretical: netSales.theoretical - cmv.theoretical,
      real: netSales.real - cmv.real,
    };

    const profit = {
      theoretical: contributionMargin.theoretical - operatingExpenses.theoretical,
      real: contributionMargin.real - operatingExpenses.real,
    };

    return { netSales, contributionMargin, profit };
  }, [sectionTotals]);

  // Total gross sales for % calculations
  const totalGrossSales = sectionTotals['gross_sales']?.real || 1;

  // Dialog states
  const [lineItemDialog, setLineItemDialog] = useState(false);
  const [sectionDialog, setSectionDialog] = useState(false);
  const [editingSection, setEditingSection] = useState<PNLSectionType | null>(null);
  const [editingLineItem, setEditingLineItem] = useState<{ sectionId: string; item: PNLLineItem | null }>({ sectionId: '', item: null });

  // Form states
  const [lineItemName, setLineItemName] = useState('');
  const [lineItemTheoretical, setLineItemTheoretical] = useState('');
  const [lineItemReal, setLineItemReal] = useState('');

  // Initialize P&L for current month
  const initializePNL = () => {
    const defaultSections: PNLSection[] = [
      { id: uuidv4(), type: 'gross_sales', name: 'Venta Bruta', lineItems: [], order: 1 },
      { id: uuidv4(), type: 'cost_of_sales', name: 'Costo de Ventas', lineItems: [], order: 2 },
      { id: uuidv4(), type: 'cmv', name: 'CMV', lineItems: [], order: 3 },
      { id: uuidv4(), type: 'operating_expenses', name: 'Gastos Operativos', lineItems: [], order: 4 },
    ];

    const newPNL: PNLData = {
      id: uuidv4(),
      period: currentMonth,
      sections: defaultSections,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addPNLData(newPNL);
  };

  const openLineItemDialog = (sectionId: string, item: PNLLineItem | null = null) => {
    setEditingSection(null);
    setEditingLineItem({ sectionId, item });
    if (item) {
      setLineItemName(item.name);
      setLineItemTheoretical(item.theoretical.toString());
      setLineItemReal(item.real.toString());
    } else {
      setLineItemName('');
      setLineItemTheoretical('');
      setLineItemReal('');
    }
    setLineItemDialog(true);
  };

  const saveLineItem = () => {
    if (!lineItemName.trim() || !currentPNL) return;

    const lineItem: PNLLineItem = {
      id: editingLineItem.item?.id || uuidv4(),
      name: lineItemName.trim(),
      theoretical: parseFloat(lineItemTheoretical) || 0,
      real: parseFloat(lineItemReal) || 0,
      order: editingLineItem.item?.order || Date.now(),
    };

    if (editingLineItem.item) {
      updatePNLLineItem(currentPNL.id, editingLineItem.sectionId, editingLineItem.item.id, lineItem);
    } else {
      addPNLLineItem(currentPNL.id, editingLineItem.sectionId, lineItem);
    }

    setLineItemDialog(false);
    setLineItemName('');
    setLineItemTheoretical('');
    setLineItemReal('');
    setEditingLineItem({ sectionId: '', item: null });
  };

  const deleteLineItem = (sectionId: string, itemId: string) => {
    if (!currentPNL) return;
    deletePNLLineItem(currentPNL.id, sectionId, itemId);
  };

  // Format helpers
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getDeviation = (theoretical: number, real: number) => {
    const deviationAmount = real - theoretical;
    const deviationPercent = theoretical !== 0 ? ((real - theoretical) / theoretical) * 100 : 0;
    return { amount: deviationAmount, percent: deviationPercent };
  };

  const getPercentOfSales = (value: number) => {
    return totalGrossSales !== 0 ? (value / totalGrossSales) * 100 : 0;
  };

  // Render section
  const renderSection = (section: PNLSection, isExpanded: boolean, toggleExpand: () => void) => {
    const total = sectionTotals[section.type] || { theoretical: 0, real: 0 };
    const deviation = getDeviation(total.theoretical, total.real);
    const percentOfSales = getPercentOfSales(total.real);
    const config = SECTION_CONFIG[section.type];

    return (
      <div key={section.id} className={cn("rounded-lg border overflow-hidden", config.color)}>
        {/* Section Header */}
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-black/5"
          onClick={toggleExpand}
        >
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="font-semibold">{section.name}</span>
            <Badge variant="outline">{section.lineItems.length} líneas</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right">
              <span className="text-muted-foreground">Teórico: </span>
              <span className={cn("font-medium", config.sign === 'positive' ? 'text-green-600' : 'text-red-600')}>
                {config.sign === 'positive' ? '+' : '-'}{formatCurrency(total.theoretical)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">Real: </span>
              <span className={cn("font-medium", config.sign === 'positive' ? 'text-green-600' : 'text-red-600')}>
                {config.sign === 'positive' ? '+' : '-'}{formatCurrency(total.real)}
              </span>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-2 p-2 bg-black/5 text-xs font-medium text-muted-foreground">
              <div className="col-span-3">Concepto</div>
              <div className="col-span-2 text-right">Teórico</div>
              <div className="col-span-2 text-right">Real</div>
              <div className="col-span-2 text-right">Desvío $</div>
              <div className="col-span-1 text-right">Desvío %</div>
              <div className="col-span-1 text-right">% Venta</div>
              <div className="col-span-1"></div>
            </div>

            {/* Line Items */}
            {section.lineItems.map(item => {
              const itemDeviation = getDeviation(item.theoretical, item.real);
              const itemPercentOfSales = getPercentOfSales(item.real);

              return (
                <div key={item.id} className="grid grid-cols-12 gap-2 p-2 border-t items-center hover:bg-black/5">
                  <div className="col-span-3 font-medium">{item.name}</div>
                  <div className="col-span-2 text-right">{formatCurrency(item.theoretical)}</div>
                  <div className="col-span-2 text-right">{formatCurrency(item.real)}</div>
                  <div className={cn("col-span-2 text-right", itemDeviation.amount >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {formatCurrency(itemDeviation.amount)}
                  </div>
                  <div className={cn("col-span-1 text-right text-xs", itemDeviation.percent >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {formatPercent(itemDeviation.percent)}
                  </div>
                  <div className="col-span-1 text-right text-xs text-muted-foreground">
                    {itemPercentOfSales.toFixed(1)}%
                  </div>
                  <div className="col-span-1 flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openLineItemDialog(section.id, item)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteLineItem(section.id, item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Add Line Button */}
            <div className="p-2 border-t">
              <Button variant="outline" size="sm" className="w-full" onClick={() => openLineItemDialog(section.id)}>
                <Plus className="h-4 w-4 mr-1" /> Agregar Línea
              </Button>
            </div>

            {/* Section Total */}
            <div className="grid grid-cols-12 gap-2 p-2 border-t bg-black/10 font-semibold">
              <div className="col-span-3">Total {section.name}</div>
              <div className="col-span-2 text-right">{formatCurrency(total.theoretical)}</div>
              <div className="col-span-2 text-right">{formatCurrency(total.real)}</div>
              <div className={cn("col-span-2 text-right", deviation.amount >= 0 ? 'text-green-600' : 'text-red-600')}>
                {formatCurrency(deviation.amount)}
              </div>
              <div className={cn("col-span-1 text-right text-xs", deviation.percent >= 0 ? 'text-green-600' : 'text-red-600')}>
                {formatPercent(deviation.percent)}
              </div>
              <div className="col-span-1 text-right text-xs">{percentOfSales.toFixed(1)}%</div>
              <div className="col-span-1"></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render calculated section
  const renderCalculatedSection = (
    id: string, 
    label: string, 
    values: { theoretical: number; real: number },
    color: string
  ) => {
    const deviation = getDeviation(values.theoretical, values.real);
    const percentOfSales = getPercentOfSales(values.real);

    return (
      <div key={id} className={cn("rounded-lg border p-3", color)}>
        <div className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-3 font-bold text-lg">{label}</div>
          <div className="col-span-2 text-right font-semibold">{formatCurrency(values.theoretical)}</div>
          <div className="col-span-2 text-right font-semibold">{formatCurrency(values.real)}</div>
          <div className={cn("col-span-2 text-right font-semibold", deviation.amount >= 0 ? 'text-green-600' : 'text-red-600')}>
            {formatCurrency(deviation.amount)}
          </div>
          <div className={cn("col-span-1 text-right font-semibold", deviation.percent >= 0 ? 'text-green-600' : 'text-red-600')}>
            {formatPercent(deviation.percent)}
          </div>
          <div className="col-span-1 text-right font-semibold">{percentOfSales.toFixed(1)}%</div>
          <div className="col-span-1"></div>
        </div>
      </div>
    );
  };

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['gross_sales', 'cost_of_sales', 'cmv', 'operating_expenses']));

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">P&L - Estado de Pérdidas y Ganancias</h2>
          <p className="text-muted-foreground">{format(new Date(), 'MMMM yyyy', { locale: es })}</p>
        </div>
        {!currentPNL && (
          <Button onClick={initializePNL}>
            <Plus className="h-4 w-4 mr-2" /> Inicializar P&L
          </Button>
        )}
      </div>

      {currentPNL ? (
        <Tabs defaultValue="pnl" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pnl">P&L</TabsTrigger>
            <TabsTrigger value="transactions">Transacciones</TabsTrigger>
            <TabsTrigger value="budgets">Presupuestos</TabsTrigger>
            <TabsTrigger value="savings">Ahorros</TabsTrigger>
          </TabsList>

          <TabsContent value="pnl" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Venta Neta</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(calculatedValues.netSales.real)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Margen Contrib.</p>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(calculatedValues.contributionMargin.real)}</p>
                    </div>
                    <Target className="h-8 w-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className={cn(
                "bg-gradient-to-br",
                calculatedValues.profit.real >= 0 
                  ? "from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900"
                  : "from-red-50 to-red-100 dark:from-red-950 dark:to-red-900"
              )}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Profit</p>
                      <p className={cn("text-2xl font-bold", calculatedValues.profit.real >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                        {formatCurrency(calculatedValues.profit.real)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-emerald-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Desvío Profit</p>
                      <p className={cn("text-2xl font-bold", getDeviation(calculatedValues.profit.theoretical, calculatedValues.profit.real).amount >= 0 ? 'text-blue-600' : 'text-red-600')}>
                        {formatPercent(getDeviation(calculatedValues.profit.theoretical, calculatedValues.profit.real).percent)}
                      </p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* P&L Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Estado de Resultados - Teórico vs Real
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Column Headers */}
                <div className="grid grid-cols-12 gap-2 p-2 bg-muted rounded-lg text-sm font-medium">
                  <div className="col-span-3">Concepto</div>
                  <div className="col-span-2 text-right">Teórico</div>
                  <div className="col-span-2 text-right">Real</div>
                  <div className="col-span-2 text-right">Desvío $</div>
                  <div className="col-span-1 text-right">Desvío %</div>
                  <div className="col-span-1 text-right">% Venta</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Sections in order */}
                {currentPNL.sections
                  .sort((a, b) => a.order - b.order)
                  .map(section => renderSection(section, expandedSections.has(section.id), () => toggleSection(section.id)))}

                {/* Net Sales */}
                {renderCalculatedSection('net_sales', 'Venta Neta', calculatedValues.netSales, CALCULATED_SECTIONS[0].color)}

                {/* CMV */}
                {currentPNL.sections
                  .filter(s => s.type === 'cmv')
                  .map(section => renderSection(section, expandedSections.has(section.id), () => toggleSection(section.id)))}

                {/* Contribution Margin */}
                {renderCalculatedSection('contribution_margin', 'Margen de Contribución', calculatedValues.contributionMargin, CALCULATED_SECTIONS[1].color)}

                {/* Operating Expenses */}
                {currentPNL.sections
                  .filter(s => s.type === 'operating_expenses')
                  .map(section => renderSection(section, expandedSections.has(section.id), () => toggleSection(section.id)))}

                {/* Profit */}
                {renderCalculatedSection('profit', 'PROFIT', calculatedValues.profit, CALCULATED_SECTIONS[2].color)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transacciones del Mes</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-2">
                    {transactions.slice(0, 10).map(t => (
                      <div key={t.id} className="flex justify-between items-center p-2 rounded bg-muted/50">
                        <div>
                          <p className="font-medium">{t.description || 'Sin descripción'}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(t.date), 'd MMM yyyy')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={t.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                            {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                          </span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteTransaction(t.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No hay transacciones</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budgets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Presupuestos</CardTitle>
              </CardHeader>
              <CardContent>
                {budgets.length > 0 ? (
                  <div className="space-y-2">
                    {budgets.map(b => (
                      <div key={b.id} className="flex justify-between items-center p-2 rounded bg-muted/50">
                        <span>{b.category}</span>
                        <div className="flex items-center gap-2">
                          <span>${b.limit.toLocaleString()}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteBudget(b.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No hay presupuestos</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="savings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Metas de Ahorro</CardTitle>
              </CardHeader>
              <CardContent>
                {savingsGoals.length > 0 ? (
                  <div className="space-y-4">
                    {savingsGoals.map(goal => (
                      <div key={goal.id} className="p-4 rounded-lg bg-muted/50">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{goal.name}</span>
                            <p className="text-xs text-muted-foreground">
                              Meta: ${goal.targetAmount.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">${goal.currentAmount.toLocaleString()}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteSavingsGoal(goal.id)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No hay metas de ahorro</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Wallet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay P&L para este mes</h3>
            <p className="text-muted-foreground mb-4">Inicializa el P&L para comenzar a registrar tu estado de resultados</p>
            <Button onClick={initializePNL}>
              <Plus className="h-4 w-4 mr-2" /> Inicializar P&L
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Line Item Dialog */}
      <Dialog open={lineItemDialog} onOpenChange={setLineItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLineItem.item ? 'Editar Línea' : 'Nueva Línea'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre del Concepto</Label>
              <Input 
                value={lineItemName} 
                onChange={(e) => setLineItemName(e.target.value)}
                placeholder="Ej: Ventas de productos, Sueldos, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor Teórico (Presupuesto)</Label>
                <Input 
                  type="number"
                  value={lineItemTheoretical} 
                  onChange={(e) => setLineItemTheoretical(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Valor Real</Label>
                <Input 
                  type="number"
                  value={lineItemReal} 
                  onChange={(e) => setLineItemReal(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLineItemDialog(false)}>Cancelar</Button>
            <Button onClick={saveLineItem} disabled={!lineItemName.trim()}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
