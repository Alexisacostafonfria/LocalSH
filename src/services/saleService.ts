
'use server';
// src/services/saleService.ts
import { getDbConnection } from '@/lib/db';
import { Sale, SaleItem } from '@/types';
import { RowDataPacket } from 'mysql2';

/**
 * Fetches all sales from the database with their details.
 * Aligned with the user-provided database schema.
 */
export async function getSales(): Promise<Sale[]> {
    const db = await getDbConnection();
    try {
      const [salesRows] = await db.execute<RowDataPacket[]>(
          `SELECT 
              s.sale_uuid as id,
              s.created_at as timestamp,
              s.operational_date as operationalDate,
              s.origin,
              s.customer_id as customerDbId,
              c.name as customerName,
              c.customer_uuid as customerId,
              s.sub_total as subTotal,
              s.total_amount as totalAmount,
              s.payment_method as paymentMethod,
              s.payment_details as paymentDetails,
              s.user_id as userDbId
           FROM sales s
           LEFT JOIN customers c ON s.customer_id = c.id
           ORDER BY s.created_at DESC`
      );

      const sales: Sale[] = salesRows.map(saleRow => {
          let parsedPaymentDetails = {};
          if (typeof saleRow.paymentDetails === 'string') {
              try {
                  parsedPaymentDetails = JSON.parse(saleRow.paymentDetails);
              } catch (e) {
                  console.error(`Failed to parse payment_details for sale ${saleRow.id}:`, saleRow.paymentDetails);
              }
          } else if (typeof saleRow.paymentDetails === 'object' && saleRow.paymentDetails !== null) {
              parsedPaymentDetails = saleRow.paymentDetails;
          }

          return {
              ...saleRow,
              timestamp: new Date(saleRow.timestamp).toISOString(),
              operationalDate: saleRow.operationalDate ? new Date(saleRow.operationalDate).toISOString() : undefined,
              paymentDetails: parsedPaymentDetails,
              items: [], 
          } as unknown as Sale;
      });

      if (sales.length > 0) {
          const saleIds = sales.map(s => s.id);
          const placeholders = saleIds.map(() => '?').join(',');
          
          const [itemsRows] = await db.execute<RowDataPacket[]>(
              `SELECT sale_uuid as saleId, product_id as productId, product_name as productName, quantity, unit_price as unitPrice, total_price as totalPrice FROM sale_items WHERE sale_uuid IN (${placeholders})`,
              saleIds
          );
          
          const itemsBySaleId = itemsRows.reduce((acc, item) => {
              const saleId = item.saleId;
              if (!acc[saleId]) {
                  acc[saleId] = [];
              }
              acc[saleId].push(item as SaleItem);
              return acc;
          }, {} as Record<string, SaleItem[]>);

          sales.forEach(sale => {
              sale.items = itemsBySaleId[sale.id] || [];
          });
      }

      return sales;
    } finally {
        await db.end();
    }
}


/**
 * Creates a new sale, its items, and updates stock in a transaction.
 * Aligned with the user-provided database schema.
 */
export async function createSale(sale: Sale): Promise<Sale> {
    const db = await getDbConnection();
    await db.beginTransaction();

    try {
        // 1. Insert into sales table using correct column names from user's schema
        await db.execute(
            `INSERT INTO sales (sale_uuid, customer_id, user_id, origin, sub_total, total_amount, payment_method, payment_details, operational_date, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                sale.id,
                sale.customerDbId ?? null,      // Use the numeric customer ID
                sale.userDbId ?? null,          // Use the numeric user ID
                sale.origin,
                sale.subTotal,
                sale.totalAmount,
                sale.paymentMethod,
                JSON.stringify(sale.paymentDetails),
                sale.operationalDate ? new Date(sale.operationalDate) : new Date(),
                new Date(sale.timestamp)
            ]
        );

        // 2. Insert sale items
        if (sale.items.length > 0) {
            const itemValues = sale.items.map(item => [sale.id, item.productId, item.productName, item.quantity, item.unitPrice, item.totalPrice]);
            await db.query(
                'INSERT INTO sale_items (sale_uuid, product_id, product_name, quantity, unit_price, total_price) VALUES ?',
                [itemValues]
            );
        }
        
        // 3. Update product stock using the string UUID (product_uuid)
        for (const item of sale.items) {
            await db.execute(
                'UPDATE products SET stock = stock - ? WHERE product_uuid = ? AND stock >= ?',
                [item.quantity, item.productId, item.quantity]
            );
            const [checkStock] = await db.execute<RowDataPacket[]>('SELECT stock FROM products WHERE product_uuid = ?', [item.productId]);
            if (checkStock.length > 0 && checkStock[0].stock < 0) {
                // This check is a safeguard, the WHERE clause should prevent this.
                throw new Error(`Stock for product ${item.productName} would become negative.`);
            }
        }

        await db.commit();
        return sale;
    } catch (error) {
        await db.rollback();
        console.error("Error creating sale in transaction, rolled back.", error);
        throw error;
    } finally {
      await db.end();
    }
}
