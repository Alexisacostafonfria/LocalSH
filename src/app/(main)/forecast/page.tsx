// src/app/(main)/forecast/page.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sale, SalesDataPoint } from '@/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { salesTrendForecast, SalesTrendForecastOutput } from '@/ai/flows/sales-trend-forecast';
import { Brain, TrendingUp, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, startOfDay } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ForecastPage() {
  const [sales] = useLocalStorageState<Sale[]>('sales', []);
  const [forecastResult, setForecastResult] = useState<SalesTrendForecastOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  const historicalSalesData: SalesDataPoint[] = useMemo(() => {
    const aggregatedSales: { [date: string]: number } = {};
    sales.forEach(sale => {
      const dateKey = format(startOfDay(parseISO(sale.timestamp)), 'yyyy-MM-dd');
      aggregatedSales[dateKey] = (aggregatedSales[dateKey] || 0) + sale.totalAmount; // Using total amount as sales volume proxy
    });
    return Object.entries(aggregatedSales)
      .map(([date, salesVolume]) => ({ date, salesVolume }))
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date
  }, [sales]);

  const handleGenerateForecast = async () => {
    if (historicalSalesData.length < 7) { // Arbitrary minimum data points, e.g., 7 days
      toast({
        title: "Datos Insuficientes",
        description: "Se necesitan más datos históricos de ventas para generar un pronóstico confiable (mínimo 7 días de ventas).",
        variant: "destructive", // Keep toast destructive for actual errors, but page alert is warning
      });
      setError("Datos históricos insuficientes para un pronóstico significativo.");
      setForecastResult(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setForecastResult(null);

    try {
      const result = await salesTrendForecast({ salesData: historicalSalesData });
      setForecastResult(result);
      toast({
        title: "Pronóstico Generado",
        description: "El pronóstico de tendencias de ventas ha sido completado.",
      });
    } catch (err) {
      console.error("Error generating forecast:", err);
      setError("Ocurrió un error al generar el pronóstico. Por favor, inténtalo de nuevo.");
      toast({
        title: "Error en Pronóstico",
        description: "No se pudo generar el pronóstico. Revisa la consola para más detalles.",
        variant: "destructive", // Keep toast destructive
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Pronosticador de Tendencias de Ventas" description="Utiliza IA para predecir futuras tendencias de ventas y optimizar tu inventario." />

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Generar Nuevo Pronóstico</CardTitle>
          <CardDescription>
            Basado en {historicalSalesData.length} días de datos de ventas ({sales.length} transacciones totales). 
            La IA analizará estos datos para predecir tendencias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGenerateForecast} disabled={isLoading} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-5 w-5" />
                Generar Pronóstico
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="warning" className="mt-4">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error al Generar Pronóstico</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {forecastResult && (
        <Card className="shadow-lg animate-in fade-in-50">
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
             <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
                <CardTitle className="font-headline text-2xl">Resultados del Pronóstico</CardTitle>
                <CardDescription>Confianza del pronóstico: <span className="font-semibold text-accent">{forecastResult.confidence}</span></CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg text-primary mb-1">Tendencia Pronosticada:</h3>
              <p className="text-muted-foreground leading-relaxed">{forecastResult.forecast}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-primary mb-1">Recomendaciones de Inventario:</h3>
              <p className="text-muted-foreground leading-relaxed">{forecastResult.recommendations}</p>
            </div>
             <div className="pt-2 text-xs text-muted-foreground">
                Nota: Este pronóstico es una estimación basada en los datos proporcionados y modelos de IA. Úsalo como una guía para la toma de decisiones.
            </div>
          </CardContent>
        </Card>
      )}
       {!isLoading && !forecastResult && !error && historicalSalesData.length > 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <TrendingUp className="mx-auto h-10 w-10 mb-2" />
            <p>Haz clic en "Generar Pronóstico" para obtener información sobre tus ventas futuras.</p>
          </CardContent>
        </Card>
      )}
       {!isLoading && historicalSalesData.length === 0 && (
         <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <AlertTriangle className="mx-auto h-10 w-10 mb-2 text-orange-500" />
            <p>No hay datos de ventas registrados para generar un pronóstico.</p>
            <p>Comienza registrando ventas para poder usar esta funcionalidad.</p>
          </CardContent>
        </Card>
       )}
    </div>
  );
}
