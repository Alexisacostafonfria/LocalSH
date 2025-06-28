// src/app/(main)/sales/page.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom'; // Import ReactDOM for Portals
import { PlusCircle, ShoppingCart, Printer, Search, Filter, CalendarIcon, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import InvoiceContractPrintLayout from '@/components/sales/InvoiceContractPrintLayout';
import PrintOptionsDialog from '@/components/sales/PrintOptionsDialog'; // Import new dialog
import SaleA4Layout from '@/components/sales/SaleA4Layout'; // Import new A4 layout
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
  const [products, setProducts] = useLocalStorageState<Product[]>('products', []);
  const [customers, setCustomers] = useLocalStorageState<Customer[]>('customers', []);
  const [appSettings] = useLocalStorageState<AppSettings>('appSettings', DEFAULT_APP_SETTINGS);
  const [businessSettings] = useLocalStorageState<BusinessSettings>('businessSettings', DEFAULT_BUSINESS_SETTINGS);
  const [accountingSettings] = useLocalStorageState<AccountingSettings>('accountingSettings', DEFAULT_ACCOUNTING_SETTINGS);

  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<'cash' | 'transfer' | 'invoice' | ''>('');
  
  const [filterDateRange, setFilterDateRange] = useState<DateRange | undefined>(() => {
    const today = startOfDay(new Date());
    if (accountingSettings.isDayOpen && accountingSettings.currentOperationalDate && isValid(parseISO(accountingSettings.currentOperationalDate))) {
      const opDate = startOfDay(parseISO(accountingSettings.currentOperationalDate));
      return { from: opDate, to: opDate };
    }
    return { from: subDays(today, 6), to: today };
  });
  
  const [saleForPrintOptions, setSaleForPrintOptions] = useState<Sale | null>(null);
  const [saleToPrint, setSaleToPrint] = useState<Sale | null>(null);
  const [contractToPrint, setContractToPrint] = useState<{sale: Sale, customer: Customer | undefined} | null>(null);
  const [printFormat, setPrintFormat] = useState<'a4' | 'receipt' | null>(null);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    setIsClientMounted(true);
    setIsLoadingProducts(false);
  }, []);

  const handleAddSale = (newSale: Sale) => {
    // Check if this is the first invoice sale for this customer
    const isFirstInvoice = newSale.paymentMethod === 'invoice' && newSale.customerId &&
      !sales.some(s => s.customerId === newSale.customerId && s.paymentMethod === 'invoice' && s.id !== newSale.id);

    setSales(prevSales => [newSale, ...prevSales].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    
    // Stock is now deducted for ALL sales, including invoices, as the goods have left the inventory.
    const updatedProducts = products.map(p => {
        const itemSold = newSale.items.find(item => item.productId === p.id);
        if (itemSold) {
            const newStock = p.stock - itemSold.quantity;
            return { ...p, stock: Math.max(0, newStock) };
        }
        return p;
    });
    setProducts(updatedProducts);

    toast({
        title: "Venta Registrada",
        description: `Venta ${newSale.id.substring(0,8)} completada.`,
    });

    if (isFirstInvoice) {
        handleInitiateContractPrint(newSale);
    } else {
        setSaleForPrintOptions(newSale);
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

    if (filterDateRange?.from) {
      const startDate = startOfDay(filterDateRange.from);
      const endDate = filterDateRange.to ? endOfDay(filterDateRange.to) : endOfDay(filterDateRange.from);
      
      salesToFilter = salesToFilter.filter(sale => {
        const saleDate = getSaleDateForFilter(sale);
        return isWithinInterval(saleDate, { start: startDate, end: endDate });
      });
    }

    return salesToFilter.filter(sale =>
      (sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      sale.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (filterPaymentMethod === '' || sale.paymentMethod === filterPaymentMethod)
    );
  }, [sales, searchTerm, filterPaymentMethod, filterDateRange, getSaleDateForFilter]);
  
  const handleSelectPrintFormat = (format: 'a4' | 'receipt') => {
    if (!saleForPrintOptions) return;
    setPrintFormat(format);
    setSaleToPrint(saleForPrintOptions);
    setSaleForPrintOptions(null);
    setIsPrinting(true);
  };

  const handleInitiateContractPrint = useCallback((sale: Sale) => {
    const customerForContract = customers.find(c => c.id === sale.customerId);
    setContractToPrint({sale, customer: customerForContract});
    setSaleToPrint(null);
    setPrintFormat(null);
    setIsPrinting(true);
  }, [customers]);

  useEffect(() => {
    if (isPrinting && (saleToPrint || contractToPrint) && isClientMounted) {
      const timer = setTimeout(() => {
        window.print();
      }, 750); 

      const handleAfterPrint = () => {
        setIsPrinting(false);
        setSaleToPrint(null);
        setContractToPrint(null);
        setPrintFormat(null);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
      window.addEventListener('afterprint', handleAfterPrint);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [isPrinting, saleToPrint, contractToPrint, isClientMounted]);
  
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
      
      {fetchError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
      )}

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
                  onValueChange={(value) => setFilterPaymentMethod(value === 'all' ? '' : value as 'cash' | 'transfer' | 'invoice' | '')}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Método de Pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                    <SelectItem value="invoice">Factura</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingProducts ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ShoppingCart className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg">No hay ventas registradas para los filtros seleccionados.</p>
              <p>Intenta ajustar la búsqueda o el rango de fechas.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Venta/Factura</TableHead>
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
                       <Badge variant={sale.paymentMethod === 'cash' ? 'secondary' : sale.paymentMethod === 'transfer' ? 'outline' : 'default'}>
                         {sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setSaleForPrintOptions(sale)} title="Imprimir Recibo/Factura">
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
      
      {saleForPrintOptions && isClientMounted && (
        <PrintOptionsDialog
            isOpen={!!saleForPrintOptions}
            onClose={() => setSaleForPrintOptions(null)}
            onSelectFormat={handleSelectPrintFormat}
        />
      )}

      {isPrinting && isClientMounted && typeof document !== 'undefined' &&
        ReactDOM.createPortal(
          <>
            {contractToPrint && (
              <div id="printableInvoiceContractArea">
                <InvoiceContractPrintLayout 
                  sale={contractToPrint.sale} 
                  customer={contractToPrint.customer}
                  appSettings={appSettings}
                  businessSettings={businessSettings} 
                />
              </div>
            )}
            {saleToPrint && printFormat === 'receipt' && (
              <div id="printable-receipt-area">
                <SaleReceipt 
                  sale={saleToPrint} 
                  appSettings={appSettings}
                  businessSettings={businessSettings} 
                />
              </div>
            )}
            {saleToPrint && printFormat === 'a4' && (
              <div id="printableSaleA4Area">
                <SaleA4Layout 
                  sale={saleToPrint} 
                  appSettings={appSettings}
                  businessSettings={businessSettings} 
                />
              </div>
            )}
          </>,
          document.body
        )
      }
    </div>
  );
}
