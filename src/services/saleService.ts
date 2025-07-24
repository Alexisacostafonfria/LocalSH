
'use server';
// src/services/saleService.ts
import { getDbConnection } from '@/lib/db';
import { Sale, SaleItem, CashPaymentDetails, TransferPaymentDetails, InvoicePaymentDetails } from '@/types';
import { RowDataPacket } from 'mysql2';

/**
 * Fetches all sales from the database with their details.
 * Corrected to match the user's provided schema.
 */
export async function getSales(): Promise<Sale[]> {
    const db = await getDbConnection();
    const [salesRows] = await db.execute<RowDataPacket[]>(
        `SELECT 
            sale_uuid as id,
            created_at as timestamp,
            operational_date as operationalDate,
            origin,
            customer_uuid as customerId,
            customer_name as customerName,
            sub_total as subTotal,
            total_amount as totalAmount,
            payment_method as paymentMethod,
            payment_details as paymentDetails,
            user_id as userId
         FROM sales ORDER BY created_at DESC`
    );

    const sales: Sale[] = salesRows.map(saleRow => {
        // The payment_details column is already a JSON string, which Next.js/MySQL2 driver often auto-parses.
        // If it's a string, we parse it. If it's an object, we use it directly.
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
            // Items are not stored in the sales table in the provided schema, 
            // assuming they are handled separately or will be added later.
            // For now, returning an empty array to prevent crashes.
            items: [], 
        } as Sale;
    });

    // In the provided schema, sale_items are in a separate table.
    // We need to fetch them for each sale.
    for (const sale of sales) {
         const [itemsRows] = await db.execute<RowDataPacket[]>(
            'SELECT product_uuid as productId, product_name as productName, quantity, unit_price as unitPrice, total_price as totalPrice FROM sale_items WHERE sale_uuid = ?',
            [sale.id]
        );
        sale.items = itemsRows as SaleItem[];
    }

    return sales;
}


/**
 * Creates a new sale, its items, and updates stock in a transaction.
 * Corrected to match the user's provided schema.
 */
export async function createSale(sale: Sale): Promise<Sale> {
    const db = await getDbConnection();
    await db.beginTransaction();

    try {
        // 1. Insert into sales table
        await db.execute(
            `INSERT INTO sales (sale_uuid, customer_uuid, customer_name, user_id, origin, sub_total, total_amount, payment_method, payment_details, operational_date, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                sale.id,
                sale.customerId, // Using the UUID for customer_uuid
                sale.customerName,
                sale.userId, // This should be the user's ID from your auth system
                sale.origin,
                sale.subTotal,
                sale.totalAmount,
                sale.paymentMethod,
                JSON.stringify(sale.paymentDetails), // Store the details object as a JSON string
                sale.operationalDate ? new Date(sale.operationalDate) : new Date(),
                new Date(sale.timestamp)
            ]
        );

        // 2. Insert sale items
        if (sale.items.length > 0) {
            const itemValues = sale.items.map(item => [sale.id, item.productId, item.productName, item.quantity, item.unitPrice, item.totalPrice]);
            await db.query(
                'INSERT INTO sale_items (sale_uuid, product_uuid, product_name, quantity, unit_price, total_price) VALUES ?',
                [itemValues]
            );
        }
        
        // 3. Update product stock
        for (const item of sale.items) {
            await db.execute(
                'UPDATE products SET stock = stock - ? WHERE product_uuid = ? AND stock >= ?',
                [item.quantity, item.productId, item.quantity]
            );
        }

        await db.commit();
        return sale;
    } catch (error) {
        await db.rollback();
        console.error("Error creating sale in transaction, rolled back.", error);
        // We throw the original error to be handled by the API route
        throw error;
    }
}
