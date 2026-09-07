import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { busySlotsFromCalendar } from '@/lib/googleCalendar';

// Kalendern ändrar sig hela tiden — svaret får aldrig cachas.
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const slots: Record<string, string[]> = {};

  const add = (date: string, time: string) => {
    if (!slots[date]) slots[date] = [];
    if (!slots[date].includes(time)) slots[date].push(time);
  };

  const { data } = await supabase.from('meetings').select('date, time');
  for (const row of data ?? []) add(row.date, row.time);

  // Eriks egen kalender räknas lika mycket som en bokning på sajten — annars
  // går det att boka en tid han redan sitter i ett annat möte.
  const busy = await busySlotsFromCalendar();
  for (const [date, times] of Object.entries(busy)) {
    for (const time of times) add(date, time);
  }

  return NextResponse.json({ slots });
}
