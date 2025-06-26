
// src/app/(main)/accounts-receivable/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sale, AppSettings, AuthState, InvoicePaymentRecord, Customer, InvoicePaymentDetails, InvoiceStatus, BusinessSettings, DEFAULT_BUSINESS_SETTINGS } from '@/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { format, parseISO, isBefore, startOfDay, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { FileText, Search, Filter, DollarSign, Loader2, AlertTriangle, CheckCircle, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import PayInvoiceDialog from '@/components/accounts-receivable/PayInvoiceDialog';
import AccountsReceivableReportPrintLayout from '@/components/accounts-receivable/AccountsReceivableReportPrintLayout';
import { DEFAULT_APP_SETTINGS, DEFAULT_AUTH_STATE } from '@/types';

type StatusFilter = "all" | "pending" | "overdue" | "paid";

export default function AccountsReceivablePage() {
  const [sales, setSales] = useLocalStorageState<Sale[]>('sales', []);
  const [customers] = useLocalStorageState<Customer[]>('customers', []);
  const [invoicePayments, setInvoicePayments] = useLocalStorageState<InvoicePaymentRecord[]>('invoicePayments', []);
  const [appSettings] = useLocalStorageState<AppSettings>('appSettings', DEFAULT_APP_SETTINGS);
  const [businessSettings] = useLocalStorageState<BusinessSettings>('businessSettings', DEFAULT_BUSINESS_SETTINGS);
  const [authState] = useLocalStorageState<AuthState>('authData', DEFAULT_AUTH_STATE);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  
  const [payingInvoice, setPayingInvoice] = useState<Sale | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const { toast } = useToast();
  const isAdmin = authState.currentUser?.role === 'admin';

  useEffect(() => {
    setIsLoading(false);
    setIsClientMounted(true);
  }, []);
  
  const invoices = useMemo(() => {
    return sales
      .filter(sale => sale.paymentMethod === 'invoice' && sale.paymentDetails && typeof (sale.paymentDetails as InvoicePaymentDetails).dueDate === 'string')
      .map(sale => {
        const details = sale.paymentDetails as InvoicePaymentDetails;
        let effectiveStatus: InvoiceStatus = details.status;
        if (details.status === 'pending' && isValid(parseISO(details.dueDate)) && isBefore(parseISO(details.dueDate), startOfDay(new Date()))) {
            effectiveStatus = 'overdue';
        }
        return { ...sale, paymentDetails: { ...details, status: effectiveStatus } };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [sales]);

  const filteredInvoices = useMemo(() => {
    const searchTermLower = searchTerm.toLowerCase();
    return invoices.filter(invoice => {
      const details = invoice.paymentDetails as InvoicePaymentDetails;
      const customer = customers.find(c => c.id === invoice.customerId);

      const matchesSearch = searchTermLower === '' ||
        (invoice.id && invoice.id.toLowerCase().includes(searchTermLower)) ||
        (invoice.customerName && invoice.customerName.toLowerCase().includes(searchTermLower)) ||
        (customer?.personalId && customer.personalId.toLowerCase().includes(searchTermLower));
        
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'pending' && details.status === 'pending') ||
        (statusFilter === 'overdue' && details.status === 'overdue') ||
        (statusFilter === 'paid' && details.status === 'paid');
        
      if (statusFilter === 'pending' && details.status === 'overdue') {
        return matchesSearch;
      }
        
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter, customers]);

  const summary = useMemo(() => {
    const totalPending = invoices
      .filter(inv => (inv.paymentDetails as InvoicePaymentDetails).status !== 'paid')
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalOverdue = invoices
      .filter(inv => (inv.paymentDetails as InvoicePaymentDetails).status === 'overdue')
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalPaid = invoices
      .filter(inv => (inv.paymentDetails as InvoicePaymentDetails).status === 'paid')
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
      
    return { totalPending, totalOverdue, totalPaid };
  }, [invoices]);

  const handleRegisterPayment = (invoice: Sale) => {
    if (!isAdmin) {
      toast({ title: "Acceso Denegado", description: "No tienes permiso para registrar pagos.", variant: 'destructive' });
      return;
    }
    setPayingInvoice(invoice);
  };
  
  const handlePaymentSuccess = (updatedInvoice: Sale, paymentRecord: InvoicePaymentRecord) => {
    setSales(prev => prev.map(s => s.id === updatedInvoice.id ? updatedInvoice : s));
    setInvoicePayments(prev => [...prev, paymentRecord]);
    setPayingInvoice(null);
    toast({
      title: "Pago Registrado Exitosamente",
      description: `El pago para la factura #${updatedInvoice.id.substring(0,8)} ha sido registrado.`
    });
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch(status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-600/80 text-white hover:bg-green-600">Pagada</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Vencida</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline" className="border-orange-500 text-orange-500">Pendiente</Badge>;
    }
  };
  
  const handlePrintReport = () => {
    if (filteredInvoices.length === 0) {
        toast({ title: "Nada que imprimir", description: "No hay facturas que coincidan con los filtros actuales.", variant: "warning" });
        return;
    }
    setIsPrinting(true);
  };

  useEffect(() => {
    if (isPrinting && filteredInvoices.length > 0 && isClientMounted) {
        const timer = setTimeout(() => window.print(), 300);
        const handleAfterPrint = () => {
            setIsPrinting(false);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
        window.addEventListener('afterprint', handleAfterPrint);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }
  }, [isPrinting, filteredInvoices, isClientMounted]);

  const reportPeriodDescription = useMemo(() => {
    let description = `Filtro: ${statusFilter === 'all' ? 'Todos' : statusFilter === 'pending' ? 'Pendientes y Vencidas' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`;
    if (searchTerm) {
      description += ` | Búsqueda: "${searchTerm}"`;
    }
    return description;
  }, [statusFilter, searchTerm]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Cuentas por Cobrar" description="Gestiona y registra los pagos de las ventas a crédito (facturas)." />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendiente de Cobro</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appSettings.currencySymbol}{(summary.totalPending || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Suma de facturas pendientes y vencidas.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vencido</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appSettings.currencySymbol}{(summary.totalOverdue || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Facturas cuya fecha de pago ha pasado.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cobrado</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appSettings.currencySymbol}{(summary.totalPaid || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Suma histórica de facturas pagadas.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Facturas</CardTitle>
          <CardDescription>Aquí puedes ver todas las facturas emitidas y su estado de pago.</CardDescription>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por ID factura, cliente, ID personal..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Estados</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="overdue">Vencidas</SelectItem>
                  <SelectItem value="paid">Pagadas</SelectItem>
                </SelectContent>
              </Select>
               <Button onClick={handlePrintReport} variant="outline" size="sm" className="w-full sm:w-auto">
                 <Printer className="mr-2 h-4 w-4"/>Imprimir Reporte
               </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10"><Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /></div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg">No hay facturas que coincidan con los filtros.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Factura #</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha Emisión</TableHead>
                  <TableHead>Fecha Vencimiento</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const details = invoice.paymentDetails as InvoicePaymentDetails;
                  return (
                    <TableRow key={invoice.id} className={cn(details.status === 'overdue' && 'bg-destructive/10')}>
                      <TableCell className="font-mono text-xs">{invoice.id.substring(0,8)}...</TableCell>
                      <TableCell>{invoice.customerName}</TableCell>
                      <TableCell>{format(parseISO(invoice.timestamp), 'dd MMM yyyy', { locale: es })}</TableCell>
                      <TableCell>{format(parseISO(details.dueDate), 'dd MMM yyyy', { locale: es })}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {appSettings.currencySymbol}{(invoice.totalAmount || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{getStatusBadge(details.status)}</TableCell>
                      <TableCell className="text-right">
                        {(details.status === 'pending' || details.status === 'overdue') && (
                          <Button size="sm" onClick={() => handleRegisterPayment(invoice)} disabled={!isAdmin}>Registrar Pago</Button>
                        )}
                        {details.status === 'paid' && (
                           <Button size="sm" variant="outline" disabled>Pagada</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {payingInvoice && (
        <PayInvoiceDialog
          isOpen={!!payingInvoice}
          onClose={() => setPayingInvoice(null)}
          invoice={payingInvoice}
          onConfirm={handlePaymentSuccess}
          appSettings={appSettings}
        />
      )}
      
      {isPrinting && isClientMounted && typeof document !== 'undefined' &&
        ReactDOM.createPortal(
          <div id="printableAccountsReceivableReportArea">
            <AccountsReceivableReportPrintLayout
              invoices={filteredInvoices as (Sale & { paymentDetails: InvoicePaymentDetails })[]}
              summary={summary}
              appSettings={appSettings}
              businessSettings={businessSettings}
              reportPeriodDescription={reportPeriodDescription}
            />
          </div>,
          document.body
        )
      }
    </div>
  );
}
