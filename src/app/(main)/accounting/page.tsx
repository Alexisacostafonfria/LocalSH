
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
import { AccountingSettings, DEFAULT_ACCOUNTING_SETTINGS, Sale, AppSettings, DEFAULT_APP_SETTINGS, CashPaymentDetails, DenominationCount, LastClosureDetails, BusinessSettings, DEFAULT_BUSINESS_SETTINGS, AuthState, DEFAULT_AUTH_STATE, InvoicePaymentRecord } from '@/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, startOfDay, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, AlertTriangle, Info, CheckCircle2, Clock, DollarSign, Package, TrendingUp, Coins, Landmark, ClipboardList, Printer, Lock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import DailyClosureReportPrintLayout from '@/components/accounting/DailyClosureReportPrintLayout';


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
  const [invoicePayments] = useLocalStorageState<InvoicePaymentRecord[]>('invoicePayments', []);
  const [authState] = useLocalStorageState<AuthState>('authData', DEFAULT_AUTH_STATE);

  const [selectedDateForNewDay, setSelectedDateForNewDay] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [countedCashBreakdownInputs, setCountedCashBreakdownInputs] = useState<Record<string, string>>({});
  const [closureNotes, setClosureNotes] = useState<string>("");
  const [isPrintingClosureReport, setIsPrintingClosureReport] = useState(false);
  const [isClientMounted, setIsClientMounted] = useState(false);


  const { toast } = useToast();
  const isAdmin = authState.currentUser?.role === 'admin';

  useEffect(() => {
    setIsClientMounted(true);
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
    
    const currentClosureDetails: LastClosureDetails = {
        closureDate: currentOperationalDate,
        expectedCashInBox: dailySummary.expectedCashInBox,
        countedCashBreakdown: getDenominationCountsFromInputs(countedCashBreakdownInputs),
        totalCountedCash: totalCountedCash,
        cashDifference: cashDifference,
        closureNotes: closureNotes,
        totalRevenue: dailySummary.totalRevenue,
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
        lastClosureDetails: currentClosureDetails,
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
    const totalTransactions = salesForOperationalDate.length;

    const cashSalesDetails = salesForOperationalDate
      .filter(s => s.paymentMethod === 'cash')
      .map(s => s.paymentDetails as CashPaymentDetails);

    const cashSalesAmount = salesForOperationalDate
      .filter(s => s.paymentMethod === 'cash')
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
      
    const transferSalesAmount = salesForOperationalDate.filter(s => s.paymentMethod === 'transfer').reduce((sum, s) => sum + s.totalAmount, 0);
    
    const totalTips = cashSalesDetails.reduce((sum, details) => sum + (details.tip || 0), 0);

    const invoicePaymentsInCash = invoicePaymentsForOperationalDate.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amountPaid, 0);
    const invoicePaymentsInTransfer = invoicePaymentsForOperationalDate.filter(p => p.method === 'transfer').reduce((sum, p) => sum + p.amountPaid, 0);
    
    const expectedCashInBox = cashSalesAmount + totalTips + invoicePaymentsInCash;


    return {
        totalRevenue,
        totalTransactions,
        cashSalesAmount,
        transferSalesAmount,
        totalTips,
        invoicePaymentsInCash,
        invoicePaymentsInTransfer,
        expectedCashInBox,
    };
  }, [currentOperationalDate, sales, invoicePayments]);

  const handleCountedCashBreakdownChange = (denominationKey: string, countStr: string) => {
    const newBreakdownInputs = {
      ...countedCashBreakdownInputs,
      [denominationKey]: countStr,
    };
    setCountedCashBreakdownInputs(newBreakdownInputs);
  };

  const totalCountedCash = useMemo(() => {
    let total = 0;
    for (const denKey in countedCashBreakdownInputs) {
      const count = parseFloat(countedCashBreakdownInputs[denKey]);
      const denominationValue = parseFloat(denKey);
      if (!isNaN(count) && count > 0 && !isNaN(denominationValue)) {
        total += denominationValue * count;
      }
    }
    return total;
  }, [countedCashBreakdownInputs]);

  const cashDifference = useMemo(() => {
    if (dailySummary?.expectedCashInBox === undefined) return 0; 
    return totalCountedCash - dailySummary.expectedCashInBox;
  }, [totalCountedCash, dailySummary]);

  const handlePrintClosureReport = () => {
    if (!dailySummary || !isDayOpen) {
      toast({ title: "No se puede imprimir", description: "No hay un día operativo activo o resumen para generar el reporte.", variant: "warning" });
      return;
    }
    if (Object.keys(countedCashBreakdownInputs).length === 0 && totalCountedCash === 0) {
      toast({ title: "Arqueo Incompleto", description: "Por favor, complete el arqueo de caja antes de imprimir el reporte.", variant: "warning" });
      return;
    }
    setIsPrintingClosureReport(true);
  };
  
  useEffect(() => {
    if (isPrintingClosureReport && dailySummary && isClientMounted) {
      const timer = setTimeout(() => {
        window.print();
      }, 300);

      const handleAfterPrint = () => {
        setIsPrintingClosureReport(false);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
      window.addEventListener('afterprint', handleAfterPrint);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [isPrintingClosureReport, dailySummary, isClientMounted]);

  const isClosureButtonDisabled = isLoading || (Object.keys(countedCashBreakdownInputs).length === 0 && totalCountedCash === 0);


  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Contabilidad y Cierre Diario" description="Gestiona los cierres diarios, arqueos y visualiza resúmenes operativos." />

      {!isAdmin && (
        <Alert variant="warning">
            <Lock className="h-5 w-5" />
            <AlertTitle>Acceso Restringido</AlertTitle>
            <AlertDescription>
                Solo los administradores pueden iniciar nuevos días operativos o realizar cierres. Puedes ver el estado actual.
            </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Estado Operativo Actual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p><strong>Último Cierre Realizado:</strong> <span className="text-primary font-medium">{lastClosureDateDisplay}</span></p>
          <p><strong>Día Operativo Actual:</strong> <span className="text-primary font-medium">{operationalDateDisplay}</span></p>
          <p><strong>Estado del Día:</strong>
            {isDayOpen && currentOperationalDate ? (
              <span className="text-green-500 font-medium ml-1 py-0.5 px-2 rounded-full bg-green-500/10 border border-green-500/30">
                <CheckCircle2 className="inline h-4 w-4 mr-1" />Abierto
              </span>
            ) : (
              <span className="text-orange-500 font-medium ml-1 py-0.5 px-2 rounded-full bg-orange-500/10 border border-orange-500/30">
                <Clock className="inline h-4 w-4 mr-1" />Cerrado / No Iniciado
              </span>
            )}
          </p>
        </CardContent>
      </Card>

      {!isDayOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Iniciar Nuevo Día Operativo</CardTitle>
            <CardDescription>
              Selecciona la fecha para el nuevo día operativo que deseas iniciar.
              {lastClosureDate && ` El último día cerrado fue el ${lastClosureDateDisplay}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="newOperationalDate">Fecha del Nuevo Día Operativo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDateForNewDay && "text-muted-foreground"
                    )}
                    disabled={!isAdmin}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDateForNewDay ? format(selectedDateForNewDay, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDateForNewDay}
                    onSelect={setSelectedDateForNewDay}
                    initialFocus
                    locale={es}
                    disabled={(date) =>
                      (!isAdmin || (lastClosureDate ? date <= parseISO(lastClosureDate) : false) || date > new Date())
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={handleStartNewDay} disabled={isLoading || !selectedDateForNewDay || !isAdmin} className="w-full" size="lg">
              {isLoading ? "Iniciando..." : "Iniciar Nuevo Día"}
            </Button>
          </CardContent>
        </Card>
      )}

      {isDayOpen && currentOperationalDate && dailySummary && (
        <>
          <Card>
            <CardHeader>
                <CardTitle className="font-headline">Resumen del Día Operativo: {operationalDateDisplay}</CardTitle>
                <CardDescription>Operaciones registradas para el día actual.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center"><DollarSign className="h-4 w-4 mr-2" />Ingresos Totales (Ventas)</h3>
                        <p className="text-2xl font-bold">{appSettings.currencySymbol}{dailySummary.totalRevenue.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                     <div className="p-4 bg-muted/30 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center"><Package className="h-4 w-4 mr-2" />Total Transacciones</h3>
                        <p className="text-2xl font-bold">{dailySummary.totalTransactions}</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center"><Coins className="h-4 w-4 mr-2" />Ventas en Efectivo</h3>
                        <p className="text-2xl font-bold">{appSettings.currencySymbol}{dailySummary.cashSalesAmount.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center"><Landmark className="h-4 w-4 mr-2" />Ventas por Transferencia</h3>
                        <p className="text-2xl font-bold">{appSettings.currencySymbol}{dailySummary.transferSalesAmount.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    {appSettings.allowTips && (
                        <div className="p-4 bg-muted/30 rounded-lg shadow">
                            <h3 className="text-sm font-medium text-muted-foreground flex items-center"><TrendingUp className="h-4 w-4 mr-2" />Total Propinas (Efectivo)</h3>
                            <p className="text-2xl font-bold">{appSettings.currencySymbol}{dailySummary.totalTips.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                    )}
                    <div className="p-4 bg-muted/30 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center"><FileText className="h-4 w-4 mr-2" />Cobros Facturas (Efectivo)</h3>
                        <p className="text-2xl font-bold">{appSettings.currencySymbol}{dailySummary.invoicePaymentsInCash.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                     <div className="p-4 bg-muted/30 rounded-lg shadow">
                        <h3 className="text-sm font-medium text-muted-foreground flex items-center"><FileText className="h-4 w-4 mr-2" />Cobros Facturas (Transfer)</h3>
                        <p className="text-2xl font-bold">{appSettings.currencySymbol}{dailySummary.invoicePaymentsInTransfer.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                     <div className="p-4 bg-green-500/10 rounded-lg shadow border border-green-500/30 col-span-1 md:col-span-2 lg:col-span-3">
                        <h3 className="text-sm font-medium text-green-600 flex items-center"><ClipboardList className="h-4 w-4 mr-2" />Efectivo Esperado en Caja</h3>
                        <p className="text-2xl font-bold text-green-700">{appSettings.currencySymbol}{dailySummary.expectedCashInBox.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-xs text-muted-foreground">(Ventas Efectivo + Propinas Efectivo + Cobros Facturas Efectivo)</p>
                    </div>
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Arqueo de Caja del Día</CardTitle>
              <CardDescription>Realiza el conteo del efectivo en caja para compararlo con el esperado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Efectivo Esperado en Caja:</h3>
                <p className="text-2xl font-bold text-primary">
                  {appSettings.currencySymbol}{dailySummary.expectedCashInBox.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Conteo de Efectivo Físico:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-3 p-4 border rounded-md bg-muted/20">
                  {denominations.map(den => (
                    <div key={den}>
                      <Label htmlFor={`counted-${den}`} className="text-sm">
                        {appSettings.currencySymbol}
                        {den.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </Label>
                      <Input
                        id={`counted-${den}`}
                        type="number"
                        min="0"
                        placeholder="0"
                        value={countedCashBreakdownInputs[String(den)] || ''}
                        onChange={e => handleCountedCashBreakdownChange(String(den), e.target.value)}
                        className="w-full h-9 text-sm"
                        disabled={!isAdmin}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-right">
                  <p className="text-lg font-semibold">Total Contado en Caja:</p>
                  <p className="text-2xl font-bold text-primary">
                    {appSettings.currencySymbol}{totalCountedCash.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-1">Diferencia:</h3>
                <p className={cn(
                    "text-2xl font-bold",
                    cashDifference === 0 && "text-muted-foreground",
                    cashDifference > 0 && "text-green-500",
                    cashDifference < 0 && "text-destructive"
                  )}>
                  {appSettings.currencySymbol}{cashDifference.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {cashDifference > 0 && <span className="text-sm ml-2">(Sobrante)</span>}
                  {cashDifference < 0 && <span className="text-sm ml-2">(Faltante)</span>}
                  {cashDifference === 0 && <span className="text-sm ml-2">(Cuadre Exacto)</span>}
                </p>
              </div>
               <div>
                  <Label htmlFor="closureNotes">Notas Adicionales para el Cierre (Opcional)</Label>
                  <Textarea
                    id="closureNotes"
                    value={closureNotes}
                    onChange={(e) => setClosureNotes(e.target.value)}
                    placeholder="Ej: Se retiraron $50 para gastos menores, faltante justificado por error en cambio..."
                    rows={3}
                    disabled={!isAdmin}
                  />
              </div>
               <div className="pt-4">
                <Button
                    onClick={handlePrintClosureReport}
                    variant="outline"
                    disabled={isPrintingClosureReport || (Object.keys(countedCashBreakdownInputs).length === 0 && totalCountedCash === 0)}
                    className="w-full sm:w-auto"
                >
                    <Printer className="mr-2 h-4 w-4" /> Imprimir Reporte de Cierre y Arqueo
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Realizar Cierre Diario</CardTitle>
              <CardDescription>
                Al realizar el cierre, se finalizarán las operaciones para el día {operationalDateDisplay}.
                No se podrán registrar más ventas para esta fecha.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant={isClosureButtonDisabled ? "warning" : (cashDifference !== 0 ? "warning" : "default")}>
                <AlertTriangle className={cn("h-5 w-5", cashDifference === 0 && !isClosureButtonDisabled && "hidden")} />
                <CheckCircle2 className={cn("h-5 w-5", (cashDifference !== 0 || isClosureButtonDisabled) && "hidden", cashDifference === 0 && !isClosureButtonDisabled && "text-green-500")} />
                <AlertTitle>
                    {isClosureButtonDisabled ? "Arqueo Pendiente" :
                     (cashDifference !== 0 ? "¡Atención! Hay una diferencia en caja." : "Cuadre de Caja")}
                </AlertTitle>
                <AlertDescription>
                  {isClosureButtonDisabled ? "Por favor, ingrese las cantidades en el conteo de efectivo físico para habilitar el cierre. " :
                   (cashDifference !== 0 ? `La diferencia es de ${appSettings.currencySymbol}${cashDifference.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}. ` :
                    "El cuadre de caja es exacto. ")
                  }
                  Asegúrate de que todas las transacciones y el conteo de efectivo son correctos antes de proceder.
                  Esta acción es irreversible para el día operativo actual.
                </AlertDescription>
              </Alert>
              <Button onClick={handlePerformClosure} disabled={isClosureButtonDisabled || !isAdmin} className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground" size="lg">
                {isLoading ? "Cerrando Día..." : `Confirmar y Realizar Cierre para ${operationalDateDisplay}`}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {isDayOpen === false && currentOperationalDate === null && lastClosureDate !== null && (
         <Card>
            <CardHeader>
                <CardTitle className="font-headline text-green-500 flex items-center"><CheckCircle2 className="h-6 w-6 mr-2"/>Día Anterior Cerrado Exitosamente</CardTitle>
                <CardDescription>
                   El día operativo {lastClosureDateDisplay} fue cerrado.
                   {accountingSettings.lastClosureDetails && ` El efectivo esperado fue de ${appSettings.currencySymbol}${accountingSettings.lastClosureDetails.expectedCashInBox.toLocaleString('es-ES', {style:'decimal', minimumFractionDigits:2, maximumFractionDigits:2})}, se contaron ${appSettings.currencySymbol}${accountingSettings.lastClosureDetails.totalCountedCash.toLocaleString('es-ES', {style:'decimal', minimumFractionDigits:2, maximumFractionDigits:2})}.`}
                   Por favor, inicie un nuevo día operativo para continuar.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Button 
                   onClick={() => { 
                     const newDayButton = document.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"][class*="justify-start"]'); 
                     newDayButton?.focus(); 
                   }} 
                   variant="default" 
                   size="lg"
                   disabled={!isAdmin}
                  >
                    Ir a Iniciar Nuevo Día
                </Button>
            </CardContent>
        </Card>
      )}

      {isPrintingClosureReport && dailySummary && isClientMounted && typeof document !== 'undefined' &&
        ReactDOM.createPortal(
          <div id="printableClosureReportArea">
            <DailyClosureReportPrintLayout
              dailySummary={dailySummary}
              countedCashBreakdown={getDenominationCountsFromInputs(countedCashBreakdownInputs)}
              totalCountedCash={totalCountedCash}
              cashDifference={cashDifference}
              closureNotes={closureNotes}
              operationalDateDisplay={operationalDateDisplay}
              appSettings={appSettings}
              businessSettings={businessSettings}
            />
          </div>,
          document.body
        )
      }
    </div>
  );
}
