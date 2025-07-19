
// src/app/api/upload/route.ts
'use server';

import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

// Store uploads outside the /public directory to be served by a dedicated API route.
// This avoids issues with Next.js development server caching of the /public folder.
const UPLOAD_DIR = join(process.cwd(), 'local_uploads');
const UPLOAD_URL_PREFIX = '/api/images'; // The URL points to our new image serving API

// Ensure the upload directory exists
const ensureUploadDirExists = () => {
  if (!existsSync(UPLOAD_DIR)) {
    console.log(`Creating upload directory at: ${UPLOAD_DIR}`);
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
};

export async function POST(request: Request) {
  try {
    ensureUploadDirExists();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file provided.' }, { status: 400 });
    }

    const uniqueFileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = join(UPLOAD_DIR, uniqueFileName);
    const fileUrlPath = `${UPLOAD_URL_PREFIX}/${uniqueFileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    console.log(`File saved to physical path: ${filePath}`);
    console.log(`File will be served from URL: ${fileUrlPath}`);

    return NextResponse.json({ url: fileUrlPath }, { status: 201 });
  } catch (error) {
    console.error('Error uploading file locally:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error.';
    return NextResponse.json({ message: `Error uploading file: ${errorMessage}` }, { status: 500 });
  }
}
