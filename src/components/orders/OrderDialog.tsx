
// src/components/orders/OrderDialog.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Product, Customer, SaleItem, AppSettings, Order, OrderStatus } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, Trash2, UserPlus, Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { useAddToCartToast } from '@/context/ToastContext';

interface OrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  onSave: (order: Order) => void;
  appSettings: AppSettings;
  editingOrder: Order | null;
}

const ANONYMOUS_CUSTOMER_VALUE = "__ANONYMOUS__";

export default function OrderDialog({ isOpen, onClose, products: availableProducts, customers, onSave, appSettings, editingOrder }: OrderDialogProps) {
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(ANONYMOUS_CUSTOMER_VALUE);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  const { toast } = useToast();
  const { showToast: showAddToCartToast } = useAddToCartToast();

  useEffect(() => {
    if (editingOrder) {
      setItems(editingOrder.items);
      setSelectedCustomerId(editingOrder.customerId || ANONYMOUS_CUSTOMER_VALUE);
      setCustomerName(editingOrder.customerName);
      setCustomerPhone(editingOrder.customerPhone || '');
      setNotes(editingOrder.notes || '');
    } else {
      resetState();
    }
  }, [editingOrder]);

  useEffect(() => {
    if (selectedCustomerId === ANONYMOUS_CUSTOMER_VALUE) {
      if (!editingOrder) { // Don't clear fields if we're just loading an anonymous existing order
        setCustomerName('');
        setCustomerPhone('');
      }
    } else {
      const cust = customers.find(c => c.id === selectedCustomerId);
      if (cust) {
        setCustomerName(cust.name);
        setCustomerPhone(cust.phone || '');
      }
    }
  }, [selectedCustomerId, customers, editingOrder]);

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.totalPrice, 0), [items]);

  const resetState = () => {
    setItems([]);
    setSelectedProduct('');
    setQuantity(1);
    setSelectedCustomerId(ANONYMOUS_CUSTOMER_VALUE);
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleAddSaleItem = () => {
    if (!selectedProduct) return toast({ title: "Seleccione un producto", variant: 'destructive' });
    const product = availableProducts.find(p => p.id === selectedProduct);
    if (!product) return toast({ title: "Producto no encontrado", variant: 'destructive' });
    
    if (product.stock <= 0) return toast({ title: "Producto Agotado", description: `${product.name} no tiene stock.`, variant: 'destructive'});

    const existingItemIndex = items.findIndex(item => item.productId === product.id);
    if (existingItemIndex > -1) {
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += quantity;
      updatedItems[existingItemIndex].totalPrice = updatedItems[existingItemIndex].quantity * product.price;
      setItems(updatedItems);
    } else {
      setItems([...items, {
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        totalPrice: product.price * quantity,
      }]);
    }
    showAddToCartToast({
        productName: product.name,
        imageUrl: product.imageUrl,
        quantity: quantity,
    });
    setSelectedProduct('');
    setQuantity(1);
  };

  const handleRemoveSaleItem = (productId: string) => {
    setItems(items.filter(item => item.productId !== productId));
  };
  
  const handleSaveOrder = () => {
    if (items.length === 0) return toast({ title: "Pedido vacío", description: "Añada al menos un producto.", variant: 'destructive' });
    if (!customerName.trim()) return toast({ title: "Cliente requerido", description: "Por favor, ingrese un nombre para el cliente.", variant: 'destructive' });
    
    const orderData: Order = {
      id: editingOrder?.id || crypto.randomUUID(),
      orderNumber: editingOrder?.orderNumber || 0, // Will be set properly on save
      timestamp: editingOrder?.timestamp || new Date().toISOString(),
      customerId: selectedCustomerId !== ANONYMOUS_CUSTOMER_VALUE ? selectedCustomerId : undefined,
      customerName,
      customerPhone,
      items,
      totalAmount,
      status: editingOrder?.status || 'pending',
      notes,
    };
    
    onSave(orderData);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{editingOrder ? 'Editar Pedido' : 'Crear Nuevo Pedido'}</DialogTitle>
          <DialogDescription>Añada productos, asigne un cliente y guarde el pedido para procesarlo.</DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6 py-4 flex-grow overflow-y-auto pr-2">
          {/* Columna Izquierda: Productos */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Añadir Productos</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 items-end">
                  <div className="flex-grow">
                    <Label htmlFor="product">Producto</Label>
                    <Select value={selectedProduct} onValueChange={setSelectedProduct} disabled={availableProducts.length === 0}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                      <SelectContent>
                        {availableProducts.map(p => (
                          <SelectItem key={p.id} value={p.id} disabled={p.stock <= 0}>{p.name} (Stock: {p.stock})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20">
                    <Label htmlFor="quantity">Cant.</Label>
                    <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} min="1" />
                  </div>
                  <Button onClick={handleAddSaleItem} size="icon" className="shrink-0"><Plus /></Button>
                </div>
              </CardContent>
            </Card>
            <Card className="flex-grow flex flex-col">
              <CardHeader><CardTitle>Items del Pedido</CardTitle></CardHeader>
              <CardContent className="flex-grow">
                <ScrollArea className="h-64 border rounded-md p-2">
                  {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No hay productos añadidos.</p>}
                  {items.map(item => (
                    <div key={item.productId} className="flex justify-between items-center py-1.5 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{item.quantity} x {appSettings.currencySymbol}{item.unitPrice.toLocaleString('es-ES')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{appSettings.currencySymbol}{item.totalPrice.toLocaleString('es-ES')}</p>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveSaleItem(item.productId)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Columna Derecha: Cliente y Resumen */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Datos del Cliente</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANONYMOUS_CUSTOMER_VALUE}>Cliente Anónimo / Nuevo</SelectItem>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div>
                  <Label htmlFor="customerName">Nombre del Cliente *</Label>
                  <Input id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} disabled={selectedCustomerId !== ANONYMOUS_CUSTOMER_VALUE} />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Teléfono del Cliente</Label>
                  <Input id="customerPhone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} disabled={selectedCustomerId !== ANONYMOUS_CUSTOMER_VALUE} />
                </div>
                 <p className="text-xs text-muted-foreground">Para clientes existentes, los datos se rellenan automáticamente. Para guardar un nuevo cliente, debe hacerse desde el módulo de Ventas.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Notas del Pedido</CardTitle></CardHeader>
              <CardContent>
                <Textarea placeholder="Añadir notas o instrucciones especiales aquí..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
              </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl font-headline text-right">Total del Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="text-3xl font-bold text-right text-primary">
                        {appSettings.currencySymbol}{totalAmount.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSaveOrder} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Save className="mr-2 h-4 w-4" /> {editingOrder ? 'Guardar Cambios' : 'Crear Pedido'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
