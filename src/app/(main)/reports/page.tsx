

// src/app/(main)/reports/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product, Sale, AppSettings, DEFAULT_APP_SETTINGS, BusinessSettings, DEFAULT_BUSINESS_SETTINGS, CashPaymentDetails, TransferPaymentDetails } from '@/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isWithinInterval, subDays, subWeeks, subMonths, startOfDay, endOfDay, addWeeks, addMonths, isValid, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Download, BarChart3, Coins, ShoppingBag, ArchiveRestore, TrendingUp, PieChart, Search, Filter, Printer, CalendarIcon, Loader2, AlertTriangle, Package, Layers } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import OperationsReportPrintLayout from '@/components/reports/OperationsReportPrintLayout';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { cn } from '@/lib/utils';


type ChartType = 'bar' | 'line';
type PaymentMethodFilter = 'all' | 'cash' | 'transfer';
type OriginFilter = 'all' | 'pos' | 'order';

export default function ReportsPage() {
  const [sales] = useLocalStorageState<Sale[]>('sales', []);
  const [products] = useLocalStorageState<Product[]>('products', []);
  const [appSettings] = useLocalStorageState<AppSettings>('appSettings', DEFAULT_APP_SETTINGS);
  const [businessSettings] = useLocalStorageState<BusinessSettings>('businessSettings', DEFAULT_BUSINESS_SETTINGS);
  
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const today = useMemo(() => startOfDay(new Date()), []);
  
  const [chartDateRange, setChartDateRange] = useState<DateRange | undefined>({
    from: subDays(today, 6),
    to: today,
  });
  const [tableDateRange, setTableDateRange] = useState<DateRange | undefined>({
    from: subDays(today, 6),
    to: today,
  });

  const [chartType, setChartType] = useState<ChartType>('bar');
  const [detailSearchTerm, setDetailSearchTerm] = useState('');
  const [detailPaymentMethodFilter, setDetailPaymentMethodFilter] = useState<PaymentMethodFilter>('all');
  const [detailOriginFilter, setDetailOriginFilter] = useState<OriginFilter>('all');
  const [isPrintingOperationsReport, setIsPrintingOperationsReport] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    // With localStorage, loading is synchronous.
    setIsLoadingProducts(false);
  }, []);

  const getSaleDate = useMemo(() => (sale: Sale): Date => {
    return sale.operationalDate && isValid(parseISO(sale.operationalDate)) 
      ? parseISO(sale.operationalDate) 
      : parseISO(sale.timestamp);
  }, []);

  const salesForChartPeriod = useMemo(() => {
    if (!chartDateRange?.from || !chartDateRange?.to) {
      return [];
    }
    const startDate = startOfDay(chartDateRange.from);
    const endDate = endOfDay(chartDateRange.to);

    return sales.filter(sale =>
      isWithinInterval(getSaleDate(sale), { start: startDate, end: endDate })
    );
  }, [sales, chartDateRange, getSaleDate]);

  const salesForTablePeriod = useMemo(() => {
    if (!tableDateRange?.from || !tableDateRange?.to) {
      return [];
    }
    const startDate = startOfDay(tableDateRange.from);
    const endDate = endOfDay(tableDateRange.to);
    return sales.filter(sale => 
        isWithinInterval(getSaleDate(sale), { start: startDate, end: endDate})
    );
  }, [sales, tableDateRange, getSaleDate]);


  const salesDataForChart = useMemo(() => {
    if (!chartDateRange?.from || !chartDateRange?.to || salesForChartPeriod.length === 0) {
      return [];
    }
  
    const startDate = startOfDay(chartDateRange.from);
    const endDate = endOfDay(chartDateRange.to);
    const diffInDays = differenceInDays(endDate, startDate);
  
    let dateFormat: string;
    let aggregateBy: 'day' | 'week' | 'month';
  
    if (diffInDays <= 31) {
      aggregateBy = 'day';
      dateFormat = "dd MMM";
    } else if (diffInDays <= 182) {
      aggregateBy = 'week';
      dateFormat = "'Sem' W, yy";
    } else {
      aggregateBy = 'month';
      dateFormat = "MMM yyyy";
    }
  
    const aggregatedData: { [key: string]: number } = {};
    salesForChartPeriod.forEach(sale => {
      let periodKey: string;
      const saleDate = getSaleDate(sale);
      if (aggregateBy === 'day') periodKey = format(saleDate, 'yyyy-MM-dd');
      else if (aggregateBy === 'week') periodKey = format(startOfWeek(saleDate, { locale: es }), 'yyyy-MM-dd');
      else periodKey = format(startOfMonth(saleDate), 'yyyy-MM');
  
      aggregatedData[periodKey] = (aggregatedData[periodKey] || 0) + sale.totalAmount;
    });
  
    const chartDataPoints: { name: string, Ventas: number }[] = [];
      
    if (aggregateBy === 'day') {
      eachDayOfInterval({ start: startDate, end: endDate }).forEach(day => {
        const periodKey = format(day, 'yyyy-MM-dd');
        chartDataPoints.push({
          name: format(day, dateFormat, { locale: es }),
          Ventas: aggregatedData[periodKey] || 0,
        });
      });
    } else if (aggregateBy === 'week') {
      let currentDatePointer = startOfWeek(startDate, { locale: es });
      while (currentDatePointer <= endDate) {
        const periodKey = format(currentDatePointer, 'yyyy-MM-dd');
        chartDataPoints.push({
          name: format(currentDatePointer, dateFormat, { locale: es }),
          Ventas: aggregatedData[periodKey] || 0,
        });
        currentDatePointer = addWeeks(currentDatePointer, 1);
      }
    } else { 
      let currentDatePointer = startOfMonth(startDate);
      while (currentDatePointer <= endDate) {
        const periodKey = format(currentDatePointer, 'yyyy-MM');
        chartDataPoints.push({
          name: format(currentDatePointer, dateFormat, { locale: es }),
          Ventas: aggregatedData[periodKey] || 0,
        });
        currentDatePointer = addMonths(currentDatePointer, 1);
      }
    }
    return chartDataPoints;
  }, [salesForChartPeriod, chartDateRange, getSaleDate]);
  
  const totalSalesValueForChartPeriod = useMemo(() => {
    return salesForChartPeriod.reduce((sum, sale) => sum + sale.totalAmount, 0);
  }, [salesForChartPeriod]);
  
  const averageSalesValueForChartPeriod = useMemo(() => {
    if (salesForChartPeriod.length === 0) return 0;
    return totalSalesValueForChartPeriod / salesForChartPeriod.length;
  }, [salesForChartPeriod, totalSalesValueForChartPeriod]);

  const totalTransactionsForChartPeriod = useMemo(() => {
    return salesForChartPeriod.length;
  }, [salesForChartPeriod]);

  const totalTipsValueForChartPeriod = useMemo(() => {
    return salesForChartPeriod.reduce((sum, sale) => {
      if (sale.paymentMethod === 'cash' && sale.paymentDetails && typeof (sale.paymentDetails as CashPaymentDetails).tip === 'number') {
        return sum + ((sale.paymentDetails as CashPaymentDetails).tip || 0);
      }
      return sum;
    }, 0);
  }, [salesForChartPeriod]);

  const totalCogsValueForChartPeriod = useMemo(() => {
    if (isLoadingProducts) return 0;
    return salesForChartPeriod.reduce((totalCogs, sale) => {
      const saleCogs = sale.items.reduce((currentSaleCogs, item) => {
        const product = products.find(p => p.id === item.productId);
        const costPrice = product?.costPrice || 0;
        return currentSaleCogs + (costPrice * item.quantity);
      }, 0);
      return totalCogs + saleCogs;
    }, 0);
  }, [salesForChartPeriod, products, isLoadingProducts]);

  const totalProfitValueForChartPeriod = useMemo(() => {
    return totalSalesValueForChartPeriod - totalCogsValueForChartPeriod;
  }, [totalSalesValueForChartPeriod, totalCogsValueForChartPeriod]);

  const salesFromPos = useMemo(() => salesForChartPeriod.filter(s => s.origin === 'pos').reduce((sum, s) => sum + s.totalAmount, 0), [salesForChartPeriod]);
  const salesFromOrders = useMemo(() => salesForChartPeriod.filter(s => s.origin === 'order').reduce((sum, s) => sum + s.totalAmount, 0), [salesForChartPeriod]);


  const detailedOperations = useMemo(() => {
    return salesForTablePeriod // Use salesForTablePeriod here
      .filter(sale => 
        (detailPaymentMethodFilter === 'all' || sale.paymentMethod === detailPaymentMethodFilter) &&
        (detailOriginFilter === 'all' || sale.origin === detailOriginFilter) &&
        (
          sale.id.toLowerCase().includes(detailSearchTerm.toLowerCase()) ||
          (sale.customerName && sale.customerName.toLowerCase().includes(detailSearchTerm.toLowerCase())) ||
          sale.items.some(item => item.productName.toLowerCase().includes(detailSearchTerm.toLowerCase())) ||
          (sale.operationalDate && format(parseISO(sale.operationalDate), "dd/MM/yyyy", { locale: es }).includes(detailSearchTerm)) ||
          (format(parseISO(sale.timestamp), "dd/MM/yyyy").includes(detailSearchTerm))
        )
      )
      .sort((a,b) => getSaleDate(b).getTime() - getSaleDate(a).getTime());
  }, [salesForTablePeriod, detailSearchTerm, detailPaymentMethodFilter, detailOriginFilter, getSaleDate]);


  const handleExport = () => {
    if (detailedOperations.length === 0) { // Based on detailedOperations (table data)
      toast({title: "Nada que Exportar", description:"No hay datos para exportar en el periodo y filtros de tabla seleccionados.", variant: "warning"});
      return;
    }
    const headers = "ID Venta,Timestamp,Fecha Operativa,Origen,ID Pedido,Cliente,Items (Cantidad Total),SubTotal,Descuento,Total Venta,Metodo Pago,Monto Recibido (Efectivo),Cambio (Efectivo),Propina (Efectivo),Referencia (Transferencia)\n";
    const csvRows = detailedOperations.map(sale => {
      const itemsCount = sale.items.reduce((acc, item) => acc + item.quantity, 0);
      const cashDetails = sale.paymentMethod === 'cash' ? sale.paymentDetails as CashPaymentDetails : null;
      const transferDetails = sale.paymentMethod === 'transfer' ? sale.paymentDetails as TransferPaymentDetails : null;
      
      return [
        sale.id,
        format(parseISO(sale.timestamp), "yyyy-MM-dd HH:mm:ss"),
        sale.operationalDate ? format(parseISO(sale.operationalDate), "yyyy-MM-dd") : format(parseISO(sale.timestamp), "yyyy-MM-dd"),
        sale.origin,
        sale.orderId || 'N/A',
        `"${sale.customerName || 'N/A'}"`,
        itemsCount,
        sale.subTotal.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        (sale.discount || 0).toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        sale.totalAmount.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        sale.paymentMethod,
        cashDetails ? cashDetails.amountReceived.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        cashDetails ? cashDetails.changeGiven.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        cashDetails ? (cashDetails.tip || 0).toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        transferDetails ? `"${transferDetails.reference || ''}"` : '',
      ].join(',');
    });
    const csvString = headers + csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      const fromDateStr = tableDateRange?.from ? format(tableDateRange.from, "yyyyMMdd") : 'inicio';
      const toDateStr = tableDateRange?.to ? format(tableDateRange.to, "yyyyMMdd") : 'fin';
      link.setAttribute("download", `reporte_ventas_detalle_${fromDateStr}_${toDateStr}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    toast({title: "Exportación CSV Iniciada", description: "El archivo se está descargando."});
  };

  const periodDescriptionForPrint = useMemo(() => {
    if (!tableDateRange?.from || !tableDateRange?.to) { // Use tableDateRange for print description
      return "Rango no seleccionado";
    }
    return `Del ${format(tableDateRange.from, "dd MMM yyyy", { locale: es })} al ${format(tableDateRange.to, "dd MMM yyyy", { locale: es })}`;
  }, [tableDateRange]);

  const handlePrintOperationsReport = () => {
    if (detailedOperations.length === 0) {
      toast({
        title: "Nada que Imprimir",
        description: "No hay operaciones en la tabla para el periodo/filtros seleccionados.",
        variant: "warning" 
      });
      return;
    }
    setIsPrintingOperationsReport(true);
  };

  useEffect(() => {
    if (isPrintingOperationsReport && detailedOperations.length > 0) {
      const timer = setTimeout(() => {
        window.print();
      }, 300); 

      const handleAfterPrint = () => {
        setIsPrintingOperationsReport(false);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
      window.addEventListener('afterprint', handleAfterPrint);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [isPrintingOperationsReport, detailedOperations]);


  const ChartComponent = chartType === 'bar' ? BarChart : LineChart;
  const ChartElement = chartType === 'bar' ? Bar : Line;
  
  const chartPeriodDescription = useMemo(() => {
    if (!chartDateRange?.from || !chartDateRange?.to) return "Rango no seleccionado";
    return `Datos del ${format(chartDateRange.from, "dd LLL, y", {locale: es})} al ${format(chartDateRange.to, "dd LLL, y", {locale: es})}`;
  }, [chartDateRange]);

  const tablePeriodDescription = useMemo(() => {
    if (!tableDateRange?.from || !tableDateRange?.to) return "Rango no seleccionado";
    return `Mostrando datos del ${format(tableDateRange.from, "dd LLL, y", {locale: es})} al ${format(tableDateRange.to, "dd LLL, y", {locale: es})}`;
  }, [tableDateRange]);


  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reportes de Ventas" description="Analiza el rendimiento de tus ventas con gráficos y datos detallados." />
      
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
            <CardDescription>Indicadores clave basados en el rango seleccionado para el gráfico de ventas.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoadingProducts ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent><p className="text-2xl font-bold">{appSettings.currencySymbol}{totalSalesValueForChartPeriod.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Ganancia Total</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent><p className="text-2xl font-bold">{appSettings.currencySymbol}{totalProfitValueForChartPeriod.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Ventas Directas (POS)</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent><p className="text-2xl font-bold">{appSettings.currencySymbol}{salesFromPos.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></CardContent>
                </Card>
                 <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Ventas por Pedidos</CardTitle>
                      <Layers className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent><p className="text-2xl font-bold">{appSettings.currencySymbol}{salesFromOrders.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Costo Bienes Vendidos</CardTitle>
                      <ArchiveRestore className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent><p className="text-2xl font-bold">{appSettings.currencySymbol}{totalCogsValueForChartPeriod.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Promedio Venta</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent><p className="text-2xl font-bold">{appSettings.currencySymbol}{averageSalesValueForChartPeriod.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
                      <PieChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent><p className="text-2xl font-bold">{totalTransactionsForChartPeriod}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Propinas</CardTitle>
                      <Coins className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent><p className="text-2xl font-bold">{appSettings.currencySymbol}{totalTipsValueForChartPeriod.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></CardContent>
                </Card>
            </div>
            )}
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="font-headline">Visualización de Ventas Agregadas</CardTitle>
              <CardDescription>Selecciona el rango de fechas y tipo de gráfico para ver las tendencias.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="chartDateRangePicker"
                    variant={"outline"}
                    className={cn(
                      "w-full sm:w-[280px] justify-start text-left font-normal",
                      !chartDateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {chartDateRange?.from ? (
                      chartDateRange.to ? (
                        <>
                          {format(chartDateRange.from, "dd LLL, y", { locale: es })} - {format(chartDateRange.to, "dd LLL, y", { locale: es })}
                        </>
                      ) : (
                        format(chartDateRange.from, "dd LLL, y", { locale: es })
                      )
                    ) : (
                      <span>Seleccionar rango (Gráfico)</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={chartDateRange?.from}
                    selected={chartDateRange}
                    onSelect={setChartDateRange}
                    numberOfMonths={2}
                    locale={es}
                    disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                  />
                </PopoverContent>
              </Popover>
              <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue placeholder="Tipo Gráfico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Barras</SelectItem>
                  <SelectItem value="line">Líneas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[400px] w-full pt-6">
          {salesDataForChart.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                {(sales.length === 0 || salesForChartPeriod.length === 0) 
                  ? "No hay datos de ventas para el periodo seleccionado para el gráfico."
                  : "No hay datos de ventas para mostrar en el gráfico."}
            </div>
           ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ChartComponent data={salesDataForChart} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value: number) => `${appSettings.currencySymbol}${value.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} 
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }}
                  cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.3 }}
                  formatter={(value: number) => [`${appSettings.currencySymbol}${value.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "Ventas"]}
                />
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
                <div>
                    <CardTitle className="font-headline">Detalle de Operaciones</CardTitle>
                    <CardDescription>
                        Lista de todas las ventas individuales. {tablePeriodDescription}.
                    </CardDescription>
                </div>
                 <div className="flex gap-2 items-center sm:justify-end flex-wrap">
                    <Button onClick={handleExport} variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" /> Exportar CSV
                    </Button>
                    <Button onClick={handlePrintOperationsReport} variant="outline" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Printer className="mr-2 h-4 w-4" /> Imprimir Detalle
                    </Button>
                </div>
            </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
             <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="tableDateRangePicker"
                    variant={"outline"}
                    className={cn(
                      "w-full sm:w-[280px] justify-start text-left font-normal",
                      !tableDateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tableDateRange?.from ? (
                      tableDateRange.to ? (
                        <>
                          {format(tableDateRange.from, "dd LLL, y", { locale: es })} - {format(tableDateRange.to, "dd LLL, y", { locale: es })}
                        </>
                      ) : (
                        format(tableDateRange.from, "dd LLL, y", { locale: es })
                      )
                    ) : (
                      <span>Seleccionar rango (Tabla)</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={tableDateRange?.from}
                    selected={tableDateRange}
                    onSelect={setTableDateRange}
                    numberOfMonths={2}
                    locale={es}
                    disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                  />
                </PopoverContent>
              </Popover>
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por ID, cliente, producto, fecha (dd/MM/yyyy)..."
                className="pl-8 w-full"
                value={detailSearchTerm}
                onChange={(e) => setDetailSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <Select 
                  value={detailPaymentMethodFilter} 
                  onValueChange={(value) => setDetailPaymentMethodFilter(value as PaymentMethodFilter)}
                >
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Método de Pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo Pago</SelectItem>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
                <Select 
                  value={detailOriginFilter} 
                  onValueChange={(value) => setDetailOriginFilter(value as OriginFilter)}
                >
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Origen Venta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo Origen</SelectItem>
                    <SelectItem value="pos">Venta Directa (POS)</SelectItem>
                    <SelectItem value="order">Pedido</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {detailedOperations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ShoppingBag className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg">No hay operaciones que coincidan con los filtros y el rango de fechas seleccionado para la tabla.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Venta</TableHead>
                    <TableHead>Fecha Venta</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Método Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailedOperations.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-xs">{sale.id.substring(0,8)}...</TableCell>
                      <TableCell>{format(parseISO(sale.timestamp), "dd MMM yy, HH:mm", { locale: es })}</TableCell>
                      <TableCell>
                        <Badge variant={sale.origin === 'pos' ? 'default' : 'secondary'}>
                          {sale.origin === 'pos' ? 'POS' : 'Pedido'}
                        </Badge>
                      </TableCell>
                      <TableCell>{sale.customerName || <span className="text-muted-foreground/70">N/A</span>}</TableCell>
                      <TableCell className="text-center">{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {appSettings.currencySymbol}{sale.totalAmount.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sale.paymentMethod === 'cash' ? 'secondary' : 'outline'}>
                          {sale.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {isPrintingOperationsReport && typeof document !== 'undefined' &&
        ReactDOM.createPortal(
          <div id="printableOperationsReportArea">
            <OperationsReportPrintLayout
              reportTitle="Reporte Detallado de Operaciones"
              periodDescription={periodDescriptionForPrint}
              operations={detailedOperations}
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
