/**
 * Serversidans koll av om en mötestid är ledig.
 *
 * Frontenden hämtar lediga tider när sidan laddas och vet ingenting om vad som
 * hänt sedan dess. Två besökare kan alltså skicka in samma tid inom samma
 * minut — det är här den ena stoppas.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { isSlotBusyInCalendar } from './googleCalendar';

export const SLOT_TAKEN_MESSAGE =
  'Tiden blev tyvärr bokad precis före dig. Välj en annan tid så löser det sig.';

export async function isSlotTaken(
  supabase: SupabaseClient,
  date: string,
  time: string
): Promise<boolean> {
  const { data } = await supabase
    .from('meetings')
    .select('id')
    .eq('date', date)
    .eq('time', time)
    .limit(1);

  if (data && data.length > 0) return true;

  return isSlotBusyInCalendar(date, time);
}
