// src/app/api/products/[id]/route.ts
import { NextResponse } from 'next/server';
import * as productService from '@/services/productService';
import { Product } from '@/types';

/**
 * PUT /api/products/[id]
 * Updates an existing product.
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const productData: Partial<Product> = await request.json();
    const updatedProduct = await productService.updateProduct(params.id, productData);
    if (!updatedProduct) {
        return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error(`API Error updating product ${params.id}:`, error);
    return NextResponse.json({ message: 'Error updating product in API' }, { status: 500 });
  }
}

/**
 * DELETE /api/products/[id]
 * Deletes a product.
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await productService.deleteProduct(params.id);
    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error(`API Error deleting product ${params.id}:`, error);
    return NextResponse.json({ message: 'Error deleting product in API' }, { status: 500 });
  }
}
