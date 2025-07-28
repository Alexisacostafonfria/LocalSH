
// src/app/api/settings/[key]/route.ts
'use server';

import { NextResponse } from 'next/server';
import * as settingsService from '@/services/settingsService';

/**
 * GET /api/settings/[key]
 * Fetches a specific setting from the database.
 */
export async function GET(request: Request, context: { params: { key: string } }) {
  const { key } = context.params;
  if (!key) {
    return NextResponse.json({ message: 'Setting key is required' }, { status: 400 });
  }

  try {
    const value = await settingsService.getSetting(key);
    if (value === null) {
      return NextResponse.json({ message: `Setting '${key}' not found` }, { status: 404 });
    }
    return NextResponse.json({ key, value });
  } catch (error) {
    console.error(`API Error fetching setting '${key}':`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Error fetching setting from API: ${errorMessage}` }, { status: 500 });
  }
}
