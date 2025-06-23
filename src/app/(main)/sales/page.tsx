
// src/app/(main)/sales/page.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom'; // Import ReactDOM for Portals
import { PlusCircle, ShoppingCart, Printer, Search, Filter, CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sale, Product, Customer, AppSettings, DEFAULT_APP_SETTINGS, BusinessSettings, DEFAULT_BUSINESS_SETTINGS, AccountingSettings, DEFAULT_ACCOUNTING_SETTINGS } from '@/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import SaleDialog from '@/components/sales/SaleDialog';
import SaleReceipt from '@/components/sales/SaleReceipt';
import { format, parseISO, isValid, startOfDay, endOfDay, isWithinInterval, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DateRange } from "react-day-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function SalesPage() {
  const [sales, setSales] = useLocalStorageState<Sale[]>('sales', []);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useLocalStorageState<Customer[]>('customers', []);
  const [appSettings] = useLocalStorageState<AppSettings>('appSettings', DEFAULT_APP_SETTINGS);
  const [businessSettings] = useLocalStorageState<BusinessSettings>('businessSettings', DEFAULT_BUSINESS_SETTINGS);
  const [accountingSettings] = useLocalStorageState<AccountingSettings>('accountingSettings', DEFAULT_ACCOUNTING_SETTINGS);

  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<'cash' | 'transfer' | ''>('');
  
  const [filterDateRange, setFilterDateRange] = useState<DateRange | undefined>(() => {
    const today = startOfDay(new Date());
    if (accountingSettings.isDayOpen && accountingSettings.currentOperationalDate && isValid(parseISO(accountingSettings.currentOperationalDate))) {
      const opDate = startOfDay(parseISO(accountingSettings.currentOperationalDate));
      return { from: opDate, to: opDate };
    }
    return { from: subDays(today, 6), to: today }; // Default to last 7 days if no operational day
  });
  
  const [saleToPrint, setSaleToPrint] = useState<Sale | null>(null);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
        const response = await fetch('/api/products');
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data);
    } catch (error) {
        console.error(error);
        toast({
            title: "Error de Red",
            description: "No se pudieron cargar los productos.",
            variant: "destructive",
        });
    } finally {
        setIsLoadingProducts(false);
    }
  }, [toast]);

  useEffect(() => {
    setIsClientMounted(true);
    fetchProducts();
  }, [fetchProducts]);

  // Effect to update filterDateRange if operational day changes after mount
  useEffect(() => {
    if (accountingSettings.isDayOpen && accountingSettings.currentOperationalDate && isValid(parseISO(accountingSettings.currentOperationalDate))) {
      const opDate = startOfDay(parseISO(accountingSettings.currentOperationalDate));
      if (!filterDateRange || !filterDateRange.from || !filterDateRange.to || 
          format(filterDateRange.from, 'yyyy-MM-dd') !== format(opDate, 'yyyy-MM-dd') ||
          format(filterDateRange.to, 'yyyy-MM-dd') !== format(opDate, 'yyyy-MM-dd')
         ) {
          // This logic might need refinement based on desired UX for "stickiness" of user-selected range vs. auto-switching to new op day.
          // For now, if an operational day starts, it defaults to filtering by it.
          // setFilterDateRange({ from: opDate, to: opDate });
      }
    }
  }, [accountingSettings.currentOperationalDate, accountingSettings.isDayOpen, filterDateRange]);


  const handleAddSale = async (newSale: Sale) => {
    // Add sale to local storage first
    setSales(prevSales => [newSale, ...prevSales].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    
    // Then, update product stock in the database
    try {
      const stockUpdatePromises = newSale.items.map(item => {
        return fetch(`/api/products/${item.productId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stockChange: -item.quantity }),
        });
      });
  
      const responses = await Promise.all(stockUpdatePromises);
      const failedUpdates = responses.filter(res => !res.ok);
  
      if (failedUpdates.length > 0) {
        toast({
          title: "Error al actualizar stock",
          description: "Algunos productos no pudieron ser actualizados. Por favor, revise el inventario manualmente.",
          variant: "destructive",
        });
        const errorDetails = await Promise.all(failedUpdates.map(r => r.json()));
        console.error("Failed to update stock for some items:", errorDetails);
      }
      
      // Refetch products to update UI everywhere with latest stock
      await fetchProducts();

    } catch (error) {
      console.error("Error during stock update process:", error);
      toast({
        title: "Error grave al actualizar stock",
        description: "No se pudo conectar con el servidor para actualizar el stock.",
        variant: "destructive",
      });
    }
  };

  const getSaleDateForFilter = useCallback((sale: Sale): Date => {
    if (sale.operationalDate && isValid(parseISO(sale.operationalDate))) {
      return startOfDay(parseISO(sale.operationalDate));
    }
    return startOfDay(parseISO(sale.timestamp));
  }, []);

  const filteredSales = useMemo(() => {
    let salesToFilter = [...sales].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Filter by date range
    if (filterDateRange?.from) {
      const startDate = startOfDay(filterDateRange.from);
      const endDate = filterDateRange.to ? endOfDay(filterDateRange.to) : endOfDay(filterDateRange.from);
      
      salesToFilter = salesToFilter.filter(sale => {
        const saleDate = getSaleDateForFilter(sale);
        return isWithinInterval(saleDate, { start: startDate, end: endDate });
      });
    }

    // Filter by search term and payment method
    return salesToFilter.filter(sale =>
      (sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      sale.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (filterPaymentMethod === '' || sale.paymentMethod === filterPaymentMethod)
    );
  }, [sales, searchTerm, filterPaymentMethod, filterDateRange, getSaleDateForFilter]);

  const handleInitiatePrint = useCallback((sale: Sale) => {
    setSaleToPrint(sale);
    setIsPrinting(true); 
  }, []);

  useEffect(() => {
    if (isPrinting && saleToPrint && isClientMounted) {
      const timer = setTimeout(() => {
        window.print();
      }, 750); 

      const handleAfterPrint = () => {
        setIsPrinting(false);
        setSaleToPrint(null);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
      window.addEventListener('afterprint', handleAfterPrint);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [isPrinting, saleToPrint, isClientMounted]);
  
  const dateFilterDescription = useMemo(() => {
    if (!filterDateRange?.from) return "Todas las fechas";
    const fromDateStr = format(filterDateRange.from, "dd LLL, y", { locale: es });
    if (!filterDateRange.to || format(filterDateRange.from, 'yyyy-MM-dd') === format(filterDateRange.to, 'yyyy-MM-dd')) {
      return `el ${fromDateStr}`;
    }
    const toDateStr = format(filterDateRange.to, "dd LLL, y", { locale: es });
    return `del ${fromDateStr} al ${toDateStr}`;
  }, [filterDateRange]);


  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Registro de Ventas" description="Registra nuevas transacciones y visualiza el historial de ventas.">
        <Button onClick={() => setIsSaleDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlusCircle className="mr-2 h-5 w-5" /> Registrar Venta
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Historial de Ventas</CardTitle>
          <CardDescription>Mostrando ventas para {dateFilterDescription}.</CardDescription>
           <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full sm:w-[260px] justify-start text-left font-normal",
                      !filterDateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterDateRange?.from ? (
                      filterDateRange.to ? (
                        <>
                          {format(filterDateRange.from, "dd LLL, y", {locale: es})} - {format(filterDateRange.to, "dd LLL, y", {locale: es})}
                        </>
                      ) : (
                        format(filterDateRange.from, "dd LLL, y", {locale: es})
                      )
                    ) : (
                      <span>Seleccionar rango</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={filterDateRange?.from}
                    selected={filterDateRange}
                    onSelect={setFilterDateRange}
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
                placeholder="Buscar por ID, cliente, producto..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <Select 
                  value={filterPaymentMethod === '' ? 'all' : filterPaymentMethod} 
                  onValueChange={(value) => setFilterPaymentMethod(value === 'all' ? '' : value as 'cash' | 'transfer' | '')}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Método de Pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ShoppingCart className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg">No hay ventas registradas para los filtros seleccionados.</p>
              <p>Intenta ajustar la búsqueda o el rango de fechas.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Venta</TableHead>
                  <TableHead>Fecha Venta</TableHead>
                  <TableHead>Fecha Operativa</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Método Pago</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-xs">{sale.id.substring(0,8)}...</TableCell>
                    <TableCell>{format(new Date(sale.timestamp), "dd MMM yy, HH:mm", { locale: es })}</TableCell>
                    <TableCell>
                      {sale.operationalDate && isValid(parseISO(sale.operationalDate)) 
                        ? format(parseISO(sale.operationalDate), "dd MMM yy", { locale: es }) 
                        : <span className="text-muted-foreground text-xs">N/A</span>}
                    </TableCell>
                    <TableCell>{sale.customerName || <span className="text-muted-foreground text-xs">N/A</span>}</TableCell>
                    <TableCell className="text-center">{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {appSettings.currencySymbol}{sale.totalAmount.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={sale.paymentMethod === 'cash' ? 'secondary' : 'outline'}>
                        {sale.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleInitiatePrint(sale)} title="Imprimir Recibo">
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isSaleDialogOpen && isClientMounted && (
        <SaleDialog
          isOpen={isSaleDialogOpen}
          onClose={() => setIsSaleDialogOpen(false)}
          products={products}
          customers={customers}
          onAddSale={handleAddSale}
          appSettings={appSettings}
          onUpdateCustomers={setCustomers}
        />
      )}

      {isPrinting && saleToPrint && isClientMounted && typeof document !== 'undefined' &&
        ReactDOM.createPortal(
          <div id="printable-receipt-area">
            <SaleReceipt 
              sale={saleToPrint} 
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
