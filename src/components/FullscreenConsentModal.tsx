import React, { useState, useRef, useEffect } from 'react';
import { CojLogo, DnwellLogo } from './Logos';
import {
  X,
  Maximize2,
  Minimize2,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  PenTool,
  Type,
  FileCheck,
  Languages,
  HeartHandshake,
  HeartPulse,
  Flame,
  Lock,
  Sparkles,
} from 'lucide-react';

interface FullscreenConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  clientAlias?: string;
  clientAge?: number;
  clientGender?: string;
  clientNationality?: string;
  clientHomeLanguage?: string;
  clientAddress?: string;
  clientRace?: string;
  outreachSite?: string;
  initialSignature?: string;
  onSaveSignature?: (signatureDataUrl: string, signedName: string) => void;
  isReadOnly?: boolean;
  signedAt?: string;
}

type LangOption = 'en' | 'zu' | 'st' | 'af';

const TRANSLATIONS: Record<LangOption, {
  title: string;
  sub: string;
  p1Title: string;
  p1: string;
  p2Title: string;
  p2: string;
  p3Title: string;
  p3: string;
  p4Title: string;
  p4: string;
  p5Title: string;
  p5: string;
  confirmText: string;
}> = {
  en: {
    title: 'Informed Consent & Patient Rights Attestation',
    sub: 'City of Johannesburg Health & Dunwell Youth Priority Clinic Homeless Outreach',
    p1Title: '1. Voluntary Participation',
    p1: 'I choose freely to participate in this outreach health screening. I can decline any question, test, or step at any time without losing access to shelter or other municipal services.',
    p2Title: '2. Clinical Health Check & Vitals',
    p2: 'I agree to have my blood pressure, pulse, temperature, blood sugar, and present complaints (injuries, respiratory, wounds) checked by the healthcare team.',
    p3Title: '3. Confidential Rapid HIV Testing (HTS)',
    p3: 'I agree to optional, confidential rapid HIV counseling and testing. If positive, I will be immediately linked to free treatment (ART) and wellness care.',
    p4Title: '4. Substance Use Assessment & Voluntary Rehab',
    p4: 'I agree to discuss my substance use safely without legal fear. If I want help, the team will link me directly to City of Johannesburg detox and rehab programs.',
    p5Title: '5. Privacy & POPIA Protection',
    p5: 'My health information is confidential. It will only be shared with healthcare clinicians, social workers, and clinic doctors to provide me with care and referrals.',
    confirmText: 'I confirm that the outreach worker explained these terms to me, and I give my informed consent.',
  },
  zu: {
    title: 'Imvume Enolwazi Namalungelo Omguli',
    sub: 'Ezempilo ZeDolobha laseGoli ne-Dunwell Youth Priority Clinic',
    p1Title: '1. Ukuzibandakanya Ngokuzithandela',
    p1: 'Ngizikhethela ngokwami ukuhlolwa impilo. Ngingenqaba noma yisiphi isivivinyo nganoma yisiphi isikhathi ngaphandle kokulahlekelwa yizinsiza zokuhlala.',
    p2Title: '2. Ukuhlolwa Kwempilo Nezimpawu Zokugula',
    p2: 'Ngiyavuma ukuthi kuhlolwe umfutho wegazi, izinga likashukela, nokulimala noma ukukhwehlela kwami ngumtholampilo.',
    p3Title: '3. Ukuhlolwa Kwe-HIV Okuyimfihlo (HTS)',
    p3: 'Ngiyavuma ukuhlolwa i-HIV ngasese. Uma kutholakala ukuthi nginalo, ngizosizwa ngokushesha ngemithi yamahhala (ART).',
    p4Title: '4. Ukusizwa Ngezidakamizwa Nokuhlanzwa (Rehab)',
    p4: 'Ngiyavuma ukuxoxa ngokusebenzisa izidakamizwa ngokuphepha. Uma ngidinga usizo lwe-rehab, ngizoxhunywa nezikhungo zikamasipala.',
    p5Title: '5. Ukuvikelwa Kwemininingwane (POPIA)',
    p5: 'Ulwazi lwami luyimfihlo kakhulu. Luyosetshenziswa odokotela nabahlengikazi kuphela ukunginakekela.',
    confirmText: 'Ngiyaqinisekisa ukuthi ngachazelwa la magama ngolimi lwami futhi nginikeza imvume yami ephelele.',
  },
  st: {
    title: 'Tumellano e nang le Tsebo le Litokelo tsa Mokuli',
    sub: 'Bophelo bo Botle ba Toropo ea Joburg le Tliliniki ea Bacha ea Dunwell',
    p1Title: '1. Ho nka Karolo ka Boithatelo',
    p1: 'Ke khetha ka boithaopo ho hlahlojoa bophelo. Nka hana nako efe kapa efe ntle le ho lahleheloa ke thuso ea bolulo.',
    p2Title: '2. Tlhahlobo ea Bophelo bo Botle',
    p2: 'Ke lumela hore mooki a hlahlobe khatello ea mali, tsoekere le maqeba kapa ho hema hampe.',
    p3Title: '3. Tlhahlobo ea Sephiri ea HIV (HTS)',
    p3: 'Ke lumela ho hlahlobela HIV ka sephiri le ho fumana meriana ea mahala hang-hang ha ho hlokahala.',
    p4Title: '4. Tšehetso ea Lithethefatsi le Rehab',
    p4: 'Ke lumela ho buisana ka lithethefatsi ka polokeho. Haeba ke batla thuso ea rehab, ke tla kopanngoa le litsi tsa Toropo.',
    p5Title: '5. Tšireletso ea Lintlha (POPIA)',
    p5: 'Tlhahisoleseling ea ka ke lekunutu, e tla sebelisoa feela ke basebeletsi ba tsa bophelo ho nthusa.',
    confirmText: 'Ke tiisa hore ke hlaloselitsoe lintlha tsena mme ke fana ka tumello e felletseng.',
  },
  af: {
    title: 'Ingeligte Toestemming & Pasiënteregte',
    sub: 'Stad Johannesburg Gesondheid & Dunwell Jeugkliniek Uitgebreide Diens',
    p1Title: '1. Vrywillige Deelname',
    p1: 'Ek kies vrywilliglik om aan hierdie gesondheidsifting deel te neem. Ek mag enige stap of toets weier sonder verlies van dienste.',
    p2Title: '2. Kliniese Ondersoek & Vitale Tekens',
    p2: 'Ek stem in dat my bloeddruk, pols, suiker en fisiese klagtes deur die verpleegspan ondersoek word.',
    p3Title: '3. Vertroulike Vinnige MIV-toetsing (HTS)',
    p3: 'Ek stem in tot vrywillige MIV-toetsing met berading en direkte skakeling na gratis behandeling (ART).',
    p4Title: '4. Middelgebruik & Rehabilitasie',
    p4: 'Ek stem in om middelgebruik veilig te bespreek. Indien ek hulp verlang, sal die span my na munisipale rehabilitasiesentrums verwys.',
    p5Title: '5. Privaatheid en POPIA Beskerming',
    p5: 'My inligting is streng vertroulik en word slegs deur gesondheidswerkers gebruik vir my sorg en verwysing.',
    confirmText: 'Ek bevestig dat hierdie terme aan my verduidelik is en ek gee my ingeligte toestemming.',
  },
};

export const FullscreenConsentModal: React.FC<FullscreenConsentModalProps> = ({
  isOpen,
  onClose,
  clientName,
  clientAlias,
  clientAge,
  clientGender,
  clientNationality,
  clientHomeLanguage,
  clientAddress,
  clientRace,
  outreachSite = 'Joubert Park / Inner-City Outreach',
  initialSignature = '',
  onSaveSignature,
  isReadOnly = false,
  signedAt,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lang, setLang] = useState<LangOption>('en');
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(Boolean(initialSignature));
  const [typedName, setTypedName] = useState(clientName || '');
  const [signatureUrl, setSignatureUrl] = useState(initialSignature);
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  // Sync state when props change
  useEffect(() => {
    if (initialSignature) {
      setSignatureUrl(initialSignature);
      setHasDrawn(true);
    }
    if (clientName) {
      setTypedName(clientName);
    }
  }, [initialSignature, clientName]);

  // Handle Fullscreen API toggle
  const toggleBrowserFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (e) {
      // Fallback: visual full viewport overlay is always active
      setIsFullscreen(!isFullscreen);
    }
  };

  // Monitor fullscreen change events
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Setup signature canvas
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#0B2545'; // Deep City of Joburg Navy Blue
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (signatureUrl && signatureUrl.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = signatureUrl;
    }
  };

  useEffect(() => {
    if (isOpen && mode === 'draw' && !isReadOnly) {
      // Slight delay for layout measurement
      const timer = setTimeout(() => {
        initCanvas();
      }, 80);
      window.addEventListener('resize', initCanvas);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', initCanvas);
      };
    }
  }, [isOpen, mode, isReadOnly]);

  if (!isOpen) return null;

  const t = TRANSLATIONS[lang];

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isReadOnly) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isReadOnly) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || isReadOnly) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      setSignatureUrl(dataUrl);
    }
  };

  const clearCanvas = () => {
    if (isReadOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    setSignatureUrl('');
  };

  const adoptTypedSignature = () => {
    if (isReadOnly || !typedName.trim()) return;
    const offscreen = document.createElement('canvas');
    offscreen.width = 600;
    offscreen.height = 180;
    const ctx = offscreen.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 600, 180);
      ctx.fillStyle = '#0B2545';
      ctx.font = 'italic bold 44px "Brush Script MT", "Caveat", "Segoe Script", cursive';
      ctx.fillText(typedName.trim(), 40, 95);

      // Gold baseline rule
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(35, 125);
      ctx.lineTo(565, 125);
      ctx.stroke();

      const dataUrl = offscreen.toDataURL('image/png');
      setSignatureUrl(dataUrl);
      setHasDrawn(true);
    }
  };

  const handleSaveAndConfirm = () => {
    if (onSaveSignature) {
      onSaveSignature(signatureUrl, typedName || clientName);
    }
    // If browser fullscreen was active, exit
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-slate-100 flex flex-col overflow-hidden select-none font-sans text-slate-900 animate-in fade-in duration-150"
    >
      {/* Top Banner & Control Bar */}
      <header className="bg-white border-b border-slate-300 px-4 sm:px-8 py-3 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <CojLogo className="h-10" variant="dark" />
          <div className="h-7 w-px bg-slate-300 hidden sm:block" />
          <DnwellLogo className="h-10" variant="dark" />
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Multi-language Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 rounded-xl px-2 py-1 text-xs">
            <Languages className="w-4 h-4 text-blue-900 shrink-0" />
            <span className="text-[11px] font-bold text-slate-600 hidden md:inline">Language:</span>
            <div className="flex gap-1">
              {(['en', 'zu', 'st', 'af'] as LangOption[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`px-2 py-1 rounded-md text-xs font-bold transition uppercase ${
                    lang === l
                      ? 'bg-blue-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* True Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleBrowserFullscreen}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter True Fullscreen Mode'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 text-blue-900" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-blue-900" />
                <span className="hidden sm:inline">Fullscreen Mode</span>
              </>
            )}
          </button>

          {/* Close Modal Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition"
            title="Close Consent View"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Fullscreen Scrollable Body */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/80 flex justify-center">
        <div className="w-full max-w-4xl bg-white border border-slate-300 rounded-2xl shadow-xl p-6 sm:p-10 space-y-6">
          
          {/* Header Badge & Title */}
          <div className="border-b-2 border-amber-400 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-900 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-blue-900" />
                Official Client Informed Consent Form
              </span>
              <span className="text-xs text-slate-500 font-medium">
                National Health Act 61 of 2003 • POPIA Act 4 of 2013
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t.title}
            </h1>
            <p className="text-sm font-semibold text-amber-700 mt-0.5">
              {t.sub}
            </p>

            {/* Section 1: Client Personal Details */}
            <div className="mt-4 bg-slate-50 border-2 border-blue-900/20 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-900"></span>
                  <span className="text-xs font-black uppercase tracking-wider text-blue-950">
                    Section 1: Client Personal Details
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                  POPIA Confidential Record
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                {/* 1. Full Name & Alias */}
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">1. Full Name & Alias</span>
                  <span className="text-sm font-extrabold text-blue-950 block">
                    {clientName || 'Homeless Community Client'}
                  </span>
                  {clientAlias && (
                    <span className="text-[11px] text-amber-800 font-semibold block italic">
                      Alias: "{clientAlias}"
                    </span>
                  )}
                </div>

                {/* 2. Demographics (Gender, Age, Race) */}
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">2. Gender, Age & Race</span>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className="font-bold text-slate-800 text-xs">
                      {clientGender || 'Male'}, {clientAge ? `${clientAge} yrs` : 'Age N/A'}
                    </span>
                    {clientAge && clientAge <= 35 && (
                      <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black">
                        YOUTH
                      </span>
                    )}
                  </div>
                  {clientRace && (
                    <span className="text-[11px] text-slate-600 block mt-0.5 font-medium">
                      Race: {clientRace}
                    </span>
                  )}
                </div>

                {/* 3. Nationality & Home Language */}
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">3. Nationality & Language</span>
                  <span className="text-xs font-bold text-blue-900 block truncate">
                    {clientNationality || 'South African (ID Verified)'}
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] text-slate-500 font-medium">Language:</span>
                    <span className="text-[11px] font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      {clientHomeLanguage || 'isiZulu'}
                    </span>
                  </div>
                </div>

                {/* 4. Physical Address & Spot */}
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">4. Physical Address / Spot</span>
                  <span className="text-xs font-bold text-slate-800 block line-clamp-2">
                    {clientAddress || outreachSite || 'Joubert Park Inner-City Outreach'}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5 truncate">
                    Site: {outreachSite}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2 Banner: Consent Form Shown Under Personal Details */}
            <div className="mt-4 pt-3 flex items-center justify-between border-t border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Section 2: Informed Consent Form & POPIA Attestation (Under Personal Details)
                </h3>
              </div>
              {signedAt && (
                <span className="text-[11px] text-slate-500 font-mono">
                  Recorded: {signedAt}
                </span>
              )}
            </div>
          </div>

          {/* Dignified Plain-Language Consent Terms */}
          <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Please read or listen as the healthcare worker reviews each right with you:
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Point 1 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-1.5 text-sm">
                  <HeartHandshake className="w-4 h-4 text-blue-800" />
                  {t.p1Title}
                </h3>
                <p className="text-xs text-slate-600 leading-normal">{t.p1}</p>
              </div>

              {/* Point 2 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-1.5 text-sm">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  {t.p2Title}
                </h3>
                <p className="text-xs text-slate-600 leading-normal">{t.p2}</p>
              </div>

              {/* Point 3 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-1.5 text-sm">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  {t.p3Title}
                </h3>
                <p className="text-xs text-slate-600 leading-normal">{t.p3}</p>
              </div>

              {/* Point 4 */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-1.5 text-sm">
                  <Flame className="w-4 h-4 text-orange-600" />
                  {t.p4Title}
                </h3>
                <p className="text-xs text-slate-600 leading-normal">{t.p4}</p>
              </div>
            </div>

            {/* Point 5: Full Width POPIA Privacy */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
              <h3 className="font-bold text-blue-950 flex items-center gap-2 mb-1 text-sm">
                <Lock className="w-4 h-4 text-blue-900" />
                {t.p5Title}
              </h3>
              <p className="text-xs text-slate-700 leading-normal">{t.p5}</p>
            </div>
          </div>

          {/* Acknowledgement Checkbox */}
          <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                disabled={isReadOnly}
                className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-900 focus:ring-blue-800"
              />
              <span className="text-sm font-bold text-slate-900 leading-snug">
                {t.confirmText}
              </span>
            </label>
          </div>

          {/* Signature Section */}
          <div className="border-t-2 border-slate-200 pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-blue-900" />
                  Homeless Client Digital Signature
                </h3>
                <p className="text-xs text-slate-600">
                  {isReadOnly
                    ? 'Official verified signature stored on file'
                    : 'Draw with your finger or stylus directly inside the signature box below'}
                </p>
              </div>

              {!isReadOnly && (
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-300 self-start">
                  <button
                    type="button"
                    onClick={() => setMode('draw')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      mode === 'draw'
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    Draw Finger / Stylus
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('type')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      mode === 'type'
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    Type Legal Name
                  </button>
                </div>
              )}
            </div>

            {/* Read-Only Signature Display */}
            {isReadOnly ? (
              <div className="p-6 bg-slate-50 border-2 border-slate-300 rounded-xl flex flex-col items-center justify-center">
                {signatureUrl ? (
                  <img
                    src={signatureUrl}
                    alt="Verified Client Signature"
                    className="max-h-28 object-contain"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-500 italic">No signature image recorded</p>
                )}
                <div className="mt-3 text-center border-t border-slate-300 pt-2 w-full max-w-sm">
                  <span className="text-xs font-bold text-blue-950 block">{clientName}</span>
                  <span className="text-[11px] text-emerald-700 font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Legal Outreach Consent
                  </span>
                </div>
              </div>
            ) : mode === 'draw' ? (
              /* Interactive Drawing Canvas */
              <div className="space-y-2">
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-44 sm:h-52 bg-amber-50/20 border-2 border-dashed border-blue-900/40 rounded-2xl cursor-crosshair touch-none shadow-inner"
                  />

                  {!hasDrawn && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400">
                      <PenTool className="w-8 h-8 mb-2 text-blue-900/50 animate-bounce" />
                      <span className="text-base font-bold text-slate-700">
                        Touch screen here with finger or stylus to sign
                      </span>
                      <span className="text-xs text-slate-500">
                        Sign within this large box
                      </span>
                    </div>
                  )}

                  {/* Visual Baseline Guide */}
                  <div className="absolute left-6 right-6 bottom-8 border-b-2 border-dotted border-slate-300 pointer-events-none flex justify-between">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">
                      X ____________________________ Sign On This Line
                    </span>
                    <span className="text-[10px] text-amber-600 font-mono font-bold">
                      DUNWELL & COJ HEALTH
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {hasDrawn ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Signature captured ready to save
                      </span>
                    ) : (
                      'Waiting for client touch or stylus stroke'
                    )}
                  </span>

                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-rose-700 px-3 py-1 rounded-lg text-xs font-bold border border-slate-300 hover:border-rose-300 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Clear & Resign
                  </button>
                </div>
              </div>
            ) : (
              /* Type Name Option */
              <div className="p-5 bg-slate-50 border border-slate-300 rounded-xl space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Client's Recognized / Legal Name:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      placeholder="Type name here..."
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-base font-semibold text-slate-900 focus:outline-none focus:border-blue-800"
                    />
                    <button
                      type="button"
                      onClick={adoptTypedSignature}
                      className="bg-blue-900 hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap"
                    >
                      Adopt as Signature
                    </button>
                  </div>
                </div>

                {signatureUrl && (
                  <div className="p-4 bg-white rounded-xl border border-slate-300 flex items-center justify-between">
                    <img src={signatureUrl} alt="Electronic Signature" className="h-14 object-contain" />
                    <div className="text-right text-xs">
                      <span className="text-emerald-700 font-bold block">Adopted Electronic Signature</span>
                      <span className="text-slate-500">{new Date().toLocaleDateString('en-ZA')}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Sticky Action Footer */}
      <footer className="bg-white border-t border-slate-300 px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shrink-0">
        <div className="text-xs text-slate-600 text-center sm:text-left">
          <strong className="text-slate-900">Protected Legal Record:</strong> Both client and mobile outreach staff are bound by medical ethics and POPIA confidentiality.
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs sm:text-sm transition"
          >
            {isReadOnly ? 'Close View' : 'Cancel'}
          </button>

          {!isReadOnly && (
            <button
              type="button"
              disabled={!agreedToTerms || !signatureUrl}
              onClick={handleSaveAndConfirm}
              className={`px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md transition flex items-center gap-2 ${
                agreedToTerms && signatureUrl
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer ring-2 ring-amber-300'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <FileCheck className="w-4 h-4 text-slate-950" />
              <span>Confirm & Save Client Consent</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
