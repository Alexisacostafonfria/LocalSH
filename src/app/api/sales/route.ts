
// src/app/api/sales/route.ts
'use server';

import { NextResponse } from 'next/server';
import * as saleService from '@/services/saleService';
import { Sale } from '@/types';

/**
 * GET /api/sales
 * Fetches all sales with their details.
 */
export async function GET() {
  try {
    const sales = await saleService.getSales();
    return NextResponse.json(sales);
  } catch (error) {
    console.error('API Error fetching sales:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';

    if (error instanceof Error && error.message.toLowerCase().includes("doesn't exist")) {
        return NextResponse.json({ message: "Una de las tablas de ventas (sales, sale_items) no existe en la base de datos." }, { status: 500 });
    }
    return NextResponse.json({ message: `Error fetching sales from API: ${errorMessage}` }, { status: 500 });
  }
}

/**
 * POST /api/sales
 * Creates a new sale transaction.
 */
export async function POST(request: Request) {
  try {
    const saleData: Sale = await request.json();
    const newSale = await saleService.createSale(saleData);
    return NextResponse.json(newSale, { status: 201 });
  } catch (error) {
    console.error('API Error creating sale:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Error creating sale in API: ${errorMessage}` }, { status: 500 });
  }
}
