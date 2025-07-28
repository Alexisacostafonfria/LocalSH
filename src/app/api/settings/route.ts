
// src/app/api/settings/route.ts
'use server';

import { NextResponse } from 'next/server';
import * as settingsService from '@/services/settingsService';

/**
 * POST /api/settings
 * Creates or updates a setting in the database.
 */
export async function POST(request: Request) {
  try {
    const { key, value } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json({ message: 'Setting key and value are required' }, { status: 400 });
    }

    await settingsService.setSetting(key, value);
    return NextResponse.json({ message: `Setting '${key}' saved successfully.` }, { status: 200 });
  } catch (error) {
    console.error('API Error saving setting:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Error saving setting in API: ${errorMessage}` }, { status: 500 });
  }
}
