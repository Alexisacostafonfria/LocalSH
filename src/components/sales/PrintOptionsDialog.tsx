// src/components/sales/PrintOptionsDialog.tsx
"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, FileText } from 'lucide-react';

interface PrintOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFormat: (format: 'a4' | 'receipt') => void;
}

export default function PrintOptionsDialog({ isOpen, onClose, onSelectFormat }: PrintOptionsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-card">
        <DialogHeader>
          <DialogTitle className="font-headline">Seleccionar Formato de Impresión</DialogTitle>
          <DialogDescription>
            ¿Cómo deseas imprimir el comprobante de esta venta?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Button
            size="lg"
            variant="outline"
            className="h-auto py-4"
            onClick={() => onSelectFormat('a4')}
          >
            <FileText className="mr-4 h-8 w-8 text-primary" />
            <div className="text-left">
              <p className="font-semibold">Hoja Completa (A4/Carta)</p>
              <p className="text-xs text-muted-foreground">Ideal para facturas formales.</p>
            </div>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-auto py-4"
            onClick={() => onSelectFormat('receipt')}
          >
            <Printer className="mr-4 h-8 w-8 text-primary" />
            <div className="text-left">
              <p className="font-semibold">Recibo de Caja (Rollo)</p>
              <p className="text-xs text-muted-foreground">Formato para impresoras térmicas.</p>
            </div>
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
