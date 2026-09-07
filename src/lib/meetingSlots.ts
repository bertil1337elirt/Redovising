export const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00',
];

/** Upptagen = bokad hos oss eller upptagen i Eriks Google-kalender. */
export function isSlotBooked(
  date: string,
  time: string,
  bookedSlots: Record<string, string[]>
): boolean {
  return bookedSlots[date]?.includes(time) ?? false;
}

export function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Första bokningsbara vardagen från och med `from`. */
export function firstBookableDate(from: Date) {
  const d = new Date(from);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}

/** De N närmaste bokningsbara vardagarna från och med `from`. */
export function upcomingWeekdays(from: Date, count: number) {
  const out: Date[] = [];
  const d = new Date(from);
  while (out.length < count) {
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/** Tidigast bokningsbara dag: i morgon, och aldrig en helg. */
export function minBookableDate(today = new Date()) {
  const d = new Date(today);
  d.setDate(d.getDate() + 1);
  return d;
}

/** Dagens datum i svensk tid. Servern går på UTC, mötena på väggklockan. */
export function todayInSweden(now = new Date()): string {
  return now.toLocaleDateString('sv-SE', { timeZone: 'Europe/Stockholm' });
}

/** Klockslaget nu i svensk tid, som "HH:MM" — jämförbart med en slottid. */
export function timeInSweden(now = new Date()): string {
  return now.toLocaleTimeString('sv-SE', {
    timeZone: 'Europe/Stockholm',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Vilket svenskt datum en tidsstämpel inföll på. */
export function swedishDateOf(iso: string): string {
  return todayInSweden(new Date(iso));
}

export function formatMeetingDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
