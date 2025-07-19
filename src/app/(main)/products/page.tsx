
// src/app/(main)/products/page.tsx
"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { PlusCircle, Search, Edit2, Trash2, Package, Filter, UploadCloud, Image as ImageIcon, Printer, Tags, LayoutGrid, List, BarChartHorizontalBig, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Product, AppSettings, DEFAULT_APP_SETTINGS, BusinessSettings, DEFAULT_BUSINESS_SETTINGS, Sale, AccountingSettings, DEFAULT_ACCOUNTING_SETTINGS, AuthState, DEFAULT_AUTH_STATE, ProductMovement, AuditLogEntry } from '@/types';
import Image from 'next/image';
import { PageHeader } from '@/components/PageHeader';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import ProductBarcode from '@/components/products/ProductBarcode';
import ProductListPrintLayout from '@/components/products/ProductListPrintLayout';
import ProductMovementsReportPrintLayout from '@/components/products/ProductMovementsReportPrintLayout';
import { format, parseISO, startOfDay, endOfDay, isWithinInterval, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { revalidatePath } from 'next/cache';

interface ProductFormData extends Omit<Product, 'id' | 'stock' | 'price' | 'costPrice'> {
  id?: string; 
  stock: string;
  price: string;
  costPrice: string;
}

const initialProductFormState: ProductFormData = {
  id: undefined,
  name: '',
  category: '',
  price: '0',
  costPrice: '0',
  stock: '0',
  unitOfMeasure: '',
  imageUrl: '',
  description: '',
};

type ViewMode = 'grid' | 'list';

export default function ProductsPage() {
  const [products, setProducts] = useLocalStorageState<Product[]>('products', []);
  const [sales] = useLocalStorageState<Sale[]>('sales', []); 
  const [auditLog] = useLocalStorageState<AuditLogEntry[]>('auditLog', []);
  const [appSettings] = useLocalStorageState<AppSettings>('appSettings', DEFAULT_APP_SETTINGS);
  const [businessSettings] = useLocalStorageState<BusinessSettings>('businessSettings', DEFAULT_BUSINESS_SETTINGS);
  const [accountingSettings] = useLocalStorageState<AccountingSettings>('accountingSettings', DEFAULT_ACCOUNTING_SETTINGS);
  const [authState] = useLocalStorageState<AuthState>('authData', DEFAULT_AUTH_STATE);

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>(initialProductFormState);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPrintingProductReport, setIsPrintingProductReport] = useState(false);
  const [isPrintingMovementsReport, setIsPrintingMovementsReport] = useState(false);
  const [movementsReportData, setMovementsReportData] = useState<ProductMovement[]>([]);
  const [movementsOperationalDateDisplay, setMovementsOperationalDateDisplay] = useState<string>('');

  const [isClientMounted, setIsClientMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const { toast } = useToast();
  const isAdmin = authState.currentUser?.role === 'admin';

  useEffect(() => {
    setIsClientMounted(true);
    // Data is now sourced from local storage, so we can remove the API fetch.
    // Replace with logic to initialize from `useLocalStorageState` if needed.
    // For now, `useLocalStorageState` handles initialization.
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (editingProduct) {
      setProductForm({
        id: editingProduct.id,
        name: editingProduct.name,
        category: editingProduct.category,
        price: String(editingProduct.price),
        costPrice: String(editingProduct.costPrice || 0),
        stock: String(editingProduct.stock),
        unitOfMeasure: editingProduct.unitOfMeasure || '',
        imageUrl: editingProduct.imageUrl || '',
        description: editingProduct.description || '',
      });
      if (editingProduct.imageUrl) {
        setImagePreviewUrl(editingProduct.imageUrl);
      } else {
        setImagePreviewUrl(null);
      }
    } else {
      setProductForm(prev => ({
        ...initialProductFormState,
        id: prev.id, // Keep new ID if generated
      }));
      setImagePreviewUrl(null);
    }
  }, [editingProduct]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProductForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Imagen Demasiado Grande",
          description: "Por favor, selecciona una imagen de menos de 2MB.",
          variant: "destructive",
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
        setImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProductForm(prev => ({ ...prev, imageUrl: '' }));
    setImagePreviewUrl(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
     if (!isAdmin) {
      toast({ title: "Acceso Denegado", description: "No tienes permiso para realizar esta acción.", variant: "destructive" });
      return;
    }
    setIsSaving(true);

    const price = Number(productForm.price);
    const costPrice = Number(productForm.costPrice);
    const stock = parseInt(productForm.stock);

    if (!productForm.name ||
        !productForm.category ||
        !isFinite(price) || price <= 0 ||
        !isFinite(costPrice) || costPrice < 0 ||
        !isFinite(stock) || stock < 0
    ) {
      toast({
        title: "Error de Validación",
        description: "Por favor, complete todos los campos obligatorios y asegúrese que los valores numéricos son válidos.",
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }
    
    let uploadedImageUrl = productForm.imageUrl || '';
    if (imageFile) {
        uploadedImageUrl = imagePreviewUrl || ''; // Use the Data URI from the preview
    }

    const productPayload: Product = {
      id: editingProduct?.id || productForm.id || crypto.randomUUID(),
      name: productForm.name,
      category: productForm.category,
      price: price,
      costPrice: costPrice,
      stock: stock,
      unitOfMeasure: productForm.unitOfMeasure,
      description: productForm.description,
      imageUrl: uploadedImageUrl,
    };
    
    // Logic to save to local storage
    if (editingProduct) {
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? productPayload : p));
        toast({ title: "Producto Actualizado", description: `"${productPayload.name}" ha sido guardado.` });
    } else {
        setProducts(prev => [...prev, productPayload]);
        toast({ title: "Producto Creado", description: `"${productPayload.name}" ha sido guardado.` });
    }

    setIsDialogOpen(false);
    setIsSaving(false);
  };

  const openAddDialog = () => {
    if (!isAdmin) {
      toast({ title: "Acceso Denegado", description: "No tienes permiso para añadir productos.", variant: "destructive" });
      return;
    }
    setEditingProduct(null);
    setProductForm({ ...initialProductFormState, id: crypto.randomUUID() });
    setImagePreviewUrl(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    if (!isAdmin) {
      toast({ title: "Acceso Denegado", description: "No tienes permiso para editar productos.", variant: "destructive" });
      return;
    }
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
     if (!isAdmin) {
      toast({ title: "Acceso Denegado", description: "No tienes permiso para eliminar productos.", variant: "destructive" });
      return;
    }
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!isAdmin || !productToDelete) return;
    
    setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
    toast({ title: "Producto Eliminado", description: `"${productToDelete.name}" ha sido eliminado.`, variant: "default" });
    
    setProductToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))).sort(), [products]);

  const filteredProducts = useMemo(() => {
    const searchTermLower = searchTerm.toLowerCase();
    return products.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(searchTermLower);
      const categoryMatch = product.category.toLowerCase().includes(searchTermLower);
      const idMatch = product.id.toLowerCase().includes(searchTermLower);
      const categoryFilterMatch = filterCategory === '' || product.category === filterCategory;
      return (nameMatch || categoryMatch || idMatch) && categoryFilterMatch;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [products, searchTerm, filterCategory]);

  const resetDialogForms = useCallback(() => {
      setEditingProduct(null);
      setProductForm(initialProductFormState);
      setImagePreviewUrl(null);
      setImageFile(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handlePrintProductList = () => {
    if (filteredProducts.length === 0) {
      toast({ title: "Nada que Imprimir", description: "No hay productos que coincidan con los filtros actuales.", variant: "warning" });
      return;
    }
    setIsPrintingProductReport(true);
  };

  const handlePrintMovementsReport = () => {
    if (!accountingSettings.isDayOpen || !accountingSettings.currentOperationalDate) {
        toast({ title: "Día no operativo", description: "Debe iniciar un día operativo para generar este reporte.", variant: "warning" });
        return;
    }
    const operationalDayStartISO = startOfDay(parseISO(accountingSettings.currentOperationalDate)).toISOString();

    const salesForDay = sales.filter(sale => {
        const saleOpDate = sale.operationalDate ? startOfDay(parseISO(sale.operationalDate)).toISOString() : startOfDay(parseISO(sale.timestamp)).toISOString();
        return saleOpDate === operationalDayStartISO;
    });

    const adjustmentsForDay = auditLog.filter(log => {
      const logOpDate = log.timestamp ? startOfDay(parseISO(log.timestamp)).toISOString() : null; // Assuming timestamp is the operational date
      return log.actionType === 'INVENTORY_ADJUSTMENT' && logOpDate === operationalDayStartISO;
    });

    const movementsMap: { [productId: string]: ProductMovement } = {};

    products.forEach(p => {
        movementsMap[p.id] = { productId: p.id, productName: p.name, quantitySold: 0, quantityAdded: 0, remainingStock: p.stock };
    });

    salesForDay.forEach(sale => {
      sale.items.forEach(item => {
        if (movementsMap[item.productId]) {
          movementsMap[item.productId].quantitySold += item.quantity;
        }
      });
    });
    
    adjustmentsForDay.forEach(log => {
      if (log.entityId && movementsMap[log.entityId]) {
        // Example description: "Añadió 5 unidad(es) al stock..."
        const match = log.description.match(/Añadió (\d+) unidad/);
        if (match && match[1]) {
          movementsMap[log.entityId].quantityAdded += parseInt(match[1], 10);
        }
      }
    });

    const movementsData = Object.values(movementsMap).filter(m => m.quantitySold > 0 || m.quantityAdded > 0);
    
    if (movementsData.length === 0) {
      toast({ title: "Sin Movimientos", description: "No se registraron ventas ni ajustes de stock para el día operativo actual.", variant: "warning" });
      return;
    }

    setMovementsReportData(movementsData);
    setMovementsOperationalDateDisplay(format(parseISO(accountingSettings.currentOperationalDate), "PPP", { locale: es }));
    setIsPrintingMovementsReport(true);
  };

  useEffect(() => {
    const handlePrint = (reportId: string, setPrintingState: React.Dispatch<React.SetStateAction<boolean>>) => {
        const timer = setTimeout(() => { window.print(); }, 500); 
        const handleAfterPrint = () => {
            setPrintingState(false);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
        window.addEventListener('afterprint', handleAfterPrint);
        return () => { clearTimeout(timer); window.removeEventListener('afterprint', handleAfterPrint); };
    };
    if (isPrintingProductReport) {
       handlePrint("printableProductListArea", setIsPrintingProductReport);
    }
    if (isPrintingMovementsReport) {
       handlePrint("printableMovementsReportArea", setIsPrintingMovementsReport);
    }
  }, [isPrintingProductReport, isPrintingMovementsReport]);


  return (
    <div className="flex flex-col gap-4 h-full">
      <PageHeader title="Catálogo de Productos" description="Explora, busca y gestiona tus productos.">
        <div className="flex gap-2 items-center flex-wrap">
          <Button variant="outline" size="sm" onClick={handlePrintProductList}><Printer className="h-4 w-4 mr-2"/> Lista de Productos</Button>
          <Button variant="outline" size="sm" onClick={handlePrintMovementsReport}><BarChartHorizontalBig className="h-4 w-4 mr-2"/>Movimientos del Día</Button>
          <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')} title="Vista de Cuadrícula"><LayoutGrid className="h-5 w-5" /></Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')} title="Vista de Lista"><List className="h-5 w-5" /></Button>
        </div>
      </PageHeader>

      {fetchError && (<Alert variant="destructive"><AlertTriangle className="h-5 w-5" /><AlertTitle>Error</AlertTitle><AlertDescription>{fetchError}</AlertDescription></Alert>)}

      <Card><CardContent className="p-4"><div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Buscar por nombre, categoría, ID..." className="pl-8 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select value={filterCategory === '' ? 'all' : filterCategory} onValueChange={(value) => setFilterCategory(value === 'all' ? '' : value)}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Todas las categorías" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                </SelectContent>
            </Select>
        </div>
      </div></CardContent></Card>

      <Card className="flex-1 flex flex-col min-h-0"><CardContent className="flex-1 overflow-y-auto p-4">
        {isLoading ? ( <div className="text-center py-10"><Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">Cargando productos...</p></div>
        ) : filteredProducts.length === 0 && !fetchError ? (
            <div className="text-center py-10 text-muted-foreground"><Package className="mx-auto h-12 w-12 mb-4" /><p className="text-lg">No se encontraron productos.</p><p>Intenta ajustar tu búsqueda o añade nuevos productos.</p></div>
        ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">{filteredProducts.map(product => (
                <Card key={product.id} className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="p-0 relative">
                    <Image src={product.imageUrl || `https://placehold.co/400x300.png?text=${encodeURIComponent(product.name)}`} alt={product.name} width={400} height={300} className="object-cover w-full h-48" data-ai-hint="product item"/>
                  </CardHeader>
                  <CardContent className="p-4 flex-grow flex flex-col">
                    <div className="flex-grow">
                      <CardTitle className="text-lg font-headline mb-1 h-14 line-clamp-2" title={product.name}>{product.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mb-1">{product.category}</p>
                      <p className="text-xl font-semibold text-primary mb-1">{appSettings.currencySymbol}{(product.price || 0).toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}</p>
                      <p className={`text-sm ${product.stock <= appSettings.lowStockThreshold && product.stock > 0 ? 'text-orange-500 font-semibold' : product.stock === 0 ? 'text-destructive font-bold' : ''}`}>Stock: {product.stock} {product.unitOfMeasure || 'unid.'}</p>
                    </div>
                    <div className="mt-auto pt-2"><ProductBarcode productId={product.id} className="flex justify-center items-center" /></div>
                  </CardContent>
                  {isAdmin && (<CardFooter className="p-2 border-t flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(product)} className="flex-1"><Edit2 className="mr-1 h-4 w-4" /> Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(product)} className="flex-1"><Trash2 className="mr-1 h-4 w-4" /> Eliminar</Button>
                  </CardFooter>)}
                </Card>
            ))}</div>
        ) : (
            <div className="overflow-x-auto"><Table>
              <TableHeader><TableRow>
                <TableHead className="w-[60px] hidden sm:table-cell">Imagen</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Categoría</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow></TableHeader>
              <TableBody>{filteredProducts.map(product => (
                  <TableRow key={product.id}>
                    <TableCell className="hidden sm:table-cell"><Image src={product.imageUrl || `https://placehold.co/64x64.png?text=${encodeURIComponent(product.name[0])}`} alt={product.name} width={40} height={40} className="rounded-md object-cover" data-ai-hint="product thumbnail"/></TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate" title={product.name}>{product.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{product.category}</TableCell>
                    <TableCell className="text-right">{appSettings.currencySymbol}{(product.price || 0).toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className={`text-right font-semibold ${product.stock <= appSettings.lowStockThreshold && product.stock > 0 ? 'text-orange-500' : product.stock === 0 ? 'text-destructive' : ''}`}>{product.stock}</TableCell>
                    {isAdmin && (<TableCell className="text-right"><div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)} title="Editar"><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(product)} title="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div></TableCell>)}
                  </TableRow>
              ))}</TableBody>
            </Table></div>
        )}
      </CardContent></Card>

      {isAdmin && (<Button onClick={openAddDialog} className="fixed bottom-6 right-6 z-30 h-14 w-14 rounded-full shadow-xl" aria-label="Añadir Producto"><PlusCircle className="h-7 w-7" /></Button>)}

      {isAdmin && isDialogOpen && ( 
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) resetDialogForms(); setIsDialogOpen(isOpen); }}>
          <DialogContent className="sm:max-w-2xl bg-card">
            <DialogHeader><DialogTitle className="font-headline">{editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}</DialogTitle><DialogDescription>{editingProduct ? 'Actualiza los detalles.' : 'Completa la información.'}</DialogDescription></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto pr-3">
              <div className="space-y-4">
                {[{ id: 'name', label: 'Nombre del Producto', type: 'text' },{ id: 'category', label: 'Categoría', type: 'text' },{ id: 'price', label: 'Precio de Venta', type: 'number', step: '0.01', min: '0.01' },{ id: 'costPrice', label: 'Precio de Costo', type: 'number', step: '0.01', min: '0' },{ id: 'stock', label: 'Stock Inicial', type: 'number', step: '1', min: '0' },{ id: 'unitOfMeasure', label: 'Unidad Medida', type: 'text' }].map(field => (
                  <div key={field.id}><Label htmlFor={field.id} className="block mb-1.5">{field.label}</Label><Input id={field.id} name={field.id} type={field.type} step={field.step} min={field.min} value={productForm[field.id as keyof Omit<ProductFormData, 'id' | 'imageUrl' | 'description'>]} onChange={handleInputChange} /></div>
                ))}
                <div><Label htmlFor="description" className="block mb-1.5">Descripción (Opcional)</Label><Textarea id="description" name="description" value={productForm.description} onChange={handleInputChange} rows={3}/></div>
              </div>
              <div className="space-y-4">
                <Label htmlFor="imageUrl">Imagen del Producto</Label>
                <Input id="imageUrl" name="imageUrl" type="file" accept="image/*" onChange={handleImageChange} className="w-full" ref={fileInputRef}/>
                <p className="text-xs text-muted-foreground">Tamaño máximo: 2MB. Formatos: JPG, PNG, WebP.</p>
                {imagePreviewUrl && (<div className="mt-4 space-y-2"><p className="text-sm font-medium">Vista Previa:</p><div className="relative w-full aspect-video border rounded-md overflow-hidden bg-muted"><Image src={imagePreviewUrl} alt="Vista previa" layout="fill" objectFit="contain" data-ai-hint="product image preview"/></div><Button variant="outline" size="sm" onClick={handleRemoveImage} className="w-full"><Trash2 className="mr-2 h-4 w-4" /> Eliminar Imagen</Button></div>)}
                {!imagePreviewUrl && (<div className="mt-4 flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-md p-4 text-center"><ImageIcon className="h-12 w-12 text-muted-foreground/70 mb-2" /><p className="text-sm text-muted-foreground">Sube una imagen o deja el campo vacío.</p></div>)}
                {productForm.id && ( <div className="mt-4 space-y-2"><div className="flex items-center gap-2"><Tags className="h-4 w-4 text-muted-foreground" /><p className="text-sm font-medium">ID Interno (Código de Barras):</p></div><p className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono">{productForm.id.replace(/-/g, '').substring(0,16)}</p><ProductBarcode productId={productForm.id} className="mt-2 flex justify-center items-center" /></div>)}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetDialogForms(); }}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={isSaving}>{isSaving ? 'Guardando...' : (editingProduct ? 'Guardar Cambios' : 'Añadir Producto')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle className="font-headline">¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente "{productToDelete?.name}".</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Sí, eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
       
      {isClientMounted && isPrintingProductReport && ReactDOM.createPortal(
            <div id="printableProductListArea">
                <ProductListPrintLayout
                    products={filteredProducts}
                    appSettings={appSettings}
                    businessSettings={businessSettings}
                />
            </div>,
            document.body
        )}

      {isClientMounted && isPrintingMovementsReport && ReactDOM.createPortal(
            <div id="printableMovementsReportArea">
                <ProductMovementsReportPrintLayout
                    movements={movementsReportData}
                    operationalDateDisplay={movementsOperationalDateDisplay}
                    businessSettings={businessSettings}
                />
            </div>,
            document.body
      )}

    </div>
  );
}
