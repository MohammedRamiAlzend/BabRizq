import { useState, useEffect, useCallback, memo } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { Ad, MOCK_ADS } from '~/entities/products';

const AUTO_PLAY_MS = 4500;

// ─── Single ad slide ───────────────────────────────────────────────────────────

interface AdSlideProps {
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  ctaEn: string;
  ctaAr: string;
  emoji: string;
  gradient: string;
  lang: 'en' | 'ar';
  onCtaClick: () => void;
}

const AdSlide = memo(function AdSlide({
  titleEn,
  titleAr,
  subtitleEn,
  subtitleAr,
  ctaEn,
  ctaAr,
  emoji,
  gradient,
  lang,
  onCtaClick,
}: AdSlideProps) {
  const title = lang === 'ar' ? titleAr : titleEn;
  const subtitle = lang === 'ar' ? subtitleAr : subtitleEn;
  const cta = lang === 'ar' ? ctaAr : ctaEn;

  return (
    <div
      className={`relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 md:p-8 md:flex-row md:items-center`}
    >
      {/* Decorative background circles */}
      <div className="pointer-events-none absolute -top-10 -end-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 -start-8 h-32 w-32 rounded-full bg-white/10 blur-xl" />

      {/* Text content */}
      <div className="relative z-10 max-w-md">
        <p className="text-3xl leading-none mb-3 md:hidden">{emoji}</p>
        <h3 className="text-xl font-extrabold text-white leading-snug md:text-2xl">{title}</h3>
        <p className="mt-2 text-sm text-white/80 leading-relaxed">{subtitle}</p>
        <button
          onClick={onCtaClick}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/20 border border-white/30 px-5 py-2.5 text-sm font-bold text-white backdrop-blur transition-all hover:bg-white/30 active:scale-95"
        >
          {cta}
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Emoji decoration */}
      <div className="pointer-events-none hidden select-none text-right md:block md:flex-shrink-0">
        <span className="text-8xl leading-none drop-shadow-lg" role="img" aria-hidden>
          {emoji}
        </span>
      </div>
    </div>
  );
});

// ─── Carousel ─────────────────────────────────────────────────────────────────

interface AdCarouselProps {
  /** Custom ads to display. Defaults to the global MOCK_ADS when omitted. */
  ads?: Ad[];
}

const AdCarousel = ({ ads = MOCK_ADS }: AdCarouselProps) => {
  const { lang, dir } = useLocale();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  // Reset to first slide when ad list changes (e.g. navigating between stores)
  useEffect(() => {
    setCurrent(0);
  }, [ads]);

  // Auto-advance
  useEffect(() => {
    if (paused || ads.length <= 1) return;
    const id = setInterval(() => {
      setCurrent(prev => (prev + 1) % ads.length);
    }, AUTO_PLAY_MS);
    return () => clearInterval(id);
  }, [paused, ads]);

  const prev = useCallback(() => {
    setCurrent(c => (c - 1 + ads.length) % ads.length);
  }, [ads]);

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % ads.length);
  }, [ads]);

  const handleCta = useCallback(() => {
    const ad = ads[current];
    if (!ad.linkType || !ad.linkValue) return;
    if (ad.linkType === 'category') navigate(`/store/c/${ad.linkValue}`);
    if (ad.linkType === 'store') navigate(`/store/s/${ad.linkValue}`);
  }, [current, navigate, ads]);

  if (ads.length === 0) return null;

  const ad = ads[current];

  // In RTL direction the "previous" visual arrow is on the right side
  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slide area */}
      <div className="overflow-hidden rounded-2xl" style={{ minHeight: '180px' }}>
        <AdSlide
          key={ad.id}
          titleEn={ad.titleEn}
          titleAr={ad.titleAr}
          subtitleEn={ad.subtitleEn}
          subtitleAr={ad.subtitleAr}
          ctaEn={ad.ctaEn}
          ctaAr={ad.ctaAr}
          emoji={ad.emoji}
          gradient={ad.gradient}
          lang={lang}
          onCtaClick={handleCta}
        />
      </div>

      {/* Prev / Next buttons — only show when there are multiple slides */}
      {ads.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous ad"
            className="absolute start-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur transition hover:bg-black/35"
          >
            <PrevIcon className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            aria-label="Next ad"
            className="absolute end-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur transition hover:bg-black/35"
          >
            <NextIcon className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Dot indicators — only when multiple slides */}
      {ads.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to ad ${i + 1}`}
              className={[
                'h-1.5 rounded-full transition-all duration-300',
                i === current ? 'w-5 bg-white' : 'w-1.5 bg-white/50',
              ].join(' ')}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdCarousel;










