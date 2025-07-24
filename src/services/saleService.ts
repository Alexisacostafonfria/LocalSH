
'use server';
// src/services/saleService.ts
import { getDbConnection } from '@/lib/db';
import { Sale, SaleItem, CashPaymentDetails, TransferPaymentDetails, InvoicePaymentDetails } from '@/types';
import { RowDataPacket } from 'mysql2';

/**
 * Fetches all sales from the database with their details.
 * Aligned with the user-provided database schema.
 */
export async function getSales(): Promise<Sale[]> {
    const db = await getDbConnection();
    const [salesRows] = await db.execute<RowDataPacket[]>(
        `SELECT 
            s.sale_uuid as id,
            s.created_at as timestamp,
            s.operational_date as operationalDate,
            s.origin,
            s.customer_uuid as customerId,
            s.customer_name as customerName,
            s.sub_total as subTotal,
            s.total_amount as totalAmount,
            s.payment_method as paymentMethod,
            s.payment_details as paymentDetails,
            s.user_id as userId
         FROM sales s ORDER BY s.created_at DESC`
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
        } as Sale;
    });

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
 * Aligned with the user-provided database schema.
 */
export async function createSale(sale: Sale): Promise<Sale> {
    const db = await getDbConnection();
    await db.beginTransaction();

    try {
        // 1. Insert into sales table using correct column names
        await db.execute(
            `INSERT INTO sales (sale_uuid, customer_uuid, customer_name, user_id, origin, sub_total, total_amount, payment_method, payment_details, operational_date, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                sale.id,
                sale.customerId,
                sale.customerName,
                sale.userId,
                sale.origin,
                sale.subTotal,
                sale.totalAmount,
                sale.paymentMethod,
                JSON.stringify(sale.paymentDetails),
                sale.operationalDate ? new Date(sale.operationalDate) : new Date(),
                new Date(sale.timestamp) // Uses the 'created_at' column in the DB
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
            const [checkStock] = await db.execute<RowDataPacket[]>('SELECT stock FROM products WHERE product_uuid = ?', [item.productId]);
            if (checkStock.length > 0 && checkStock[0].stock < 0) {
                // This would indicate a race condition if not for the transaction.
                // With the transaction, it's a logic error if stock goes negative.
                throw new Error(`Stock for product ${item.productName} would become negative.`);
            }
        }

        await db.commit();
        return sale;
    } catch (error) {
        await db.rollback();
        console.error("Error creating sale in transaction, rolled back.", error);
        throw error;
    }
}
