import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { Product } from '@/types';
import type { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM products ORDER BY name ASC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json({ message: 'Error fetching products', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const productData: Omit<Product, 'id'> = await req.json();
    const newProduct: Product = { ...productData, id: crypto.randomUUID() };

    const { id, name, category, price, costPrice, stock, unitOfMeasure, imageUrl, description } = newProduct;

    await pool.query(
      'INSERT INTO products (id, name, category, price, costPrice, stock, unitOfMeasure, imageUrl, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, category, price, costPrice, stock, unitOfMeasure || null, imageUrl || null, description || null]
    );

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json({ message: 'Error creating product', error: (error as Error).message }, { status: 500 });
  }
}
