// src/pages/api/products/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/mysql';
import { Product } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET': {
        const products = await query<Product[]>('SELECT * FROM products ORDER BY name ASC');
        res.status(200).json(products);
        break;
      }
      case 'POST': {
        const product: Product = req.body;
        if (!product.id || !product.name || !product.category || product.price == null || product.stock == null) {
          return res.status(400).json({ message: 'Faltan campos requeridos.' });
        }
        
        const sql = `
          INSERT INTO products (id, name, category, price, costPrice, stock, unitOfMeasure, imageUrl, description)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
          product.id,
          product.name,
          product.category,
          product.price,
          product.costPrice || 0,
          product.stock,
          product.unitOfMeasure || null,
          product.imageUrl || null,
          product.description || null,
        ];
        
        await query(sql, params);
        res.status(201).json(product);
        break;
      }
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error /api/products:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
