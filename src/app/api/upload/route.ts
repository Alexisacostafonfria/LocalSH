// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

// Define el directorio de subida dentro de la carpeta `public`
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'products');

// Asegúrate de que el directorio de subida exista
const ensureUploadDirExists = () => {
  if (!existsSync(UPLOAD_DIR)) {
    console.log(`Creando directorio de subida en: ${UPLOAD_DIR}`);
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
};

export async function POST(request: Request) {
  try {
    // Asegurarse de que el directorio existe antes de cualquier operación
    ensureUploadDirExists();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No se proporcionó ningún archivo.' }, { status: 400 });
    }

    // Crear un nombre de archivo único para evitar colisiones
    const uniqueFileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = join(UPLOAD_DIR, uniqueFileName);
    const fileUrlPath = `/uploads/products/${uniqueFileName}`; // La ruta pública para acceder al archivo

    // Convertir el archivo a un buffer para poder escribirlo
    const buffer = Buffer.from(await file.arrayBuffer());

    // Escribir el archivo en el sistema de archivos del servidor
    await writeFile(filePath, buffer);

    console.log(`Archivo guardado en: ${filePath}`);
    console.log(`URL de acceso público: ${fileUrlPath}`);

    // Devolver la URL pública
    return NextResponse.json({ url: fileUrlPath }, { status: 201 });
  } catch (error) {
    console.error('Error al subir el archivo localmente:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido.';
    return NextResponse.json({ message: `Error al subir el archivo: ${errorMessage}` }, { status: 500 });
  }
}
