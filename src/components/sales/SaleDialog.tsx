
// src/components/sales/SaleDialog.tsx
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom'; // Import ReactDOM for Portals
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Product, Customer, Sale, SaleItem, AppSettings, CashPaymentDetails, TransferPaymentDetails, AccountingSettings, DEFAULT_ACCOUNTING_SETTINGS } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, Trash2, UserPlus, AlertCircle, Coins, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, ScanLine } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  onAddSale: (sale: Sale) => void;
  appSettings: AppSettings;
  onUpdateCustomers: (customers: Customer[]) => void;
}

type SaleDialogStep = 'products' | 'customer' | 'payment';

const initialCashDetails: CashPaymentDetails = { amountReceived: 0, changeGiven: 0, tip: 0, breakdown: {} };
const initialTransferDetails: TransferPaymentDetails = { reference: '', customerName: '', personalId: '', mobileNumber: '', cardNumber: '' };
const ANONYMOUS_CUSTOMER_VALUE = "__ANONYMOUS__";
const denominations = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1] as const;

interface CurrentTransactionCustomerData {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  personalId?: string;
  cardNumber?: string;
}

const initialTransactionCustomerData: CurrentTransactionCustomerData = {
  name: '',
  phone: '',
  email: '',
  personalId: '',
  cardNumber: '',
};


export default function SaleDialog({
  isOpen,
  onClose,
  products: availableProducts,
  customers,
  onAddSale,
  appSettings,
  onUpdateCustomers,
}: SaleDialogProps) {
  const [currentStep, setCurrentStep] = useState<SaleDialogStep>('products');
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [barcodeInputValue, setBarcodeInputValue] = useState<string>('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [cashDetails, setCashDetails] = useState<CashPaymentDetails>(initialCashDetails);
  const [transferDetails, setTransferDetails] = useState<TransferPaymentDetails>(initialTransferDetails);
  const [cashBreakdownInputs, setCashBreakdownInputs] = useState<Record<string, string>>({});
  const [isCashBreakdownPopoverOpen, setIsCashBreakdownPopoverOpen] = useState(false);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(ANONYMOUS_CUSTOMER_VALUE); 
  const [isAddingNewSystemCustomer, setIsAddingNewSystemCustomer] = useState(false);
  const [currentTransactionCustomer, setCurrentTransactionCustomer] = useState<CurrentTransactionCustomerData>(initialTransactionCustomerData);
  
  const [accountingSettings] = useLocalStorageState<AccountingSettings>('accountingSettings', DEFAULT_ACCOUNTING_SETTINGS);


  const { toast } = useToast();

  const subTotal = useMemo(() => saleItems.reduce((sum, item) => {
    const itemPrice = (typeof item.unitPrice === 'number' && isFinite(item.unitPrice)) ? item.unitPrice : 0;
    const itemQuantity = (typeof item.quantity === 'number' && isFinite(item.quantity)) ? item.quantity : 0;
    return sum + (itemPrice * itemQuantity);
  }, 0), [saleItems]);
  const totalAmount = subTotal; 

  const isDayEffectivelyOpen = accountingSettings.isDayOpen && !!accountingSettings.currentOperationalDate;

  useEffect(() => {
    if (isOpen && currentStep === 'products' && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [isOpen, currentStep]);


  useEffect(() => {
    if (selectedCustomerId === ANONYMOUS_CUSTOMER_VALUE) {
      if (!isAddingNewSystemCustomer) { 
          setCurrentTransactionCustomer(prev => ({
            ...initialTransactionCustomerData,
            name: paymentMethod === 'transfer' ? prev.name : '',
            phone: paymentMethod === 'transfer' ? prev.phone : '',
            personalId: paymentMethod === 'transfer' ? prev.personalId : '',
            cardNumber: paymentMethod === 'transfer' ? prev.cardNumber : '',
          }));
      }
    } else {
      const cust = customers.find(c => c.id === selectedCustomerId);
      if (cust) {
        setCurrentTransactionCustomer({
          id: cust.id,
          name: cust.name,
          phone: cust.phone || '',
          email: cust.email || '',
          personalId: cust.personalId || '',
          cardNumber: cust.cardNumber || '',
        });
        setIsAddingNewSystemCustomer(false); 
      }
    }
  }, [selectedCustomerId, customers, isAddingNewSystemCustomer, paymentMethod]);


  useEffect(() => {
    if (paymentMethod === 'cash') {
      const currentAmountReceived = isFinite(cashDetails.amountReceived) ? cashDetails.amountReceived : 0;
      const currentTotalAmount = isFinite(totalAmount) ? totalAmount : 0;
      let currentPrevTip = isFinite(cashDetails.tip) ? cashDetails.tip : 0;

      const changePreTip = currentAmountReceived - currentTotalAmount;
      
      let newTip = currentPrevTip;
      let newChangeGiven = 0;
  
      if (isFinite(changePreTip) && changePreTip >= 0) {
        if (appSettings.allowTips) {
          if (newTip > changePreTip) {
            newTip = changePreTip;
          }
        } else {
          newTip = 0;
        }
        newChangeGiven = changePreTip - newTip;
      } else { 
        newTip = 0;
        newChangeGiven = isFinite(changePreTip) ? changePreTip : 0; 
        if (newChangeGiven < 0) { 
          newChangeGiven = 0; 
        }
      }
  
      const finalNewTip = isFinite(newTip) ? Math.max(0, newTip) : 0;
      const finalNewChangeGiven = isFinite(newChangeGiven) ? Math.max(0, newChangeGiven) : 0; 
  
      if (finalNewTip !== cashDetails.tip || finalNewChangeGiven !== cashDetails.changeGiven) {
        setCashDetails(prev => ({
          ...prev,
          tip: finalNewTip,
          changeGiven: finalNewChangeGiven,
        }));
      }
    } else { 
        if ((isFinite(cashDetails.tip) && cashDetails.tip !== 0) || (isFinite(cashDetails.changeGiven) && cashDetails.changeGiven !== 0)) {
             setCashDetails(prev => ({ 
                ...prev, 
                tip: 0, 
                changeGiven: 0, 
                amountReceived: isFinite(prev.amountReceived) ? prev.amountReceived : 0, 
                breakdown: prev.breakdown || {} 
            }));
        }
    }
  }, [cashDetails.amountReceived, totalAmount, paymentMethod, appSettings.allowTips, cashDetails.tip, cashDetails.changeGiven]);


  const handleCashBreakdownChange = (denominationKey: string, countStr: string) => {
    const newBreakdownInputs = {
      ...cashBreakdownInputs,
      [denominationKey]: countStr,
    };
    setCashBreakdownInputs(newBreakdownInputs);

    let newAmountReceived = 0;
    const newParsedBreakdown: { [key: string]: number } = {};
    for (const denKey in newBreakdownInputs) {
      const count = parseInt(newBreakdownInputs[denKey]);
      const denominationValue = parseInt(denKey);
      if (!isNaN(count) && count > 0 && !isNaN(denominationValue)) {
        newAmountReceived += denominationValue * count;
        newParsedBreakdown[denKey] = count;
      }
    }
    setCashDetails(prev => ({ ...prev, amountReceived: newAmountReceived, breakdown: newParsedBreakdown }));
  };

  const handleAmountReceivedChange = (amountStr: string) => {
    const newAmountReceived = parseFloat(amountStr) || 0;
    setCashBreakdownInputs({}); 
    setCashDetails(prev => ({ ...prev, amountReceived: newAmountReceived, breakdown: {} }));
  };

  const handleTransactionCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentTransactionCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    let formattedValue = "";
    for (let i = 0; i < rawValue.length; i++) {
      if (i > 0 && i % 4 === 0 && i < 16) { 
        formattedValue += "-";
      }
      if (formattedValue.length < 19) { 
        formattedValue += rawValue[i];
      } else {
        break;
      }
    }
    setCurrentTransactionCustomer(prev => ({ ...prev, cardNumber: formattedValue.slice(0,19) }));
  };

  const getSafeNumericDisplayValue = (num: number | undefined | null, allowZero: boolean = false) => {
    if (typeof num !== 'number' || !isFinite(num)) {
      return "";
    }
    if (!allowZero && num === 0) {
      return "";
    }
    return String(num);
  };
  
  const getAmountReceivedDisplayValue = () => {
    const currentAmountReceived = isFinite(cashDetails.amountReceived) ? cashDetails.amountReceived : 0;
    if (hasActiveBreakdown) return String(currentAmountReceived); 
    return currentAmountReceived === 0 ? "" : String(currentAmountReceived); 
  };

  const addProductToSaleItems = (productToAdd: Product, quantityToAdd: number) => {
    const productPrice = (typeof productToAdd.price === 'number' && isFinite(productToAdd.price)) ? productToAdd.price : 0;
    if (productPrice <= 0) {
        toast({ title: "Error de Precio", description: `El producto "${productToAdd.name}" tiene un precio inválido o cero. Por favor, actualice el precio en el catálogo.`, variant: "destructive" });
        return false;
    }

    const existingItemIndex = saleItems.findIndex(item => item.productId === productToAdd.id);
    if (existingItemIndex > -1) {
      const updatedItems = [...saleItems];
      const currentQuantityInCart = updatedItems[existingItemIndex].quantity;
      const newTotalQuantity = currentQuantityInCart + quantityToAdd;

      if (productToAdd.stock < newTotalQuantity) {
        toast({ title: "Stock Insuficiente", description: `Solo hay ${productToAdd.stock} unidades de ${productToAdd.name}. Ya tiene ${currentQuantityInCart} en el carrito. No se puede añadir ${quantityToAdd} más.`, variant: "destructive" });
        return false;
      }
      updatedItems[existingItemIndex].quantity = newTotalQuantity;
      updatedItems[existingItemIndex].totalPrice = newTotalQuantity * productPrice;
      setSaleItems(updatedItems);
    } else {
      if (productToAdd.stock < quantityToAdd) {
        toast({ title: "Stock Insuficiente", description: `Solo hay ${productToAdd.stock} unidades de ${productToAdd.name}. No se puede añadir ${quantityToAdd}.`, variant: "destructive" });
        return false;
      }
      setSaleItems([...saleItems, {
        productId: productToAdd.id,
        productName: productToAdd.name,
        quantity: quantityToAdd,
        unitPrice: productPrice,
        totalPrice: productPrice * quantityToAdd,
      }]);
    }
    return true;
  }


  const handleAddSaleItemManually = () => {
    if (!selectedProduct) {
      toast({ title: "Error", description: "Seleccione un producto.", variant: "destructive" });
      return;
    }
    const quantityNum = Number(quantity);
    if (!isFinite(quantityNum) || quantityNum <= 0) {
      toast({ title: "Error", description: "La cantidad debe ser un número mayor a cero.", variant: "destructive" });
      setQuantity(1);
      return;
    }

    const product = availableProducts.find(p => p.id === selectedProduct);
    if (!product) {
      toast({ title: "Error", description: "Producto no encontrado.", variant: "destructive" });
      return;
    }
    
    if (addProductToSaleItems(product, quantityNum)) {
      toast({ title: "Producto Añadido", description: `${quantityNum} x ${product.name} añadido(s) al carrito.` });
      setSelectedProduct('');
      setQuantity(1);
      barcodeInputRef.current?.focus();
    }
  };

  const handleBarcodeScan = (scannedCode: string) => {
    if (!scannedCode.trim()) return;
    const cleanScannedCode = scannedCode.trim(); // Lector ya envía sin guiones y con longitud esperada

    const product = availableProducts.find(p => {
      const cleanProductId = p.id.replace(/-/g, '').substring(0, 16);
      return cleanProductId === cleanScannedCode;
    });

    if (!product) {
      toast({ title: "Código No Encontrado", description: `No se encontró producto con el código: ${cleanScannedCode}`, variant: "destructive" });
      return;
    }

    if (addProductToSaleItems(product, 1)) { // Default quantity 1 for barcode scan
        toast({ title: "Producto Escaneado", description: `${product.name} añadido al carrito (Cantidad +1).` });
    }
  };

  const handleBarcodeKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleBarcodeScan(barcodeInputValue);
      setBarcodeInputValue(''); 
      barcodeInputRef.current?.focus();
    }
  };

  const handleRemoveSaleItem = (productId: string) => {
    setSaleItems(saleItems.filter(item => item.productId !== productId));
  };
  
  const handleToggleAddNewSystemCustomer = () => {
    const newIsAdding = !isAddingNewSystemCustomer;
    setIsAddingNewSystemCustomer(newIsAdding);
    if (newIsAdding) {
      setSelectedCustomerId(ANONYMOUS_CUSTOMER_VALUE); 
      setCurrentTransactionCustomer(initialTransactionCustomerData); 
    }
  };

  const handleSaveNewSystemCustomer = () => {
    if (!currentTransactionCustomer.name) {
      toast({ title: "Error", description: "El nombre del cliente es obligatorio para guardarlo en el sistema.", variant: "destructive" });
      return;
    }
    const customerToAddToSystem: Customer = {
      id: crypto.randomUUID(),
      name: currentTransactionCustomer.name,
      phone: currentTransactionCustomer.phone || undefined,
      email: currentTransactionCustomer.email || undefined,
      personalId: currentTransactionCustomer.personalId || undefined,
      cardNumber: currentTransactionCustomer.cardNumber || undefined,
    };
    const updatedCustomersList = [...customers, customerToAddToSystem];
    onUpdateCustomers(updatedCustomersList);
    setSelectedCustomerId(customerToAddToSystem.id); 
    setIsAddingNewSystemCustomer(false); 
    toast({ title: "Cliente Guardado", description: `${customerToAddToSystem.name} ha sido añadido al sistema.` });
  };


  const handleFinalizeSale = () => {
    if (!isDayEffectivelyOpen) {
        toast({ title: "Día Operativo Cerrado", description: "No se puede registrar la venta. Inicie un nuevo día operativo.", variant: "destructive" });
        return;
    }
    if (saleItems.length === 0) {
      toast({ title: "Error", description: "Añada productos a la venta.", variant: "destructive" });
      return;
    }
    
    const finalTotalAmount = isFinite(totalAmount) ? totalAmount : 0;

    if (paymentMethod === 'cash') {
      const finalAmountReceived = (isFinite(cashDetails.amountReceived) ? cashDetails.amountReceived : 0);
      const finalTip = (isFinite(cashDetails.tip) ? cashDetails.tip : 0);
      
      if ((finalAmountReceived - finalTip) < finalTotalAmount) {
         toast({ title: "Pago Insuficiente", description: "El monto recibido (menos propina si aplica) es menor al total de la venta.", variant: "destructive" });
         return;
      }
       if (!isFinite(finalTip) || finalTip < 0 || (appSettings.allowTips && finalTip > Math.max(0, finalAmountReceived - finalTotalAmount)) ) {
         toast({ title: "Propina Inválida", description: `La propina no puede ser negativa ni mayor que el cambio disponible (${appSettings.currencySymbol}${Math.max(0, finalAmountReceived - finalTotalAmount).toLocaleString('es-ES',{minimumFractionDigits:2, maximumFractionDigits:2})}).`, variant: "destructive" });
         return;
      }
    } else { 
        if (!currentTransactionCustomer.name || !currentTransactionCustomer.personalId || !currentTransactionCustomer.phone || !currentTransactionCustomer.cardNumber) {
             toast({ title: "Error de Validación", description: "Para ventas por transferencia, se requiere Nombre, ID Personal, Móvil y Número de Tarjeta del cliente.", variant: "destructive" });
             return;
        }
        if (currentTransactionCustomer.cardNumber.replace(/[^0-9]/g, "").length !== 16) {
           toast({ title: "Error de Validación", description: "El número de tarjeta para la transferencia debe tener 16 dígitos.", variant: "destructive" });
           return;
        }
    }
    
    const finalPaymentDetails = paymentMethod === 'cash'
      ? { 
          amountReceived: isFinite(cashDetails.amountReceived) ? cashDetails.amountReceived : 0,
          changeGiven: isFinite(cashDetails.changeGiven) ? cashDetails.changeGiven : 0,
          tip: isFinite(cashDetails.tip) ? cashDetails.tip : 0,
          breakdown: cashDetails.breakdown || {} 
        }
      : { 
          reference: transferDetails.reference || '', 
          customerName: currentTransactionCustomer.name,
          personalId: currentTransactionCustomer.personalId,
          mobileNumber: currentTransactionCustomer.phone,
          cardNumber: currentTransactionCustomer.cardNumber,
          customerId: currentTransactionCustomer.id 
        };

    const sale: Sale = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      operationalDate: accountingSettings.currentOperationalDate!, 
      customerId: currentTransactionCustomer.id, 
      customerName: currentTransactionCustomer.name, 
      items: saleItems,
      subTotal: isFinite(subTotal) ? subTotal : 0,
      totalAmount: finalTotalAmount,
      paymentMethod,
      paymentDetails: finalPaymentDetails,
    };
    onAddSale(sale);
    toast({ title: "Venta Registrada", description: `Venta ${sale.id.substring(0,8)} completada.` });
    resetDialog();
    onClose();
  };

  const resetDialog = () => {
    setSaleItems([]);
    setSelectedProduct('');
    setQuantity(1);
    setBarcodeInputValue('');
    setPaymentMethod('cash'); 
    setCashDetails(initialCashDetails);
    setTransferDetails(initialTransferDetails); 
    setCashBreakdownInputs({});
    setSelectedCustomerId(ANONYMOUS_CUSTOMER_VALUE);
    setIsAddingNewSystemCustomer(false);
    setCurrentTransactionCustomer(initialTransactionCustomerData);
    setIsCashBreakdownPopoverOpen(false);
    setCurrentStep('products'); 
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };
  
  const handleClose = () => {
    resetDialog();
    onClose();
  }
  
  const hasActiveBreakdown = Object.values(cashBreakdownInputs).some(val => val && parseInt(val) > 0);
  
  const customerStepNextButtonDisabled = paymentMethod === 'transfer' && 
                                          (!currentTransactionCustomer.name || 
                                           !currentTransactionCustomer.personalId || 
                                           !currentTransactionCustomer.phone || 
                                           !currentTransactionCustomer.cardNumber || 
                                           currentTransactionCustomer.cardNumber.replace(/[^0-9]/g, "").length !== 16);

  const finalizeSaleButtonDisabled = saleItems.length === 0 ||
    !isDayEffectivelyOpen ||
    (paymentMethod === 'cash' && (
      ((isFinite(cashDetails.amountReceived) ? cashDetails.amountReceived : 0) - (isFinite(cashDetails.tip) ? cashDetails.tip : 0)) < (isFinite(totalAmount) ? totalAmount : 0) ||
      !isFinite(cashDetails.tip) || cashDetails.tip < 0 ||
      (appSettings.allowTips && cashDetails.tip > Math.max(0, (isFinite(cashDetails.amountReceived) ? cashDetails.amountReceived : 0) - (isFinite(totalAmount) ? totalAmount : 0)))
    )) ||
    (paymentMethod === 'transfer' && (
      !currentTransactionCustomer.name ||
      !currentTransactionCustomer.personalId ||
      !currentTransactionCustomer.phone ||
      !currentTransactionCustomer.cardNumber ||
      currentTransactionCustomer.cardNumber.replace(/[^0-9]/g, "").length !== 16
    ));


  const renderStepContent = () => {
    switch (currentStep) {
      case 'products':
        return (
          <Card>
            <CardHeader><CardTitle className="text-lg font-headline">Añadir Productos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="barcodeInput" className="sr-only">Código de Barras</Label>
                <div className="relative">
                  <ScanLine className="absolute left-2.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="barcodeInput"
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Escanear o ingresar código de barras y presionar Enter..."
                    value={barcodeInputValue}
                    onChange={(e) => setBarcodeInputValue(e.target.value)}
                    onKeyDown={handleBarcodeKeyDown}
                    className="pl-10 text-base"
                  />
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground my-2">O añadir manualmente:</div>
              
              <div className="flex gap-2 items-end">
                <div className="flex-grow">
                  <Label htmlFor="product">Producto</Label>
                  <Select 
                    value={selectedProduct} 
                    onValueChange={setSelectedProduct} 
                    disabled={availableProducts.length === 0}
                  >
                    <SelectTrigger id="product">
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts.map(p => (
                        <SelectItem key={p.id} value={p.id} disabled={p.stock <= 0 || !isFinite(p.price) || p.price <= 0}>
                          {p.name} ({appSettings.currencySymbol}{(isFinite(p.price) ? p.price : 0).toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}, Stock: {p.stock})
                          {(!isFinite(p.price) || p.price <= 0) && <span className="text-destructive text-xs ml-2">(Precio Inválido)</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableProducts.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      No hay productos en el catálogo. Añada productos para vender.
                    </p>
                  )}
                </div>
                <div className="w-20">
                  <Label htmlFor="quantity">Cantidad</Label>
                  <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" />
                </div>
                <Button 
                  onClick={handleAddSaleItemManually} 
                  size="icon" 
                  className="shrink-0"
                  disabled={availableProducts.length === 0 || !selectedProduct}
                  title="Añadir producto seleccionado manualmente"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <ScrollArea className="h-40 border rounded-md p-2">
                {saleItems.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No hay productos añadidos.</p>}
                {saleItems.map(item => (
                  <div key={item.productId} className="flex justify-between items-center py-1.5 border-b last:border-b-0">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} x {appSettings.currencySymbol}{(isFinite(item.unitPrice) ? item.unitPrice : 0).toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {appSettings.currencySymbol}{(isFinite(item.totalPrice) ? item.totalPrice : 0).toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveSaleItem(item.productId)} title="Eliminar item"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
               <div className="text-xl font-bold text-right text-primary pt-2">
                Subtotal: {appSettings.currencySymbol}{(isFinite(subTotal) ? subTotal : 0).toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        );
      case 'customer':
        return (
          <Card>
            <CardHeader>
                <CardTitle className="text-lg font-headline">Información del Cliente</CardTitle>
                <DialogDescription>Seleccione o ingrese los datos del cliente para la transacción actual. Los cambios aquí no se guardan en el sistema automáticamente.</DialogDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId} disabled={isAddingNewSystemCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente existente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANONYMOUS_CUSTOMER_VALUE}>Anónimo / Consumidor Final</SelectItem>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} {c.phone && `(${c.phone})`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleToggleAddNewSystemCustomer}>
                <UserPlus className="mr-2 h-4 w-4" /> {isAddingNewSystemCustomer ? 'Cancelar Nuevo Cliente del Sistema' : 'Añadir Nuevo Cliente al Sistema'}
              </Button>
              
              {(isAddingNewSystemCustomer || paymentMethod === 'transfer') && (
                <div className={cn("border p-3 rounded-md space-y-2", 
                                isAddingNewSystemCustomer ? "bg-muted/30" 
                                : paymentMethod === 'transfer' ? "bg-blue-500/10" : ""
                )}>
                  <h4 className="text-sm font-medium">
                    {isAddingNewSystemCustomer ? "Datos del Nuevo Cliente para el Sistema" 
                      : (paymentMethod === 'transfer' ? "Datos Requeridos para Transferencia" : "")}
                  </h4>
                  <div>
                      <Label htmlFor="txCustomerName">Nombre Completo *</Label>
                      <Input id="txCustomerName" placeholder="Nombre Completo" name="name" value={currentTransactionCustomer.name} onChange={handleTransactionCustomerInputChange} />
                  </div>
                   <div>
                      <Label htmlFor="txCustomerPhone">Teléfono *</Label>
                      <Input id="txCustomerPhone" placeholder="Teléfono" name="phone" value={currentTransactionCustomer.phone || ''} onChange={handleTransactionCustomerInputChange} />
                  </div>
                  {isAddingNewSystemCustomer && (
                    <div>
                      <Label htmlFor="txCustomerEmail">Email</Label>
                      <Input id="txCustomerEmail" placeholder="Email" type="email" name="email" value={currentTransactionCustomer.email || ''} onChange={handleTransactionCustomerInputChange} />
                    </div>
                  )}
                   <div>
                      <Label htmlFor="txCustomerPersonalId">ID Personal (DNI, CUIT, etc.) *</Label>
                      <Input id="txCustomerPersonalId" placeholder="ID Personal" name="personalId" value={currentTransactionCustomer.personalId || ''} onChange={handleTransactionCustomerInputChange} />
                  </div>
                  <div>
                      <Label htmlFor="txCustomerCardNumber">Nro Tarjeta (16 dígitos) *</Label>
                      <Input 
                          id="txCustomerCardNumber"
                          placeholder="XXXX-XXXX-XXXX-XXXX" 
                          name="cardNumber" 
                          value={currentTransactionCustomer.cardNumber || ''} 
                          onChange={handleCardNumberChange} 
                          maxLength={19}
                      />
                  </div>
                  {isAddingNewSystemCustomer && (
                    <Button size="sm" onClick={handleSaveNewSystemCustomer} disabled={!currentTransactionCustomer.name}>Guardar en Sistema</Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      case 'payment':
        return (
          <Card className="flex-grow">
            <CardHeader><CardTitle className="text-lg font-headline">Resumen y Pago</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-right text-primary">
                Total: {appSettings.currencySymbol}{(isFinite(totalAmount) ? totalAmount : 0).toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="space-y-1">
                <Label htmlFor="paymentMethod">Método de Pago</Label>
                <Select value={paymentMethod} onValueChange={(value: 'cash' | 'transfer') => {
                  setPaymentMethod(value);
                  if (value === 'transfer' && selectedCustomerId !== ANONYMOUS_CUSTOMER_VALUE && !isAddingNewSystemCustomer) {
                      const cust = customers.find(c => c.id === selectedCustomerId);
                      if (cust) {
                        setCurrentTransactionCustomer(prev => ({
                            ...prev, 
                            id: cust.id, 
                            name: prev.name || cust.name, 
                            phone: prev.phone || cust.phone || '',
                            email: prev.email || cust.email || '',
                            personalId: prev.personalId || cust.personalId || '',
                            cardNumber: prev.cardNumber || cust.cardNumber || '',
                        }));
                      }
                  } else if (value === 'cash' && selectedCustomerId === ANONYMOUS_CUSTOMER_VALUE) {
                     setCurrentTransactionCustomer(initialTransactionCustomerData);
                  }
                }}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === 'cash' && (
                <div className="border p-3 rounded-md space-y-3 bg-muted/30">
                  <h4 className="font-medium text-base">Detalles Efectivo</h4>
                  <div className="flex items-end gap-2">
                      <div className="flex-grow">
                          <Label htmlFor="amountReceivedInput">Monto Recibido</Label>
                          <Input 
                              id="amountReceivedInput" 
                              type="number" 
                              placeholder="0.00"
                              value={getAmountReceivedDisplayValue()}
                              onChange={(e) => handleAmountReceivedChange(e.target.value)}
                              min="0"
                              step="0.01"
                              disabled={hasActiveBreakdown}
                              className="text-lg font-semibold text-orange-500"
                          />
                      </div>
                      <Popover open={isCashBreakdownPopoverOpen} onOpenChange={setIsCashBreakdownPopoverOpen}>
                          <PopoverTrigger asChild>
                              <Button variant="outline" size="icon" title="Detallar efectivo recibido">
                                  <Coins className="h-5 w-5" />
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent side="right" align="start" className="bg-popover w-auto"> 
                              <div className="grid gap-4">
                              <div className="space-y-2">
                                  <h4 className="font-medium leading-none">Desglose de Efectivo</h4>
                                  <p className="text-sm text-muted-foreground">
                                  Ingrese la cantidad de cada billete/moneda.
                                  </p>
                              </div>
                              <div className="grid grid-cols-2 gap-x-3 gap-y-2"> 
                                  {denominations.map(den => (
                                  <div key={den}>
                                      <Label htmlFor={`breakdown-popover-${den}`} className="text-xs">{appSettings.currencySymbol}{den.toLocaleString('es-ES', { style: 'decimal' })}</Label>
                                      <Input
                                      id={`breakdown-popover-${den}`}
                                      type="number"
                                      min="0"
                                      placeholder="0"
                                      value={cashBreakdownInputs[String(den)] || ''}
                                      onChange={e => handleCashBreakdownChange(String(den), e.target.value)}
                                      className="w-full h-8 text-sm"
                                      />
                                  </div>
                                  ))}
                              </div>
                              <Button onClick={() => setIsCashBreakdownPopoverOpen(false)} size="sm">Aplicar Desglose</Button>
                              </div>
                          </PopoverContent>
                      </Popover>
                  </div>
                   {hasActiveBreakdown && (
                      <p className="text-xs text-muted-foreground -mt-2">Monto calculado por desglose. Limpie el desglose para entrada directa.</p>
                   )}
                   {(isFinite(cashDetails.amountReceived) ? cashDetails.amountReceived : 0) > 0 && ((isFinite(cashDetails.amountReceived) ? cashDetails.amountReceived : 0) - (isFinite(cashDetails.tip) ? cashDetails.tip : 0)) < (isFinite(totalAmount) ? totalAmount : 0) && (
                    <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle size={14}/>Monto recibido (menos propina) es menor al total.</p>
                  )}
                  <div className="text-lg font-semibold text-orange-500 pt-2">
                    Cambio: <span className="text-lg font-semibold text-orange-500">
                      {appSettings.currencySymbol}{(isFinite(cashDetails.changeGiven) ? cashDetails.changeGiven : 0).toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {appSettings.allowTips && (isFinite(cashDetails.amountReceived) ? cashDetails.amountReceived : 0) - (isFinite(totalAmount) ? totalAmount : 0) >= 0 && (
                     <div>
                       <Label htmlFor="tip">Propina (del cambio disponible)</Label>
                       <Input 
                          id="tip" 
                          type="number" 
                          placeholder="0.00" 
                          min="0"
                          max={Math.max(0, (isFinite(cashDetails.amountReceived) ? cashDetails.amountReceived : 0) - (isFinite(totalAmount) ? totalAmount : 0)).toFixed(2)}
                          value={Number.isNaN(cashDetails.tip) || !isFinite(cashDetails.tip) ? "" : String(cashDetails.tip)}
                          onChange={e => {
                            const enteredValue = e.target.value;
                            const parsedTip = enteredValue === "" ? 0 : parseFloat(enteredValue);
                            if (isFinite(parsedTip)) { 
                                setCashDetails(prev => ({...prev, tip: Math.max(0, parsedTip) }));
                            } else if (enteredValue === "") { 
                                setCashDetails(prev => ({...prev, tip: 0}));
                            }
                          }}
                          step="0.01"
                          className="text-lg font-semibold text-orange-500"
                        />
                        {isFinite(cashDetails.tip) && cashDetails.tip > Math.max(0, (isFinite(cashDetails.amountReceived) ? cashDetails.amountReceived : 0) - (isFinite(totalAmount) ? totalAmount : 0)) ? 
                          <p className="text-xs text-destructive">La propina excede el cambio disponible.</p> : null
                        }
                     </div>
                  )}
                </div>
              )}

              {paymentMethod === 'transfer' && (
                <div className="border p-3 rounded-md space-y-3 bg-muted/30">
                  <h4 className="font-medium text-base">Confirmar Datos del Cliente para Transferencia</h4>
                     <div className="text-sm space-y-1 bg-background/30 p-2 rounded">
                        <p><strong>Nombre:</strong> {currentTransactionCustomer.name || <span className="text-destructive">Requerido (ir a paso Cliente)</span>}</p>
                        <p><strong>ID Personal:</strong> {currentTransactionCustomer.personalId || <span className="text-destructive">Requerido (ir a paso Cliente)</span>}</p>
                        <p><strong>Móvil:</strong> {currentTransactionCustomer.phone || <span className="text-destructive">Requerido (ir a paso Cliente)</span>}</p>
                        <p><strong>Nro. Tarjeta:</strong> {currentTransactionCustomer.cardNumber ? (currentTransactionCustomer.cardNumber.replace(/[^0-9]/g,"").length === 16 ? currentTransactionCustomer.cardNumber : <span className="text-destructive">Inválido (16 dígitos - ir a paso Cliente)</span>) : <span className="text-destructive">Requerido (ir a paso Cliente)</span>}</p>
                     </div>
                   <div>
                    <Label htmlFor="transferReference">Referencia de Pago (Opcional)</Label>
                    <Input id="transferReference" placeholder="Ej: Orden #123" value={transferDetails.reference || ''} onChange={e => setTransferDetails({...transferDetails, reference: e.target.value})} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  const getDialogTitle = () => {
    switch (currentStep) {
      case 'products': return 'Paso 1: Seleccionar Productos';
      case 'customer': return 'Paso 2: Datos del Cliente (para esta transacción)';
      case 'payment': return 'Paso 3: Registrar Pago';
      default: return 'Registrar Nueva Venta';
    }
  };
  
  const getDialogDescription = () => {
     switch (currentStep) {
      case 'products': return 'Escanee códigos de barra o añada productos manualmente al carrito.';
      case 'customer': return 'Seleccione un cliente existente o ingrese los datos para la transacción actual. Los cambios aquí solo afectan esta venta y no se guardan en el sistema a menos que se indique.';
      case 'payment': return 'Seleccione el método de pago y complete los detalles.';
      default: return 'Complete los pasos para registrar una nueva venta.';
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col bg-card"> 
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        {!isDayEffectivelyOpen && (
            <Alert variant="warning" className="mt-2 mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Día Operativo No Abierto</AlertTitle>
                <AlertDescription>
                No se pueden registrar ventas porque no hay un día operativo abierto y configurado. 
                Por favor, vaya a Contabilidad para iniciar un nuevo día.
                </AlertDescription>
            </Alert>
        )}

        <div className="flex-grow overflow-y-auto pr-2 py-4">
          {renderStepContent()}
        </div>

        <DialogFooter className="pt-4 border-t flex justify-between">
          <div> 
            {currentStep === 'customer' && (
              <Button variant="outline" onClick={() => setCurrentStep('products')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Atrás (Productos)
              </Button>
            )}
            {currentStep === 'payment' && (
              <Button variant="outline" onClick={() => setCurrentStep('customer')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Atrás (Cliente)
              </Button>
            )}
          </div>
          <div> 
            <Button variant="ghost" onClick={handleClose} className="mr-2">Cancelar</Button>
            {currentStep === 'products' && (
              <Button 
                onClick={() => setCurrentStep('customer')} 
                disabled={saleItems.length === 0 || !isDayEffectivelyOpen}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Siguiente (Cliente) <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {currentStep === 'customer' && (
              <Button 
                onClick={() => setCurrentStep('payment')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={customerStepNextButtonDisabled || !isDayEffectivelyOpen}
              >
                Siguiente (Pago) <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {currentStep === 'payment' && (
              <Button 
                onClick={handleFinalizeSale} 
                disabled={finalizeSaleButtonDisabled}
                className="bg-green-600 hover:bg-green-600/90 text-white"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Finalizar Venta ({appSettings.currencySymbol}{(isFinite(totalAmount) ? totalAmount : 0).toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })})
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
