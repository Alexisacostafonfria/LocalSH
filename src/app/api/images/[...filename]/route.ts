// src/app/api/images/[...filename]/route.ts
import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import mime from 'mime-types';

const UPLOAD_DIR = join(process.cwd(), 'local_uploads');

export async function GET(request: Request, { params }: { params: { filename: string[] } }) {
  const filename = params.filename.join('/');

  if (!filename) {
    return new NextResponse('File not specified', { status: 400 });
  }

  // Basic security check to prevent directory traversal
  if (filename.includes('..')) {
    return new NextResponse('Invalid path', { status: 400 });
  }

  try {
    const filePath = join(UPLOAD_DIR, filename);
    const fileBuffer = await readFile(filePath);

    // Determine content type from file extension
    const contentType = mime.lookup(filePath) || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    // Check if the error is a file not found error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      console.warn(`Image not found at path: ${join(UPLOAD_DIR, filename)}`);
      return new NextResponse(`Image not found: ${filename}`, { status: 404 });
    }
    
    console.error(`Error reading file ${filename}:`, error);
    return new NextResponse('Error retrieving file', { status: 500 });
  }
}
