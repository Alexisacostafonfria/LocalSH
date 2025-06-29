// src/app/(main)/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, ShoppingCart, Archive, BarChartBig, Loader2, Briefcase, DollarSign, Info, AlertTriangle, ClipboardList, PackageCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import useLocalStorageState from '@/hooks/useLocalStorageState';
import type { Product, Sale, AppSettings, BusinessSettings, Order } from '@/types';
import { DEFAULT_APP_SETTINGS, DEFAULT_BUSINESS_SETTINGS } from '@/types';
import { format, parseISO, startOfDay, isToday } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const quickAccessItems = [
  { name: "Nuevo Producto", href: "/products#add", icon: Package, description: "Añadir un nuevo artículo al catálogo." },
  { name: "Registrar Venta", href: "/sales#register", icon: ShoppingCart, description: "Ingresar una nueva transacción de venta." },
  { name: "Ver Inventario", href: "/inventory", icon: Archive, description: "Consultar niveles de stock actuales." },
  { name: "Generar Informe", href: "/reports", icon: BarChartBig, description: "Analizar datos de ventas." },
];

export default function DashboardPage() {
  const [products, setProducts] = useLocalStorageState<Product[]>('products', []);
  const [sales] = useLocalStorageState<Sale[]>('sales', []);
  const [orders] = useLocalStorageState<Order[]>('orders', []);
  const [appSettings] = useLocalStorageState<AppSettings>('appSettings', DEFAULT_APP_SETTINGS);
  const [businessSettings] = useLocalStorageState<BusinessSettings>('businessSettings', DEFAULT_BUSINESS_SETTINGS);

  const [isLoadingProducts, setIsLoadingProducts] = useState(true); // Will be set to false in effect
  const [error, setError] = useState<string | null>(null);
  const [todaySales, setTodaySales] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  const { toast } = useToast();

   useEffect(() => {
    // With localStorage, loading is synchronous and instant after the hook initializes.
    // We can set loading to false immediately.
    setIsLoadingProducts(false);
  }, []);


  useEffect(() => {
    const calculatedTodaySales = sales
      .filter(sale => isToday(parseISO(sale.timestamp)))
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
    setTodaySales(calculatedTodaySales);
  }, [sales]);

  useEffect(() => {
    const count = products.filter(p => p.stock <= appSettings.lowStockThreshold).length;
    setLowStockCount(count);
  }, [products, appSettings.lowStockThreshold]);

  const totalStockCostValue = useMemo(() => {
    return products.reduce((sum, product) => sum + ((product.costPrice || 0) * product.stock), 0);
  }, [products]);
  
  const { activeOrdersCount, readyOrdersCount } = useMemo(() => {
    const active = orders.filter(o => o.status === 'pending' || o.status === 'in-progress').length;
    const ready = orders.filter(o => o.status === 'ready').length;
    return { activeOrdersCount: active, readyOrdersCount: ready };
  }, [orders]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Dashboard</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {businessSettings.logoUrl && (
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden shadow-md border-2 border-primary shrink-0">
              <Image 
                src={businessSettings.logoUrl} 
                alt={`${businessSettings.businessName || 'Logo del Negocio'} logo`} 
                layout="fill" 
                objectFit="cover" 
                data-ai-hint="business logo"
              />
            </div>
          )}
          <div className="text-center sm:text-left">
            <CardTitle className="font-headline text-2xl sm:text-3xl">
              Bienvenido a {businessSettings.businessName || 'Local Sales Hub'}
            </CardTitle>
            <CardDescription className="mt-1 text-sm sm:text-base">
              {businessSettings.address ? `${businessSettings.address}` : "Gestiona tus ventas, inventario y pedidos de forma eficiente."}
            </CardDescription>
            {businessSettings.phone && (
                <p className="text-xs text-muted-foreground mt-1">Tel: {businessSettings.phone}</p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Utiliza los accesos rápidos a continuación o el menú lateral para navegar.
            Esta es tu central de operaciones para todas las funcionalidades clave.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {quickAccessItems.map((item) => (
          <Card key={item.name} className="hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium font-headline">{item.name}</CardTitle>
              <item.icon className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground pb-4">{item.description}</p>
              <Button asChild size="sm" variant="outline">
                <Link href={item.href}>Ir a {item.name.split(' ')[0]}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

       <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-headline">Resumen Rápido</CardTitle>
          <CardDescription>Estadísticas clave de tu negocio.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingProducts ? (
             <div className="flex justify-center items-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg shadow">
              <h3 className="text-sm font-medium text-muted-foreground">Ventas Hoy</h3>
              <p className="text-2xl font-bold">
                {appSettings.currencySymbol}
                {todaySales.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg shadow">
              <h3 className="text-sm font-medium text-muted-foreground">Productos Bajos en Stock</h3>
              <p className="text-2xl font-bold">{lowStockCount}</p>
            </div>
             <div className="p-4 bg-muted/30 rounded-lg shadow">
              <h3 className="text-sm font-medium text-muted-foreground">Pedidos Activos</h3>
              <p className="text-2xl font-bold">{activeOrdersCount}</p>
            </div>
             <div className="p-4 bg-muted/30 rounded-lg shadow">
              <h3 className="text-sm font-medium text-muted-foreground">Pedidos Listos</h3>
              <p className="text-2xl font-bold">{readyOrdersCount}</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg shadow">
              <h3 className="text-sm font-medium text-muted-foreground">Valor Costo del Stock</h3>
              <p className="text-2xl font-bold">
                {appSettings.currencySymbol}
                {totalStockCostValue.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
