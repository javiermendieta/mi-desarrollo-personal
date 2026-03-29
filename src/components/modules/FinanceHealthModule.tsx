'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Wallet,
  Heart,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Bed,
  Droplets,
  Scale,
  Footprints,
  Moon,
  Sun,
  DollarSign,
  PiggyBank,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { TRANSACTION_CATEGORIES, SLEEP_QUALITY_LABELS } from '@/lib/constants';
import type { Transaction, SavingsGoal, SleepLog, HydrationLog, TransactionType, TransactionCategory } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export function FinanceHealthModule() {
  const {
    transactions,
    addTransaction,
    deleteTransaction,
    savingsGoals,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    sleepLogs,
    addSleepLog,
    hydrationLogs,
    addHydrationLog,
    updateHydrationLog,
  } = useAppStore();

  // Transaction state
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionCategory, setTransactionCategory] = useState<TransactionCategory>('other');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Savings goal state
  const [isSavingsDialogOpen, setIsSavingsDialogOpen] = useState(false);
  const [savingsName, setSavingsName] = useState('');
  const [savingsTarget, setSavingsTarget] = useState('');
  const [savingsCurrent, setSavingsCurrent] = useState('');
  const [savingsDeadline, setSavingsDeadline] = useState('');

  // Sleep state
  const [isSleepDialogOpen, setIsSleepDialogOpen] = useState(false);
  const [sleepTime, setSleepTime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepQuality, setSleepQuality] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [sleepNotes, setSleepNotes] = useState('');

  // Hydration
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayHydration = hydrationLogs.find((l) => l.date === todayStr);

  // Finance calculations
  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthTransactions = transactions.filter((t) => t.date.startsWith(currentMonth));
  const monthIncome = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  const monthExpenses = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
  const balance = monthIncome - monthExpenses;

  // Transaction handlers
  const openTransactionDialog = (type: TransactionType) => {
    setTransactionType(type);
    setTransactionAmount('');
    setTransactionCategory(type === 'income' ? 'salary' : 'food');
    setTransactionDescription('');
    setTransactionDate(format(new Date(), 'yyyy-MM-dd'));
    setIsTransactionDialogOpen(true);
  };

  const handleSaveTransaction = () => {
    if (!transactionAmount || parseFloat(transactionAmount) <= 0) return;

    addTransaction({
      id: uuidv4(),
      type: transactionType,
      amount: parseFloat(transactionAmount),
      category: transactionCategory,
      description: transactionDescription,
      date: transactionDate,
    });

    setIsTransactionDialogOpen(false);
  };

  // Savings handlers
  const openSavingsDialog = () => {
    setSavingsName('');
    setSavingsTarget('');
    setSavingsCurrent('');
    setSavingsDeadline('');
    setIsSavingsDialogOpen(true);
  };

  const handleSaveSavingsGoal = () => {
    if (!savingsName.trim() || !savingsTarget) return;

    addSavingsGoal({
      id: uuidv4(),
      name: savingsName,
      targetAmount: parseFloat(savingsTarget),
      currentAmount: parseFloat(savingsCurrent) || 0,
      deadline: savingsDeadline || undefined,
      createdAt: new Date().toISOString(),
    });

    setIsSavingsDialogOpen(false);
  };

  // Sleep handlers
  const openSleepDialog = () => {
    setSleepTime('23:00');
    setWakeTime('07:00');
    setSleepQuality(3);
    setSleepNotes('');
    setIsSleepDialogOpen(true);
  };

  const handleSaveSleep = () => {
    addSleepLog({
      id: uuidv4(),
      date: todayStr,
      sleepTime: sleepTime,
      wakeTime: wakeTime,
      quality: sleepQuality,
      notes: sleepNotes || undefined,
    });
    setIsSleepDialogOpen(false);
  };

  // Hydration handlers
  const updateHydration = (glasses: number) => {
    if (todayHydration) {
      updateHydrationLog(todayHydration.id, { glasses: Math.max(0, Math.min(glasses, 12)) });
    } else {
      addHydrationLog({
        id: uuidv4(),
        date: todayStr,
        glasses: glasses,
        target: 8,
      });
    }
  };

  const getCategoryLabel = (cat: TransactionCategory) => {
    const allCats = [...TRANSACTION_CATEGORIES.income, ...TRANSACTION_CATEGORIES.expense];
    return allCats.find((c) => c.value === cat)?.label || cat;
  };

  const getQualityLabel = (quality: number) => {
    return SLEEP_QUALITY_LABELS.find((q) => q.value === quality)?.label || 'Regular';
  };

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const recentSleep = [...sleepLogs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="finances" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="finances">Finanzas</TabsTrigger>
          <TabsTrigger value="health">Salud</TabsTrigger>
        </TabsList>

        {/* Finances Tab */}
        <TabsContent value="finances" className="space-y-4">
          {/* Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Resumen del Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950">
                  <TrendingUp className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
                  <p className="text-lg font-bold text-emerald-600">${monthIncome.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Ingresos</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950">
                  <TrendingDown className="h-5 w-5 mx-auto text-red-600 mb-1" />
                  <p className="text-lg font-bold text-red-600">${monthExpenses.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Gastos</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <DollarSign className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                  <p className={`text-lg font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ${balance.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Balance</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => openTransactionDialog('income')}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ingreso
                </Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={() => openTransactionDialog('expense')}>
                  <Plus className="h-4 w-4 mr-1" />
                  Gasto
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Savings Goals */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PiggyBank className="h-5 w-5" />
                  Metas de Ahorro
                </CardTitle>
                <Button variant="outline" size="sm" onClick={openSavingsDialog}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {savingsGoals.length > 0 ? (
                <div className="space-y-3">
                  {savingsGoals.map((goal) => {
                    const progress = Math.round((goal.currentAmount / goal.targetAmount) * 100);
                    return (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{goal.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{progress}%</span>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar meta?</AlertDialogTitle>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteSavingsGoal(goal.id)}>
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tienes metas de ahorro
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Últimos Movimientos</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recentTransactions.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {t.type === 'income' ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{t.description || getCategoryLabel(t.category)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(t.date), 'd MMM yyyy', { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                        </span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar movimiento?</AlertDialogTitle>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteTransaction(t.id)}>
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin movimientos registrados
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-4">
          {/* Hydration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-500" />
                Hidratación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-2 mb-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => updateHydration(i + 1)}
                    className="transition-transform hover:scale-110"
                  >
                    <Droplets
                      className={`h-8 w-8 ${
                        i < (todayHydration?.glasses || 0)
                          ? 'text-blue-500 fill-blue-500'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{todayHydration?.glasses || 0}/8</p>
                <p className="text-sm text-muted-foreground">vasos hoy</p>
              </div>
              <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => updateHydration((todayHydration?.glasses || 0) - 1)}>
                  -
                </Button>
                <Button variant="outline" size="sm" onClick={() => updateHydration((todayHydration?.glasses || 0) + 1)}>
                  + 1 vaso
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sleep */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Moon className="h-5 w-5 text-purple-500" />
                  Sueño
                </CardTitle>
                <Button variant="outline" size="sm" onClick={openSleepDialog}>
                  <Plus className="h-4 w-4 mr-1" />
                  Registrar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentSleep.length > 0 ? (
                <div className="space-y-2">
                  {recentSleep.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">
                          {log.sleepTime} - {log.wakeTime}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(log.date), 'd MMM', { locale: es })}
                        </p>
                      </div>
                      <Badge variant={log.quality >= 4 ? 'default' : log.quality <= 2 ? 'destructive' : 'secondary'}>
                        {getQualityLabel(log.quality)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Registra tu sueño de anoche
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Health Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Bienestar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <Droplets className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                  <p className="text-sm font-medium">Agua</p>
                  <p className="text-xl font-bold">{todayHydration?.glasses || 0}</p>
                  <p className="text-xs text-muted-foreground">vasos hoy</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <Bed className="h-6 w-6 mx-auto text-purple-500 mb-2" />
                  <p className="text-sm font-medium">Sueño</p>
                  <p className="text-xl font-bold">{recentSleep.length}</p>
                  <p className="text-xs text-muted-foreground">registros semana</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction Dialog */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{transactionType === 'income' ? 'Nuevo Ingreso' : 'Nuevo Gasto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Monto *</Label>
              <Input
                type="number"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Categoría</Label>
              <Select value={transactionCategory} onValueChange={(v) => setTransactionCategory(v as TransactionCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_CATEGORIES[transactionType].map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descripción</Label>
              <Input
                value={transactionDescription}
                onChange={(e) => setTransactionDescription(e.target.value)}
                placeholder="Detalle del movimiento"
              />
            </div>
            <div>
              <Label>Fecha</Label>
              <Input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransactionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTransaction}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Savings Goal Dialog */}
      <Dialog open={isSavingsDialogOpen} onOpenChange={setIsSavingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Meta de Ahorro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={savingsName}
                onChange={(e) => setSavingsName(e.target.value)}
                placeholder="Ej: Vacaciones, Emergencias"
              />
            </div>
            <div>
              <Label>Monto objetivo *</Label>
              <Input
                type="number"
                value={savingsTarget}
                onChange={(e) => setSavingsTarget(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Monto actual</Label>
              <Input
                type="number"
                value={savingsCurrent}
                onChange={(e) => setSavingsCurrent(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Fecha límite (opcional)</Label>
              <Input
                type="date"
                value={savingsDeadline}
                onChange={(e) => setSavingsDeadline(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSavingsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSavingsGoal}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sleep Dialog */}
      <Dialog open={isSleepDialogOpen} onOpenChange={setIsSleepDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Sueño</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hora de dormir</Label>
                <Input
                  type="time"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                />
              </div>
              <div>
                <Label>Hora de despertar</Label>
                <Input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Calidad del sueño</Label>
              <div className="flex gap-2 mt-2">
                {SLEEP_QUALITY_LABELS.map((q) => (
                  <button
                    key={q.value}
                    type="button"
                    className={`flex-1 p-2 rounded-lg text-sm transition-colors ${
                      sleepQuality === q.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    onClick={() => setSleepQuality(q.value as 1 | 2 | 3 | 4 | 5)}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Notas (opcional)</Label>
              <Textarea
                value={sleepNotes}
                onChange={(e) => setSleepNotes(e.target.value)}
                placeholder="¿Cómo dormiste?"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSleepDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSleep}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
