
// src/app/(main)/migration-plan/page.tsx
"use client";

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCopy, AlertTriangle, DatabaseZap, Database } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
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

SET FOREIGN_KEY_CHECKS=1;

`;

const creationScript = `
-- PASO 2: SCRIPT DE CREACIÓN DE ESTRUCTURA
-- Después de limpiar, ejecuta este script para crear la estructura correcta con 8 tablas.

SET FOREIGN_KEY_CHECKS=0;

-- Tabla: users
CREATE TABLE \`users\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`user_uuid\` VARCHAR(36) NOT NULL UNIQUE,
  \`username\` VARCHAR(50) NOT NULL UNIQUE,
  \`name\` VARCHAR(100) NOT NULL,
  \`role\` ENUM('admin', 'cashier') NOT NULL DEFAULT 'cashier'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: customers
CREATE TABLE \`customers\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`customer_uuid\` VARCHAR(36) NOT NULL UNIQUE,
  \`name\` VARCHAR(255) NOT NULL,
  \`phone\` VARCHAR(50) DEFAULT NULL,
  \`email\` VARCHAR(255) DEFAULT NULL,
  \`personal_id\` VARCHAR(50) DEFAULT NULL,
  \`card_number\` VARCHAR(25) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: products
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
  \`description\` TEXT DEFAULT NULL,
  INDEX \`idx_product_name\` (\`name\`),
  INDEX \`idx_product_category\` (\`category\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: orders
CREATE TABLE \`orders\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`order_uuid\` VARCHAR(36) NOT NULL UNIQUE,
  \`order_number\` INT NOT NULL,
  \`customer_id\` INT DEFAULT NULL,
  \`customer_name\` VARCHAR(255) NOT NULL,
  \`customer_phone\` VARCHAR(50) DEFAULT NULL,
  \`total_amount\` DECIMAL(10, 2) NOT NULL,
  \`status\` ENUM('pending', 'in-progress', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  \`notes\` TEXT DEFAULT NULL,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\`(\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: order_items
CREATE TABLE \`order_items\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`order_id\` INT NOT NULL,
  \`product_id\` INT NOT NULL,
  \`product_name\` VARCHAR(255) NOT NULL,
  \`quantity\` INT NOT NULL,
  \`unit_price\` DECIMAL(10, 2) NOT NULL,
  \`total_price\` DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: sales
CREATE TABLE \`sales\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`sale_uuid\` VARCHAR(36) NOT NULL UNIQUE,
  \`order_id\` INT DEFAULT NULL,
  \`customer_id\` INT DEFAULT NULL,
  \`user_id\` INT DEFAULT NULL,
  \`customer_name\` VARCHAR(255) DEFAULT NULL,
  \`origin\` ENUM('pos', 'order') NOT NULL DEFAULT 'pos',
  \`sub_total\` DECIMAL(10, 2) NOT NULL,
  \`discount\` DECIMAL(10, 2) DEFAULT 0.00,
  \`fees\` TEXT DEFAULT NULL,
  \`total_amount\` DECIMAL(10, 2) NOT NULL,
  \`payment_method\` ENUM('cash', 'transfer', 'invoice') NOT NULL,
  \`payment_details\` JSON NOT NULL,
  \`operational_date\` DATE NOT NULL,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_operational_date\` (\`operational_date\`),
  FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE SET NULL,
  FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\`(\`id\`) ON DELETE SET NULL,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: invoice_payments
CREATE TABLE \`invoice_payments\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`payment_uuid\` VARCHAR(36) NOT NULL UNIQUE,
  \`sale_id\` INT NOT NULL,
  \`amount_paid\` DECIMAL(10, 2) NOT NULL,
  \`method\` ENUM('cash', 'transfer') NOT NULL,
  \`reference\` VARCHAR(255) DEFAULT NULL,
  \`tip\` DECIMAL(10, 2) DEFAULT 0.00,
  \`operational_date\` DATE NOT NULL,
  \`payment_timestamp\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`sale_id\`) REFERENCES \`sales\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: audit_log
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
        description="Después de limpiar la base de datos, ejecuta este script para crear la estructura final y correcta de 8 tablas."
        script={creationScript}
      />
    </div>
  );
}
