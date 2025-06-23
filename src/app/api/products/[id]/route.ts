import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { Product } from '@/types';
import type { RowDataPacket } from 'mysql2';

type RouteParams = {
  params: {
    id: string;
  };
};

export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM products WHERE id = ?', [params.id]);
        if (rows.length === 0) {
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error(`Failed to fetch product ${params.id}:`, error);
        return NextResponse.json({ message: 'Error fetching product', error: (error as Error).message }, { status: 500 });
    }
}


export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const productData: Omit<Product, 'id'> = await req.json();
    const { id } = params;
    const { name, category, price, costPrice, stock, unitOfMeasure, imageUrl, description } = productData;

    const [result] = await pool.query<any>(
      'UPDATE products SET name = ?, category = ?, price = ?, costPrice = ?, stock = ?, unitOfMeasure = ?, imageUrl = ?, description = ? WHERE id = ?',
      [name, category, price, costPrice, stock, unitOfMeasure || null, imageUrl || null, description || null, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ id, ...productData });
  } catch (error) {
    console.error(`Failed to update product ${params.id}:`, error);
    return NextResponse.json({ message: 'Error updating product', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const [result] = await pool.query<any>('DELETE FROM products WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error(`Failed to delete product ${params.id}:`, error);
    return NextResponse.json({ message: 'Error deleting product', error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = params;
        const { stockChange } = await req.json();

        if (typeof stockChange !== 'number') {
            return NextResponse.json({ message: 'Invalid stockChange value' }, { status: 400 });
        }
        
        // For sales, stockChange will be negative. We need to check if we have enough stock.
        if (stockChange < 0) {
            const [currentStockRows] = await pool.query<RowDataPacket[]>('SELECT stock FROM products WHERE id = ?', [id]);
            if (currentStockRows.length === 0) {
                return NextResponse.json({ message: 'Product not found' }, { status: 404 });
            }
            if (currentStockRows[0].stock < Math.abs(stockChange)) {
                return NextResponse.json({ message: `Not enough stock for product ${id}. Available: ${currentStockRows[0].stock}, Requested: ${Math.abs(stockChange)}` }, { status: 409 }); // 409 Conflict
            }
        }
        
        const [result] = await pool.query<any>(
            'UPDATE products SET stock = stock + ? WHERE id = ?',
            [stockChange, id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }

        const [updatedRows] = await pool.query<RowDataPacket[]>('SELECT * FROM products WHERE id = ?', [id]);
        
        return NextResponse.json(updatedRows[0]);
    } catch (error) {
        console.error(`Failed to update stock for product ${params.id}:`, error);
        return NextResponse.json({ message: 'Error updating product stock', error: (error as Error).message }, { status: 500 });
    }
}
