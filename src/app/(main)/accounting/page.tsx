
// src/app/(main)/accounting/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AccountingSettings, DEFAULT_ACCOUNTING_SETTINGS, Sale, AppSettings, DEFAULT_APP_SETTINGS, CashPaymentDetails, DenominationCount, DailyClosureReport, BusinessSettings, DEFAULT_BUSINESS_SETTINGS, AuthState, DEFAULT_AUTH_STATE, InvoicePaymentRecord, Product, MonthlyClosureReport } from '@/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, startOfDay, isValid, getYear, getMonth, set } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, AlertTriangle, Info, CheckCircle2, Clock, DollarSign, Package, TrendingUp, Coins, Landmark, ClipboardList, Printer, Lock, FileText, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import DailyClosureReportPrintLayout from '@/components/accounting/DailyClosureReportPrintLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MonthlyClosureReportPrintLayout from '@/components/accounting/MonthlyClosureReportPrintLayout';


const ACCOUNTING_STORAGE_KEY = 'accountingSettings';
const denominations = [1000, 500, 200, 100, 50, 20, 10, 5, 2] as const;

export default function AccountingPage() {
  const [accountingSettings, setAccountingSettings] = useLocalStorageState<AccountingSettings>(
    ACCOUNTING_STORAGE_KEY,
    DEFAULT_ACCOUNTING_SETTINGS
  );
  const [appSettings] = useLocalStorageState<AppSettings>('appSettings', DEFAULT_APP_SETTINGS);
  const [businessSettings] = useLocalStorageState<BusinessSettings>('businessSettings', DEFAULT_BUSINESS_SETTINGS);
  const [sales] = useLocalStorageState<Sale[]>('sales', []);
  const [products] = useLocalStorageState<Product[]>('products', []);
  const [invoicePayments] = useLocalStorageState<InvoicePaymentRecord[]>('invoicePayments', []);
  const [authState] = useLocalStorageState<AuthState>('authData', DEFAULT_AUTH_STATE);

  const [selectedDateForNewDay, setSelectedDateForNewDay] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [countedCashBreakdownInputs, setCountedCashBreakdownInputs] = useState<Record<string, string>>({});
  const [closureNotes, setClosureNotes] = useState<string>("");
  const [isPrintingClosureReport, setIsPrintingClosureReport] = useState(false);
  const [isClientMounted, setIsClientMounted] = useState(false);

  const [closureToPrint, setClosureToPrint] = useState<DailyClosureReport | null>(null);
  const [monthlyReportToPrint, setMonthlyReportToPrint] = useState<MonthlyClosureReport | null>(null);

  const today = new Date();
  const [reportYear, setReportYear] = useState<number>(getYear(today));
  const [reportMonth, setReportMonth] = useState<number>(getMonth(today) + 1);


  const { toast } = useToast();
  const isAdmin = authState.currentUser?.role === 'admin';

  useEffect(() => {
    setIsClientMounted(true);
    // One-time migration for users with the old data structure
    const migrateData = () => {
        const oldData = accountingSettings as any;
        if (oldData.lastClosureDetails && !oldData.dailyClosureHistory) {
            console.log("Migrating accounting data structure...");
            const oldClosure = oldData.lastClosureDetails;
            const migratedClosure: DailyClosureReport = {
                ...oldClosure,
                totalCogs: 0,
                grossProfit: oldClosure.totalRevenue || 0,
            };
            setAccountingSettings(prev => {
                const newSettings = { ...(prev as any) };
                delete newSettings.lastClosureDetails;
                newSettings.dailyClosureHistory = [migratedClosure];
                newSettings.monthlyClosureHistory = newSettings.monthlyClosureHistory || [];
                return newSettings as AccountingSettings;
            });
            toast({ title: "Datos de contabilidad actualizados", description: "Se ha actualizado la estructura de datos interna." });
        } else if (!oldData.dailyClosureHistory || !oldData.monthlyClosureHistory) {
            setAccountingSettings(prev => ({
                ...prev,
                dailyClosureHistory: prev.dailyClosureHistory || [],
                monthlyClosureHistory: prev.monthlyClosureHistory || [],
            }));
        }
    };
    migrateData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { currentOperationalDate, isDayOpen, lastClosureDate } = accountingSettings;

  const operationalDateDisplay = useMemo(() => {
    if (currentOperationalDate && isValid(parseISO(currentOperationalDate))) {
      return format(parseISO(currentOperationalDate), "PPP", { locale: es });
    }
    return "No definido";
  }, [currentOperationalDate]);

  const lastClosureDateDisplay = useMemo(() => {
    if (lastClosureDate && isValid(parseISO(lastClosureDate))) {
      return format(parseISO(lastClosureDate), "PPP", { locale: es });
    }
    return "Ninguno";
  }, [lastClosureDate]);


  const handleStartNewDay = () => {
    if (!isAdmin) {
      toast({ title: "Acceso Denegado", description: "No tienes permiso para iniciar un nuevo día.", variant: "destructive" });
      return;
    }
    if (!selectedDateForNewDay) {
      toast({ title: "Error", description: "Por favor, seleccione una fecha para el nuevo día operativo.", variant: "destructive" });
      return;
    }
    const newOperationalDate = startOfDay(selectedDateForNewDay).toISOString();

    if (lastClosureDate && newOperationalDate <= lastClosureDate) {
      toast({
        title: "Fecha Inválida",
        description: `La nueva fecha operativa debe ser posterior al último cierre (${lastClosureDateDisplay}).`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setAccountingSettings(prev => ({
      ...prev,
      currentOperationalDate: newOperationalDate,
      isDayOpen: true,
    }));
    toast({
      title: "Nuevo Día Iniciado",
      description: `Día operativo iniciado para ${format(selectedDateForNewDay, "PPP", { locale: es })}.`,
    });
    setIsLoading(false);
  };
  
  const getDenominationCountsFromInputs = (inputs: Record<string, string>): DenominationCount[] => {
    return Object.entries(inputs)
      .map(([denStr, countStr]) => {
        const denomination = parseFloat(denStr);
        const count = parseInt(countStr);
        if (!isNaN(denomination) && !isNaN(count) && count >= 0) { 
          return {
            denomination,
            count,
            totalValue: denomination * count,
          };
        }
        return null;
      })
      .filter(Boolean) as DenominationCount[];
  };


  const handlePerformClosure = () => {
    if (!isAdmin) {
      toast({ title: "Acceso Denegado", description: "No tienes permiso para realizar el cierre.", variant: "destructive" });
      return;
    }
    if (!currentOperationalDate || !dailySummary) {
        toast({ title: "Error", description: "No hay un día operativo activo o resumen diario para cerrar.", variant: "destructive" });
        return;
    }
    if (Object.keys(countedCashBreakdownInputs).length === 0 && totalCountedCash === 0) {
        toast({ title: "Arqueo Requerido", description: "Por favor, realice el arqueo de caja antes de cerrar el día.", variant: "warning" });
        return;
    }

    setIsLoading(true);
    
    const newDailyClosure: DailyClosureReport = {
        closureDate: currentOperationalDate,
        expectedCashInBox: dailySummary.expectedCashInBox,
        countedCashBreakdown: getDenominationCountsFromInputs(countedCashBreakdownInputs),
        totalCountedCash: totalCountedCash,
        cashDifference: cashDifference,
        closureNotes: closureNotes,
        totalRevenue: dailySummary.totalRevenue,
        totalCogs: dailySummary.totalCogs,
        grossProfit: dailySummary.grossProfit,
        totalTransactions: dailySummary.totalTransactions,
        cashSalesAmount: dailySummary.cashSalesAmount,
        transferSalesAmount: dailySummary.transferSalesAmount,
        totalTips: dailySummary.totalTips,
        invoicePaymentsInCash: dailySummary.invoicePaymentsInCash,
        invoicePaymentsInTransfer: dailySummary.invoicePaymentsInTransfer,
    };

    setTimeout(() => {
      setAccountingSettings(prev => ({
        ...prev,
        lastClosureDate: currentOperationalDate,
        currentOperationalDate: null,
        isDayOpen: false,
        dailyClosureHistory: [...(prev.dailyClosureHistory || []), newDailyClosure],
      }));
      toast({
        title: "Cierre Diario Realizado",
        description: `El día ${operationalDateDisplay} ha sido cerrado. Inicie un nuevo día operativo.`,
      });
      setSelectedDateForNewDay(new Date());
      setCountedCashBreakdownInputs({});
      setClosureNotes("");
      setIsLoading(false);
    }, 1000);
  };

  const dailySummary = useMemo(() => {
    if (!currentOperationalDate) return null;

    const operationalDayStartISO = startOfDay(parseISO(currentOperationalDate)).toISOString();

    const salesForOperationalDate = sales.filter(sale => {
        const saleDateToCompare = sale.operationalDate ? startOfDay(parseISO(sale.operationalDate)).toISOString() : startOfDay(parseISO(sale.timestamp)).toISOString();
        return saleDateToCompare === operationalDayStartISO;
    });

    const invoicePaymentsForOperationalDate = invoicePayments.filter(p => {
        const paymentOpDate = p.operationalDate ? startOfDay(parseISO(p.operationalDate)).toISOString() : startOfDay(parseISO(p.paymentTimestamp)).toISOString();
        return paymentOpDate === operationalDayStartISO;
    });

    const totalRevenue = salesForOperationalDate.reduce((sum, sale) => sum + sale.totalAmount, 0);
    
    const totalCogs = salesForOperationalDate.reduce((totalCogs, sale) => {
        const saleCogs = sale.items.reduce((currentSaleCogs, item) => {
            const product = products.find(p => p.id === item.productId);
            const costPrice = product?.costPrice ?? 0;
            return currentSaleCogs + (costPrice * item.quantity);
        }, 0);
        return totalCogs + saleCogs;
    }, 0);
    const grossProfit = totalRevenue - totalCogs;

    const totalTransactions = salesForOperationalDate.length;
    const cashSalesDetails = salesForOperationalDate.filter(s => s.paymentMethod === 'cash').map(s => s.paymentDetails as CashPaymentDetails);
    const cashSalesAmount = salesForOperationalDate.filter(s => s.paymentMethod === 'cash').reduce((sum, sale) => sum + sale.totalAmount, 0);
    const transferSalesAmount = salesForOperationalDate.filter(s => s.paymentMethod === 'transfer').reduce((sum, s) => sum + s.totalAmount, 0);
    const totalTips = cashSalesDetails.reduce((sum, details) => sum + (details.tip || 0), 0);
    const invoicePaymentsInCash = invoicePaymentsForOperationalDate.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amountPaid, 0);
    const invoicePaymentsInTransfer = invoicePaymentsForOperationalDate.filter(p => p.method === 'transfer').reduce((sum, p) => sum + p.amountPaid, 0);
    const expectedCashInBox = cashSalesAmount + totalTips + invoicePaymentsInCash;

    return {
        totalRevenue, totalCogs, grossProfit, totalTransactions, cashSalesAmount,
        transferSalesAmount, totalTips, invoicePaymentsInCash, invoicePaymentsInTransfer, expectedCashInBox,
    };
  }, [currentOperationalDate, sales, invoicePayments, products]);

  const handleCountedCashBreakdownChange = (denominationKey: string, countStr: string) => {
    const newBreakdownInputs = { ...countedCashBreakdownInputs, [denominationKey]: countStr };
    setCountedCashBreakdownInputs(newBreakdownInputs);
  };

  const totalCountedCash = useMemo(() => {
    return Object.values(countedCashBreakdownInputs).reduce((total, countStr) => {
      const denKey = Object.keys(countedCashBreakdownInputs).find(k => countedCashBreakdownInputs[k] === countStr);
      if (!denKey) return total;
      const count = parseFloat(countStr);
      const denominationValue = parseFloat(denKey);
      if (!isNaN(count) && count > 0 && !isNaN(denominationValue)) {
        return total + (denominationValue * count);
      }
      return total;
    }, 0);
  }, [countedCashBreakdownInputs]);

  const cashDifference = useMemo(() => {
    if (dailySummary?.expectedCashInBox === undefined) return 0; 
    return totalCountedCash - dailySummary.expectedCashInBox;
  }, [totalCountedCash, dailySummary]);

  const handlePrintDailyReport = () => {
    if (!dailySummary || !isDayOpen) {
      toast({ title: "No se puede imprimir", description: "No hay un día operativo activo o resumen para generar el reporte.", variant: "warning" });
      return;
    }
    if (Object.keys(countedCashBreakdownInputs).length === 0 && totalCountedCash === 0) {
      toast({ title: "Arqueo Incompleto", description: "Por favor, complete el arqueo de caja antes de imprimir el reporte.", variant: "warning" });
      return;
    }
    const reportData: DailyClosureReport = {
        closureDate: currentOperationalDate!, totalCogs: dailySummary.totalCogs, grossProfit: dailySummary.grossProfit,
        expectedCashInBox: dailySummary.expectedCashInBox, totalCountedCash, cashDifference, closureNotes,
        countedCashBreakdown: getDenominationCountsFromInputs(countedCashBreakdownInputs), ...dailySummary,
    };
    setClosureToPrint(reportData);
    setIsPrintingClosureReport(true);
  };
  
  useEffect(() => {
    if (isPrintingClosureReport && (closureToPrint || monthlyReportToPrint)) {
      const timer = setTimeout(() => { window.print(); }, 300);
      const handleAfterPrint = () => {
        setIsPrintingClosureReport(false);
        setClosureToPrint(null);
        setMonthlyReportToPrint(null);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
      window.addEventListener('afterprint', handleAfterPrint);
      return () => { clearTimeout(timer); window.removeEventListener('afterprint', handleAfterPrint); };
    }
  }, [isPrintingClosureReport, closureToPrint, monthlyReportToPrint]);

  const isClosureButtonDisabled = isLoading || (Object.keys(countedCashBreakdownInputs).length === 0 && totalCountedCash === 0);

  const reportYears = useMemo(() => {
    const years = new Set((accountingSettings.dailyClosureHistory || []).map(h => getYear(parseISO(h.closureDate))));
    years.add(getYear(new Date()));
    return Array.from(years).sort((a, b) => b - a);
  }, [accountingSettings.dailyClosureHistory]);

  const handleGenerateMonthlyClosure = () => {
    if (!isAdmin) {
      toast({ title: "Acceso Denegado", description: "No tienes permiso para generar cierres mensuales.", variant: "destructive" });
      return;
    }
    const dailyClosuresForMonth = (accountingSettings.dailyClosureHistory || []).filter(h => {
        const closureDate = parseISO(h.closureDate);
        return getYear(closureDate) === reportYear && (getMonth(closureDate) + 1) === reportMonth;
    });

    if (dailyClosuresForMonth.length === 0) {
        toast({ title: "Sin Datos", description: "No hay cierres diarios registrados para el mes y año seleccionados.", variant: "warning" });
        return;
    }

    const newMonthlyReport: MonthlyClosureReport = {
        year: reportYear,
        month: reportMonth,
        generationDate: new Date().toISOString(),
        totalRevenue: dailyClosuresForMonth.reduce((sum, h) => sum + h.totalRevenue, 0),
        totalCogs: dailyClosuresForMonth.reduce((sum, h) => sum + h.totalCogs, 0),
        grossProfit: dailyClosuresForMonth.reduce((sum, h) => sum + h.grossProfit, 0),
        totalTransactions: dailyClosuresForMonth.reduce((sum, h) => sum + h.totalTransactions, 0),
        totalTips: dailyClosuresForMonth.reduce((sum, h) => sum + h.totalTips, 0),
    };

    setAccountingSettings(prev => {
        const otherMonths = (prev.monthlyClosureHistory || []).filter(r => !(r.year === reportYear && r.month === reportMonth));
        return {
            ...prev,
            monthlyClosureHistory: [...otherMonths, newMonthlyReport].sort((a, b) => new Date(b.generationDate).getTime() - new Date(a.generationDate).getTime()),
        };
    });

    toast({ title: "Reporte Mensual Generado", description: `Se ha generado el reporte para ${reportMonth}/${reportYear}.` });
  };
  
  const handlePrintMonthlyReport = (report: MonthlyClosureReport) => {
    setMonthlyReportToPrint(report);
    setIsPrintingClosureReport(true);
  };

  const renderDailyClosureDetails = (closure: DailyClosureReport) => (
    <div className="text-xs space-y-2 p-2 bg-muted/20 rounded-b-md">
        <h4 className="font-semibold text-sm">Resumen Financiero</h4>
        <div className="grid grid-cols-2 gap-x-4">
            <span>Ingresos Totales (Ventas):</span> <span className="font-mono text-right">{appSettings.currencySymbol}{closure.totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
            <span>Costo de Bienes Vendidos (COGS):</span> <span className="font-mono text-right">{appSettings.currencySymbol}{closure.totalCogs.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
            <span className="font-bold">Ganancia Bruta:</span> <span className="font-mono font-bold text-right">{appSettings.currencySymbol}{closure.grossProfit.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
        </div>
        <h4 className="font-semibold text-sm pt-2 border-t">Detalle de Caja</h4>
        <div className="grid grid-cols-2 gap-x-4">
            <span>Efectivo Esperado:</span> <span className="font-mono text-right">{appSettings.currencySymbol}{closure.expectedCashInBox.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
            <span>Efectivo Contado:</span> <span className="font-mono text-right">{appSettings.currencySymbol}{closure.totalCountedCash.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
            <span className={cn(closure.cashDifference !== 0 && "font-bold", closure.cashDifference < 0 ? "text-destructive" : "text-green-500")}>Diferencia:</span> 
            <span className={cn("font-mono text-right", closure.cashDifference !== 0 && "font-bold", closure.cashDifference < 0 ? "text-destructive" : "text-green-500")}>
                {appSettings.currencySymbol}{closure.cashDifference.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </span>
        </div>
        {closure.closureNotes && <div className="pt-2 border-t"><p className="font-semibold">Notas:</p><p className="whitespace-pre-wrap">{closure.closureNotes}</p></div>}
    </div>
  );

  const renderMonthlyClosureDetails = (closure: MonthlyClosureReport) => (
     <div className="text-xs space-y-2 p-2 bg-muted/20 rounded-b-md">
        <h4 className="font-semibold text-sm">Estado de Resultados Mensual</h4>
        <div className="grid grid-cols-2 gap-x-4">
            <span>Ingresos Totales (Ventas):</span> <span className="font-mono text-right">{appSettings.currencySymbol}{closure.totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
            <span>Costo de Bienes Vendidos (COGS):</span> <span className="font-mono text-right">{appSettings.currencySymbol}{closure.totalCogs.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
            <span className="font-bold text-base">Ganancia Bruta:</span> <span className="font-mono font-bold text-right text-base">{appSettings.currencySymbol}{closure.grossProfit.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
        </div>
        <h4 className="font-semibold text-sm pt-2 border-t">Otras Métricas</h4>
        <div className="grid grid-cols-2 gap-x-4">
            <span>Total Transacciones:</span> <span className="font-mono text-right">{closure.totalTransactions}</span>
            <span>Total Propinas:</span> <span className="font-mono text-right">{appSettings.currencySymbol}{closure.totalTips.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
        </div>
         <div className="pt-2 flex justify-end">
             <Button size="sm" variant="outline" onClick={() => handlePrintMonthlyReport(closure)}>
                 <Printer className="mr-2 h-4 w-4"/> Imprimir Reporte Mensual
             </Button>
         </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Contabilidad y Cierres" description="Gestiona los cierres diarios, mensuales y visualiza el historial operativo." />
      {!isAdmin && (<Alert variant="warning"><Lock className="h-5 w-5" /><AlertTitle>Acceso Restringido</AlertTitle><AlertDescription>Solo los administradores pueden gestionar la contabilidad.</AlertDescription></Alert>)}

      <Tabs defaultValue="daily-closure" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily-closure">Cierre Diario</TabsTrigger>
          <TabsTrigger value="daily-history">Historial Diario</TabsTrigger>
          <TabsTrigger value="monthly-closure">Cierre Mensual</TabsTrigger>
        </TabsList>
        <TabsContent value="daily-closure" className="mt-4 space-y-6">
            <Card>
                <CardHeader><CardTitle className="font-headline">Estado Operativo Actual</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                <p><strong>Último Cierre Realizado:</strong> <span className="text-primary font-medium">{lastClosureDateDisplay}</span></p>
                <p><strong>Día Operativo Actual:</strong> <span className="text-primary font-medium">{operationalDateDisplay}</span></p>
                <p><strong>Estado del Día:</strong>
                    {isDayOpen && currentOperationalDate ? (
                    <span className="text-green-500 font-medium ml-1 py-0.5 px-2 rounded-full bg-green-500/10 border border-green-500/30"><CheckCircle2 className="inline h-4 w-4 mr-1" />Abierto</span>
                    ) : (
                    <span className="text-orange-500 font-medium ml-1 py-0.5 px-2 rounded-full bg-orange-500/10 border border-orange-500/30"><Clock className="inline h-4 w-4 mr-1" />Cerrado / No Iniciado</span>
                    )}
                </p>
                </CardContent>
            </Card>

            {!isDayOpen && (
                <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Iniciar Nuevo Día Operativo</CardTitle>
                    <CardDescription>Selecciona la fecha para el nuevo día operativo. El último día cerrado fue el {lastClosureDateDisplay}.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                    <Label htmlFor="newOperationalDate">Fecha del Nuevo Día Operativo</Label>
                    <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !selectedDateForNewDay && "text-muted-foreground")} disabled={!isAdmin}><CalendarIcon className="mr-2 h-4 w-4" />{selectedDateForNewDay ? format(selectedDateForNewDay, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={selectedDateForNewDay} onSelect={setSelectedDateForNewDay} initialFocus locale={es} disabled={(date) => !isAdmin || (lastClosureDate ? date <= parseISO(lastClosureDate) : false) || date > new Date()} /></PopoverContent></Popover>
                    </div>
                    <Button onClick={handleStartNewDay} disabled={isLoading || !selectedDateForNewDay || !isAdmin} className="w-full" size="lg">{isLoading ? "Iniciando..." : "Iniciar Nuevo Día"}</Button>
                </CardContent>
                </Card>
            )}

            {isDayOpen && currentOperationalDate && dailySummary && (
                <>
                <Card>
                    <CardHeader><CardTitle className="font-headline">Resumen del Día Operativo: {operationalDateDisplay}</CardTitle><CardDescription>Operaciones registradas para el día actual.</CardDescription></CardHeader>
                    <CardContent><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted/30 rounded-lg shadow"><h3 className="text-sm font-medium text-muted-foreground flex items-center"><DollarSign className="h-4 w-4 mr-2" />Ingresos Totales (Ventas)</h3><p className="text-2xl font-bold">{appSettings.currencySymbol}{dailySummary.totalRevenue.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}</p></div>
                        <div className="p-4 bg-muted/30 rounded-lg shadow"><h3 className="text-sm font-medium text-muted-foreground flex items-center"><TrendingUp className="h-4 w-4 mr-2" />Ganancia Bruta</h3><p className="text-2xl font-bold">{appSettings.currencySymbol}{dailySummary.grossProfit.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}</p></div>
                        <div className="p-4 bg-muted/30 rounded-lg shadow"><h3 className="text-sm font-medium text-muted-foreground flex items-center"><Package className="h-4 w-4 mr-2" />Total Transacciones</h3><p className="text-2xl font-bold">{dailySummary.totalTransactions}</p></div>
                        <div className="p-4 bg-muted/30 rounded-lg shadow"><h3 className="text-sm font-medium text-muted-foreground flex items-center"><Coins className="h-4 w-4 mr-2" />Ventas en Efectivo</h3><p className="text-2xl font-bold">{appSettings.currencySymbol}{dailySummary.cashSalesAmount.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}</p></div>
                        <div className="p-4 bg-muted/30 rounded-lg shadow"><h3 className="text-sm font-medium text-muted-foreground flex items-center"><Landmark className="h-4 w-4 mr-2" />Ventas por Transferencia</h3><p className="text-2xl font-bold">{appSettings.currencySymbol}{dailySummary.transferSalesAmount.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}</p></div>
                        <div className="p-4 bg-green-500/10 rounded-lg shadow border border-green-500/30 col-span-full"><h3 className="text-sm font-medium text-green-600 flex items-center"><ClipboardList className="h-4 w-4 mr-2" />Efectivo Esperado en Caja</h3><p className="text-2xl font-bold text-green-700">{appSettings.currencySymbol}{dailySummary.expectedCashInBox.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}</p><p className="text-xs text-muted-foreground">(Ventas Efectivo + Propinas Efectivo + Cobros Facturas Efectivo)</p></div>
                    </div></CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="font-headline">Arqueo y Cierre de Caja del Día</CardTitle><CardDescription>Realiza el conteo del efectivo y finaliza las operaciones del día.</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Conteo de Efectivo Físico:</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-3 p-4 border rounded-md bg-muted/20">
                            {denominations.map(den => (<div key={den}><Label htmlFor={`counted-${den}`} className="text-sm">{appSettings.currencySymbol}{den.toLocaleString('es-ES')}</Label><Input id={`counted-${den}`} type="number" min="0" placeholder="0" value={countedCashBreakdownInputs[String(den)] || ''} onChange={e => handleCountedCashBreakdownChange(String(den), e.target.value)} className="w-full h-9 text-sm" disabled={!isAdmin} /></div>))}
                            </div>
                            <div className="mt-3 text-right"><p className="text-lg font-semibold">Total Contado:</p><p className="text-2xl font-bold text-primary">{appSettings.currencySymbol}{totalCountedCash.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}</p></div>
                        </div>
                        <div><h3 className="text-lg font-semibold mb-1">Diferencia de Caja:</h3><p className={cn("text-2xl font-bold", cashDifference === 0 && "text-muted-foreground", cashDifference > 0 && "text-green-500", cashDifference < 0 && "text-destructive")}>{appSettings.currencySymbol}{cashDifference.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}{cashDifference > 0 && <span className="text-sm ml-2">(Sobrante)</span>}{cashDifference < 0 && <span className="text-sm ml-2">(Faltante)</span>}{cashDifference === 0 && <span className="text-sm ml-2">(Cuadre Exacto)</span>}</p></div>
                        <div><Label htmlFor="closureNotes">Notas Adicionales (Opcional)</Label><Textarea id="closureNotes" value={closureNotes} onChange={(e) => setClosureNotes(e.target.value)} placeholder="Ej: Se retiraron $50 para gastos menores..." rows={3} disabled={!isAdmin} /></div>
                        <div className="flex flex-wrap gap-2 pt-4"><Button onClick={handlePrintDailyReport} variant="outline" disabled={isPrintingClosureReport || isClosureButtonDisabled} className="w-full sm:w-auto"><Printer className="mr-2 h-4 w-4" /> Imprimir Reporte de Cierre</Button></div>
                        <Alert variant={isClosureButtonDisabled ? "warning" : "default"}><AlertTriangle className="h-5 w-5" /><AlertTitle>{isClosureButtonDisabled ? "Arqueo Pendiente" : (cashDifference !== 0 ? "¡Atención! Hay diferencia en caja." : "Cuadre de Caja Exacto")}</AlertTitle><AlertDescription>{isClosureButtonDisabled ? "Ingrese el conteo de efectivo para habilitar el cierre." : "Asegúrate que todo es correcto. Esta acción es irreversible."}</AlertDescription></Alert>
                        <Button onClick={handlePerformClosure} disabled={isClosureButtonDisabled || !isAdmin} className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground" size="lg">{isLoading ? "Cerrando Día..." : `Confirmar y Realizar Cierre para ${operationalDateDisplay}`}</Button>
                    </CardContent>
                </Card>
                </>
            )}
        </TabsContent>
        <TabsContent value="daily-history" className="mt-4">
            <Card>
                <CardHeader><CardTitle className="font-headline">Historial de Cierres Diarios</CardTitle><CardDescription>Consulta los detalles de cada cierre operativo realizado.</CardDescription></CardHeader>
                <CardContent>
                    {(accountingSettings.dailyClosureHistory || []).length === 0 ? (<p className="text-muted-foreground">No hay cierres diarios en el historial.</p>) : (
                    <Accordion type="single" collapsible className="w-full">
                        {(accountingSettings.dailyClosureHistory || []).sort((a,b) => new Date(b.closureDate).getTime() - new Date(a.closureDate).getTime()).map(closure => (
                            <AccordionItem value={closure.closureDate} key={closure.closureDate}>
                                <AccordionTrigger>
                                    <div className="flex justify-between w-full pr-4">
                                        <span>{format(parseISO(closure.closureDate), "PPP", { locale: es })}</span>
                                        <span className="text-muted-foreground font-normal">Ganancia Bruta: <span className="font-medium text-primary">{appSettings.currencySymbol}{closure.grossProfit.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span></span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>{renderDailyClosureDetails(closure)}</AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="monthly-closure" className="mt-4 space-y-6">
            <Card>
                <CardHeader><CardTitle className="font-headline">Generar Cierre Mensual</CardTitle><CardDescription>Selecciona un mes y año para generar un estado de resultados consolidado.</CardDescription></CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-grow"><Label>Año</Label><Select value={String(reportYear)} onValueChange={(v) => setReportYear(Number(v))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{reportYears.map(y => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}</SelectContent></Select></div>
                    <div className="flex-grow"><Label>Mes</Label><Select value={String(reportMonth)} onValueChange={(v) => setReportMonth(Number(v))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{Array.from({length: 12}, (_, i) => i + 1).map(m => (<SelectItem key={m} value={String(m)}>{format(set(new Date(), { month: m - 1 }), 'MMMM', { locale: es })}</SelectItem>))}</SelectContent></Select></div>
                    <Button onClick={handleGenerateMonthlyClosure} disabled={!isAdmin} className="w-full sm:w-auto">Generar Reporte</Button>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="font-headline">Historial de Cierres Mensuales</CardTitle><CardDescription>Consulta los reportes mensuales generados.</CardDescription></CardHeader>
                <CardContent>
                    {(accountingSettings.monthlyClosureHistory || []).length === 0 ? (<p className="text-muted-foreground">No hay cierres mensuales en el historial.</p>) : (
                    <Accordion type="single" collapsible className="w-full">
                        {(accountingSettings.monthlyClosureHistory || []).sort((a,b) => b.year - a.year || b.month - a.month).map(report => (
                            <AccordionItem value={`${report.year}-${report.month}`} key={`${report.year}-${report.month}`}>
                                <AccordionTrigger>
                                    <div className="flex justify-between w-full pr-4">
                                        <span>{format(set(new Date(), { year: report.year, month: report.month - 1 }), "MMMM yyyy", { locale: es })}</span>
                                        <span className="text-muted-foreground font-normal">Ganancia Bruta: <span className="font-medium text-primary">{appSettings.currencySymbol}{report.grossProfit.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span></span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>{renderMonthlyClosureDetails(report)}</AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      
      {isPrintingClosureReport && (closureToPrint || monthlyReportToPrint) && isClientMounted && typeof document !== 'undefined' &&
        ReactDOM.createPortal(
          <div id="printableClosureReportArea">
            {closureToPrint && <DailyClosureReportPrintLayout dailySummary={closureToPrint} {...closureToPrint} operationalDateDisplay={format(parseISO(closureToPrint.closureDate), "PPP", { locale: es })} appSettings={appSettings} businessSettings={businessSettings} />}
            {monthlyReportToPrint && <MonthlyClosureReportPrintLayout report={monthlyReportToPrint} appSettings={appSettings} businessSettings={businessSettings}/>}
          </div>,
          document.body
        )
      }
    </div>
  );
}
