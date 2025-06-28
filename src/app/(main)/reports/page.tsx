
// src/app/(main)/reports/page.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product, Sale, AppSettings, DEFAULT_APP_SETTINGS, BusinessSettings, DEFAULT_BUSINESS_SETTINGS, CashPaymentDetails, TransferPaymentDetails, InvoicePaymentDetails, Order, ORDER_STATUS_MAP } from '@/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isWithinInterval, subDays, subWeeks, subMonths, startOfDay, endOfDay, addWeeks, addMonths, isValid, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Download, BarChart3, Coins, ShoppingBag, ArchiveRestore, TrendingUp, PieChart, Search, Filter, Printer, CalendarIcon, Loader2, AlertTriangle, Package, Layers, FileText, ClipboardList, CheckCircle, Ban, Hourglass, DollarSign } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import OperationsReportPrintLayout from '@/components/reports/OperationsReportPrintLayout';
import OrdersReportLayout from '@/components/reports/OrdersReportLayout';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { cn } from '@/lib/utils';

// Helper function to safely parse a date string. Returns null if invalid.
const getSafeDate = (dateString: string | undefined | null): Date | null => {
  if (!dateString) return null;
  try {
    const date = parseISO(dateString);
    return isValid(date) ? date : null;
  } catch (error) {
    return null;
  }
};

// Define a type for our clean, validated sale object
type ValidatedSale = Omit<Sale, 'timestamp' | 'operationalDate'> & {
  timestampDate: Date;
  operationalDateDate: Date | null;
  totalAmount: number;
  items: NonNullable<Sale['items']>;
  id: NonNullable<Sale['id']>;
};

// Define a type for our clean, validated order object
type ValidatedOrder = Omit<Order, 'timestamp'> & {
  timestampDate: Date;
  totalAmount: number;
  items: NonNullable<Order['items']>;
  id: NonNullable<Order['id']>;
};


export default function ReportsPage() {
  const [sales] = useLocalStorageState<Sale[]>('sales', []);
  const [products] = useLocalStorageState<Product[]>('products', []);
  const [orders] = useLocalStorageState<Order[]>('orders', []);
  const [appSettings] = useLocalStorageState<AppSettings>('appSettings', DEFAULT_APP_SETTINGS);
  const [businessSettings] = useLocalStorageState<BusinessSettings>('businessSettings', DEFAULT_BUSINESS_SETTINGS);
  
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const today = useMemo(() => startOfDay(new Date()), []);
  
  const [chartDateRange, setChartDateRange] = useState<DateRange | undefined>({ from: subDays(today, 6), to: today });
  const [tableDateRange, setTableDateRange] = useState<DateRange | undefined>({ from: subDays(today, 6), to: today });
  const [ordersDateRange, setOrdersDateRange] = useState<DateRange | undefined>({ from: subDays(today, 6), to: today });

  const [chartType, setChartType] = useState<ChartType>('bar');
  const [detailSearchTerm, setDetailSearchTerm] = useState('');
  const [detailPaymentMethodFilter, setDetailPaymentMethodFilter] = useState<PaymentMethodFilter>('all');
  const [detailOriginFilter, setDetailOriginFilter] = useState<OriginFilter>('all');
  const [isPrintingOperationsReport, setIsPrintingOperationsReport] = useState(false);
  const [isPrintingOrdersReport, setIsPrintingOrdersReport] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    setIsLoadingProducts(false);
  }, []);

  // 1. Create a fully validated and clean source of truth for sales data.
  const validatedSales = useMemo((): ValidatedSale[] => {
    return sales
      .map(sale => {
        const timestampDate = getSafeDate(sale?.timestamp);
        if (!sale || !timestampDate) return null; // Exclude sales with no data or invalid primary timestamp.

        return {
          ...sale,
          id: sale.id ?? `invalid-id-${Math.random()}`,
          totalAmount: typeof sale.totalAmount === 'number' && isFinite(sale.totalAmount) ? sale.totalAmount : 0,
          items: Array.isArray(sale.items) ? sale.items : [],
          paymentMethod: sale.paymentMethod ?? 'cash',
          timestampDate,
          operationalDateDate: getSafeDate(sale.operationalDate),
        };
      })
      .filter((s): s is ValidatedSale => s !== null);
  }, [sales]);

  // Create a fully validated and clean source of truth for orders data.
  const validatedOrders = useMemo((): ValidatedOrder[] => {
    return orders
      .map(order => {
        const timestampDate = getSafeDate(order?.timestamp);
        if (!order || !timestampDate) return null;

        return {
          ...order,
          id: order.id ?? `invalid-id-${Math.random()}`,
          totalAmount: typeof order.totalAmount === 'number' && isFinite(order.totalAmount) ? order.totalAmount : 0,
          items: Array.isArray(order.items) ? order.items : [],
          timestampDate,
        };
      })
      .filter((o): o is ValidatedOrder => o !== null);
  }, [orders]);


  // 2. Base all subsequent logic on these validated arrays.
  const getSaleDateForFiltering = useCallback((sale: ValidatedSale): Date => {
    return sale.operationalDateDate ?? sale.timestampDate;
  }, []);

  const salesForChartPeriod = useMemo(() => {
    if (!chartDateRange?.from) return [];
    const from = startOfDay(chartDateRange.from);
    const to = endOfDay(chartDateRange.to ?? chartDateRange.from);
    return validatedSales.filter(sale => isWithinInterval(getSaleDateForFiltering(sale), { start: from, end: to }));
  }, [validatedSales, chartDateRange, getSaleDateForFiltering]);
  
  const salesForTablePeriod = useMemo(() => {
    if (!tableDateRange?.from) return [];
    const from = startOfDay(tableDateRange.from);
    const to = endOfDay(tableDateRange.to ?? tableDateRange.from);
    return validatedSales.filter(sale => isWithinInterval(getSaleDateForFiltering(sale), { start: from, end: to }));
  }, [validatedSales, tableDateRange, getSaleDateForFiltering]);


  const salesDataForChart = useMemo(() => {
    if (!chartDateRange?.from || !chartDateRange?.to || salesForChartPeriod.length === 0) return [];
    
    const startDate = startOfDay(chartDateRange.from);
    const endDate = endOfDay(chartDateRange.to);
    const diff = differenceInDays(endDate, startDate);

    let aggregateBy: 'day' | 'week' | 'month';
    let dateFormat: string;

    if (diff <= 31) { aggregateBy = 'day'; dateFormat = "dd MMM"; } 
    else if (diff <= 182) { aggregateBy = 'week'; dateFormat = "'Sem' W, yy"; } 
    else { aggregateBy = 'month'; dateFormat = "MMM yyyy"; }
    
    const aggregatedData: { [key: string]: number } = {};
    salesForChartPeriod.forEach(sale => {
      const saleDate = getSaleDateForFiltering(sale);
      let periodKey: string;
      if (aggregateBy === 'day') periodKey = format(saleDate, 'yyyy-MM-dd');
      else if (aggregateBy === 'week') periodKey = format(startOfWeek(saleDate, { locale: es }), 'yyyy-MM-dd');
      else periodKey = format(startOfMonth(saleDate), 'yyyy-MM');
      aggregatedData[periodKey] = (aggregatedData[periodKey] || 0) + sale.totalAmount;
    });

    const chartDataPoints: { name: string, Ventas: number }[] = [];
    if (aggregateBy === 'day') {
      eachDayOfInterval({ start: startDate, end: endDate }).forEach(day => {
        chartDataPoints.push({
          name: format(day, dateFormat, { locale: es }),
          Ventas: aggregatedData[format(day, 'yyyy-MM-dd')] || 0,
        });
      });
    } else if (aggregateBy === 'week') {
      for (let d = startOfWeek(startDate, { locale: es }); d <= endDate; d = addWeeks(d, 1)) {
        chartDataPoints.push({
          name: format(d, dateFormat, { locale: es }),
          Ventas: aggregatedData[format(d, 'yyyy-MM-dd')] || 0,
        });
      }
    } else {
      for (let d = startOfMonth(startDate); d <= endDate; d = addMonths(d, 1)) {
        chartDataPoints.push({
          name: format(d, dateFormat, { locale: es }),
          Ventas: aggregatedData[format(d, 'yyyy-MM')] || 0,
        });
      }
    }
    return chartDataPoints;
  }, [salesForChartPeriod, chartDateRange, getSaleDateForFiltering]);

  // KPIs now use pre-validated data and are much safer
  const totalSalesValueForChartPeriod = useMemo(() => salesForChartPeriod.reduce((sum, sale) => sum + sale.totalAmount, 0), [salesForChartPeriod]);
  const averageSalesValueForChartPeriod = useMemo(() => salesForChartPeriod.length === 0 ? 0 : totalSalesValueForChartPeriod / salesForChartPeriod.length, [salesForChartPeriod.length, totalSalesValueForChartPeriod]);
  const totalTransactionsForChartPeriod = useMemo(() => salesForChartPeriod.length, [salesForChartPeriod]);
  
  const totalTipsValueForChartPeriod = useMemo(() => {
    return salesForChartPeriod.reduce((sum, sale) => {
      if (sale.paymentMethod === 'cash' && sale.paymentDetails) {
        const tip = (sale.paymentDetails as CashPaymentDetails)?.tip;
        return sum + (typeof tip === 'number' && isFinite(tip) ? tip : 0);
      }
      return sum;
    }, 0);
  }, [salesForChartPeriod]);
  
  const totalAccountsReceivable = useMemo(() => {
    return validatedSales
      .filter(s => s.paymentMethod === 'invoice' && (s.paymentDetails as InvoicePaymentDetails)?.status !== 'paid')
      .reduce((sum, s) => sum + s.totalAmount, 0);
  }, [validatedSales]);

  const totalCogsValueForChartPeriod = useMemo(() => {
    if (isLoadingProducts) return 0;
    return salesForChartPeriod.reduce((totalCogs, sale) => {
      const saleCogs = sale.items.reduce((currentSaleCogs, item) => {
        const product = products.find(p => p.id === item.productId);
        const costPrice = product?.costPrice ?? 0;
        return currentSaleCogs + (costPrice * item.quantity);
      }, 0);
      return totalCogs + saleCogs;
    }, 0);
  }, [salesForChartPeriod, products, isLoadingProducts]);

  const totalProfitValueForChartPeriod = useMemo(() => totalSalesValueForChartPeriod - totalCogsValueForChartPeriod, [totalSalesValueForChartPeriod, totalCogsValueForChartPeriod]);
  const salesFromPos = useMemo(() => salesForChartPeriod.filter(s => s.origin === 'pos').reduce((sum, s) => sum + s.totalAmount, 0), [salesForChartPeriod]);
  const salesFromOrders = useMemo(() => salesForChartPeriod.filter(s => s.origin === 'order').reduce((sum, s) => sum + s.totalAmount, 0), [salesForChartPeriod]);

  const detailedOperations = useMemo(() => {
    const searchTermLower = detailSearchTerm.toLowerCase();
    return salesForTablePeriod
      .filter(sale => {
        const matchesPaymentMethod = detailPaymentMethodFilter === 'all' || sale.paymentMethod === detailPaymentMethodFilter;
        const matchesOrigin = detailOriginFilter === 'all' || (sale.origin || 'pos') === detailOriginFilter;
        if (!matchesPaymentMethod || !matchesOrigin) return false;
        if (!searchTermLower) return true;
        
        const idMatch = sale.id.toLowerCase().includes(searchTermLower);
        const customerMatch = (sale.customerName ?? '').toLowerCase().includes(searchTermLower);
        const itemMatch = sale.items.some(item => (item.productName ?? '').toLowerCase().includes(searchTermLower));
        const opDateMatch = sale.operationalDateDate ? format(sale.operationalDateDate, "dd/MM/yyyy", { locale: es }).includes(searchTermLower) : false;
        const timestampMatch = format(sale.timestampDate, "dd/MM/yyyy", { locale: es }).includes(searchTermLower);

        return idMatch || customerMatch || itemMatch || opDateMatch || timestampMatch;
      })
      .sort((a, b) => b.timestampDate.getTime() - a.timestampDate.getTime());
  }, [salesForTablePeriod, detailSearchTerm, detailPaymentMethodFilter, detailOriginFilter]);
  
  const ordersForPeriod = useMemo(() => {
    if (!ordersDateRange?.from) return [];
    const from = startOfDay(ordersDateRange.from);
    const to = endOfDay(ordersDateRange.to ?? ordersDateRange.from);

    return validatedOrders
      .filter(order => isWithinInterval(order.timestampDate, { start: from, end: to }))
      .sort((a, b) => b.timestampDate.getTime() - a.timestampDate.getTime());
  }, [validatedOrders, ordersDateRange]);
  
  const ordersSummary = useMemo(() => {
    const totalOrders = ordersForPeriod.length;
    const totalValue = ordersForPeriod.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const completedOrders = ordersForPeriod.filter(o => o.status === 'completed').length;
    const cancelledOrders = ordersForPeriod.filter(o => o.status === 'cancelled').length;
    const activeOrders = ordersForPeriod.filter(o => ['pending', 'in-progress', 'ready'].includes(o.status)).length;
    return { totalOrders, totalValue, completedOrders, cancelledOrders, activeOrders };
  }, [ordersForPeriod]);

  const handleExport = () => {
    if (detailedOperations.length === 0) {
      toast({title: "Nada que Exportar", description:"No hay datos para exportar en el periodo y filtros de tabla seleccionados.", variant: "warning"});
      return;
    }
    const headers = "ID Venta,Timestamp,Fecha Operativa,Origen,ID Pedido,Cliente,Items (Cantidad Total),SubTotal,Descuento,Total Venta,Metodo Pago,Monto Recibido (Efectivo),Cambio (Efectivo),Propina (Efectivo),Referencia (Transferencia),Estado Factura,Vencimiento Factura\n";
    const csvRows = detailedOperations.map(sale => {
      const itemsCount = sale.items.reduce((acc, item) => acc + (item.quantity || 0), 0);
      const cashDetails = sale.paymentMethod === 'cash' ? sale.paymentDetails as CashPaymentDetails : null;
      const transferDetails = sale.paymentMethod === 'transfer' ? sale.paymentDetails as TransferPaymentDetails : null;
      const invoiceDetails = sale.paymentMethod === 'invoice' ? sale.paymentDetails as InvoicePaymentDetails : null;

      return [
        sale.id,
        format(sale.timestampDate, "yyyy-MM-dd HH:mm:ss"),
        sale.operationalDateDate ? format(sale.operationalDateDate, "yyyy-MM-dd") : format(sale.timestampDate, "yyyy-MM-dd"),
        sale.origin || 'pos',
        sale.orderId || 'N/A',
        `"${sale.customerName || 'N/A'}"`,
        itemsCount,
        (sale.subTotal || 0).toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        (sale.discount || 0).toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        sale.totalAmount.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        sale.paymentMethod,
        cashDetails ? (cashDetails.amountReceived || 0).toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        cashDetails ? (cashDetails.changeGiven || 0).toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        cashDetails ? (cashDetails.tip || 0).toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        transferDetails ? `"${transferDetails.reference || ''}"` : '',
        invoiceDetails?.status ?? '',
        invoiceDetails?.dueDate ? format(parseISO(invoiceDetails.dueDate), 'yyyy-MM-dd') : '',
      ].join(',');
    });
    const csvString = headers + csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const fromDateStr = tableDateRange?.from ? format(tableDateRange.from, "yyyyMMdd") : 'inicio';
    const toDateStr = tableDateRange?.to ? format(tableDateRange.to, "yyyyMMdd") : 'fin';
    link.setAttribute("download", `reporte_ventas_detalle_${fromDateStr}_${toDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({title: "Exportación CSV Iniciada", description: "El archivo se está descargando."});
  };

  const periodDescriptionForPrint = useMemo(() => {
    if (!tableDateRange?.from) return "Rango no seleccionado";
    return `Del ${format(tableDateRange.from, "dd MMM yyyy", { locale: es })} al ${format(tableDateRange.to ?? tableDateRange.from, "dd MMM yyyy", { locale: es })}`;
  }, [tableDateRange]);

  const handlePrintOperationsReport = () => {
    if (detailedOperations.length === 0) {
      toast({ title: "Nada que Imprimir", description: "No hay operaciones para el periodo/filtros seleccionados.", variant: "warning" });
      return;
    }
    setIsPrintingOperationsReport(true);
  };
  
  const handlePrintOrdersReport = () => {
    if (ordersForPeriod.length === 0) {
      toast({ title: "Nada que Imprimir", description: "No hay pedidos en el periodo seleccionado.", variant: "warning" });
      return;
    }
    setIsPrintingOrdersReport(true);
  };

  useEffect(() => {
    if (isPrintingOperationsReport && detailedOperations.length > 0) {
      const timer = setTimeout(() => window.print(), 300); 
      const handleAfterPrint = () => setIsPrintingOperationsReport(false);
      window.addEventListener('afterprint', handleAfterPrint);
      return () => { clearTimeout(timer); window.removeEventListener('afterprint', handleAfterPrint); };
    }
  }, [isPrintingOperationsReport, detailedOperations]);
  
  useEffect(() => {
    if (isPrintingOrdersReport && ordersForPeriod.length > 0) {
      const timer = setTimeout(() => window.print(), 300);
      const handleAfterPrint = () => setIsPrintingOrdersReport(false);
      window.addEventListener('afterprint', handleAfterPrint);
      return () => { clearTimeout(timer); window.removeEventListener('afterprint', handleAfterPrint); };
    }
  }, [isPrintingOrdersReport, ordersForPeriod]);

  const ChartComponent = chartType === 'bar' ? BarChart : LineChart;
  const ChartElement = chartType === 'bar' ? Bar : Line;
  
  const chartPeriodDescription = useMemo(() => {
    if (!chartDateRange?.from) return "Rango no seleccionado";
    return `Datos del ${format(chartDateRange.from, "dd LLL, y", {locale: es})} al ${format(chartDateRange.to ?? chartDateRange.from, "dd LLL, y", {locale: es})}`;
  }, [chartDateRange]);

  const tablePeriodDescription = useMemo(() => {
    if (!tableDateRange?.from) return "Rango no seleccionado";
    return `Mostrando datos del ${format(tableDateRange.from, "dd LLL, y", {locale: es})} al ${format(tableDateRange.to ?? tableDateRange.from, "dd LLL, y", {locale: es})}`;
  }, [tableDateRange]);

  const ordersPeriodDescription = useMemo(() => {
    if (!ordersDateRange?.from) return "Rango no seleccionado";
    return `Datos del ${format(ordersDateRange.from, "dd LLL, y", {locale: es})} al ${format(ordersDateRange.to ?? ordersDateRange.from, "dd LLL, y", {locale: es})}`;
  }, [ordersDateRange]);

  const formatCurrency = (value: number) => {
    return (appSettings?.currencySymbol ?? '$') + (value ?? 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reportes de Ventas y Pedidos" description="Analiza el rendimiento de tu negocio con gráficos y datos detallados." />
      
      {fetchError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error al Cargar Datos</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
            <CardTitle className="font-headline">KPIs Globales ({chartPeriodDescription})</CardTitle>
            <CardDescription>Indicadores clave basados en el rango seleccionado para el gráfico de ventas. El total de cuentas por cobrar es global.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoadingProducts ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
            ) : (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="col-span-2 lg:col-span-1"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ventas Totales</CardTitle><ShoppingBag className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(totalSalesValueForChartPeriod)}</p></CardContent></Card>
                <Card className="col-span-2 lg:col-span-1"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ganancia Total</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(totalProfitValueForChartPeriod)}</p></CardContent></Card>
                <Card className="col-span-2 lg:col-span-1"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ventas por Pedidos</CardTitle><Layers className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(salesFromOrders)}</p></CardContent></Card>
                <Card className="col-span-2 lg:col-span-1"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Costo Bienes Vendidos</CardTitle><ArchiveRestore className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(totalCogsValueForChartPeriod)}</p></CardContent></Card>
                <Card className="col-span-2 lg:col-span-1"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Cuentas por Cobrar</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(totalAccountsReceivable)}</p></CardContent></Card>
            </div>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div><CardTitle className="font-headline">Visualización de Ventas Agregadas</CardTitle><CardDescription>Selecciona el rango y tipo de gráfico.</CardDescription></div>
            <div className="flex flex-wrap gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="chartDateRangePicker" variant={"outline"} className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !chartDateRange && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {chartDateRange?.from ? (chartDateRange.to ? `${format(chartDateRange.from, "dd LLL, y", { locale: es })} - ${format(chartDateRange.to, "dd LLL, y", { locale: es })}` : format(chartDateRange.from, "dd LLL, y", { locale: es })) : <span>Seleccionar rango (Gráfico)</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end"><Calendar initialFocus mode="range" defaultMonth={chartDateRange?.from} selected={chartDateRange} onSelect={setChartDateRange} numberOfMonths={2} locale={es} disabled={(date) => date > new Date() || date < new Date("2000-01-01")} /></PopoverContent>
              </Popover>
              <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
                <SelectTrigger className="w-full sm:w-[120px]"><SelectValue placeholder="Tipo Gráfico" /></SelectTrigger>
                <SelectContent><SelectItem value="bar">Barras</SelectItem><SelectItem value="line">Líneas</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[400px] w-full pt-6">
          {salesDataForChart.length === 0 ? (<div className="flex items-center justify-center h-full text-muted-foreground">No hay datos de ventas para el periodo seleccionado.</div>) : (
            <ResponsiveContainer width="100%" height="100%">
              <ChartComponent data={salesDataForChart} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value: number) => formatCurrency(value).replace('.00', '')} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }} cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.3 }} formatter={(value: number) => [formatCurrency(value), "Ventas"]} />
                <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                <ChartElement dataKey="Ventas" fill="hsl(var(--primary))" stroke="hsl(var(--primary))" radius={chartType === 'bar' ? [4, 4, 0, 0] : undefined} />
              </ChartComponent>
            </ResponsiveContainer>
           )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div><CardTitle className="font-headline">Reporte de Pedidos</CardTitle><CardDescription>Resumen y detalle de pedidos en el período seleccionado.</CardDescription></div>
            <div className="flex flex-wrap gap-2">
               <Popover>
                <PopoverTrigger asChild>
                  <Button id="ordersDateRangePicker" variant={"outline"} className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !ordersDateRange && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {ordersDateRange?.from ? (ordersDateRange.to ? `${format(ordersDateRange.from, "dd LLL, y", { locale: es })} - ${format(ordersDateRange.to, "dd LLL, y", { locale: es })}` : format(ordersDateRange.from, "dd LLL, y", { locale: es })) : <span>Seleccionar rango (Pedidos)</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end"><Calendar initialFocus mode="range" defaultMonth={ordersDateRange?.from} selected={ordersDateRange} onSelect={setOrdersDateRange} numberOfMonths={2} locale={es} disabled={(date) => date > new Date() || date < new Date("2000-01-01")} /></PopoverContent>
              </Popover>
               <Button onClick={handlePrintOrdersReport} variant="outline" size="sm"><Printer className="mr-2 h-4 w-4" /> Imprimir Reporte</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle><ClipboardList className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{ordersSummary.totalOrders}</p></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Valor Total Pedidos</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(ordersSummary.totalValue)}</p></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pedidos Completados</CardTitle><CheckCircle className="h-4 w-4 text-green-500" /></CardHeader><CardContent><p className="text-2xl font-bold">{ordersSummary.completedOrders}</p></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pedidos Cancelados</CardTitle><Ban className="h-4 w-4 text-destructive" /></CardHeader><CardContent><p className="text-2xl font-bold">{ordersSummary.cancelledOrders}</p></CardContent></Card>
            </div>
             {ordersForPeriod.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground"><ClipboardList className="mx-auto h-12 w-12 mb-4" /><p className="text-lg">No hay pedidos en el período seleccionado.</p></div>
            ) : (
                <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Pedido #</TableHead><TableHead>Fecha</TableHead><TableHead>Cliente</TableHead><TableHead className="text-right">Monto</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader><TableBody>
                  {ordersForPeriod.map(order => (<TableRow key={order.id}><TableCell className="font-mono">{order.orderNumber}</TableCell><TableCell>{format(order.timestampDate, 'dd MMM yy, HH:mm', {locale: es})}</TableCell><TableCell>{order.customerName}</TableCell><TableCell className="text-right">{formatCurrency(order.totalAmount)}</TableCell><TableCell><Badge variant="outline">{ORDER_STATUS_MAP[order.status]}</Badge></TableCell></TableRow>))}
                </TableBody></Table></div>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div><CardTitle className="font-headline">Detalle de Operaciones de Venta</CardTitle><CardDescription>Lista de ventas individuales. {tablePeriodDescription}.</CardDescription></div>
                 <div className="flex gap-2 items-center sm:justify-end flex-wrap">
                    <Button onClick={handleExport} variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Exportar CSV</Button>
                    <Button onClick={handlePrintOperationsReport} variant="outline" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90"><Printer className="mr-2 h-4 w-4" /> Imprimir Detalle</Button>
                </div>
            </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
             <Popover>
                <PopoverTrigger asChild>
                  <Button id="tableDateRangePicker" variant={"outline"} className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !tableDateRange && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tableDateRange?.from ? (tableDateRange.to ? `${format(tableDateRange.from, "dd LLL, y", { locale: es })} - ${format(tableDateRange.to, "dd LLL, y", { locale: es })}` : format(tableDateRange.from, "dd LLL, y", { locale: es })) : <span>Seleccionar rango (Tabla)</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={tableDateRange?.from} selected={tableDateRange} onSelect={setTableDateRange} numberOfMonths={2} locale={es} disabled={(date) => date > new Date() || date < new Date("2000-01-01")} /></PopoverContent>
              </Popover>
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar por ID, cliente, producto..." className="pl-8 w-full" value={detailSearchTerm} onChange={(e) => setDetailSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <Select value={detailPaymentMethodFilter} onValueChange={(value) => setDetailPaymentMethodFilter(value as PaymentMethodFilter)}>
                  <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Método de Pago" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todo Pago</SelectItem><SelectItem value="cash">Efectivo</SelectItem><SelectItem value="transfer">Transferencia</SelectItem><SelectItem value="invoice">Factura</SelectItem></SelectContent>
                </Select>
                <Select value={detailOriginFilter} onValueChange={(value) => setDetailOriginFilter(value as OriginFilter)}>
                  <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Origen Venta" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todo Origen</SelectItem><SelectItem value="pos">Venta Directa (POS)</SelectItem><SelectItem value="order">Pedido</SelectItem></SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {detailedOperations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground"><ShoppingBag className="mx-auto h-12 w-12 mb-4" /><p className="text-lg">No hay operaciones que coincidan con los filtros y el rango de fechas.</p></div>
          ) : (
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>ID Venta</TableHead><TableHead>Fecha Venta</TableHead><TableHead>Origen</TableHead><TableHead>Cliente</TableHead><TableHead className="text-center">Items</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Método Pago</TableHead></TableRow></TableHeader><TableBody>
              {detailedOperations.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono text-xs">{sale.id.substring(0,8)}...</TableCell>
                  <TableCell>{format(sale.timestampDate, "dd MMM yy, HH:mm", { locale: es })}</TableCell>
                  <TableCell><Badge variant={sale.origin === 'pos' ? 'default' : 'secondary'}>{sale.origin === 'pos' ? 'POS' : 'Pedido'}</Badge></TableCell>
                  <TableCell>{sale.customerName || <span className="text-muted-foreground/70">N/A</span>}</TableCell>
                  <TableCell className="text-center">{sale.items.reduce((sum, item) => sum + (item.quantity || 0), 0)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(sale.totalAmount)}</TableCell>
                  <TableCell><Badge variant={sale.paymentMethod === 'cash' ? 'secondary' : sale.paymentMethod === 'transfer' ? 'outline' : 'default'}>{(sale.paymentMethod).charAt(0).toUpperCase() + (sale.paymentMethod).slice(1)}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody></Table></div>
          )}
        </CardContent>
      </Card>

      {isPrintingOperationsReport && ReactDOM.createPortal(<div id="printableOperationsReportArea"><OperationsReportPrintLayout reportTitle="Reporte Detallado de Operaciones" periodDescription={periodDescriptionForPrint} operations={detailedOperations} appSettings={appSettings} businessSettings={businessSettings}/></div>, document.body)}
      {isPrintingOrdersReport && ReactDOM.createPortal(<div id="printableOrdersReportArea"><OrdersReportLayout reportTitle="Reporte Detallado de Pedidos" periodDescription={ordersPeriodDescription} orders={ordersForPeriod as (Order & {timestampDate: Date})[]} summary={ordersSummary} appSettings={appSettings} businessSettings={businessSettings} /></div>, document.body)}
    </div>
  );
}
