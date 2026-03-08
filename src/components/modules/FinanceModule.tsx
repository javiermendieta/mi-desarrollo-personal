'use client';

import { useState, useMemo, useEffect } from 'react';
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
  Edit, ChevronDown, ChevronUp, List, Calendar, ArrowUpCircle, ArrowDownCircle,
  Loader2
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { AccountPlanItem, PNLSectionType, Transaction } from '@/types';
import { 
  saveAccountPlanToDB, deleteAccountPlanFromDB,
  savePNLToDB, saveTransactionToDB, deleteTransactionFromDB 
} from '@/lib/dbApi';
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

const SECTION_ORDER: PNLSectionType[] = ['gross_sales', 'cost_of_sales', 'cmv', 'operating_expenses'];

// Default accounts for new users
const DEFAULT_ACCOUNTS: Omit<AccountPlanItem, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Venta Bruta (Ingresos)
  { name: 'Ventas de Productos', section: 'gross_sales', type: 'income', isDefault: true },
  { name: 'Ventas de Servicios', section: 'gross_sales', type: 'income', isDefault: true },
  { name: 'Otros Ingresos', section: 'gross_sales', type: 'income', isDefault: true },
  // Costo de Ventas
  { name: 'Descuentos', section: 'cost_of_sales', type: 'expense', isDefault: true },
  { name: 'Devoluciones', section: 'cost_of_sales', type: 'expense', isDefault: true },
  // CMV
  { name: 'Materia Prima', section: 'cmv', type: 'expense', isDefault: true },
  { name: 'Mano de Obra Directa', section: 'cmv', type: 'expense', isDefault: true },
  { name: 'Costos de Producción', section: 'cmv', type: 'expense', isDefault: true },
  // Gastos Operativos
  { name: 'Alquiler', section: 'operating_expenses', type: 'expense', isDefault: true },
  { name: 'Sueldos y Salarios', section: 'operating_expenses', type: 'expense', isDefault: true },
  { name: 'Servicios (Luz, Agua, Gas)', section: 'operating_expenses', type: 'expense', isDefault: true },
  { name: 'Marketing y Publicidad', section: 'operating_expenses', type: 'expense', isDefault: true },
  { name: 'Servicios Profesionales', section: 'operating_expenses', type: 'expense', isDefault: true },
  { name: 'Impuestos', section: 'operating_expenses', type: 'expense', isDefault: true },
  { name: 'Otros Gastos', section: 'operating_expenses', type: 'expense', isDefault: true },
];

export function FinanceModule() {
  const { 
    accountPlan, addAccountPlanItem, updateAccountPlanItem, deleteAccountPlanItem,
    pnlData, addPNLData, updatePNLAccountPlan,
    transactions, addTransaction, updateTransaction, deleteTransaction,
    savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
    budgets, addBudget, updateBudget, deleteBudget,
  } = useAppStore();

  const currentMonth = format(new Date(), 'yyyy-MM');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [isSaving, setIsSaving] = useState(false);
  
  // Note: Account plan is loaded from /api/data in page.tsx and imported via useAppStore

  // Get or create P&L for selected month
  const currentPNL = useMemo(() => {
    return pnlData.find(p => p.period === selectedMonth);
  }, [pnlData, selectedMonth]);

  // Get transactions for selected month
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Calculate real values from transactions grouped by account
  const realValuesByAccount = useMemo(() => {
    const values: Record<string, number> = {};
    monthTransactions.forEach(t => {
      const account = accountPlan.find(a => a.id === t.accountId);
      if (account) {
        if (!values[t.accountId]) values[t.accountId] = 0;
        values[t.accountId] += t.amount;
      }
    });
    return values;
  }, [monthTransactions, accountPlan]);

  // Calculate section totals
  const sectionTotals = useMemo(() => {
    const totals: Record<PNLSectionType, { theoretical: number; real: number }> = {
      gross_sales: { theoretical: 0, real: 0 },
      cost_of_sales: { theoretical: 0, real: 0 },
      cmv: { theoretical: 0, real: 0 },
      operating_expenses: { theoretical: 0, real: 0 },
    };

    accountPlan.forEach(account => {
      const theoretical = currentPNL?.accountPlans.find(ap => ap.accountId === account.id)?.theoretical || 0;
      const real = realValuesByAccount[account.id] || 0;
      
      totals[account.section].theoretical += theoretical;
      totals[account.section].real += real;
    });

    return totals;
  }, [accountPlan, currentPNL, realValuesByAccount]);

  // Calculate derived values (Venta Neta, Margen, Profit)
  const calculatedValues = useMemo(() => {
    const grossSales = sectionTotals['gross_sales'];
    const costOfSales = sectionTotals['cost_of_sales'];
    const cmv = sectionTotals['cmv'];
    const operatingExpenses = sectionTotals['operating_expenses'];

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

  // Total gross sales for % calculations (both theoretical and real)
  const totalGrossSalesReal = sectionTotals['gross_sales'].real || 1;
  const totalGrossSalesTheoretical = sectionTotals['gross_sales'].theoretical || 1;

  // Dialog states
  const [accountDialog, setAccountDialog] = useState(false);
  const [transactionDialog, setTransactionDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountPlanItem | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Form states for account
  const [accountName, setAccountName] = useState('');
  const [accountCode, setAccountCode] = useState('');
  const [accountSection, setAccountSection] = useState<PNLSectionType>('gross_sales');
  const [accountType, setAccountType] = useState<'income' | 'expense'>('income');

  // Form states for transaction
  const [transactionAccountId, setTransactionAccountId] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [transactionNotes, setTransactionNotes] = useState('');

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState<Set<PNLSectionType>>(
    new Set(['gross_sales', 'cost_of_sales', 'cmv', 'operating_expenses'])
  );

  // Account functions
  const openAccountDialog = (account: AccountPlanItem | null = null) => {
    setEditingAccount(account);
    if (account) {
      setAccountName(account.name);
      setAccountCode(account.code || '');
      setAccountSection(account.section);
      setAccountType(account.type);
    } else {
      setAccountName('');
      setAccountCode('');
      setAccountSection('gross_sales');
      setAccountType('income');
    }
    setAccountDialog(true);
  };

  const saveAccount = async () => {
    if (!accountName.trim()) return;
    setIsSaving(true);
    const now = new Date().toISOString();
    
    if (editingAccount) {
      updateAccountPlanItem(editingAccount.id, {
        name: accountName.trim(),
        code: accountCode.trim() || undefined,
        section: accountSection,
        type: accountType,
      });
      // Sync to DB
      try {
        await saveAccountPlanToDB({
          id: editingAccount.id,
          name: accountName.trim(),
          code: accountCode.trim() || undefined,
          type: accountType,
          section: accountSection,
        });
      } catch (e) {
        console.error('Error saving account to DB:', e);
      }
    } else {
      const newId = uuidv4();
      addAccountPlanItem({
        id: newId,
        name: accountName.trim(),
        code: accountCode.trim() || undefined,
        section: accountSection,
        type: accountType,
        isDefault: false,
        createdAt: now,
        updatedAt: now,
      });
      // Sync to DB
      try {
        await saveAccountPlanToDB({
          id: newId,
          name: accountName.trim(),
          code: accountCode.trim() || undefined,
          type: accountType,
          section: accountSection,
        });
      } catch (e) {
        console.error('Error saving account to DB:', e);
      }
    }
    setIsSaving(false);
    setAccountDialog(false);
  };

  // Transaction functions
  const openTransactionDialog = (transaction: Transaction | null = null) => {
    setEditingTransaction(transaction);
    if (transaction) {
      setTransactionAccountId(transaction.accountId);
      setTransactionAmount(transaction.amount.toString());
      setTransactionDescription(transaction.description);
      setTransactionDate(transaction.date);
      setTransactionNotes(transaction.notes || '');
    } else {
      setTransactionAccountId('');
      setTransactionAmount('');
      setTransactionDescription('');
      setTransactionDate(format(new Date(), 'yyyy-MM-dd'));
      setTransactionNotes('');
    }
    setTransactionDialog(true);
  };

  const saveTransactionHandler = async () => {
    if (!transactionAccountId || !transactionAmount) return;
    const account = accountPlan.find(a => a.id === transactionAccountId);
    if (!account) return;
    
    setIsSaving(true);

    const transactionData: Omit<Transaction, 'id'> = {
      type: account.type,
      amount: parseFloat(transactionAmount),
      accountId: transactionAccountId,
      description: transactionDescription.trim() || account.name,
      date: transactionDate,
      notes: transactionNotes.trim() || undefined,
    };

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, transactionData);
      // Sync to DB
      try {
        await saveTransactionToDB({
          id: editingTransaction.id,
          ...transactionData,
        });
      } catch (e) {
        console.error('Error saving transaction to DB:', e);
      }
    } else {
      const newId = uuidv4();
      addTransaction({
        id: newId,
        ...transactionData,
      });
      // Sync to DB
      try {
        await saveTransactionToDB({
          id: newId,
          ...transactionData,
        });
      } catch (e) {
        console.error('Error saving transaction to DB:', e);
      }
    }
    setIsSaving(false);
    setTransactionDialog(false);
  };

  // Update theoretical value
  const updateTheoretical = async (accountId: string, value: number) => {
    if (!currentPNL) return;
    updatePNLAccountPlan(currentPNL.id, accountId, value);
    // Sync to DB - debounced
    const updatedAccountPlans = currentPNL.accountPlans.map(ap => 
      ap.accountId === accountId ? { accountId, theoretical: value } : ap
    );
    try {
      await savePNLToDB({
        id: currentPNL.id,
        period: currentPNL.period,
        accountPlans: updatedAccountPlans,
      });
    } catch (e) {
      console.error('Error saving P&L to DB:', e);
    }
  };

  // Delete account with DB sync
  const handleDeleteAccount = async (accountId: string) => {
    deleteAccountPlanItem(accountId);
    try {
      await deleteAccountPlanFromDB(accountId);
    } catch (e) {
      console.error('Error deleting account from DB:', e);
    }
  };

  // Delete transaction with DB sync
  const handleDeleteTransaction = async (transactionId: string) => {
    deleteTransaction(transactionId);
    try {
      await deleteTransactionFromDB(transactionId);
    } catch (e) {
      console.error('Error deleting transaction from DB:', e);
    }
  };

  // Initialize P&L with DB sync
  const initializePNL = async () => {
    setIsSaving(true);
    const newPNL = {
      id: uuidv4(),
      period: selectedMonth,
      accountPlans: accountPlan.map(a => ({ accountId: a.id, theoretical: 0 })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addPNLData(newPNL);
    // Sync to DB
    try {
      await savePNLToDB({
        id: newPNL.id,
        period: newPNL.period,
        accountPlans: newPNL.accountPlans,
      });
    } catch (e) {
      console.error('Error initializing P&L in DB:', e);
    }
    setIsSaving(false);
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

  const getPercentOfSalesReal = (value: number) => {
    return totalGrossSalesReal !== 0 ? (value / totalGrossSalesReal) * 100 : 0;
  };

  const getPercentOfSalesTheoretical = (value: number) => {
    return totalGrossSalesTheoretical !== 0 ? (value / totalGrossSalesTheoretical) * 100 : 0;
  };

  const toggleSection = (sectionId: PNLSectionType) => {
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

  // Get accounts by section
  const getAccountsBySection = (section: PNLSectionType) => {
    return accountPlan.filter(a => a.section === section);
  };

  // Render section
  const renderSection = (sectionType: PNLSectionType) => {
    const config = SECTION_CONFIG[sectionType];
    const total = sectionTotals[sectionType];
    const deviation = getDeviation(total.theoretical, total.real);
    const percentOfSalesReal = getPercentOfSalesReal(total.real);
    const percentOfSalesTheoretical = getPercentOfSalesTheoretical(total.theoretical);
    const isExpanded = expandedSections.has(sectionType);
    const accounts = getAccountsBySection(sectionType);

    return (
      <div key={sectionType} className={cn("rounded-lg border overflow-hidden", config.color)}>
        {/* Section Header */}
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-black/5"
          onClick={() => toggleSection(sectionType)}
        >
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="font-semibold">{config.label}</span>
            <Badge variant="outline">{accounts.length} cuentas</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right">
              <span className="text-muted-foreground">Teórico: </span>
              <span className={cn("font-medium", config.sign === 'positive' ? 'text-green-600' : 'text-red-600')}>
                {formatCurrency(total.theoretical)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">Real: </span>
              <span className={cn("font-medium", config.sign === 'positive' ? 'text-green-600' : 'text-red-600')}>
                {formatCurrency(total.real)}
              </span>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t">
            {/* Header Row */}
            <div className="grid grid-cols-14 gap-1 p-2 bg-black/5 text-xs font-medium text-muted-foreground">
              <div className="col-span-2">Cuenta</div>
              <div className="col-span-2 text-right">Teórico</div>
              <div className="col-span-1 text-right">% Teo</div>
              <div className="col-span-2 text-right">Real</div>
              <div className="col-span-1 text-right">% Real</div>
              <div className="col-span-2 text-right">Desvío $</div>
              <div className="col-span-1 text-right">Desvío %</div>
              <div className="col-span-2 text-right">% Venta</div>
              <div className="col-span-1"></div>
            </div>

            {/* Account Rows */}
            {accounts.map(account => {
              const theoretical = currentPNL?.accountPlans.find(ap => ap.accountId === account.id)?.theoretical || 0;
              const real = realValuesByAccount[account.id] || 0;
              const accountDeviation = getDeviation(theoretical, real);
              const accountPercentOfSalesReal = getPercentOfSalesReal(real);
              const accountPercentOfSalesTheoretical = getPercentOfSalesTheoretical(theoretical);

              return (
                <div key={account.id} className="grid grid-cols-14 gap-1 p-2 border-t items-center hover:bg-black/5">
                  <div className="col-span-2">
                    <div className="font-medium text-sm">{account.name}</div>
                    {account.code && <div className="text-xs text-muted-foreground">{account.code}</div>}
                  </div>
                  <div className="col-span-2 text-right">
                    {currentPNL ? (
                      <Input
                        type="number"
                        value={theoretical}
                        onChange={(e) => updateTheoretical(account.id, parseFloat(e.target.value) || 0)}
                        className="h-7 w-20 ml-auto text-right text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span>0</span>
                    )}
                  </div>
                  <div className="col-span-1 text-right text-xs text-muted-foreground">
                    {accountPercentOfSalesTheoretical.toFixed(1)}%
                  </div>
                  <div className="col-span-2 text-right font-medium text-sm">{formatCurrency(real)}</div>
                  <div className="col-span-1 text-right text-xs text-muted-foreground">
                    {accountPercentOfSalesReal.toFixed(1)}%
                  </div>
                  <div className={cn("col-span-2 text-right text-sm", accountDeviation.amount >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {formatCurrency(accountDeviation.amount)}
                  </div>
                  <div className={cn("col-span-1 text-right text-xs", accountDeviation.percent >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {formatPercent(accountDeviation.percent)}
                  </div>
                  <div className="col-span-2 text-right text-xs text-muted-foreground">
                    {accountPercentOfSalesReal.toFixed(1)}%
                  </div>
                  <div className="col-span-1 flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openAccountDialog(account)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    {!account.isDefault && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteAccount(account.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add Account Button */}
            <div className="p-2 border-t">
              <Button variant="outline" size="sm" onClick={() => openAccountDialog(null)}>
                <Plus className="h-4 w-4 mr-1" /> Agregar Cuenta
              </Button>
            </div>

            {/* Section Total */}
            <div className="grid grid-cols-14 gap-1 p-2 border-t bg-black/10 font-semibold">
              <div className="col-span-2">Total {config.label}</div>
              <div className="col-span-2 text-right">{formatCurrency(total.theoretical)}</div>
              <div className="col-span-1 text-right text-xs">{percentOfSalesTheoretical.toFixed(1)}%</div>
              <div className="col-span-2 text-right">{formatCurrency(total.real)}</div>
              <div className="col-span-1 text-right text-xs">{percentOfSalesReal.toFixed(1)}%</div>
              <div className={cn("col-span-2 text-right", deviation.amount >= 0 ? 'text-green-600' : 'text-red-600')}>
                {formatCurrency(deviation.amount)}
              </div>
              <div className={cn("col-span-1 text-right text-xs", deviation.percent >= 0 ? 'text-green-600' : 'text-red-600')}>
                {formatPercent(deviation.percent)}
              </div>
              <div className="col-span-2 text-right text-xs">{percentOfSalesReal.toFixed(1)}%</div>
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
    const percentOfSalesReal = getPercentOfSalesReal(values.real);
    const percentOfSalesTheoretical = getPercentOfSalesTheoretical(values.theoretical);

    return (
      <div key={id} className={cn("rounded-lg border p-3", color)}>
        <div className="grid grid-cols-14 gap-1 items-center">
          <div className="col-span-2 font-bold text-lg">{label}</div>
          <div className="col-span-2 text-right font-semibold">{formatCurrency(values.theoretical)}</div>
          <div className="col-span-1 text-right font-semibold text-sm">{percentOfSalesTheoretical.toFixed(1)}%</div>
          <div className="col-span-2 text-right font-semibold">{formatCurrency(values.real)}</div>
          <div className="col-span-1 text-right font-semibold text-sm">{percentOfSalesReal.toFixed(1)}%</div>
          <div className={cn("col-span-2 text-right font-semibold", deviation.amount >= 0 ? 'text-green-600' : 'text-red-600')}>
            {formatCurrency(deviation.amount)}
          </div>
          <div className={cn("col-span-1 text-right font-semibold text-sm", deviation.percent >= 0 ? 'text-green-600' : 'text-red-600')}>
            {formatPercent(deviation.percent)}
          </div>
          <div className="col-span-2 text-right font-semibold text-sm">{percentOfSalesReal.toFixed(1)}%</div>
          <div className="col-span-1"></div>
        </div>
      </div>
    );
  };

  // Generate month options (last 12 months + next 3)
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = -12; i <= 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy', { locale: es }),
      });
    }
    return options;
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Finanzas</h2>
          <p className="text-muted-foreground">Plan de Cuentas • P&L • Cashflow</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="pnl" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pnl">P&L</TabsTrigger>
          <TabsTrigger value="cashflow">Cashflow</TabsTrigger>
          <TabsTrigger value="accounts">Plan de Cuentas</TabsTrigger>
          <TabsTrigger value="savings">Ahorros</TabsTrigger>
        </TabsList>

        {/* P&L Tab */}
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
          {currentPNL ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Estado de Resultados - Teórico vs Real
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Column Headers */}
                <div className="grid grid-cols-14 gap-1 p-2 bg-muted rounded-lg text-sm font-medium">
                  <div className="col-span-2">Concepto</div>
                  <div className="col-span-2 text-right">Teórico</div>
                  <div className="col-span-1 text-right">% Teo</div>
                  <div className="col-span-2 text-right">Real</div>
                  <div className="col-span-1 text-right">% Real</div>
                  <div className="col-span-2 text-right">Desvío $</div>
                  <div className="col-span-1 text-right">Desvío %</div>
                  <div className="col-span-2 text-right">% Venta</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Venta Bruta */}
                {renderSection('gross_sales')}

                {/* Costo de Ventas */}
                {renderSection('cost_of_sales')}

                {/* Venta Neta */}
                {renderCalculatedSection('net_sales', 'Venta Neta', calculatedValues.netSales, 'bg-blue-50 dark:bg-blue-950/30')}

                {/* CMV */}
                {renderSection('cmv')}

                {/* Margen de Contribución */}
                {renderCalculatedSection('contribution_margin', 'Margen de Contribución', calculatedValues.contributionMargin, 'bg-purple-50 dark:bg-purple-950/30')}

                {/* Gastos Operativos */}
                {renderSection('operating_expenses')}

                {/* Profit */}
                {renderCalculatedSection('profit', 'PROFIT', calculatedValues.profit, 'bg-emerald-50 dark:bg-emerald-950/30')}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Wallet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay P&L para {format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: es })}</h3>
                <p className="text-muted-foreground mb-4">Inicializa el P&L para comenzar a planificar tu estado de resultados</p>
                <Button onClick={initializePNL} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Inicializar P&L
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Cashflow Tab */}
        <TabsContent value="cashflow" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Transacciones del Mes</CardTitle>
                <Button onClick={() => openTransactionDialog(null)} disabled={isSaving || accountPlan.length === 0}>
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Nueva Transacción
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {accountPlan.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Primero debes tener cuentas en el Plan de Cuentas</p>
                  <p className="text-sm">Las cuentas se están inicializando automáticamente...</p>
                </div>
              ) : monthTransactions.length > 0 ? (
                <div className="space-y-2">
                  {monthTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => {
                    const account = accountPlan.find(a => a.id === t.accountId);
                    return (
                      <div key={t.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/50 hover:bg-muted">
                        <div className="flex items-center gap-3">
                          {account?.type === 'income' ? (
                            <ArrowUpCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <ArrowDownCircle className="h-5 w-5 text-red-500" />
                          )}
                          <div>
                            <p className="font-medium">{t.description}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{format(new Date(t.date), 'd MMM yyyy')}</span>
                              {account && (
                                <>
                                  <span>•</span>
                                  <Badge variant="outline" className="text-xs">{account.name}</Badge>
                                </>
                              )}
                            </div>
                            {t.notes && <p className="text-xs text-muted-foreground mt-1">{t.notes}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn("font-semibold", account?.type === 'income' ? 'text-green-600' : 'text-red-600')}>
                            {account?.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                          </span>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openTransactionDialog(t)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteTransaction(t.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay transacciones para este mes</p>
                  <p className="text-sm">Las transacciones que cargues aquí alimentarán automáticamente el P&L Real</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plan de Cuentas Tab */}
        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Plan de Cuentas
                </CardTitle>
                <Button onClick={() => openAccountDialog(null)} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Nueva Cuenta
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {SECTION_ORDER.map(section => {
                  const config = SECTION_CONFIG[section];
                  const accounts = getAccountsBySection(section);
                  
                  return (
                    <div key={section} className="border rounded-lg overflow-hidden">
                      <div className={cn("p-3 font-semibold", config.color)}>
                        {config.label}
                      </div>
                      <div className="divide-y">
                        {accounts.map(account => (
                          <div key={account.id} className="flex justify-between items-center p-3 hover:bg-muted/50">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{account.name}</span>
                                {account.code && <Badge variant="outline" className="text-xs">{account.code}</Badge>}
                                {account.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {account.type === 'income' ? 'Ingreso' : 'Gasto'}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openAccountDialog(account)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              {!account.isDefault && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteAccount(account.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Savings Tab */}
        <TabsContent value="savings" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5" />
                  Metas de Ahorro
                </CardTitle>
              </div>
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
                            Meta: {formatCurrency(goal.targetAmount)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{formatCurrency(goal.currentAmount)}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteSavingsGoal(goal.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all" 
                          style={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <PiggyBank className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay metas de ahorro configuradas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Account Dialog */}
      <Dialog open={accountDialog} onOpenChange={setAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="accountName">Nombre</Label>
              <Input
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Ej: Ventas de Productos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountCode">Código (opcional)</Label>
              <Input
                id="accountCode"
                value={accountCode}
                onChange={(e) => setAccountCode(e.target.value)}
                placeholder="Ej: 4.1.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Sección</Label>
              <Select value={accountSection} onValueChange={(v) => setAccountSection(v as PNLSectionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_ORDER.map(section => (
                    <SelectItem key={section} value={section}>
                      {SECTION_CONFIG[section].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={accountType} onValueChange={(v) => setAccountType(v as 'income' | 'expense')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Ingreso</SelectItem>
                  <SelectItem value="expense">Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountDialog(false)}>Cancelar</Button>
            <Button onClick={saveAccount} disabled={isSaving || !accountName.trim()}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={transactionDialog} onOpenChange={setTransactionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTransaction ? 'Editar Transacción' : 'Nueva Transacción'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cuenta</Label>
              <Select value={transactionAccountId} onValueChange={setTransactionAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {accountPlan.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.type === 'income' ? 'Ingreso' : 'Gasto'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={transactionDescription}
                onChange={(e) => setTransactionDescription(e.target.value)}
                placeholder="Descripción de la transacción"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Input
                id="notes"
                value={transactionNotes}
                onChange={(e) => setTransactionNotes(e.target.value)}
                placeholder="Notas adicionales"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransactionDialog(false)}>Cancelar</Button>
            <Button onClick={saveTransactionHandler} disabled={isSaving || !transactionAccountId || !transactionAmount}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
