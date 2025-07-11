// src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import * as productService from '@/services/productService';
import { Product } from '@/types';

/**
 * GET /api/products
 * Fetches all products. The imageUrl will be undefined as it's not stored in DB.
 */
export async function GET() {
  try {
    const products = await productService.getProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error('API Error fetching products:', error);
    // Check if the error is a known connection error to provide a better message
    if (error instanceof Error && error.message.includes("connect ECONNREFUSED")) {
       return NextResponse.json({ message: 'Database connection refused. Is the database server running and configured correctly?' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error fetching products from API' }, { status: 500 });
  }
}

/**
 * POST /api/products
 * Creates a new product. Expects data *without* imageUrl.
 */
export async function POST(request: Request) {
  try {
    const productData: Omit<Product, 'imageUrl'> = await request.json();
    // TODO: Add server-side validation here (e.g., with Zod)
    const newProduct = await productService.createProduct(productData);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('API Error creating product:', error);
    return NextResponse.json({ message: 'Error creating product in API' }, { status: 500 });
  }
}
