
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
import { Product, AppSettings, DEFAULT_APP_SETTINGS, BusinessSettings, DEFAULT_BUSINESS_SETTINGS, Sale, AccountingSettings, DEFAULT_ACCOUNTING_SETTINGS, AuthState, DEFAULT_AUTH_STATE } from '@/types';
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
import ProductMovementsReportPrintLayout, { ProductMovement } from '@/components/products/ProductMovementsReportPrintLayout';
import { format, parseISO, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


interface ProductFormData extends Omit<Product, 'id' | 'stock' | 'price' | 'costPrice'> {
  id?: string; 
  stock: string;
  price: string;
  costPrice: string;
  unitOfMeasure: string;
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
  const [products, setProducts] = useState<Product[]>([]);
  const [sales] = useLocalStorageState<Sale[]>('sales', []); 
  const [appSettings] = useLocalStorageState<AppSettings>('appSettings', DEFAULT_APP_SETTINGS);
  const [businessSettings] = useLocalStorageState<BusinessSettings>('businessSettings', DEFAULT_BUSINESS_SETTINGS);
  const [accountingSettings] = useLocalStorageState<AccountingSettings>('accountingSettings', DEFAULT_ACCOUNTING_SETTINGS);
  const [authState] = useLocalStorageState<AuthState>('authData', DEFAULT_AUTH_STATE);

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>(initialProductFormState);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPrintingProductReport, setIsPrintingProductReport] = useState(false);
  const [isPrintingMovementsReport, setIsPrintingMovementsReport] = useState(false);
  const [movementsReportData, setMovementsReportData] = useState<ProductMovement[]>([]);
  const [movementsOperationalDateDisplay, setMovementsOperationalDateDisplay] = useState<string>('');

  const [isClientMounted, setIsClientMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const { toast } = useToast();
  const isAdmin = authState.currentUser?.role === 'admin';

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
        const response = await fetch('/api/products');
        if (!response.ok) {
            const errorData = await response.json();
            const detailedMessage = errorData.error ? `${errorData.message} -> Detalle: ${errorData.error}` : errorData.message;
            throw new Error(detailedMessage || 'Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data);
    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error(errorMessage);
        setFetchError("No se pudieron cargar los productos. " + errorMessage + ". Por favor, verifica tu archivo .env.local.");
        toast({
            title: "Error al Cargar Productos",
            description: errorMessage,
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setIsClientMounted(true);
    fetchProducts();
  }, [fetchProducts]);

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
        const dataUrl = reader.result as string;
        setProductForm(prev => ({ ...prev, imageUrl: dataUrl }));
        setImagePreviewUrl(dataUrl);
      };
      reader.onerror = () => {
        toast({
          title: "Error al Cargar Imagen",
          description: "Hubo un problema al procesar la imagen. Inténtalo de nuevo.",
          variant: "destructive",
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      }
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProductForm(prev => ({ ...prev, imageUrl: '' }));
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  const handleSelectChange = (value: string) => {
    setProductForm(prev => ({ ...prev, category: value }));
  };


  const handleSubmit = async () => {
    if (!isAdmin) {
      toast({ title: "Acceso Denegado", description: "No tienes permiso para realizar esta acción.", variant: "destructive" });
      return;
    }
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
        description: "Por favor, complete todos los campos obligatorios. Asegúrese que Precio, Precio de Costo y Stock sean números válidos (Precio > 0, Costo >= 0, Stock >= 0).",
        variant: "destructive",
      });
      return;
    }
    
    const productPayload: Omit<Product, 'id'> = {
      name: productForm.name,
      category: productForm.category,
      price: price,
      costPrice: costPrice,
      stock: stock,
      unitOfMeasure: productForm.unitOfMeasure,
      imageUrl: productForm.imageUrl,
      description: productForm.description,
    };
    
    try {
        let response;
        if (editingProduct) {
            response = await fetch(`/api/products/${editingProduct.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productPayload),
            });
        } else {
            response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productPayload),
            });
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar el producto');
        }

        const savedProduct = await response.json();

        toast({
            title: editingProduct ? "Producto Actualizado" : "Producto Creado",
            description: `"${savedProduct.name}" ha sido guardado.`,
        });

        await fetchProducts();
        
        setIsDialogOpen(false);
        setEditingProduct(null);
        setProductForm(initialProductFormState);
        setImagePreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
    } catch (error) {
        console.error(error);
        toast({
            title: "Error al guardar",
            description: (error as Error).message,
            variant: "destructive",
        });
    }
  };

  const openAddDialog = () => {
    if (!isAdmin) {
      toast({ title: "Acceso Denegado", description: "No tienes permiso para añadir productos.", variant: "destructive" });
      return;
    }
    setEditingProduct(null);
    setProductForm({ ...initialProductFormState, id: crypto.randomUUID() });
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
    if (!isAdmin) {
      toast({ title: "Acceso Denegado", description: "No tienes permiso para eliminar productos.", variant: "destructive" });
      setIsDeleteDialogOpen(false);
      return;
    }
    if (!productToDelete) return;
    
    try {
        const response = await fetch(`/api/products/${productToDelete.id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al eliminar el producto');
        }
        
        toast({ title: "Producto Eliminado", description: `"${productToDelete.name}" ha sido eliminado.`, variant: "default" });
        await fetchProducts(); // Refetch
        setProductToDelete(null);
        setIsDeleteDialogOpen(false);

    } catch (error) {
        console.error(error);
        toast({
            title: "Error al eliminar",
            description: (error as Error).message,
            variant: "destructive",
        });
    }
  };

  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))).sort(), [products]);

  const filteredProducts = useMemo(() => {
    const searchTermLower = searchTerm.toLowerCase();
    return products.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(searchTermLower);
      const categoryMatch = product.category.toLowerCase().includes(searchTermLower);
      const idMatchWithHyphens = product.id.toLowerCase().includes(searchTermLower);
      const idMatchWithoutHyphens = product.id.replace(/-/g, '').toLowerCase().includes(searchTermLower);
      const categoryFilterMatch = filterCategory === '' || product.category === filterCategory;

      return (nameMatch || categoryMatch || idMatchWithHyphens || idMatchWithoutHyphens) && categoryFilterMatch;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [products, searchTerm, filterCategory]);


  const handlePrintProductReport = () => {
    if (products.length === 0) {
      toast({
        title: "Nada que Imprimir",
        description: "No hay productos en el catálogo para generar un reporte.",
        variant: "warning"
      });
      return;
    }
    setIsPrintingProductReport(true);
  };

  useEffect(() => {
    if (isPrintingProductReport && products.length > 0 && isClientMounted) {
      const timer = setTimeout(() => {
        window.print();
      }, 300);

      const handleAfterPrint = () => {
        setIsPrintingProductReport(false);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
      window.addEventListener('afterprint', handleAfterPrint);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [isPrintingProductReport, products, isClientMounted]);


  const handlePrintMovementsReport = () => {
    if (!accountingSettings.isDayOpen || !accountingSettings.currentOperationalDate) {
      toast({
        title: "Día No Operativo",
        description: "No hay un día operativo abierto para generar el reporte de movimientos.",
        variant: "warning",
      });
      return;
    }

    const currentOpDateISO = startOfDay(parseISO(accountingSettings.currentOperationalDate)).toISOString();
    const salesForCurrentDay = sales.filter(sale => {
      const saleOpDate = sale.operationalDate ? startOfDay(parseISO(sale.operationalDate)).toISOString() : startOfDay(parseISO(sale.timestamp)).toISOString();
      return saleOpDate === currentOpDateISO;
    });

    if (salesForCurrentDay.length === 0) {
      toast({
        title: "Sin Movimientos",
        description: `No hay ventas registradas para el día ${format(parseISO(currentOpDateISO), "PPP", { locale: es })}.`,
        variant: "default",
      });
      return;
    }

    const aggregatedMovements: { [productId: string]: ProductMovement } = {};

    salesForCurrentDay.forEach(sale => {
      sale.items.forEach(item => {
        const productInfo = products.find(p => p.id === item.productId);
        if (aggregatedMovements[item.productId]) {
          aggregatedMovements[item.productId].quantitySold += item.quantity;
        } else {
          aggregatedMovements[item.productId] = {
            productId: item.productId,
            productName: productInfo?.name || 'Producto Desconocido',
            quantitySold: item.quantity,
            remainingStock: productInfo?.stock ?? 0, // Use remaining stock from DB
          };
        }
      });
    });

    const movementsArray = Object.values(aggregatedMovements).sort((a,b) => a.productName.localeCompare(b.productName));

    if (movementsArray.length === 0) {
         toast({
            title: "Sin Movimientos de Productos",
            description: `No se vendieron productos específicos el ${format(parseISO(currentOpDateISO), "PPP", { locale: es })}.`,
            variant: "default",
        });
        return;
    }

    setMovementsReportData(movementsArray);
    setMovementsOperationalDateDisplay(format(parseISO(currentOpDateISO), "PPP", { locale: es }));
    setIsPrintingMovementsReport(true);
  };


  useEffect(() => {
    if (isPrintingMovementsReport && movementsReportData.length > 0 && isClientMounted) {
      const timer = setTimeout(() => {
        window.print();
      }, 300);

      const handleAfterPrint = () => {
        setIsPrintingMovementsReport(false);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
      window.addEventListener('afterprint', handleAfterPrint);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [isPrintingMovementsReport, movementsReportData, isClientMounted]);


  useEffect(() => {
    if (!isDialogOpen && !editingProduct) {
      setProductForm(initialProductFormState);
    }
  }, [isDialogOpen, editingProduct]);


  return (
    <div className="flex flex-col gap-4 h-full">
      <PageHeader title="Catálogo de Productos" description="Explora, busca y gestiona tus productos.">
        <div className="flex gap-2 items-center flex-wrap">
          <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')} title="Vista de Cuadrícula">
            <LayoutGrid className="h-5 w-5" />
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')} title="Vista de Lista">
            <List className="h-5 w-5" />
          </Button>
          <Button onClick={handlePrintProductReport} variant="outline" className="hidden sm:flex">
              <Printer className="mr-2 h-5 w-5" /> Imprimir Catálogo
          </Button>
          {accountingSettings.isDayOpen && accountingSettings.currentOperationalDate && (
            <Button onClick={handlePrintMovementsReport} variant="outline" className="hidden sm:flex">
              <BarChartHorizontalBig className="mr-2 h-5 w-5" /> Reporte Movimientos Hoy
            </Button>
          )}
        </div>
      </PageHeader>

      {fetchError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error de Conexión a la Base de Datos</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre, categoría, ID..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
               <Filter className="h-5 w-5 text-muted-foreground" />
                <Select
                  value={filterCategory === '' ? 'all' : filterCategory}
                  onValueChange={(value) => setFilterCategory(value === 'all' ? '' : value)}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-10">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Cargando productos...</p>
            </div>
          ) : filteredProducts.length === 0 && !fetchError ? (
            <div className="text-center py-10 text-muted-foreground">
              <Package className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg">No se encontraron productos.</p>
              <p>Intenta ajustar tu búsqueda o añade nuevos productos.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredProducts.map(product => (
                <Card key={product.id} className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="p-0 relative">
                    <Image
                      src={product.imageUrl || `https://placehold.co/400x300.png?text=${encodeURIComponent(product.name)}`}
                      alt={product.name}
                      width={400}
                      height={300}
                      className="object-cover w-full h-48"
                      data-ai-hint="product item"
                    />
                  </CardHeader>
                  <CardContent className="p-4 flex-grow flex flex-col">
                    <div className="flex-grow">
                      <CardTitle className="text-lg font-headline mb-1 truncate" title={product.name}>{product.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mb-1">{product.category}</p>
                      <p className="text-xl font-semibold text-primary mb-1">
                        {appSettings.currencySymbol}{(typeof product.price === 'number' && isFinite(product.price) ? product.price : 0).toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Costo: {appSettings.currencySymbol}{(typeof product.costPrice === 'number' && isFinite(product.costPrice) ? product.costPrice : 0).toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className={`text-sm ${product.stock <= appSettings.lowStockThreshold && product.stock !== 0 ? 'text-orange-500 font-semibold' : product.stock === 0 ? 'text-destructive font-bold' : 'text-foreground'}`}>
                        Stock: {product.stock} {product.unitOfMeasure || 'unidades'}
                      </p>
                      {product.stock <= appSettings.lowStockThreshold && product.stock > 0 && (
                        <p className="text-xs text-orange-500">(Bajo stock)</p>
                      )}
                      {product.stock === 0 && (
                        <p className="text-xs text-destructive font-bold">(Agotado)</p>
                      )}
                    </div>
                    <div className="mt-auto">
                      <ProductBarcode productId={product.id} className="flex justify-center items-center" />
                    </div>
                  </CardContent>
                  {isAdmin && (
                    <CardFooter className="p-4 border-t border-border flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(product)} className="flex-1">
                        <Edit2 className="mr-1 h-4 w-4" /> Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(product)} className="flex-1">
                        <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] hidden sm:table-cell">Imagen</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Categoría</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Costo</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="hidden lg:table-cell">U. Medida</TableHead>
                  <TableHead className="w-[150px] text-center hidden xl:table-cell">Código Barras</TableHead>
                  {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map(product => (
                  <TableRow key={product.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Image
                        src={product.imageUrl || `https://placehold.co/64x64.png?text=${encodeURIComponent(product.name[0])}`}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="rounded-md object-cover"
                        data-ai-hint="product thumbnail"
                      />
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate" title={product.name}>{product.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{product.category}</TableCell>
                    <TableCell className="text-right">
                      {appSettings.currencySymbol}{(typeof product.price === 'number' && isFinite(product.price) ? product.price : 0).toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {appSettings.currencySymbol}{(typeof product.costPrice === 'number' && isFinite(product.costPrice) ? product.costPrice : 0).toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${product.stock <= appSettings.lowStockThreshold && product.stock !== 0 ? 'text-orange-500' : product.stock === 0 ? 'text-destructive' : ''}`}>
                      {product.stock}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{product.unitOfMeasure || 'N/A'}</TableCell>
                    <TableCell className="text-center hidden xl:table-cell">
                      <ProductBarcode
                        productId={product.id}
                        barcodeWidth={1}
                        barcodeHeight={30}
                        barcodeFontSize={8}
                        barcodeTextMargin={1}
                        barcodeMargin={1}
                        className="mx-auto"
                      />
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)} title="Editar">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(product)} title="Eliminar">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Button
          onClick={openAddDialog}
          className="fixed bottom-6 right-6 z-30 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/80 text-primary-foreground flex items-center justify-center"
          aria-label="Añadir Producto"
          title="Añadir Producto"
        >
          <PlusCircle className="h-7 w-7" />
        </Button>
      )}

      {isAdmin && isDialogOpen && ( 
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
          if (!isAdmin) {
             setIsDialogOpen(false); 
             return;
          }
          setIsDialogOpen(isOpen);
          if (!isOpen) {
            setEditingProduct(null);
            setImagePreviewUrl(null);
            if(fileInputRef.current) fileInputRef.current.value = "";
          }
        }}>
          <DialogContent className="sm:max-w-2xl bg-card">
            <DialogHeader>
              <DialogTitle className="font-headline">{editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Actualiza los detalles del producto.' : 'Completa la información para añadir un nuevo producto al catálogo.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto pr-3">

              <div className="space-y-4">
                {[
                  { id: 'name', label: 'Nombre del Producto', type: 'text' },
                  { id: 'category', label: 'Categoría', type: 'text' },
                  { id: 'price', label: 'Precio de Venta', type: 'number', step: '0.01', min: '0.01' },
                  { id: 'costPrice', label: 'Precio de Costo', type: 'number', step: '0.01', min: '0' },
                  { id: 'stock', label: 'Stock Inicial', type: 'number', step: '1', min: '0' },
                  { id: 'unitOfMeasure', label: 'Unidad Medida (Ej: kg, lt, un.)', type: 'text' },
                ].map(field => (
                  <div key={field.id}>
                    <Label htmlFor={field.id} className="block mb-1.5">
                      {field.label}
                    </Label>
                    <Input
                      id={field.id}
                      name={field.id}
                      type={field.type}
                      step={field.step}
                      min={field.min}
                      value={productForm[field.id as keyof Omit<ProductFormData, 'id' | 'imageUrl' | 'description'>]}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  </div>
                ))}
                <div>
                  <Label htmlFor="description" className="block mb-1.5">
                    Descripción (Opcional)
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={productForm.description}
                    onChange={handleInputChange}
                    className="w-full"
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="imageUrl" className="block mb-1.5">Imagen del Producto</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  ref={fileInputRef}
                />
                <p className="text-xs text-muted-foreground">Tamaño máximo: 2MB. Formatos recomendados: JPG, PNG, WebP.</p>

                {imagePreviewUrl && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Vista Previa:</p>
                    <div className="relative w-full aspect-video border rounded-md overflow-hidden bg-muted">
                      <Image src={imagePreviewUrl} alt="Vista previa de imagen" layout="fill" objectFit="contain" data-ai-hint="product image preview"/>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRemoveImage} className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" /> Eliminar Imagen
                    </Button>
                  </div>
                )}
                {!imagePreviewUrl && (
                  <div className="mt-4 flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-muted-foreground/50 rounded-md p-4 text-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/70 mb-2" />
                      <p className="text-sm text-muted-foreground">Sube una imagen o deja el campo vacío para usar un placeholder.</p>
                  </div>
                )}

                {productForm.id && ( 
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                       <Tags className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">ID Interno (para código de barras):</p>
                    </div>
                    <p className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono">{productForm.id.replace(/-/g, '').substring(0,16)}</p>
                    <ProductBarcode productId={productForm.id} className="mt-2 flex justify-center items-center" />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  setEditingProduct(null);
                  setProductForm(initialProductFormState);
                  setImagePreviewUrl(null);
                  if(fileInputRef.current) fileInputRef.current.value = "";
              }}>Cancelar</Button>
              <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground">{editingProduct ? 'Guardar Cambios' : 'Añadir Producto'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline">¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el producto "{productToDelete?.name}" de tu catálogo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isPrintingProductReport && isClientMounted && typeof document !== 'undefined' &&
        ReactDOM.createPortal(
          <div id="printableProductListArea">
            <ProductListPrintLayout
              products={products}
              appSettings={appSettings}
              businessSettings={businessSettings}
            />
          </div>,
          document.body
        )
      }

      {isPrintingMovementsReport && isClientMounted && typeof document !== 'undefined' &&
        ReactDOM.createPortal(
          <div id="printableMovementsReportArea">
            <ProductMovementsReportPrintLayout
              movements={movementsReportData}
              operationalDateDisplay={movementsOperationalDateDisplay}
              businessSettings={businessSettings}
            />
          </div>,
          document.body
        )
      }

    </div>
  );
}
