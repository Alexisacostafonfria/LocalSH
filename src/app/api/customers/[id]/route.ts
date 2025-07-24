
// src/app/api/customers/[id]/route.ts
'use server';

import { NextResponse } from 'next/server';
import * as customerService from '@/services/customerService';
import { Customer } from '@/types';

/**
 * PUT /api/customers/[id]
 * Updates an existing customer.
 */
export async function PUT(request: Request, context: { params: { id: string } }) {
  const { id } = context.params;
  if (!id) {
    return NextResponse.json({ message: 'Customer ID is required' }, { status: 400 });
  }
  try {
    const customerData: Partial<Customer> = await request.json();
    const updatedCustomer = await customerService.updateCustomer(id, customerData);
    if (!updatedCustomer) {
        return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
    }
    return NextResponse.json(updatedCustomer);
  } catch (error)
    console.error(`API Error updating customer ${id}:`, error);
    return NextResponse.json({ message: 'Error updating customer in API' }, { status: 500 });
  }
}

/**
 * DELETE /api/customers/[id]
 * Deletes a customer.
 */
export async function DELETE(request: Request, context: { params: { id: string } }) {
  const { id } = context.params;
   if (!id) {
    return NextResponse.json({ message: 'Customer ID is required' }, { status: 400 });
  }
  try {
    await customerService.deleteCustomer(id);
    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error(`API Error deleting customer ${id}:`, error);
    return NextResponse.json({ message: 'Error deleting customer in API' }, { status: 500 });
  }
}
