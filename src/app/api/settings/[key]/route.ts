
// src/app/api/settings/[key]/route.ts
'use server';

import { NextResponse } from 'next/server';
import * as settingsService from '@/services/settingsService';

/**
 * GET /api/settings/[key]
 * Fetches a specific setting from the database.
 */
export async function GET(request: Request, { params }: { params: { key: string } }) {
  const { key } = params;
  if (!key) {
    return NextResponse.json({ message: 'Setting key is required' }, { status: 400 });
  }

  try {
    const value = await settingsService.getSetting(key);
    if (value === null) {
      // For accountingSettings, if it's not in the DB, it's not a 404 error but a first-time setup.
      // The frontend will use the default value. Returning a 404 could be misinterpreted as a server error.
      // We'll let the hook handle the default value logic.
      return NextResponse.json({ message: `Setting '${key}' not found` }, { status: 404 });
    }
    return NextResponse.json({ key, value });
  } catch (error) {
    console.error(`API Error fetching setting '${key}':`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: `Error fetching setting from API: ${errorMessage}` }, { status: 500 });
  }
}
