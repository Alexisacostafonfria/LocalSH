// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file provided.' }, { status: 400 });
    }

    // Create a unique file name
    const fileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `product-images/${fileName}`);

    // Convert file to buffer to upload
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload file to Firebase Storage
    const snapshot = await uploadBytes(storageRef, buffer, {
      contentType: file.type,
    });

    // Get the public URL of the uploaded file
    const downloadURL = await getDownloadURL(snapshot.ref);

    return NextResponse.json({ url: downloadURL }, { status: 201 });
  } catch (error) {
    console.error('Error uploading file to Firebase Storage:', error);
    if (error instanceof Error && error.message.includes('storage/unauthorized')) {
        return NextResponse.json({ message: 'Firebase Storage security rules are preventing upload. Please check your rules.' }, { status: 403 });
    }
    return NextResponse.json({ message: 'Error uploading file.' }, { status: 500 });
  }
}
