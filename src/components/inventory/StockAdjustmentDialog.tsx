
// src/components/inventory/StockAdjustmentDialog.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Product } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from 'lucide-react';

interface StockAdjustmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onConfirm: (productId: string, quantityAdded: number, notes: string) => void;
}

export default function StockAdjustmentDialog({ isOpen, onClose, products, onConfirm }: StockAdjustmentDialogProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [notes, setNotes] = useState('');

  const { toast } = useToast();

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [selectedProductId, products]);

  const resetState = () => {
    setSelectedProductId('');
    setQuantity('');
    setNotes('');
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const quantityAdded = Number(quantity);
    if (!selectedProductId) {
      toast({ title: "Error", description: "Por favor, seleccione un producto.", variant: 'destructive' });
      return;
    }
    if (!isFinite(quantityAdded) || quantityAdded <= 0) {
      toast({ title: "Error", description: "La cantidad a añadir debe ser un número positivo.", variant: 'destructive' });
      return;
    }

    onConfirm(selectedProductId, quantityAdded, notes);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline">Ajuste de Inventario (Entrada)</DialogTitle>
          <DialogDescription>
            Registre la entrada de nueva mercancía o realice ajustes positivos al stock.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <Label htmlFor="product-select">Producto</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger id="product-select"><SelectValue placeholder="Seleccionar un producto..." /></SelectTrigger>
              <SelectContent>
                {products.sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedProduct && (
            <div className="flex items-center justify-center gap-4 p-2 bg-muted/30 rounded-md">
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">Stock Actual</p>
                    <p className="text-2xl font-bold">{selectedProduct.stock}</p>
                </div>
                <ArrowRight className="h-6 w-6 text-primary"/>
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">Nuevo Stock</p>
                    <p className="text-2xl font-bold text-green-500">{selectedProduct.stock + (Number(quantity) || 0)}</p>
                </div>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="quantity">Cantidad a Añadir</Label>
            <Input id="quantity" type="number" min="1" placeholder="0" value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Textarea id="notes" placeholder="Ej: Recepción de pedido #123, Ajuste de conteo anual..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!selectedProductId || !quantity}>
            Confirmar Entrada de Stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
