// src/app/(main)/audit-log/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Loader2, History } from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay, isWithinInterval, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';
import { useAuditLog } from '@/hooks/useAuditLog';

export default function AuditLogPage() {
  const { auditLog, logAction } = useAuditLog();
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [filterDateRange, setFilterDateRange] = useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const filteredLogs = useMemo(() => {
    if (!filterDateRange?.from) {
      return auditLog;
    }
    const startDate = startOfDay(filterDateRange.from);
    const endDate = filterDateRange.to ? endOfDay(filterDateRange.to) : endOfDay(filterDateRange.from);
    
    return auditLog.filter(log => {
      const logDate = parseISO(log.timestamp);
      return isValid(logDate) && isWithinInterval(logDate, { start: startDate, end: endDate });
    });
  }, [auditLog, filterDateRange]);

  const dateFilterDescription = useMemo(() => {
    if (!filterDateRange?.from) return "todas las fechas";
    const fromDateStr = format(filterDateRange.from, "dd LLL, y", { locale: es });
    if (!filterDateRange.to || format(filterDateRange.from, 'yyyy-MM-dd') === format(filterDateRange.to, 'yyyy-MM-dd')) {
      return `el ${fromDateStr}`;
    }
    const toDateStr = format(filterDateRange.to, "dd LLL, y", { locale: es });
    return `del ${fromDateStr} al ${toDateStr}`;
  }, [filterDateRange]);

  if (!isClientMounted) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Historial de Actividad" description="Registro de todas las operaciones realizadas en el sistema." />

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Filtros del Historial</CardTitle>
          <CardDescription>Mostrando registros para {dateFilterDescription}.</CardDescription>
          <div className="flex items-center gap-2 pt-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !filterDateRange && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterDateRange?.from ? (
                    filterDateRange.to ? (
                      `${format(filterDateRange.from, "dd LLL, y", { locale: es })} - ${format(filterDateRange.to, "dd LLL, y", { locale: es })}`
                    ) : (
                      format(filterDateRange.from, "dd LLL, y", { locale: es })
                    )
                  ) : (
                    <span>Seleccionar rango de fechas</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={filterDateRange?.from}
                  selected={filterDateRange}
                  onSelect={setFilterDateRange}
                  numberOfMonths={2}
                  locale={es}
                  disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <History className="mx-auto h-12 w-12 mb-4" />
              <p className="text-lg">No hay registros de actividad para el período seleccionado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Fecha y Hora</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">{format(parseISO(log.timestamp), "dd MMM yy, HH:mm:ss", { locale: es })}</TableCell>
                    <TableCell>{log.username}</TableCell>
                    <TableCell><Badge variant="outline">{log.actionType}</Badge></TableCell>
                    <TableCell>{log.description}</TableCell>
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
