'use client';

import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import FlowContainer from '@/components/FlowContainer';
import { banks } from '@/data/banks';
import { packages } from '@/data/packages';
import { Bank } from '@/types';

export default function ConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const packageType = params.package as string;
  const bankId = searchParams.get('bank') as Bank;

  const bank = banks.find((b) => b.id === bankId);
  const packageInfo = packages.find((p) => p.id === packageType);
  const totalSteps = 5;

  return (
    <FlowContainer
      title="Tack för din beställning!"
      description="Vi har tagit emot dina uppgifter och börjar arbeta med din redovisning."
      currentStep={5}
      totalSteps={totalSteps}
      packageType={packageType}
    >
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gold-500/20 border-2 border-gold-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-12 h-12 text-gold-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">
          Allt är klart!
        </h2>
        <p className="text-lg text-warm-300">
          Du kommer få en bekräftelse via e-post inom kort.
        </p>
      </div>

      <div className="bg-navy-800/50 border border-navy-600 rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-white mb-4">
          Sammanfattning av din beställning:
        </h3>
        <div className="space-y-3 text-warm-300">
          <div className="flex justify-between">
            <span>Paket:</span>
            <span className="font-semibold text-gold-500">{packageInfo?.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Bank:</span>
            <span className="font-semibold text-white">{bank?.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Pris:</span>
            <span className="font-semibold text-gold-500">{packageInfo?.price} kr</span>
          </div>
        </div>
      </div>

      <div className="bg-gold-500/10 border-l-4 border-gold-500 rounded-r-lg p-6 mb-8">
        <h3 className="font-semibold text-gold-500 mb-3">
          Vad händer nu?
        </h3>
        {packageType === 'ne-bilaga' ? (
          <ol className="space-y-3 text-warm-300">
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500 text-navy-900 flex items-center justify-center text-sm font-bold mr-3">
                1
              </span>
              <span>Vi granskar dina kontoutdrag och börjar arbeta med din NE-bilaga</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500 text-navy-900 flex items-center justify-center text-sm font-bold mr-3">
                2
              </span>
              <span>Inom 24 timmar får du din färdiga NE-bilaga via e-post</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500 text-navy-900 flex items-center justify-center text-sm font-bold mr-3">
                3
              </span>
              <span>Du loggar in på Skatteverket och lämnar in NE-bilagan själv</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500 text-navy-900 flex items-center justify-center text-sm font-bold mr-3">
                4
              </span>
              <span>Klart! Kontakta oss vid frågor</span>
            </li>
          </ol>
        ) : (
          <ol className="space-y-3 text-warm-300">
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500 text-navy-900 flex items-center justify-center text-sm font-bold mr-3">
                1
              </span>
              <span>Vi granskar dina kontoutdrag och börjar arbeta med din NE-bilaga</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500 text-navy-900 flex items-center justify-center text-sm font-bold mr-3">
                2
              </span>
              <span>Innan inlämning får du en kopia på e-post för granskning</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500 text-navy-900 flex items-center justify-center text-sm font-bold mr-3">
                3
              </span>
              <span>Efter din godkännande lämnar vi in deklarationen åt dig</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500 text-navy-900 flex items-center justify-center text-sm font-bold mr-3">
                4
              </span>
              <span>Du får bekräftelse när allt är inlämnat - Klart!</span>
            </li>
          </ol>
        )}
      </div>

      <div className="bg-navy-800/50 border border-navy-600 rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-white mb-3">
          Kontakta oss vid frågor
        </h3>
        <p className="text-sm text-warm-300 mb-3">
          Om du har några frågor eller funderingar, tveka inte att höra av dig!
        </p>
        <Link
          href="/kontakt"
          className="inline-flex items-center text-gold-500 hover:text-gold-400 font-semibold transition-colors"
        >
          Gå till kontaktsidan
          <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Link
          href="/"
          className="px-8 py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-navy-900 rounded-xl font-bold transition-all duration-200 shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 hover:scale-105 text-center"
        >
          Tillbaka till startsidan
        </Link>
        <Link
          href="/tutorial"
          className="px-8 py-3 bg-navy-800 hover:bg-navy-600 border-2 border-gold-500/50 hover:border-gold-500 text-white rounded-xl font-bold transition-all duration-200 text-center"
        >
          Se guider
        </Link>
      </div>
    </FlowContainer>
  );
}
