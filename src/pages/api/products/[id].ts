// src/pages/api/products/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/mysql';
import { Product } from '@/types';
import type { OkPacket } from 'mysql2';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'ID de producto inválido.' });
  }

  try {
    switch (req.method) {
      case 'GET': {
        const products = await query<Product[]>('SELECT * FROM products WHERE id = ?', [id]);
        if (products.length === 0) {
          return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        res.status(200).json(products[0]);
        break;
      }
      case 'PUT': {
        const product: Product = req.body;
        if (!product.name || !product.category || product.price == null || product.stock == null) {
          return res.status(400).json({ message: 'Faltan campos requeridos.' });
        }

        const sql = `
          UPDATE products SET
            name = ?,
            category = ?,
            price = ?,
            costPrice = ?,
            stock = ?,
            unitOfMeasure = ?,
            imageUrl = ?,
            description = ?
          WHERE id = ?
        `;
        const params = [
          product.name,
          product.category,
          product.price,
          product.costPrice || 0,
          product.stock,
          product.unitOfMeasure || null,
          product.imageUrl || null,
          product.description || null,
          id,
        ];

        const result = await query<OkPacket>(sql, params);
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Producto no encontrado para actualizar.' });
        }
        res.status(200).json(product);
        break;
      }
      case 'DELETE': {
        const result = await query<OkPacket>('DELETE FROM products WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Producto no encontrado para eliminar.' });
        }
        res.status(204).end(); // No Content
        break;
      }
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error(`API Error /api/products/${id}:`, error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
