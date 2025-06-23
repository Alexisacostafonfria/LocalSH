
// src/app/(main)/inventory/page.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { Product, InventoryItem, AppSettings, DEFAULT_APP_SETTINGS } from '@/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Archive, Search, PackageCheck, PackageX, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function InventoryPage() {
  const [products] = useLocalStorageState<Product[]>('products', []);
  const [appSettings] = useLocalStorageState<AppSettings>('appSettings', DEFAULT_APP_SETTINGS);
  const [searchTerm, setSearchTerm] = useState('');

  const inventoryItems: InventoryItem[] = useMemo(() => {
    return products
      .map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        stock: product.stock,
        unitOfMeasure: product.unitOfMeasure,
        imageUrl: product.imageUrl,
        isLowStock: product.stock <= appSettings.lowStockThreshold,
      }))
      .filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.stock - b.stock); // Sort by stock, lowest first
  }, [products, appSettings.lowStockThreshold, searchTerm]);

  const totalStockValue = useMemo(() => {
    return products.reduce((sum, product) => sum + (product.price * product.stock), 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return inventoryItems.filter(item => item.isLowStock && item.stock > 0).length;
  }, [inventoryItems]);

  const outOfStockCount = useMemo(() => {
    return inventoryItems.filter(item => item.stock === 0).length;
  }, [inventoryItems]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Seguimiento de Inventario" description="Visualiza y gestiona los niveles de stock de tus productos." />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Totales</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Artículos únicos en catálogo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total del Stock</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appSettings.currencySymbol}{totalStockValue.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Estimación basada en precios actuales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bajo Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Items que necesitan reposición</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agotados</CardTitle>
            <PackageX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">Items sin stock disponible</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Niveles de Stock Actuales</CardTitle>
          <CardDescription>
            Revisa el stock de cada producto. Los artículos con bajo stock están resaltados.
          </CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar producto por nombre o categoría..."
              className="w-full pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {inventoryItems.length === 0 ? (
             <div className="text-center py-10 text-muted-foreground">
              <Archive className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg">No hay productos en el inventario.</p>
              <p>Añade productos en el catálogo para verlos aquí.</p>
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] hidden sm:table-cell">Imagen</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Stock Actual</TableHead>
                <TableHead className="text-center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems.map((item) => (
                <TableRow key={item.id} className={cn(item.stock === 0 ? "bg-destructive/10" : item.isLowStock ? "bg-orange-500/10" : "")}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      src={item.imageUrl || `https://placehold.co/64x64.png?text=${encodeURIComponent(item.name[0])}`}
                      alt={item.name}
                      width={40}
                      height={40}
                      className="rounded-md object-cover"
                      data-ai-hint="product thumbnail"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-right font-semibold">{item.stock} {item.unitOfMeasure || 'unidades'}</TableCell>
                  <TableCell className="text-center">
                    {item.stock === 0 ? (
                      <Badge variant="destructive">Agotado</Badge>
                    ) : item.isLowStock ? (
                      <Badge variant="outline" className="border-orange-500 text-orange-500">Bajo Stock</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30">En Stock</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

