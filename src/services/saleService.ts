
'use server';
// src/services/saleService.ts
import { getDbConnection } from '@/lib/db';
import { Sale, SaleItem, CashPaymentDetails, TransferPaymentDetails, InvoicePaymentDetails } from '@/types';

async function insertSaleItems(db: any, saleId: string, items: SaleItem[]) {
    if (items.length === 0) return;
    const itemValues = items.map(item => [saleId, item.productId, item.productName, item.quantity, item.unitPrice, item.totalPrice]);
    await db.query(
        'INSERT INTO sale_items (sale_uuid, product_uuid, product_name, quantity, unit_price, total_price) VALUES ?',
        [itemValues]
    );
}

async function updateProductStock(db: any, items: SaleItem[]) {
    for (const item of items) {
        await db.execute(
            'UPDATE products SET stock = stock - ? WHERE product_uuid = ? AND stock >= ?',
            [item.quantity, item.productId, item.quantity]
        );
        // We can check affectedRows here if we want to throw an error on insufficient stock
    }
}

/**
 * Fetches all sales from the database with their details.
 */
export async function getSales(): Promise<Sale[]> {
    const db = await getDbConnection();
    const [salesRows] = await db.execute<any[]>(
        `SELECT 
            s.sale_uuid as id, s.timestamp, s.operational_date as operationalDate, s.origin,
            s.customer_uuid as customerId, s.customer_name as customerName,
            s.sub_total as subTotal, s.total_amount as totalAmount, s.payment_method as paymentMethod,
            s.user_id as userId
         FROM sales s ORDER BY s.timestamp DESC`
    );

    const sales: Sale[] = [];

    for (const saleRow of salesRows) {
        const [itemsRows] = await db.execute<any[]>('SELECT product_uuid as productId, product_name as productName, quantity, unit_price as unitPrice, total_price as totalPrice FROM sale_items WHERE sale_uuid = ?', [saleRow.id]);
        
        let paymentDetails: any = {};
        if (saleRow.paymentMethod === 'cash') {
            const [pdRows] = await db.execute<any[]>('SELECT amount_received, change_given, tip FROM payment_details_cash WHERE sale_uuid = ?', [saleRow.id]);
            if (pdRows[0]) paymentDetails = { amountReceived: pdRows[0].amount_received, changeGiven: pdRows[0].change_given, tip: pdRows[0].tip };
        } else if (saleRow.paymentMethod === 'transfer') {
            const [pdRows] = await db.execute<any[]>('SELECT reference, customer_name, personal_id, mobile_number, card_number FROM payment_details_transfer WHERE sale_uuid = ?', [saleRow.id]);
            if (pdRows[0]) paymentDetails = { reference: pdRows[0].reference, customerName: pdRows[0].customer_name, personalId: pdRows[0].personal_id, mobileNumber: pdRows[0].mobile_number, cardNumber: pdRows[0].card_number };
        } else if (saleRow.paymentMethod === 'invoice') {
             const [pdRows] = await db.execute<any[]>('SELECT due_date, status, paid_date, paid_amount, paid_method FROM payment_details_invoice WHERE sale_uuid = ?', [saleRow.id]);
             if (pdRows[0]) paymentDetails = { invoiceNumber: saleRow.id, dueDate: pdRows[0].due_date, status: pdRows[0].status, paidDate: pdRows[0].paid_date, paidAmount: pdRows[0].paid_amount, paidMethod: pdRows[0].paid_method };
        }

        sales.push({
            ...saleRow,
            timestamp: new Date(saleRow.timestamp).toISOString(),
            operationalDate: saleRow.operationalDate ? new Date(saleRow.operationalDate).toISOString() : undefined,
            items: itemsRows,
            paymentDetails: paymentDetails,
        });
    }

    return sales;
}


/**
 * Creates a new sale, its items, payment details, and updates stock in a transaction.
 */
export async function createSale(sale: Sale): Promise<Sale> {
    const db = await getDbConnection();
    await db.beginTransaction();

    try {
        // 1. Insert into sales table
        await db.execute(
            `INSERT INTO sales (sale_uuid, timestamp, operational_date, origin, customer_uuid, customer_name, sub_total, total_amount, payment_method, user_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [sale.id, new Date(sale.timestamp), sale.operationalDate ? new Date(sale.operationalDate) : null, sale.origin, sale.customerId, sale.customerName, sale.subTotal, sale.totalAmount, sale.paymentMethod, sale.userId]
        );

        // 2. Insert into sale_items table
        await insertSaleItems(db, sale.id, sale.items);

        // 3. Insert into correct payment_details table
        if (sale.paymentMethod === 'cash') {
            const pd = sale.paymentDetails as CashPaymentDetails;
            await db.execute('INSERT INTO payment_details_cash (sale_uuid, amount_received, change_given, tip) VALUES (?, ?, ?, ?)', [sale.id, pd.amountReceived, pd.changeGiven, pd.tip]);
        } else if (sale.paymentMethod === 'transfer') {
            const pd = sale.paymentDetails as TransferPaymentDetails;
            await db.execute('INSERT INTO payment_details_transfer (sale_uuid, reference, customer_name, personal_id, mobile_number, card_number) VALUES (?, ?, ?, ?, ?, ?)', [sale.id, pd.reference, pd.customerName, pd.personalId, pd.mobileNumber, pd.cardNumber]);
        } else if (sale.paymentMethod === 'invoice') {
            const pd = sale.paymentDetails as InvoicePaymentDetails;
            await db.execute('INSERT INTO payment_details_invoice (sale_uuid, due_date, status) VALUES (?, ?, ?)', [sale.id, new Date(pd.dueDate), pd.status]);
        }
        
        // 4. Update product stock
        await updateProductStock(db, sale.items);

        await db.commit();
        return sale;
    } catch (error) {
        await db.rollback();
        console.error("Error creating sale in transaction, rolled back.", error);
        throw error;
    }
}
