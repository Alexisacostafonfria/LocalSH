
// src/app/(main)/migration-plan/page.tsx
"use client";

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCopy, AlertTriangle, DatabaseZap, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const cleanupScript = `
-- PASO 1: SCRIPT DE LIMPIEZA TOTAL
-- Ejecuta este script primero para eliminar todas las tablas existentes y empezar de cero.

SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS \`audit_log\`;
DROP TABLE IF EXISTS \`invoice_payments\`;
DROP TABLE IF EXISTS \`sales\`;
DROP TABLE IF EXISTS \`order_items\`;
DROP TABLE IF EXISTS \`orders\`;
DROP TABLE IF EXISTS \`products\`;
DROP TABLE IF EXISTS \`customers\`;
DROP TABLE IF EXISTS \`users\`;
DROP TABLE IF EXISTS \`daily_closures\`;
DROP TABLE IF EXISTS \`monthly_closures\`;
DROP TABLE IF EXISTS \`inventory_movements\`;
DROP TABLE IF EXISTS \`sale_items\`;
DROP TABLE IF EXISTS \`app_settings\`;
DROP TABLE IF EXISTS \`business_settings\`;

SET FOREIGN_KEY_CHECKS=1;

`;

const creationScript = `
-- PASO 2: SCRIPT DE CREACIÓN DE ESTRUCTURA
-- Después de limpiar, ejecuta este script para crear la estructura correcta con 14 tablas.

SET FOREIGN_KEY_CHECKS=0;

-- Tabla: users (1)
CREATE TABLE \`users\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_uuid\` VARCHAR(36) NOT NULL UNIQUE,
  \`username\` VARCHAR(50) NOT NULL UNIQUE,
  \`name\` VARCHAR(100) NOT NULL,
  \`role\` ENUM('admin', 'cashier') NOT NULL DEFAULT 'cashier'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: customers (2)
CREATE TABLE \`customers\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`customer_uuid\` VARCHAR(36) NOT NULL UNIQUE,
  \`name\` VARCHAR(255) NOT NULL,
  \`phone\` VARCHAR(50) DEFAULT NULL,
  \`email\` VARCHAR(255) DEFAULT NULL,
  \`personal_id\` VARCHAR(50) DEFAULT NULL,
  \`card_number\` VARCHAR(25) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: products (3)
CREATE TABLE \`products\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`product_uuid\` VARCHAR(36) NOT NULL UNIQUE,
  \`name\` VARCHAR(255) NOT NULL,
  \`category\` VARCHAR(100) NOT NULL,
  \`price\` DECIMAL(10, 2) NOT NULL,
  \`cost_price\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  \`stock\` INT NOT NULL DEFAULT 0,
  \`unit_of_measure\` VARCHAR(20) DEFAULT NULL,
  \`image_url\` TEXT DEFAULT NULL,
  \`description\` TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: orders (4)
CREATE TABLE \`orders\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`order_uuid\` VARCHAR(36) NOT NULL UNIQUE,
  \`order_number\` INT NOT NULL,
  \`customer_id\` INT DEFAULT NULL,
  \`customer_name` VARCHAR(255) NOT NULL,
  `customer_phone` VARCHAR(50) DEFAULT NULL,
  `total_amount` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('pending', 'in-progress', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: order_items (5)
CREATE TABLE `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(10, 2) NOT NULL,
  `total_price` DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: sales (6)
CREATE TABLE `sales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sale_uuid` VARCHAR(36) NOT NULL UNIQUE,
  `order_id` INT DEFAULT NULL,
  `customer_id` INT DEFAULT NULL,
  `user_id` INT DEFAULT NULL,
  `customer_name` VARCHAR(255) DEFAULT NULL,
  `origin` ENUM('pos', 'order') NOT NULL DEFAULT 'pos',
  `sub_total` DECIMAL(10, 2) NOT NULL,
  `total_amount` DECIMAL(10, 2) NOT NULL,
  `payment_method` ENUM('cash', 'transfer', 'invoice') NOT NULL,
  `payment_details` JSON NOT NULL,
  `operational_date` DATE NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: sale_items (7)
CREATE TABLE `sale_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sale_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(10, 2) NOT NULL,
  `total_price` DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: invoice_payments (8)
CREATE TABLE `invoice_payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `payment_uuid` VARCHAR(36) NOT NULL UNIQUE,
  `sale_id` INT NOT NULL,
  `amount_paid` DECIMAL(10, 2) NOT NULL,
  `method` ENUM('cash', 'transfer') NOT NULL,
  `reference` VARCHAR(255) DEFAULT NULL,
  `tip` DECIMAL(10, 2) DEFAULT 0.00,
  `operational_date` DATE NOT NULL,
  `payment_timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: daily_closures (9)
CREATE TABLE `daily_closures` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `closure_date` DATE NOT NULL UNIQUE,
    `total_revenue` DECIMAL(12, 2) NOT NULL,
    `total_cogs` DECIMAL(12, 2) NOT NULL,
    `gross_profit` DECIMAL(12, 2) NOT NULL,
    `expected_cash` DECIMAL(12, 2) NOT NULL,
    `counted_cash` DECIMAL(12, 2) NOT NULL,
    `cash_difference` DECIMAL(12, 2) NOT NULL,
    `details` JSON,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: monthly_closures (10)
CREATE TABLE `monthly_closures` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `year` INT NOT NULL,
    `month` INT NOT NULL,
    `total_revenue` DECIMAL(14, 2) NOT NULL,
    `total_cogs` DECIMAL(14, 2) NOT NULL,
    `gross_profit` DECIMAL(14, 2) NOT NULL,
    `details` JSON,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `idx_year_month` (`year`, \`month\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: inventory_movements (11)
CREATE TABLE \`inventory_movements\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`product_id\` INT NOT NULL,
  \`quantity_change\` INT NOT NULL,
  \`new_stock\` INT NOT NULL,
  \`type\` ENUM('sale', 'adjustment', 'return', 'initial') NOT NULL,
  \`reference_id\` VARCHAR(36) DEFAULT NULL,
  \`notes\` TEXT,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: audit_log (12)
CREATE TABLE \`audit_log\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`log_uuid\` VARCHAR(36) NOT NULL UNIQUE,
  \`user_id\` INT DEFAULT NULL,
  \`username\` VARCHAR(100) NOT NULL,
  \`action_type\` VARCHAR(50) NOT NULL,
  \`entity_type\` VARCHAR(50) DEFAULT NULL,
  \`entity_id\` VARCHAR(50) DEFAULT NULL,
  \`description\` TEXT NOT NULL,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: app_settings (13)
CREATE TABLE \`app_settings\` (
    \`id\` INT PRIMARY KEY DEFAULT 1,
    \`currency_symbol\` VARCHAR(5) NOT NULL DEFAULT '$',
    \`low_stock_threshold\` INT NOT NULL DEFAULT 10,
    \`allow_tips\` BOOLEAN NOT NULL DEFAULT TRUE,
    \`invoice_fee_percent\` DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    \`late_payment_fee_percent\` DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    \`auto_print_order_ticket\` BOOLEAN NOT NULL DEFAULT FALSE,
    \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: business_settings (14)
CREATE TABLE \`business_settings\` (
    \`id\` INT PRIMARY KEY DEFAULT 1,
    \`name\` VARCHAR(255),
    \`address\` TEXT,
    \`phone\` VARCHAR(50),
    \`email\` VARCHAR(255),
    \`tax_id\` VARCHAR(50),
    \`website\` VARCHAR(255),
    \`logo_url\` TEXT,
    \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
`;

const ScriptCard = ({ title, description, script, icon }: { title: string, description: string, script: string, icon: React.ElementType }) => {
  const { toast } = useToast();
  const Icon = icon;

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    toast({
      title: 'Copiado al Portapapeles',
      description: `El script de ${title.toLowerCase()} ha sido copiado.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Icon className="h-8 w-8 text-primary mt-1" />
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2 h-7 w-7 p-0"
            onClick={handleCopy}
            title="Copiar Script"
          >
            <ClipboardCopy className="h-4 w-4" />
          </Button>
          <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto">
            <code>{script.trim()}</code>
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default function DatabaseUtilityPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Utilidad de Base de Datos MySQL"
        description="Herramientas para inicializar o reparar la estructura de la base de datos."
      />

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>¡Atención! Zona Peligrosa</AlertTitle>
        <AlertDescription>
          Las acciones en esta página son destructivas y no se pueden deshacer.
          El script de limpieza **BORRARÁ PERMANENTEMENTE** todas las tablas de datos.
          Úselo solo para una instalación inicial o si su base de datos está en un estado inconsistente.
        </AlertDescription>
      </Alert>

      <ScriptCard
        icon={DatabaseZap}
        title="Paso 1: Script de Limpieza Total"
        description="Ejecuta este script para eliminar todas las tablas existentes. Esto es necesario si hay tablas sobrantes de intentos anteriores."
        script={cleanupScript}
      />

      <ScriptCard
        icon={Database}
        title="Paso 2: Script de Creación Correcto"
        description="Después de limpiar la base de datos, ejecuta este script para crear la estructura final y correcta de 14 tablas."
        script={creationScript}
      />
    </div>
  );
}
