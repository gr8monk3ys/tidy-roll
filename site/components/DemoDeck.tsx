'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  animate,
} from 'framer-motion';

type DemoCard = { img: string; name: string; mb: number };
type Decision = 'keep' | 'toss';

const CARDS: DemoCard[] = [
  { img: '/assets/samples/sunset-01.svg', name: 'IMG_2041.jpg', mb: 3.3 },
  { img: '/assets/samples/blurry.svg', name: 'IMG_2044.jpg', mb: 3.2 },
  { img: '/assets/samples/ocean.svg', name: 'IMG_1830.jpg', mb: 2.7 },
  { img: '/assets/samples/screenshot.svg', name: 'Screenshot 03-14.png', mb: 0.8 },
  { img: '/assets/samples/city.svg', name: 'IMG_2210.jpg', mb: 3.9 },
  { img: '/assets/samples/lake.svg', name: 'IMG_2119.jpg', mb: 5.7 },
  { img: '/assets/samples/night.svg', name: 'IMG_2307.jpg', mb: 1.8 },
];

const THRESHOLD = 80;
const FLY_X = 640;

function Stamp({ kind, opacity }: { kind: Decision; opacity?: import('framer-motion').MotionValue<number> | number }) {
  const isKeep = kind === 'keep';
  return (
    <motion.div
      style={{ opacity }}
      className={`pointer-events-none absolute top-5 rounded-xl border-[3.5px] px-3.5 py-1.5 text-2xl font-extrabold tracking-[0.12em] ${
        isKeep
          ? 'left-4 -rotate-[14deg] border-keep text-keep'
          : 'right-4 rotate-[14deg] border-toss text-toss'
      }`}
    >
      {isKeep ? 'KEEP' : 'TOSS'}
    </motion.div>
  );
}

function CardFace({ card }: { card: DemoCard }) {
  return (
    <>
      <div className="min-h-0 flex-1 bg-[#0b0e1a]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.img}
          alt=""
          draggable={false}
          className="pointer-events-none h-full w-full select-none object-cover"
        />
      </div>
      <div className="flex items-baseline justify-between gap-2 px-3.5 py-2.5 text-[13px]">
        <span className="font-semibold">{card.name}</span>
        <span className="text-[11.5px] text-muted">{card.mb.toFixed(1)} MB</span>
      </div>
    </>
  );
}

function TopCard({
  card,
  onDecide,
  flyTo,
}: {
  card: DemoCard;
  onDecide: (decision: Decision) => void;
  flyTo: Decision | null;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-240, 240], [-16, 16]);
  const keepOpacity = useTransform(x, [0, THRESHOLD], [0, 1]);
  const tossOpacity = useTransform(x, [-THRESHOLD, 0], [1, 0]);
  const decided = useRef(false);

  const fly = useCallback(
    (decision: Decision) => {
      if (decided.current) return;
      decided.current = true;
      animate(x, decision === 'keep' ? FLY_X : -FLY_X, {
        duration: 0.38,
        ease: 'easeIn',
      }).then(() => onDecide(decision));
    },
    [onDecide, x],
  );

  // Button/keyboard-triggered exits arrive via the flyTo prop.
  useEffect(() => {
    if (flyTo) fly(flyTo);
  }, [flyTo, fly]);

  return (
    <motion.article
      className="absolute inset-0 z-30 flex cursor-grab flex-col overflow-hidden rounded-[20px] border border-line bg-surface shadow-[0_18px_50px_rgba(0,0,0,0.45)] active:cursor-grabbing"
      style={{ x, y, rotate }}
      drag
      dragElastic={0.9}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={(_event, info) => {
        if (info.offset.x > THRESHOLD) fly('keep');
        else if (info.offset.x < -THRESHOLD) fly('toss');
      }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      <CardFace card={card} />
      <Stamp kind="keep" opacity={keepOpacity} />
      <Stamp kind="toss" opacity={tossOpacity} />
    </motion.article>
  );
}

export default function DemoDeck() {
  const [queue, setQueue] = useState<DemoCard[]>(CARDS);
  const [history, setHistory] = useState<{ card: DemoCard; decision: Decision }[]>([]);
  const [flyTo, setFlyTo] = useState<Decision | null>(null);

  const tossedMB = history
    .filter((entry) => entry.decision === 'toss')
    .reduce((sum, entry) => sum + entry.card.mb, 0);
  const reviewed = CARDS.length - queue.length;

  const handleDecide = useCallback((decision: Decision) => {
    setQueue((current) => {
      const [top, ...rest] = current;
      if (top) setHistory((entries) => [...entries, { card: top, decision }]);
      return rest;
    });
    setFlyTo(null);
  }, []);

  const undo = useCallback(() => {
    setHistory((entries) => {
      const last = entries[entries.length - 1];
      if (!last) return entries;
      setQueue((current) => [last.card, ...current]);
      return entries.slice(0, -1);
    });
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') setFlyTo('toss');
      else if (event.key === 'ArrowRight') setFlyTo('keep');
      else if (event.key === 'z' || event.key === 'Z') undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo]);

  return (
    <div className="flex flex-col items-center">
      <div className="mb-3 flex w-[min(78vw,330px)] items-center justify-between text-[13px] tabular-nums text-muted">
        <span>
          {queue.length === 0 ? CARDS.length : reviewed + 1} of {CARDS.length}
        </span>
        {tossedMB > 0 && (
          <span className="rounded-full border border-toss/35 px-2.5 py-1 text-xs text-toss">
            {tossedMB.toFixed(1)} MB to toss
          </span>
        )}
      </div>

      <div
        className="relative h-[min(96vw,410px)] w-[min(78vw,330px)] touch-none"
        aria-label="Interactive demo — drag the card left or right"
      >
        {queue.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-line p-6 text-center"
          >
            <b className="text-[22px]">{tossedMB.toFixed(1)} MB reclaimed 🎉</b>
            <p className="text-sm text-muted">
              That took, what, ten seconds? Imagine your whole camera roll.
            </p>
            <a
              href="#get"
              className="bg-gradient-brand mt-1 rounded-full px-6 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(255,90,110,0.35)]"
            >
              Get Tidy Roll
            </a>
          </motion.div>
        ) : (
          <>
            {queue.slice(1, 3).map((card, index) => (
              <div
                key={card.name}
                className="absolute inset-0 flex flex-col overflow-hidden rounded-[20px] border border-line bg-surface shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
                style={{
                  transform: `translateY(${(index + 1) * 12}px) scale(${1 - (index + 1) * 0.045})`,
                  zIndex: 2 - index,
                }}
              >
                <CardFace card={card} />
              </div>
            ))}
            <AnimatePresence>
              <TopCard
                key={queue[0].name}
                card={queue[0]}
                onDecide={handleDecide}
                flyTo={flyTo}
              />
            </AnimatePresence>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={() => setFlyTo('toss')}
          aria-label="Toss"
          className="flex h-14 w-14 items-center justify-center rounded-full border border-toss/40 bg-surface text-toss transition hover:-translate-y-0.5 hover:bg-toss/15 active:scale-95"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <button
          onClick={undo}
          aria-label="Undo"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:-translate-y-0.5 hover:text-fg active:scale-95"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-15-6.7L3 13" />
          </svg>
        </button>
        <button
          onClick={() => setFlyTo('keep')}
          aria-label="Keep"
          className="flex h-14 w-14 items-center justify-center rounded-full border border-keep/40 bg-surface text-keep transition hover:-translate-y-0.5 hover:bg-keep/15 active:scale-95"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21s-8.1-5.6-8.1-11.1a4.6 4.6 0 0 1 8.1-2.9 4.6 4.6 0 0 1 8.1 2.9C20.1 15.4 12 21 12 21z" />
          </svg>
        </button>
      </div>
      <p className="mt-3.5 text-[12.5px] text-muted">
        This is the real thing — drag the card, use the buttons, or press ←/→.
      </p>
    </div>
  );
}
