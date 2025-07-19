
// src/app/api/customers/route.ts
'use server';

import { NextResponse } from 'next/server';
import * as customerService from '@/services/customerService';
import { Customer } from '@/types';

/**
 * GET /api/customers
 * Fetches all customers.
 */
export async function GET() {
  try {
    const customers = await customerService.getCustomers();
    return NextResponse.json(customers);
  } catch (error) {
    console.error('API Error fetching customers:', error);
    if (error instanceof Error && error.message.includes("connect ECONNREFUSED")) {
       return NextResponse.json({ message: 'Database connection refused.' }, { status: 500 });
    }
    if (error instanceof Error && error.message.includes("doesn't exist")) {
        return NextResponse.json({ message: "La tabla 'customers' no existe en la base de datos." }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error fetching customers from API' }, { status: 500 });
  }
}

/**
 * POST /api/customers
 * Creates a new customer.
 */
export async function POST(request: Request) {
  try {
    const customerData: Customer = await request.json();
    const newCustomer = await customerService.createCustomer(customerData);
    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error) {
    console.error('API Error creating customer:', error);
    return NextResponse.json({ message: 'Error creating customer in API' }, { status: 500 });
  }
}

    