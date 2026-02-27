'use client';

import { useState, useEffect } from 'react';
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
import { Wallet, Plus, Trash2, TrendingUp, TrendingDown, PiggyBank, Loader2 } from 'lucide-react';
import type { Transaction, SavingsGoal } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

const TRANSACTION_CATEGORIES = [
  { value: 'salary', label: 'Salario' },
  { value: 'food', label: 'Comida' },
  { value: 'transport', label: 'Transporte' },
  { value: 'entertainment', label: 'Entretenimiento' },
  { value: 'shopping', label: 'Compras' },
  { value: 'bills', label: 'Facturas' },
  { value: 'health', label: 'Salud' },
  { value: 'other', label: 'Otros' },
];

export function FinanceModule() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [transactionDialog, setTransactionDialog] = useState(false);
  const [savingsDialog, setSavingsDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [transType, setTransType] = useState<'income' | 'expense'>('expense');
  const [transAmount, setTransAmount] = useState('');
  const [transCategory, setTransCategory] = useState('other');
  const [transDescription, setTransDescription] = useState('');

  const [savingsName, setSavingsName] = useState('');
  const [savingsTarget, setSavingsTarget] = useState('');
  const [savingsCurrent, setSavingsCurrent] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [transRes, savingsRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/savings'),
      ]);
      
      const transData = await transRes.json();
      const savingsData = await savingsRes.json();

      if (transData.transactions) setTransactions(transData.transactions);
      if (savingsData.items) setSavingsGoals(savingsData.items);
    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthTransactions = transactions.filter((t) => format(new Date(t.date), 'yyyy-MM') === currentMonth);
  const totalIncome = monthTransactions.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const totalExpenses = monthTransactions.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  const handleSaveTransaction = async () => {
    if (!transAmount) return;
    setIsSaving(true);
    try {
      const transaction = {
        id: uuidv4(),
        type: transType,
        amount: parseFloat(transAmount),
        category: transCategory,
        description: transDescription || undefined,
        date: new Date().toISOString(),
      };
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });
      setTransactions([...transactions, transaction]);
      setTransactionDialog(false);
      setTransType('expense');
      setTransAmount('');
      setTransCategory('other');
      setTransDescription('');
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSavings = async () => {
    if (!savingsName || !savingsTarget) return;
    setIsSaving(true);
    try {
      const goal = {
        id: uuidv4(),
        name: savingsName,
        targetAmount: parseFloat(savingsTarget),
        currentAmount: parseFloat(savingsCurrent) || 0,
      };
      await fetch('/api/savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal),
      });
      setSavingsGoals([...savingsGoals, goal]);
      setSavingsDialog(false);
      setSavingsName('');
      setSavingsTarget('');
      setSavingsCurrent('');
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await fetch('/api/transactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const getCategoryLabel = (cat: string) => TRANSACTION_CATEGORIES.find((c) => c.value === cat)?.label || cat;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
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
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><PiggyBank className="h-5 w-5 text-purple-500" />Metas de Ahorro</CardTitle>
            <Button size="sm" onClick={() => setSavingsDialog(true)}><Plus className="h-4 w-4 mr-1" /> Nueva</Button>
          </div>
        </CardHeader>
        <CardContent>
          {savingsGoals.length > 0 ? (
            <div className="space-y-3">
              {savingsGoals.map((goal) => (
                <div key={goal.id} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{goal.name}</span>
                    <span className="text-sm text-muted-foreground">${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}</span>
                  </div>
                  <Progress value={(goal.currentAmount / goal.targetAmount) * 100} className="h-2" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No hay metas de ahorro</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Transacciones Recientes</CardTitle>
            <Button size="sm" onClick={() => setTransactionDialog(true)}><Plus className="h-4 w-4 mr-1" /> Nueva</Button>
          </div>
        </CardHeader>
        <CardContent>
          {monthTransactions.length > 0 ? (
            <div className="space-y-2">
              {monthTransactions.slice(0, 10).map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {t.type === 'income' ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
                    </div>
                    <div>
                      <p className="font-medium">{t.description || getCategoryLabel(t.category)}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(t.date), 'd MMM yyyy')}</p>
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
                          <AlertDialogAction onClick={() => handleDeleteTransaction(t.id)}>Eliminar</AlertDialogAction>
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
              <Select value={transCategory} onValueChange={setTransCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TRANSACTION_CATEGORIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div><Label>Descripción</Label><Input value={transDescription} onChange={(e) => setTransDescription(e.target.value)} placeholder="Opcional" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setTransactionDialog(false)}>Cancelar</Button><Button onClick={handleSaveTransaction} disabled={!transAmount || isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={savingsDialog} onOpenChange={setSavingsDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Meta de Ahorro</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre</Label><Input value={savingsName} onChange={(e) => setSavingsName(e.target.value)} placeholder="Ej: Vacaciones" /></div>
            <div><Label>Monto objetivo</Label><Input type="number" value={savingsTarget} onChange={(e) => setSavingsTarget(e.target.value)} placeholder="0.00" /></div>
            <div><Label>Monto actual (opcional)</Label><Input type="number" value={savingsCurrent} onChange={(e) => setSavingsCurrent(e.target.value)} placeholder="0.00" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSavingsDialog(false)}>Cancelar</Button><Button onClick={handleSaveSavings} disabled={!savingsName || !savingsTarget || isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
