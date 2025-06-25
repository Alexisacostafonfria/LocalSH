
// src/app/(main)/orders/page.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Order, Product, Customer, AppSettings, BusinessSettings, OrderStatus, ORDER_STATUS_MAP, PaymentDetails, Sale, AccountingSettings, DEFAULT_ACCOUNTING_SETTINGS } from '@/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import OrderDialog from '@/components/orders/OrderDialog';
import PaymentDialog from '@/components/orders/PaymentDialog'; // New
import OrderTicket from '@/components/orders/OrderTicket';
import SaleReceipt from '@/components/sales/SaleReceipt'; // For final receipt
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, MoreVertical, Printer, Package, ClipboardList, Loader2, CheckCircle, Ban, Truck, CreditCard, CookingPot } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DEFAULT_APP_SETTINGS, DEFAULT_BUSINESS_SETTINGS } from '@/types';

type TabValue = 'active' | 'ready' | 'history';

const statusColors: Record<OrderStatus, string> = {
  pending: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300',
  'in-progress': 'border-blue-500/50 bg-blue-500/10 text-blue-300',
  ready: 'border-green-500/50 bg-green-500/10 text-green-300',
  completed: 'border-gray-500/50 bg-gray-500/10 text-gray-400',
  cancelled: 'border-red-500/50 bg-red-500/10 text-red-400',
};

export default function OrdersPage() {
  const [orders, setOrders] = useLocalStorageState<Order[]>('orders', []);
  const [products, setProducts] = useLocalStorageState<Product[]>('products', []);
  const [sales, setSales] = useLocalStorageState<Sale[]>('sales', []);
  const [customers, setCustomers] = useLocalStorageState<Customer[]>('customers', []);
  const [appSettings] = useLocalStorageState<AppSettings>('appSettings', DEFAULT_APP_SETTINGS);
  const [businessSettings] = useLocalStorageState<BusinessSettings>('businessSettings', DEFAULT_BUSINESS_SETTINGS);
  const [accountingSettings] = useLocalStorageState<AccountingSettings>('accountingSettings', DEFAULT_ACCOUNTING_SETTINGS);

  const [isMounted, setIsMounted] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [orderToPay, setOrderToPay] = useState<Order | null>(null);

  const [orderToPrintPrep, setOrderToPrintPrep] = useState<Order | null>(null);
  const [saleToPrint, setSaleToPrint] = useState<Sale | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  
  const [orderToConfirm, setOrderToConfirm] = useState<{ order: Order, newStatus: OrderStatus } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleAddOrUpdateOrder = (order: Order) => {
    const existingOrderIndex = orders.findIndex(o => o.id === order.id);
    if (existingOrderIndex > -1) {
      const updatedOrders = [...orders];
      updatedOrders[existingOrderIndex] = order;
      setOrders(updatedOrders);
      toast({ title: 'Pedido Actualizado', description: `El pedido #${order.orderNumber} ha sido actualizado.` });
    } else {
      const highestOrderNumber = orders.reduce((max, o) => Math.max(max, o.orderNumber), 0);
      const newOrder = { ...order, orderNumber: highestOrderNumber + 1 };
      setOrders(prev => [newOrder, ...prev].sort((a,b) => b.orderNumber - a.orderNumber));
      toast({ title: 'Pedido Creado', description: `Se ha creado el pedido #${newOrder.orderNumber}.` });
    }
  };

  const handleStatusChange = (order: Order, newStatus: OrderStatus) => {
    if (order.status === 'completed' || order.status === 'cancelled') {
        toast({ title: 'Acción no permitida', description: 'No se puede cambiar el estado de un pedido completado o cancelado.', variant: 'destructive' });
        return;
    }
    setOrderToConfirm({ order, newStatus });
  };
  
  const confirmStatusChange = () => {
    if (!orderToConfirm) return;
    const { order, newStatus } = orderToConfirm;

    const updatedOrders = orders.map(o => o.id === order.id ? { ...o, status: newStatus } : o);
    setOrders(updatedOrders);
    
    toast({
        title: `Pedido ${ORDER_STATUS_MAP[newStatus]}`,
        description: `El pedido #${order.orderNumber} ahora está ${ORDER_STATUS_MAP[newStatus]}.`
    });

    if (newStatus === 'in-progress') {
        initiatePrint(order, 'prep');
    }
    
    setOrderToConfirm(null);
  };
  
  const handleOpenPaymentDialog = (order: Order) => {
    const stockIssues = order.items.filter(item => {
      const product = products.find(p => p.id === item.productId);
      return !product || product.stock < item.quantity;
    });

    if (stockIssues.length > 0) {
      toast({
        title: 'Stock Insuficiente',
        description: `No se puede procesar el pago. Productos con stock insuficiente: ${stockIssues.map(i => i.productName).join(', ')}`,
        variant: 'destructive',
      });
      return;
    }
    setOrderToPay(order);
    setIsPaymentDialogOpen(true);
  };

  const handleCompleteOrder = (completedOrder: Order, paymentDetails: PaymentDetails) => {
    // 1. Create Sale Object
    const newSale: Sale = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      operationalDate: accountingSettings.currentOperationalDate!,
      orderId: completedOrder.id,
      origin: 'order',
      customerId: completedOrder.customerId,
      customerName: completedOrder.customerName,
      items: completedOrder.items,
      subTotal: completedOrder.totalAmount,
      totalAmount: completedOrder.totalAmount,
      paymentMethod: paymentDetails.hasOwnProperty('amountReceived') ? 'cash' : 'transfer',
      paymentDetails: paymentDetails,
    };
    
    // 2. Update Sales
    setSales(prev => [newSale, ...prev].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

    // 3. Update Product Stock
    const updatedProducts = products.map(p => {
        const itemInOrder = completedOrder.items.find(item => item.productId === p.id);
        if (itemInOrder) {
            return { ...p, stock: p.stock - itemInOrder.quantity };
        }
        return p;
    });
    setProducts(updatedProducts);
    
    // 4. Update Order Status
    const updatedOrders = orders.map(o => o.id === completedOrder.id ? { ...o, status: 'completed' } : o);
    setOrders(updatedOrders);

    // 5. Trigger Final Receipt Print
    initiatePrint(newSale, 'sale');
    
    toast({ title: 'Pedido Completado y Venta Registrada', description: `La venta para el pedido #${completedOrder.orderNumber} se ha creado. Stock actualizado.` });
    setIsPaymentDialogOpen(false);
    setOrderToPay(null);
  };


  const openDialog = (order: Order | null = null) => {
    setEditingOrder(order);
    setIsOrderDialogOpen(true);
  };
  
  const initiatePrint = (data: Order | Sale, type: 'prep' | 'sale') => {
    if (type === 'prep') {
        setOrderToPrintPrep(data as Order);
        setSaleToPrint(null);
    } else {
        setSaleToPrint(data as Sale);
        setOrderToPrintPrep(null);
    }
    setIsPrinting(true);
  };
  
  useEffect(() => {
    if (isPrinting && (orderToPrintPrep || saleToPrint)) {
      const timer = setTimeout(() => window.print(), 500);
      const handleAfterPrint = () => {
        setIsPrinting(false);
        setOrderToPrintPrep(null);
        setSaleToPrint(null);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
      window.addEventListener('afterprint', handleAfterPrint);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [isPrinting, orderToPrintPrep, saleToPrint]);

  const sortedOrders = useMemo(() => {
    const active = orders.filter(o => o.status === 'pending' || o.status === 'in-progress').sort((a,b) => a.timestamp.localeCompare(b.timestamp));
    const ready = orders.filter(o => o.status === 'ready').sort((a,b) => a.timestamp.localeCompare(b.timestamp));
    const history = orders.filter(o => o.status === 'completed' || o.status === 'cancelled').sort((a,b) => b.timestamp.localeCompare(a.timestamp));
    return { active, ready, history };
  }, [orders]);

  const renderOrderCard = (order: Order) => (
    <Card key={order.id} className={cn("flex flex-col", statusColors[order.status])}>
      <CardHeader className="flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="font-headline text-lg">Pedido #{order.orderNumber}</CardTitle>
          <CardDescription className="text-muted-foreground/80">{order.customerName}</CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => openDialog(order)} disabled={order.status === 'completed' || order.status === 'cancelled'}>Editar Pedido</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => initiatePrint(order, 'prep')}>Imprimir Ticket Preparación</DropdownMenuItem>
            {order.status === 'completed' && 
                <DropdownMenuItem onSelect={() => {
                    const linkedSale = sales.find(s => s.orderId === order.id);
                    if (linkedSale) {
                        initiatePrint(linkedSale, 'sale');
                    } else {
                        toast({title: "Recibo no encontrado", description: "No se encontró una venta vinculada a este pedido completado.", variant: 'destructive'});
                    }
                }}>
                    Re-imprimir Recibo de Venta
                </DropdownMenuItem>
            }
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <p className="text-sm"><strong>Estado:</strong> {ORDER_STATUS_MAP[order.status]}</p>
        <p className="text-sm"><strong>Total:</strong> {appSettings.currencySymbol}{order.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
        <p className="text-sm"><strong>Items:</strong> {order.items.reduce((sum, i) => sum + i.quantity, 0)}</p>
        <p className="text-xs text-muted-foreground/70">Recibido: {format(parseISO(order.timestamp), "dd MMM, HH:mm", { locale: es })}</p>
        {order.notes && <p className="text-xs pt-1 border-t border-muted-foreground/20"><strong>Notas:</strong> {order.notes}</p>}
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-2">
        {order.status === 'pending' && <Button size="sm" onClick={() => handleStatusChange(order, 'in-progress')}><CookingPot className="mr-2 h-4 w-4"/>Marcar como "En Preparación"</Button>}
        {order.status === 'in-progress' && <Button size="sm" onClick={() => handleStatusChange(order, 'ready')}><Truck className="mr-2 h-4 w-4"/>Marcar como "Listo para Retirar"</Button>}
        {order.status === 'ready' && <Button size="sm" onClick={() => handleOpenPaymentDialog(order)} className="bg-green-600 hover:bg-green-700 text-white"><CreditCard className="mr-2 h-4 w-4"/>Registrar Pago y Completar</Button>}
        {(order.status === 'pending' || order.status === 'in-progress') && <Button variant="destructive" size="sm" onClick={() => handleStatusChange(order, 'cancelled')}><Ban className="mr-2 h-4 w-4"/>Cancelar Pedido</Button>}
      </CardFooter>
    </Card>
  );

  const renderTabContent = (orderList: Order[], emptyMessage: string) => {
    if (!isMounted) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div>
    if (orderList.length === 0) {
      return <div className="text-center py-10 text-muted-foreground"><Package className="mx-auto h-12 w-12 mb-4" /><p>{emptyMessage}</p></div>;
    }
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{orderList.map(renderOrderCard)}</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Gestión de Pedidos" description="Administra los pedidos telefónicos y para llevar.">
        <Button onClick={() => openDialog()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlusCircle className="mr-2 h-5 w-5" /> Crear Pedido
        </Button>
      </PageHeader>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Activos ({sortedOrders.active.length})</TabsTrigger>
          <TabsTrigger value="ready">Listos para Retirar ({sortedOrders.ready.length})</TabsTrigger>
          <TabsTrigger value="history">Historial ({sortedOrders.history.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          {renderTabContent(sortedOrders.active, "No hay pedidos activos.")}
        </TabsContent>
        <TabsContent value="ready" className="mt-4">
          {renderTabContent(sortedOrders.ready, "No hay pedidos listos para retirar.")}
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          {renderTabContent(sortedOrders.history, "No hay pedidos en el historial.")}
        </TabsContent>
      </Tabs>

      {isOrderDialogOpen && isMounted && (
        <OrderDialog
          isOpen={isOrderDialogOpen}
          onClose={() => setIsOrderDialogOpen(false)}
          products={products}
          customers={customers}
          onSave={handleAddOrUpdateOrder}
          appSettings={appSettings}
          editingOrder={editingOrder}
        />
      )}
      
      {isPaymentDialogOpen && isMounted && orderToPay && (
        <PaymentDialog
          isOpen={isPaymentDialogOpen}
          onClose={() => setIsPaymentDialogOpen(false)}
          order={orderToPay}
          onConfirm={handleCompleteOrder}
          appSettings={appSettings}
        />
      )}

      {isPrinting && orderToPrintPrep && isMounted && typeof document !== 'undefined' &&
        ReactDOM.createPortal(
          <div id="printable-prep-ticket-area">
            <OrderTicket
              order={orderToPrintPrep}
              appSettings={appSettings}
              businessSettings={businessSettings}
            />
          </div>,
          document.body
        )
      }

      {isPrinting && saleToPrint && isMounted && typeof document !== 'undefined' &&
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
      
      <AlertDialog open={!!orderToConfirm} onOpenChange={(isOpen) => !isOpen && setOrderToConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambio de estado</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres marcar el pedido #{orderToConfirm?.order.orderNumber} como "{ORDER_STATUS_MAP[orderToConfirm?.newStatus || 'pending']}"?
              {orderToConfirm?.newStatus === 'in-progress' && " Se imprimirá un ticket de preparación."}
              {orderToConfirm?.newStatus === 'cancelled' && " Esta acción es irreversible."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
