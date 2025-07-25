// src/app/api/products/route.ts
'use server';

import { NextResponse } from 'next/server';
import * as productService from '@/services/productService';
import { Product } from '@/types';

/**
 * GET /api/products
 * Fetches all products. The imageUrl will be the public URL from cloud storage.
 */
export async function GET() {
  try {
    const products = await productService.getProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error('API Error fetching products:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Error fetching products from API: ${errorMessage}` }, { status: 500 });
  }
}

/**
 * POST /api/products
 * Creates a new product. Expects data *with* the imageUrl.
 */
export async function POST(request: Request) {
  try {
    const productData: Product = await request.json();
    // TODO: Add server-side validation here (e.g., with Zod)
    const newProduct = await productService.createProduct(productData);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('API Error creating product:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Error creating product in API: ${errorMessage}` }, { status: 500 });
  }
}
