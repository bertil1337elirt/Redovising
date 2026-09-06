/**
 * Vad en transaktionsfil måste innehålla för att gå att bokföra.
 *
 * Ligger här för att listan visas på två ställen — startsidan och
 * uppladdningssidan — och de två får inte hinna säga olika saker.
 */

export interface UnderlagFalt {
  label: string;
  desc: string;
  /** Krav för att vi ska kunna bokföra, till skillnad från bra att ha. */
  required: boolean;
}

export const UNDERLAG_FALT: UnderlagFalt[] = [
  { label: 'Datum', desc: 'Transaktionsdatum', required: true },
  { label: 'Beskrivning', desc: 'Vad gäller transaktionen', required: true },
  { label: 'Belopp', desc: 'Transaktionsbelopp', required: true },
  { label: 'Moms', desc: 'Momsbelopp', required: true },
  { label: 'Valuta*', desc: 'Krav om transaktionen inte är i SEK', required: true },
];

export const UNDERLAG_VALUTA_NOT =
  '* Valuta behövs bara om transaktionerna inte är i SEK — Zettle, Stripe och PayPal använder ofta USD eller EUR.';

export const UNDERLAG_FORMAT = 'Vi stödjer CSV, Excel, PDF och bilder';
