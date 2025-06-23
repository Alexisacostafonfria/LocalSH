
// src/app/(main)/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, ShoppingCart, Archive, BarChartBig, Loader2, Briefcase, DollarSign, Info } from "lucide-react";

import useLocalStorageState from '@/hooks/useLocalStorageState';
import type { Product, Sale, AppSettings, BusinessSettings, SalesDataPoint } from '@/types';
import { DEFAULT_APP_SETTINGS, DEFAULT_BUSINESS_SETTINGS } from '@/types';
import { salesTrendForecast } from '@/ai/flows/sales-trend-forecast';
import { format, parseISO, startOfDay, isToday, subDays } from 'date-fns';

const quickAccessItems = [
  { name: "Nuevo Producto", href: "/products#add", icon: Package, description: "Añadir un nuevo artículo al catálogo." },
  { name: "Registrar Venta", href: "/sales#register", icon: ShoppingCart, description: "Ingresar una nueva transacción de venta." },
  { name: "Ver Inventario", href: "/inventory", icon: Archive, description: "Consultar niveles de stock actuales." },
  { name: "Generar Informe", href: "/reports", icon: BarChartBig, description: "Analizar datos de ventas." },
];

export default function DashboardPage() {
  const [products] = useLocalStorageState<Product[]>('products', []);
  const [sales] = useLocalStorageState<Sale[]>('sales', []);
  const [appSettings] = useLocalStorageState<AppSettings>('appSettings', DEFAULT_APP_SETTINGS);
  const [businessSettings] = useLocalStorageState<BusinessSettings>('businessSettings', DEFAULT_BUSINESS_SETTINGS);


  const [todaySales, setTodaySales] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [nextWeekForecastText, setNextWeekForecastText] = useState<string>("Cargando...");
  const [isLoadingForecast, setIsLoadingForecast] = useState<boolean>(true);

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

  const historicalSalesDataForForecast: SalesDataPoint[] = useMemo(() => {
    const sixtyDaysAgo = subDays(startOfDay(new Date()), 59); 
    const aggregatedSales: { [date: string]: number } = {};

    sales
      .filter(sale => parseISO(sale.timestamp) >= sixtyDaysAgo)
      .forEach(sale => {
        const dateKey = format(startOfDay(parseISO(sale.timestamp)), 'yyyy-MM-dd');
        aggregatedSales[dateKey] = (aggregatedSales[dateKey] || 0) + sale.totalAmount;
      });

    return Object.entries(aggregatedSales)
      .map(([date, salesVolume]) => ({ date, salesVolume }))
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sales]);

  useEffect(() => {
    const fetchForecast = async () => {
      if (historicalSalesDataForForecast.length === 0 && sales.length > 0) {
        setNextWeekForecastText("Pocos datos recientes");
        setIsLoadingForecast(false);
        return;
      }
      
      if (historicalSalesDataForForecast.length >= 7) {
        setIsLoadingForecast(true);
        try {
          const result = await salesTrendForecast({ salesData: historicalSalesDataForForecast });
          setNextWeekForecastText(result.forecast || "Tendencia no disponible");
        } catch (err) {
          console.error("Error fetching dashboard forecast:", err);
          setNextWeekForecastText("Error al obtener pronóstico");
        } finally {
          setIsLoadingForecast(false);
        }
      } else {
        setNextWeekForecastText("Pocos datos para pronóstico");
        setIsLoadingForecast(false);
      }
    };

    if (sales.length === 0) {
        setNextWeekForecastText("Sin datos de ventas");
        setIsLoadingForecast(false);
    } else {
        fetchForecast();
    }
  }, [sales, historicalSalesDataForForecast]);


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Dashboard</h1>
      </div>

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
              {businessSettings.address ? `${businessSettings.address}` : "Gestiona tus ventas, inventario y pronósticos de forma eficiente."}
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
              <h3 className="text-sm font-medium text-muted-foreground">Valor Costo del Stock</h3>
              <p className="text-2xl font-bold">
                {appSettings.currencySymbol}
                {totalStockCostValue.toLocaleString('es-ES', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg shadow">
              <h3 className="text-sm font-medium text-muted-foreground">Pronóstico Próxima Semana</h3>
              <p className="text-2xl font-bold truncate" title={nextWeekForecastText}>
                {isLoadingForecast ? <Loader2 className="h-6 w-6 animate-spin inline" /> : nextWeekForecastText}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

