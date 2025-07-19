
// src/app/api/upload/route.ts
'use server';

import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// This path is inside the /public directory, making files directly accessible.
const UPLOAD_DIR = join(process.cwd(), 'public/uploads/products');

// Ensure the upload directory exists
const ensureUploadDirExists = async () => {
  if (!existsSync(UPLOAD_DIR)) {
    console.log(`Creating upload directory at: ${UPLOAD_DIR}`);
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
};

export async function POST(request: Request) {
  try {
    await ensureUploadDirExists();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file provided.' }, { status: 400 });
    }

    const uniqueFileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = join(UPLOAD_DIR, uniqueFileName);
    
    // This is the public URL path that will be stored in the database.
    const fileUrlPath = `/uploads/products/${uniqueFileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    console.log(`File saved to physical path: ${filePath}`);
    console.log(`File will be served from URL: ${fileUrlPath}`);

    // Return the public URL path
    return NextResponse.json({ url: fileUrlPath }, { status: 201 });
  } catch (error) {
    console.error('Error uploading file locally:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error.';
    return NextResponse.json({ message: `Error uploading file: ${errorMessage}` }, { status: 500 });
  }
}
