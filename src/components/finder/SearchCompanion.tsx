import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";

export type Mood = "idle" | "curious" | "searching" | "success" | "happy" | "not-found" | "error" | "rate-limit";

const LINES: Record<Mood, string> = {
  idle: "Hey! Who are we exploring today?",
  curious: "Ooh, who are we meeting today?",
  searching: "Let me find them!",
  success: "Yesss! Found them!",
  happy: "Want to explore someone else?",
  "not-found": "Aww, not this one. Let's try again!",
  error: "Hmm, GitHub isn't responding right now.",
  "rate-limit": "GitHub asked us to wait a moment…",
};

function CharacterSpeechBubble({ mood, text }: { mood: Mood; text?: string | undefined }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(ref.current, { y: 8, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" });
  }, { dependencies: [mood, text] });
  return (
    <div ref={ref} aria-live="polite" className="absolute -top-4 left-1/2 z-10 w-max max-w-[220px] -translate-x-1/2 -translate-y-full rounded-2xl border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground shadow-card">
      {text ?? LINES[mood]}
      <span className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 border-b border-r border-border bg-card" />
    </div>
  );
}

function CharacterFace({ mood }: { mood: Mood }) {
  const mouth =
    mood === "success" || mood === "happy" ? "M84 128 Q100 146 116 128" :
    mood === "not-found" ? "M86 138 Q100 126 114 138" :
    mood === "error" || mood === "rate-limit" ? "M88 134 L112 134" :
    mood === "searching" ? "M94 132 Q100 138 106 132" :
    "M88 130 Q100 140 112 130";
  const brows = mood === "not-found"
    ? ["M68 82 L88 88", "M132 82 L112 88"]
    : mood === "error" || mood === "rate-limit" ? ["M68 86 L88 82", "M132 86 L112 82"] : mood === "curious" ? ["M68 82 L88 80", "M112 86 L132 80"] : null;
  return (
    <g>
      {brows && brows.map((d) => <path key={d} d={d} className="stroke-deep-foreground" strokeWidth="4" strokeLinecap="round" fill="none" />)}
      <path data-mouth d={mouth} className="stroke-primary" strokeWidth="5" strokeLinecap="round" fill="none" style={{ transition: "d 0.35s ease" }} />
      {(mood === "success" || mood === "happy") && (
        <>
          <circle cx="66" cy="124" r="7" className="fill-primary" opacity="0.35" />
          <circle cx="134" cy="124" r="7" className="fill-primary" opacity="0.35" />
        </>
      )}
    </g>
  );
}

function CharacterEyes({ mood }: { mood: Mood }) {
  if (mood === "success" || mood === "happy")
    return (
      <g className="stroke-primary" strokeWidth="6" strokeLinecap="round" fill="none">
        <path d="M66 104 Q78 92 90 104" />
        <path d="M110 104 Q122 92 134 104" />
      </g>
    );
  return (
    <g data-eyes>
      <g data-blink style={{ transformOrigin: "100px 104px" }}>
        <ellipse cx="78" cy="104" rx="11" ry={mood === "not-found" ? 9 : 13} className="fill-deep-foreground" />
        <ellipse cx="122" cy="104" rx="11" ry={mood === "not-found" ? 9 : 13} className="fill-deep-foreground" />
        <g data-pupils>
          <circle cx="80" cy={mood === "not-found" ? 108 : 104} r="5.5" className="fill-deep" />
          <circle cx="124" cy={mood === "not-found" ? 108 : 104} r="5.5" className="fill-deep" />
        </g>
      </g>
    </g>
  );
}

export function SearchCompanion({ mood, message, compact = false }: { mood: Mood; message?: string | undefined; compact?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const body = useRef<SVGGElement>(null);
  const playful = useRef<gsap.core.Timeline | null>(null);
  const { contextSafe } = useGSAP({ scope: root });
  const greet = contextSafe(() => {
    if (!body.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches || playful.current?.isActive()) return;
    playful.current = gsap.timeline()
      .to(body.current, { y: -12, duration: 0.18, ease: "power2.out" })
      .to(body.current, { y: 0, duration: 0.4, ease: "bounce.out" });
    const blink = root.current?.querySelector("[data-blink]");
    if (blink) playful.current.fromTo(blink, { scaleY: 1 }, { scaleY: 0.1, duration: 0.12, yoyo: true, repeat: 1 }, 0);
  });

  // idle float + blink
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.to("[data-float]", { y: -10, duration: 2, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap.to("[data-antenna]", { rotate: 8, duration: 1.2, yoyo: true, repeat: -1, ease: "sine.inOut", transformOrigin: "100px 46px" });
    });
    return () => mm.revert();
  }, { scope: root });

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const blink = () => {
      const el = root.current?.querySelector("[data-blink]");
      if (el) gsap.fromTo(el, { scaleY: 1 }, { scaleY: 0.1, duration: 0.08, yoyo: true, repeat: 1 });
    };
    const id = window.setInterval(blink, 3600);
    return () => window.clearInterval(id);
  }, { scope: root });

  // pupils follow cursor
  useEffect(() => {
    if (compact || mood === "curious" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: PointerEvent) => {
      const el = root.current;
      const p = el?.querySelector("[data-pupils]");
      if (!el || !p) return;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
      const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
      gsap.to(p, { x: dx * 10, y: dy * 8, duration: 0.4 });
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [compact, mood]);

  // mood reactions
  useGSAP(() => {
    const b = body.current;
    if (!b) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.killTweensOf(b);
    if (mood === "curious") {
      gsap.to(b, { rotate: -5, x: -4, y: 0, duration: 0.4, transformOrigin: "100px 160px" });
      gsap.to("[data-pupils]", { x: -5, y: 1, duration: 0.4 });
    } else if (mood === "searching") {
      gsap.to(b, { rotate: -8, x: -6, duration: 0.4, ease: "power2.out", transformOrigin: "100px 160px" });
      gsap.fromTo("[data-glass]", { rotate: -20 }, { rotate: 20, duration: 0.5, yoyo: true, repeat: -1, ease: "sine.inOut", transformOrigin: "150px 150px" });
    } else if (mood === "success") {
      gsap.timeline()
        .to(b, { rotate: 0, x: 0, y: -24, duration: 0.25, ease: "power2.out" })
        .to(b, { y: 0, duration: 0.5, ease: "bounce.out" });
      gsap.fromTo("[data-spark]", { scale: 0, opacity: 1 }, { scale: 1.4, opacity: 0, duration: 0.9, stagger: 0.06, ease: "power2.out", transformOrigin: "center" });
    } else if (mood === "not-found") {
      gsap.to("[data-antenna]", { rotate: -20, duration: 0.5, transformOrigin: "100px 46px" });
      gsap.to(b, { rotate: 6, y: 10, x: 0, duration: 0.6, ease: "power3.out", transformOrigin: "100px 160px" });
      gsap.fromTo("[data-ripple]", { scale: 0.6, opacity: 0.6 }, { scale: 1.6, opacity: 0, duration: 1.2, ease: "power2.out", transformOrigin: "center" });
    } else if (mood === "error" || mood === "rate-limit") {
      gsap.fromTo(b, { x: -4 }, { x: 4, duration: 0.08, repeat: 5, yoyo: true, onComplete: () => { gsap.set(b, { x: 0 }); } });
      gsap.to(b, { rotate: 0, y: 4, duration: 0.4 });
    } else {
      gsap.to(b, { rotate: 0, x: 0, y: 0, duration: 0.5, ease: "power2.out" });
    }
  }, { dependencies: [mood], scope: root, revertOnUpdate: true });

  return (
    <div ref={root} className={compact ? "relative size-9 shrink-0 select-none" : "relative mx-auto w-[220px] select-none sm:w-[260px]"} data-companion data-mood={mood}>
      {!compact && <CharacterSpeechBubble mood={mood} text={message} />}
      <Button asChild={compact} type={compact ? undefined : "button"} variant="ghost" onClick={compact ? undefined : greet} aria-label={compact ? undefined : "Say hello to the explorer"} title={compact ? undefined : "Say hello"} className="block h-auto w-full rounded-none p-0 hover:bg-transparent [&_svg]:size-auto">
      {compact ? <span aria-hidden="true"><RobotDrawing mood={mood} body={body} compact /></span> : <RobotDrawing mood={mood} body={body} />}
      </Button>
    </div>
  );
}

function RobotDrawing({ mood, body, compact = false }: { mood: Mood; body: React.RefObject<SVGGElement | null>; compact?: boolean }) {
  return (
      <svg viewBox={compact ? "20 6 160 170" : "0 0 200 220"} role="img" aria-label={`Companion robot looking ${mood}`} className="w-full overflow-visible">
        <ellipse data-ripple cx="100" cy="200" rx="60" ry="10" className="fill-primary" opacity="0" />
        <ellipse cx="100" cy="206" rx="46" ry="7" className="fill-deep" opacity="0.12" />
        <g data-float>
          <g ref={body}>
            <g data-antenna>
              <line x1="100" y1="46" x2="100" y2="24" className="stroke-deep" strokeWidth="5" strokeLinecap="round" />
              <circle cx="100" cy="20" r="8" className="fill-primary" />
            </g>
            <rect x="40" y="46" width="120" height="120" rx="44" className="fill-deep" />
            <rect x="52" y="64" width="96" height="88" rx="32" className="fill-secondary" opacity="0.9" />
            <rect x="52" y="64" width="96" height="88" rx="32" className="fill-none stroke-primary" strokeOpacity="0.5" strokeWidth="2" />
            <CharacterEyes mood={mood} />
            <CharacterFace mood={mood} />
            <rect x="30" y="96" width="12" height="34" rx="6" className="fill-primary" />
            <rect x="158" y="96" width="12" height="34" rx="6" className="fill-primary" />
            {mood === "searching" && (
              <g data-glass>
                <circle cx="160" cy="150" r="16" className="fill-card stroke-primary" strokeWidth="5" />
                <line x1="171" y1="162" x2="184" y2="176" className="stroke-primary" strokeWidth="6" strokeLinecap="round" />
              </g>
            )}
          </g>
          {([[30, 40], [172, 50], [20, 120], [182, 120], [60, 14], [146, 18]] as [number, number][]).map(([x, y], i) => (
            <path key={i} data-spark d={`M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2} Z`} className="fill-primary" opacity="0" />
          ))}
        </g>
      </svg>
  );
}
