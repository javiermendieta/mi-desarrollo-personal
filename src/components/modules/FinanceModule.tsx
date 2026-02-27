'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Plus, Trash2, TrendingUp, TrendingDown, PiggyBank, Target, DollarSign } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { Transaction, SavingsGoal, Budget, TransactionCategory } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';

const TRANSACTION_CATEGORIES: { value: TransactionCategory; label: string; color: string }[] = [
  { value: 'salary', label: 'Salario', color: '#22c55e' },
  { value: 'freelance', label: 'Freelance', color: '#10b981' },
  { value: 'investment', label: 'Inversión', color: '#14b8a6' },
  { value: 'food', label: 'Comida', color: '#f59e0b' },
  { value: 'transport', label: 'Transporte', color: '#6366f1' },
  { value: 'entertainment', label: 'Entretenimiento', color: '#ec4899' },
  { value: 'health', label: 'Salud', color: '#ef4444' },
  { value: 'education', label: 'Educación', color: '#8b5cf6' },
  { value: 'shopping', label: 'Compras', color: '#f97316' },
  { value: 'bills', label: 'Facturas', color: '#64748b' },
  { value: 'other', label: 'Otros', color: '#94a3b8' },
];

const COLORS = ['#22c55e', '#f59e0b', '#6366f1', '#ec4899', '#ef4444', '#8b5cf6', '#f97316', '#64748b', '#94a3b8'];

export function FinanceModule() {
  const { 
    transactions, addTransaction, deleteTransaction,
    savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
    budgets, addBudget, updateBudget, deleteBudget,
  } = useAppStore();

  const [transactionDialog, setTransactionDialog] = useState(false);
  const [savingsDialog, setSavingsDialog] = useState(false);
  const [budgetDialog, setBudgetDialog] = useState(false);

  const [transType, setTransType] = useState<'income' | 'expense'>('expense');
  const [transAmount, setTransAmount] = useState('');
  const [transCategory, setTransCategory] = useState<TransactionCategory>('other');
  const [transDescription, setTransDescription] = useState('');
  const [transDate, setTransDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [savingsName, setSavingsName] = useState('');
  const [savingsTarget, setSavingsTarget] = useState('');
  const [savingsCurrent, setSavingsCurrent] = useState('');
  const [savingsDeadline, setSavingsDeadline] = useState('');
  const [editingSavings, setEditingSavings] = useState<SavingsGoal | null>(null);

  const [budgetCategory, setBudgetCategory] = useState<TransactionCategory>('food');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [budgetMonth, setBudgetMonth] = useState(format(new Date(), 'yyyy-MM'));

  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthTransactions = transactions.filter((t) => format(new Date(t.date), 'yyyy-MM') === currentMonth);
  const totalIncome = monthTransactions.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const totalExpenses = monthTransactions.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  // Chart data - last 6 months
  const last6Months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));
  const monthlyData = last6Months.map(month => {
    const monthStr = format(month, 'yyyy-MM');
    const monthTrans = transactions.filter(t => format(new Date(t.date), 'yyyy-MM') === monthStr);
    return {
      name: format(month, 'MMM', { locale: es }),
      ingresos: monthTrans.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0),
      gastos: monthTrans.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0),
    };
  });

  // Expense by category for pie chart
  const expensesByCategory = TRANSACTION_CATEGORIES
    .filter(c => c.value !== 'salary' && c.value !== 'freelance' && c.value !== 'investment')
    .map(cat => ({
      name: cat.label,
      value: monthTransactions.filter(t => t.type === 'expense' && t.category === cat.value).reduce((a, t) => a + t.amount, 0),
      color: cat.color,
    }))
    .filter(d => d.value > 0);

  // Budget progress
  const currentBudgets = budgets.filter(b => b.month === currentMonth);
  const budgetProgress = currentBudgets.map(budget => {
    const spent = monthTransactions
      .filter(t => t.type === 'expense' && t.category === budget.category)
      .reduce((a, t) => a + t.amount, 0);
    return {
      ...budget,
      spent,
      percentage: Math.min(100, Math.round((spent / budget.limit) * 100)),
      remaining: budget.limit - spent,
    };
  });

  const handleSaveTransaction = () => {
    if (!transAmount) return;
    const transaction: Transaction = {
      id: uuidv4(),
      type: transType,
      amount: parseFloat(transAmount),
      category: transCategory,
      description: transDescription || '',
      date: transDate,
    };
    addTransaction(transaction);
    setTransactionDialog(false);
    setTransType('expense');
    setTransAmount('');
    setTransCategory('other');
    setTransDescription('');
    setTransDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleSaveSavings = () => {
    if (!savingsName || !savingsTarget) return;
    const goal: SavingsGoal = {
      id: editingSavings?.id || uuidv4(),
      name: savingsName,
      targetAmount: parseFloat(savingsTarget),
      currentAmount: parseFloat(savingsCurrent) || 0,
      deadline: savingsDeadline || undefined,
      createdAt: editingSavings?.createdAt || new Date().toISOString(),
    };
    if (editingSavings) {
      updateSavingsGoal(editingSavings.id, goal);
    } else {
      addSavingsGoal(goal);
    }
    setSavingsDialog(false);
    setSavingsName('');
    setSavingsTarget('');
    setSavingsCurrent('');
    setSavingsDeadline('');
    setEditingSavings(null);
  };

  const handleSaveBudget = () => {
    if (!budgetLimit) return;
    const budget: Budget = {
      id: uuidv4(),
      category: budgetCategory,
      limit: parseFloat(budgetLimit),
      month: budgetMonth,
    };
    // Check if budget already exists for this category/month
    const existing = budgets.find(b => b.category === budgetCategory && b.month === budgetMonth);
    if (existing) {
      updateBudget(existing.id, { limit: parseFloat(budgetLimit) });
    } else {
      addBudget(budget);
    }
    setBudgetDialog(false);
    setBudgetLimit('');
  };

  const getCategoryLabel = (cat: string) => TRANSACTION_CATEGORIES.find((c) => c.value === cat)?.label || cat;
  const getCategoryColor = (cat: string) => TRANSACTION_CATEGORIES.find((c) => c.value === cat)?.color || '#94a3b8';

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><TrendingUp className="h-5 w-5 text-green-600" /></div>
              <div><p className="text-sm text-muted-foreground">Ingresos</p><p className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg"><TrendingDown className="h-5 w-5 text-red-600" /></div>
              <div><p className="text-sm text-muted-foreground">Gastos</p><p className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Wallet className="h-5 w-5 text-blue-600" /></div>
              <div><p className="text-sm text-muted-foreground">Balance</p><p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>${balance.toLocaleString()}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg"><PiggyBank className="h-5 w-5 text-purple-600" /></div>
              <div><p className="text-sm text-muted-foreground">Ahorros</p><p className="text-2xl font-bold text-purple-600">${savingsGoals.reduce((a, g) => a + g.currentAmount, 0).toLocaleString()}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pnl">P&L</TabsTrigger>
          <TabsTrigger value="transactions">Transacciones</TabsTrigger>
          <TabsTrigger value="budgets">Presupuestos</TabsTrigger>
          <TabsTrigger value="savings">Ahorros</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="pnl" className="space-y-4">
          {/* P&L Summary */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Estado de Pérdidas y Ganancias - {format(new Date(), 'MMMM yyyy', { locale: es })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Ingresos */}
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <h3 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Ingresos
                  </h3>
                  <div className="space-y-2">
                    {TRANSACTION_CATEGORIES
                      .filter(c => ['salary', 'freelance', 'investment', 'other'].includes(c.value))
                      .map(cat => {
                        const amount = monthTransactions
                          .filter(t => t.type === 'income' && t.category === cat.value)
                          .reduce((a, t) => a + t.amount, 0);
                        if (amount === 0) return null;
                        return (
                          <div key={cat.value} className="flex justify-between">
                            <span className="text-sm">{cat.label}</span>
                            <span className="font-medium text-green-600">+${amount.toLocaleString()}</span>
                          </div>
                        );
                      })}
                    <div className="flex justify-between pt-2 border-t border-green-200 dark:border-green-800">
                      <span className="font-semibold">Total Ingresos</span>
                      <span className="font-bold text-green-600 text-lg">${totalIncome.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Gastos */}
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <h3 className="font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Gastos
                  </h3>
                  <div className="space-y-2">
                    {TRANSACTION_CATEGORIES
                      .filter(c => !['salary', 'freelance', 'investment'].includes(c.value))
                      .map(cat => {
                        const amount = monthTransactions
                          .filter(t => t.type === 'expense' && t.category === cat.value)
                          .reduce((a, t) => a + t.amount, 0);
                        if (amount === 0) return null;
                        return (
                          <div key={cat.value} className="flex justify-between">
                            <span className="text-sm flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                              {cat.label}
                            </span>
                            <span className="font-medium text-red-600">-${amount.toLocaleString()}</span>
                          </div>
                        );
                      })}
                    <div className="flex justify-between pt-2 border-t border-red-200 dark:border-red-800">
                      <span className="font-semibold">Total Gastos</span>
                      <span className="font-bold text-red-600 text-lg">-${totalExpenses.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Resultado Neto */}
                <div className={`p-4 rounded-lg ${balance >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Resultado Neto</span>
                    <span className={`font-bold text-2xl ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {balance >= 0 ? '+' : ''}${balance.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {balance >= 0 ? '✓ Superávit este mes' : '⚠ Déficit este mes'}
                  </p>
                </div>

                {/* Ratio de Ahorro */}
                {totalIncome > 0 && (
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Ratio de Ahorro</span>
                      <span className="font-bold text-blue-600">
                        {((balance / totalIncome) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.max(0, (balance / totalIncome) * 100)} 
                      className="h-2 mt-2" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Recomendado: ≥20% de los ingresos
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comparación Mensual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Mes</th>
                      <th className="text-right py-2">Ingresos</th>
                      <th className="text-right py-2">Gastos</th>
                      <th className="text-right py-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {last6Months.map(month => {
                      const monthStr = format(month, 'yyyy-MM');
                      const monthTrans = transactions.filter(t => format(new Date(t.date), 'yyyy-MM') === monthStr);
                      const income = monthTrans.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
                      const expense = monthTrans.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
                      const bal = income - expense;
                      const isCurrentMonth = monthStr === currentMonth;
                      return (
                        <tr key={monthStr} className={cn("border-b", isCurrentMonth && "bg-muted/50 font-medium")}>
                          <td className="py-2">{format(month, 'MMMM yyyy', { locale: es })}</td>
                          <td className="text-right text-green-600">${income.toLocaleString()}</td>
                          <td className="text-right text-red-600">${expense.toLocaleString()}</td>
                          <td className={cn("text-right font-medium", bal >= 0 ? 'text-green-600' : 'text-red-600')}>
                            {bal >= 0 ? '+' : ''}${bal.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Transacciones de {format(new Date(), 'MMMM yyyy', { locale: es })}</CardTitle>
                <Button size="sm" onClick={() => setTransactionDialog(true)}><Plus className="h-4 w-4 mr-1" /> Nueva</Button>
              </div>
            </CardHeader>
            <CardContent>
              {monthTransactions.length > 0 ? (
                <div className="space-y-2">
                  {monthTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20).map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {t.type === 'income' ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
                        </div>
                        <div>
                          <p className="font-medium">{t.description || getCategoryLabel(t.category)}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">{format(new Date(t.date), 'd MMM yyyy')}</p>
                            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: getCategoryColor(t.category) + '20', color: getCategoryColor(t.category) }}>
                              {getCategoryLabel(t.category)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                        </span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>¿Eliminar transacción?</AlertDialogTitle></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteTransaction(t.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No hay transacciones este mes</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5" />Presupuestos Mensuales</CardTitle>
                <Button size="sm" onClick={() => setBudgetDialog(true)}><Plus className="h-4 w-4 mr-1" /> Nuevo</Button>
              </div>
            </CardHeader>
            <CardContent>
              {budgetProgress.length > 0 ? (
                <div className="space-y-4">
                  {budgetProgress.map((bp) => (
                    <div key={bp.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{getCategoryLabel(bp.category)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">${bp.spent} / ${bp.limit}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteBudget(bp.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <Progress value={bp.percentage} className={`h-2 ${bp.percentage >= 90 ? '[&>div]:bg-red-500' : bp.percentage >= 70 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`} />
                      <p className="text-xs text-muted-foreground">Restante: ${bp.remaining.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No hay presupuestos configurados</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="savings" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2"><PiggyBank className="h-5 w-5 text-purple-500" />Metas de Ahorro</CardTitle>
                <Button size="sm" onClick={() => setSavingsDialog(true)}><Plus className="h-4 w-4 mr-1" /> Nueva</Button>
              </div>
            </CardHeader>
            <CardContent>
              {savingsGoals.length > 0 ? (
                <div className="space-y-4">
                  {savingsGoals.map((goal) => (
                    <div key={goal.id} className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{goal.name}</span>
                          {goal.deadline && (
                            <p className="text-xs text-muted-foreground">Fecha límite: {format(new Date(goal.deadline), 'd MMM yyyy')}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            className="w-24 h-8"
                            value={goal.currentAmount}
                            onChange={(e) => updateSavingsGoal(goal.id, { currentAmount: parseFloat(e.target.value) || 0 })}
                          />
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteSavingsGoal(goal.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <Progress value={(goal.currentAmount / goal.targetAmount) * 100} className="h-2" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>${goal.currentAmount.toLocaleString()}</span>
                        <span>${goal.targetAmount.toLocaleString()}</span>
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

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-lg">Ingresos vs Gastos (6 meses)</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                      <Bar dataKey="ingresos" fill="#22c55e" name="Ingresos" />
                      <Bar dataKey="gastos" fill="#ef4444" name="Gastos" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Gastos por Categoría</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  {expensesByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expensesByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {expensesByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No hay datos de gastos</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Transaction Dialog */}
      <Dialog open={transactionDialog} onOpenChange={setTransactionDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Transacción</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant={transType === 'income' ? 'default' : 'outline'} className="flex-1" onClick={() => setTransType('income')}>Ingreso</Button>
              <Button variant={transType === 'expense' ? 'default' : 'outline'} className="flex-1" onClick={() => setTransType('expense')}>Gasto</Button>
            </div>
            <div><Label>Monto</Label><Input type="number" value={transAmount} onChange={(e) => setTransAmount(e.target.value)} placeholder="0.00" /></div>
            <div><Label>Categoría</Label>
              <Select value={transCategory} onValueChange={(v) => setTransCategory(v as TransactionCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRANSACTION_CATEGORIES.filter(c => transType === 'income' ? ['salary', 'freelance', 'investment', 'other'].includes(c.value) : true).map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Descripción</Label><Input value={transDescription} onChange={(e) => setTransDescription(e.target.value)} placeholder="Opcional" /></div>
            <div><Label>Fecha</Label><Input type="date" value={transDate} onChange={(e) => setTransDate(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransactionDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveTransaction} disabled={!transAmount}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Savings Dialog */}
      <Dialog open={savingsDialog} onOpenChange={setSavingsDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Meta de Ahorro</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre</Label><Input value={savingsName} onChange={(e) => setSavingsName(e.target.value)} placeholder="Ej: Vacaciones" /></div>
            <div><Label>Monto objetivo</Label><Input type="number" value={savingsTarget} onChange={(e) => setSavingsTarget(e.target.value)} placeholder="0.00" /></div>
            <div><Label>Monto actual (opcional)</Label><Input type="number" value={savingsCurrent} onChange={(e) => setSavingsCurrent(e.target.value)} placeholder="0.00" /></div>
            <div><Label>Fecha límite (opcional)</Label><Input type="date" value={savingsDeadline} onChange={(e) => setSavingsDeadline(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSavingsDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveSavings} disabled={!savingsName || !savingsTarget}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Budget Dialog */}
      <Dialog open={budgetDialog} onOpenChange={setBudgetDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Presupuesto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Categoría</Label>
              <Select value={budgetCategory} onValueChange={(v) => setBudgetCategory(v as TransactionCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRANSACTION_CATEGORIES.filter(c => !['salary', 'freelance', 'investment'].includes(c.value)).map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Límite mensual</Label><Input type="number" value={budgetLimit} onChange={(e) => setBudgetLimit(e.target.value)} placeholder="0.00" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBudgetDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveBudget} disabled={!budgetLimit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
