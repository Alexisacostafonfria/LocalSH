// src/app/api/images/[...filename]/route.ts
import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import mime from 'mime-types';

const UPLOAD_DIR = join(process.cwd(), 'local_uploads');

export async function GET(request: Request, { params }: { params: { filename: string[] } }) {
  // The 'filename' parameter is an array of path segments.
  // We need to join them to form the complete filename.
  const filename = params.filename.join('/');

  if (!filename) {
    return new NextResponse('File not specified', { status: 400 });
  }

  // Security check to prevent accessing files outside the upload directory
  if (filename.includes('..')) {
    return new NextResponse('Invalid path', { status: 400 });
  }

  const filePath = join(UPLOAD_DIR, filename);

  try {
    const fileBuffer = await readFile(filePath);
    const contentType = mime.lookup(filePath) || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    // Log the error for server-side debugging
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      console.error(`[API Image Server] File not found at path: ${filePath}`);
      return new NextResponse(`Image not found: ${filename}`, { status: 404 });
    }
    
    console.error(`[API Image Server] Error reading file ${filePath}:`, error);
    return new NextResponse('Error retrieving file', { status: 500 });
  }
}
