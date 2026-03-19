import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const events = await db.calendarEvent.findMany({ where: { userId }, orderBy: { startDate: 'asc' } });
  
  // Return dates as ISO strings to preserve the exact time
  const serializedEvents = events.map(e => ({
    ...e,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate ? e.endDate.toISOString() : null,
  }));
  
  return NextResponse.json({ events: serializedEvents });
}

export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const data = await request.json();
  
  // Parse the local datetime string and treat it as UTC to preserve the exact time
  // The frontend sends format like "2026-02-28T14:00" which we want to store as-is
  const startDate = parseLocalDateTimeAsUTC(data.startDate);
  const endDate = data.endDate ? parseLocalDateTimeAsUTC(data.endDate) : null;
  
  const event = await db.calendarEvent.create({
    data: { 
      ...data, 
      userId, 
      startDate, 
      endDate 
    }
  });
  
  return NextResponse.json({ 
    event: {
      ...event,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate ? event.endDate.toISOString() : null,
    }
  });
}

export async function PUT(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const { id, ...data } = await request.json();
  
  const updateData: any = { ...data };
  if (data.startDate) {
    updateData.startDate = parseLocalDateTimeAsUTC(data.startDate);
  }
  if (data.endDate !== undefined) {
    updateData.endDate = data.endDate ? parseLocalDateTimeAsUTC(data.endDate) : null;
  }
  
  const event = await db.calendarEvent.update({
    where: { id, userId },
    data: updateData
  });
  
  return NextResponse.json({ 
    event: {
      ...event,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate ? event.endDate.toISOString() : null,
    }
  });
}

export async function DELETE(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  
  const { id } = await request.json();
  await db.calendarEvent.delete({ where: { id, userId } });
  return NextResponse.json({ success: true });
}

// Helper: Parse local datetime string (e.g., "2026-02-28T14:00") as if it were UTC
// This preserves the exact hour/minute the user entered
function parseLocalDateTimeAsUTC(dateString: string): Date {
  // If already has timezone info (Z or +/-HH:MM), parse normally
  if (dateString.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateString)) {
    return new Date(dateString);
  }
  
  // Otherwise, treat the local time as UTC by appending 'Z'
  // This way, "2026-02-28T14:00" becomes "2026-02-28T14:00Z" (UTC)
  // and when stored in the DB as UTC, it stays as 14:00
  return new Date(dateString + 'Z');
}
