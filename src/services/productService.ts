// src/services/productService.ts
import { getDbConnection } from '@/lib/db';
import { Product } from '@/types';

// IMPORTANT: This is a placeholder service.
// You will need to implement the actual database logic by uncommenting and adapting the example queries.

/**
 * Fetches all products from the database.
 */
export async function getProducts(): Promise<Product[]> {
  // TODO: Implement actual database query
  console.log("Fetching products from database (placeholder service)...");
  // const db = await getDbConnection();
  // const [rows] = await db.execute(
  //   'SELECT product_uuid as id, name, category, price, cost_price as costPrice, stock, unit_of_measure as unitOfMeasure, image_url as imageUrl, description FROM products ORDER BY name ASC'
  // );
  // return rows as Product[];
  
  // Returning mock data for now so the API works out-of-the-box.
  // Replace this with your actual database call.
  return [
      { id: 'uuid-1-from-db', name: 'Producto de Ejemplo 1 (desde API)', category: 'Ejemplos', price: 10.99, costPrice: 5, stock: 100, unitOfMeasure: 'unid.' },
      { id: 'uuid-2-from-db', name: 'Producto de Ejemplo 2 (desde API)', category: 'Ejemplos', price: 15.50, costPrice: 7, stock: 50, unitOfMeasure: 'unid.' },
  ];
}

/**
 * Creates a new product in the database.
 */
export async function createProduct(product: Product): Promise<Product> {
  // TODO: Implement actual database query
  console.log("Creating product in database (placeholder service)...", product);
  // const db = await getDbConnection();
  // const { id, name, category, price, costPrice, stock, unitOfMeasure, imageUrl, description } = product;
  // await db.execute(
  //   'INSERT INTO products (product_uuid, name, category, price, cost_price, stock, unit_of_measure, image_url, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  //   [id, name, category, price, costPrice, stock, unitOfMeasure || null, imageUrl || null, description || null]
  // );
  
  // For the placeholder, we just return the product data we received.
  return product;
}

/**
 * Updates an existing product in the database.
 */
export async function updateProduct(id: string, productData: Partial<Product>): Promise<Product | null> {
    // TODO: Implement actual database query
    console.log(`Updating product ${id} in database (placeholder service)...`, productData);
    // const db = await getDbConnection();
    // // In a real app, you would build a dynamic SET clause
    // await db.execute(
    //     'UPDATE products SET name = ?, category = ?, price = ?, cost_price = ?, stock = ? WHERE product_uuid = ?',
    //     [productData.name, productData.category, productData.price, productData.costPrice, productData.stock, id]
    // );
    
    // For the placeholder, we return the merged product data.
    const fullProduct: Product = {
        id: id,
        name: productData.name ?? '',
        category: productData.category ?? '',
        price: productData.price ?? 0,
        costPrice: productData.costPrice ?? 0,
        stock: productData.stock ?? 0,
        unitOfMeasure: productData.unitOfMeasure,
        imageUrl: productData.imageUrl,
        description: productData.description
    };
    return fullProduct;
}

/**
 * Deletes a product from the database.
 */
export async function deleteProduct(id: string): Promise<void> {
    // TODO: Implement actual database query
    console.log(`Deleting product ${id} from database (placeholder service)...`);
    // const db = await getDbConnection();
    // await db.execute('DELETE FROM products WHERE product_uuid = ?', [id]);
}
