/**
 * Google Calendar — läser upptagna tider och lägger in bokade möten.
 *
 * Autentiseringen går via ett servicekonto, inte OAuth: inga tokens som går ut
 * och inget inloggningsflöde att underhålla. Servicekontot ser bara kalendrar
 * det uttryckligen delats med.
 *
 * Uppsättning (görs en gång):
 *   1. console.cloud.google.com → aktivera Google Calendar API
 *   2. Skapa servicekonto → Keys → ladda ner JSON-nyckeln
 *   3. Sätt GOOGLE_CALENDAR_CLIENT_EMAIL, GOOGLE_CALENDAR_PRIVATE_KEY och
 *      GOOGLE_CALENDAR_ID i .env.local och i Vercel
 *   4. Dela kalendern med servicekontots adress, behörighet
 *      "Göra ändringar i händelser" — utan det steget ser den ingenting
 *
 * Saknas variablerna är kopplingen bara avstängd: bokningarna fungerar som
 * förut, mot Supabase-tabellen `meetings`.
 */
import { google } from 'googleapis';
import { TIME_SLOTS, todayInSweden } from './meetingSlots';

const TZ = 'Europe/Stockholm';

/** Ett möte tar en timme — lika långt som luckorna i TIME_SLOTS. */
const MEETING_MINUTES = 60;

/**
 * Restid hem efter allt annat i kalendern. En tandläkartid som slutar 15:00
 * blockerar alltså även 15:00-tiden, för då sitter Erik fortfarande i bilen.
 *
 * Möten bokade via sajten är undantagna: de tas hemifrån och behöver ingen
 * hemresa. De känns igen på märkningen nedan.
 */
const TRAVEL_BUFFER_MINUTES = 60;

/** Märkning på händelser vi själva skapat, så vi kan skilja dem från Eriks egna. */
const OWN_EVENT_MARKER = { key: 'enklabokslut', value: 'bokning' };

/** Så många dagar framåt vi frågar kalendern om när sajten hämtar lediga tider. */
const LOOKAHEAD_DAYS = 90;

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
const CLIENT_EMAIL = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL;

// Miljövariabler har inga radbrytningar. Nyckeln klistras in med \n som text
// och måste få tillbaka riktiga radbrytningar innan den går att använda.
const PRIVATE_KEY = process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, '\n');

export function isCalendarConfigured() {
  return Boolean(CALENDAR_ID && CLIENT_EMAIL && PRIVATE_KEY);
}

function calendar() {
  const auth = new google.auth.JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  return google.calendar({ version: 'v3', auth });
}

/** UTC-offseten i Stockholm ett visst datum: "+01:00" på vintern, "+02:00" på sommaren. */
function offsetOn(date: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    timeZoneName: 'longOffset',
  }).formatToParts(new Date(`${date}T12:00:00Z`));
  const name = parts.find(p => p.type === 'timeZoneName')?.value;
  return name?.replace('GMT', '') || '+01:00';
}

/** Tiderna är väggklocka i Sverige — servern går på UTC och måste räkna om. */
function slotStart(date: string, time: string): Date {
  return new Date(`${date}T${time}:00${offsetOn(date)}`);
}

function slotEnd(start: Date): Date {
  return new Date(start.getTime() + MEETING_MINUTES * 60000);
}

type Interval = [number, number];

async function busyBetween(timeMin: Date, timeMax: Date): Promise<Interval[]> {
  const res = await calendar().freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone: TZ,
      items: [{ id: CALENDAR_ID! }],
    },
  });

  const busy = res.data.calendars?.[CALENDAR_ID!]?.busy ?? [];
  return busy
    .filter(b => b.start && b.end)
    .map(b => [new Date(b.start!).getTime(), new Date(b.end!).getTime()] as Interval);
}

/** Mötena sajten själv lagt in — de som inte ska ge restid efteråt. */
async function ownEventsBetween(timeMin: Date, timeMax: Date): Promise<Interval[]> {
  try {
    const res = await calendar().events.list({
      calendarId: CALENDAR_ID!,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      privateExtendedProperty: [`${OWN_EVENT_MARKER.key}=${OWN_EVENT_MARKER.value}`],
      maxResults: 250,
    });

    return (res.data.items ?? [])
      .filter(e => e.start?.dateTime && e.end?.dateTime)
      .map(e => [new Date(e.start!.dateTime!).getTime(), new Date(e.end!.dateTime!).getTime()] as Interval);
  } catch (error) {
    // Utan listan vet vi inte vad som är våra egna möten. Då får restiden gälla
    // allt — hellre en tid för lite än ett möte Erik inte hinner till.
    console.error('Kunde inte lista egna kalenderhändelser:', error);
    return [];
  }
}

/**
 * Perioder där ingen tid går att boka: allt upptaget i kalendern, plus restid
 * efter det som inte är ett möte vi själva bokat.
 */
async function blockedBetween(timeMin: Date, timeMax: Date): Promise<Interval[]> {
  const [busy, own] = await Promise.all([
    busyBetween(timeMin, timeMax),
    ownEventsBetween(timeMin, timeMax),
  ]);

  const isOwnMeeting = ([start, end]: Interval) =>
    own.some(([ownStart, ownEnd]) => ownStart === start && ownEnd === end);

  return busy.map(interval =>
    isOwnMeeting(interval)
      ? interval
      : [interval[0], interval[1] + TRAVEL_BUFFER_MINUTES * 60000] as Interval
  );
}

/**
 * Vilka slottider som krockar med något i kalendern, per datum.
 *
 * Går kalendern inte att nå returneras en tom lista: hellre en tid som ser
 * ledig ut än en kalender som inte går att boka i alls.
 */
export async function busySlotsFromCalendar(): Promise<Record<string, string[]>> {
  if (!isCalendarConfigured()) return {};

  const timeMin = new Date();
  const timeMax = new Date(timeMin.getTime() + LOOKAHEAD_DAYS * 86400000);

  let intervals: Interval[];
  try {
    intervals = await blockedBetween(timeMin, timeMax);
  } catch (error) {
    console.error('Google Calendar freebusy misslyckades:', error);
    return {};
  }

  const taken: Record<string, string[]> = {};
  for (let i = 0; i < LOOKAHEAD_DAYS; i++) {
    const date = todayInSweden(new Date(timeMin.getTime() + i * 86400000));
    for (const time of TIME_SLOTS) {
      const start = slotStart(date, time).getTime();
      const end = start + MEETING_MINUTES * 60000;
      // Överlapp, inte bara exakt träff — ett tvåtimmarsmöte tar två luckor,
      // och en heldagshändelse tar hela dagen.
      if (intervals.some(([busyStart, busyEnd]) => busyStart < end && busyEnd > start)) {
        (taken[date] ??= []).push(time);
      }
    }
  }
  return taken;
}

/** Är just den här tiden upptagen? Frågas om precis innan en bokning sparas. */
export async function isSlotBusyInCalendar(date: string, time: string): Promise<boolean> {
  if (!isCalendarConfigured()) return false;

  const start = slotStart(date, time);
  const end = slotEnd(start);
  try {
    // Fönstret börjar en restid tidigare — annars missas händelsen som slutar
    // strax innan tiden och som ska blockera den.
    const lookBack = new Date(start.getTime() - TRAVEL_BUFFER_MINUTES * 60000);
    const intervals = await blockedBetween(lookBack, end);
    return intervals.some(([busyStart, busyEnd]) =>
      busyStart < end.getTime() && busyEnd > start.getTime()
    );
  } catch (error) {
    // Kalendern svarar inte. Att neka bokningen vore att tappa en kund för att
    // Google har en dålig dag — släpp igenom den och lita på Supabase-kollen.
    console.error('Google Calendar-kollen misslyckades:', error);
    return false;
  }
}

/** Lägger in mötet i kalendern. Returnerar händelsens id, eller null om det inte gick. */
export async function createMeetingEvent(meeting: {
  name: string;
  email: string;
  phone?: string | null;
  date: string;
  time: string;
  message?: string | null;
  source?: string;
}): Promise<string | null> {
  if (!isCalendarConfigured()) return null;

  const start = slotStart(meeting.date, meeting.time);
  const end = slotEnd(start);

  try {
    const res = await calendar().events.insert({
      calendarId: CALENDAR_ID!,
      requestBody: {
        summary: `Möte: ${meeting.name}`,
        // Kunden läggs medvetet inte till som deltagare — ett servicekonto får
        // inte bjuda in gäster utan domänvid delegering. Bekräftelsen till
        // kunden går via Resend i stället.
        description: [
          `Namn: ${meeting.name}`,
          `E-post: ${meeting.email}`,
          `Telefon: ${meeting.phone || '—'}`,
          meeting.source ? `Bokat via: ${meeting.source}` : '',
          meeting.message ? `\nMeddelande:\n${meeting.message}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
        start: { dateTime: start.toISOString(), timeZone: TZ },
        end: { dateTime: end.toISOString(), timeZone: TZ },
        // Märkningen syns inte i kalendern men gör att vi känner igen mötet
        // senare och slipper lägga på restid efter det.
        extendedProperties: { private: { [OWN_EVENT_MARKER.key]: OWN_EVENT_MARKER.value } },
      },
    });
    return res.data.id ?? null;
  } catch (error) {
    // Bokningen ligger redan i Supabase och mejlen är på väg. En kalender som
    // strular ska inte få bokningen att se ut att ha misslyckats.
    console.error('Kunde inte skapa kalenderhändelse:', error);
    return null;
  }
}
