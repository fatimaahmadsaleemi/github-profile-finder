import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight, Loader2, Search, Compass, FolderGit2, Lightbulb } from "lucide-react";
import { SearchCompanion, type Mood } from "@/components/finder/SearchCompanion";
import { ErrorState, ProfileCard, ProfileSkeleton, RepoGrid } from "@/components/finder/Results";
import { fetchProfile, GitHubError, validateUsername, type GHRepo, type GHUser } from "@/lib/github";
import { Button } from "@/components/ui/button";
import { RecentSearches } from "@/components/finder/RecentSearches";
import { addRecentSearch, readRecentSearches, writeRecentSearches, type RecentSearch } from "@/lib/recent-searches";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, useGSAP);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Octoscope — Explore any GitHub developer" },
      { name: "description", content: "Search any public GitHub username and explore their profile, repositories and languages with a friendly animated companion." },
      { property: "og:title", content: "Octoscope — Explore any GitHub developer" },
      { property: "og:description", content: "A beautifully animated GitHub profile finder powered by real public GitHub data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type State =
  | { status: "idle" }
  | { status: "loading"; username: string }
  | { status: "success"; user: GHUser; repos: GHRepo[] }
  | { status: "error"; error: GitHubError; username: string };

const EXAMPLES = ["torvalds", "gaearon", "sindresorhus", "yyx990803"];

const STORY = [
  { icon: Compass, title: "Discover a developer", body: "Type any public username. Octoscope asks GitHub directly — no accounts, no tokens." },
  { icon: FolderGit2, title: "Explore their repositories", body: "Browse their latest public work, sorted by what they touched most recently." },
  { icon: Lightbulb, title: "Learn about their work", body: "See the languages they reach for, how many people follow along, and where they build." },
];

function Index() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });
  const [inputError, setInputError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [history, setHistory] = useState<RecentSearch[]>([]);
  const historyRef = useRef<RecentSearch[]>([]);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const page = useRef<HTMLDivElement>(null);

  const mood: Mood =
    state.status === "loading" ? "searching" :
    focused ? "curious" :
    state.status === "success" ? (celebrating ? "success" : "happy") :
    state.status === "error" ? (state.error.kind === "not-found" ? "not-found" : state.error.kind === "rate-limit" ? "rate-limit" : "error") : "idle";
  const bubble = state.status === "error" && state.error.kind === "rate-limit" ? "GitHub asked us to wait a moment…" : undefined;

  const run = useCallback(async (raw: string) => {
    const err = validateUsername(raw);
    if (err) { setInputError(err); inputRef.current?.focus(); return; }
    setInputError(null);
    const username = raw.trim().replace(/^@/, "");
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setFocused(false);
    setCelebrating(false);
    setState({ status: "loading", username });
    try {
      const { user, repos } = await fetchProfile(username, ctrl.signal);
      if (abortRef.current !== ctrl) return;
      setState({ status: "success", user, repos });
      setCelebrating(true);
      const next = addRecentSearch(historyRef.current, user);
      historyRef.current = next;
      setHistory(next);
      try { setStorageAvailable(writeRecentSearches(window.localStorage, next)); }
      catch { setStorageAvailable(false); }
    } catch (e) {
      if ((e as Error).name === "AbortError" || abortRef.current !== ctrl) return;
      const ge = e instanceof GitHubError ? e : new GitHubError("network", "Something unexpected happened. Please try again.");
      setState({ status: "error", error: ge, username });
    }
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    try {
      const items = readRecentSearches(window.localStorage);
      historyRef.current = items;
      setHistory(items);
      const probe = "octoscope:storage-check";
      window.localStorage.setItem(probe, "1");
      window.localStorage.removeItem(probe);
    } catch { setStorageAvailable(false); }
  }, []);
  useEffect(() => {
    if (!celebrating) return;
    const timer = window.setTimeout(() => setCelebrating(false), 3500);
    return () => window.clearTimeout(timer);
  }, [celebrating, state]);
  useEffect(() => { ScrollTrigger.refresh(); }, [state.status]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (state.status === "loading" && state.username === query.trim()) return;
    run(query);
  };

  useGSAP(() => {
    const mm = gsap.matchMedia();
    gsap.to("[data-progress]", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from("[data-atmo]", { opacity: 0, scale: 1.1, duration: 1 })
        .from("[data-nav]", { y: -20, opacity: 0, duration: 0.5 }, "-=0.7")
        .from("[data-hl] span", { yPercent: 110, rotate: 3, duration: 0.8, stagger: 0.09 }, "-=0.5")
        .from("[data-sub]", { y: 16, opacity: 0, duration: 0.5 }, "-=0.4")
        .from("[data-search]", { x: -40, opacity: 0, duration: 0.6 }, "-=0.3")
        .from("[data-hint]", { opacity: 0, duration: 0.4 }, "-=0.2")
        .from("[data-companion-wrap]", { y: 80, opacity: 0, scale: 0.8, duration: 0.9, ease: "back.out(1.6)" }, "-=0.8")
        .from("[data-deco]", { opacity: 0, scale: 0, stagger: 0.08, duration: 0.5, ease: "back.out(2)" }, "-=0.6");

      // hero scroll transformation + parallax
      const hero = { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: true };
      gsap.to("[data-hero-copy]", { y: -80, opacity: 0.3, scrollTrigger: hero });
      gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((el) => {
        gsap.to(el, { yPercent: Number(el.dataset['speed']) * -100, scrollTrigger: hero });
      });

      // section heading reveals with varied patterns
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el, i) => {
        const v = [{ y: 40 }, { x: -40 }, { clipPath: "inset(0 100% 0 0)" }][i % 3];
        gsap.from(el, { ...v, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" } });
      });

      gsap.from("[data-step]", {
        y: 60, rotate: (i) => (i - 1) * 4, opacity: 0, stagger: 0.15, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: "[data-steps]", start: "top 80%", toggleActions: "play none none reverse" },
      });
      gsap.to("[data-foot-layer]", { yPercent: -30, ease: "none", scrollTrigger: { trigger: "[data-steps]", start: "top bottom", end: "bottom top", scrub: true } });
    });

    // pinned storytelling (desktop)
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      const panels = gsap.utils.toArray<HTMLElement>("[data-panel]");
      const visuals = gsap.utils.toArray<HTMLElement>("[data-visual]");
      gsap.set(panels.slice(1), { opacity: 0, y: 60 });
      gsap.set(visuals.slice(1), { opacity: 0, scale: 0.8, rotate: -10 });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: "[data-pin]", start: "top top", end: "+=1800", pin: true, scrub: 0.6 },
      });
      tl.to("[data-story-bar]", { scaleY: 1, ease: "none", duration: 2 }, 0);
      for (let i = 1; i < panels.length; i++) {
        const pp = panels[i - 1], pv = visuals[i - 1], np = panels[i], nv = visuals[i];
        if (!pp || !pv || !np || !nv) continue;
        tl.to(pp, { opacity: 0, y: -60, duration: 0.4 }, i - 0.6)
          .to(pv, { opacity: 0, scale: 1.1, rotate: 10, duration: 0.4 }, i - 0.6)
          .to(np, { opacity: 1, y: 0, duration: 0.4 }, i - 0.3)
          .to(nv, { opacity: 1, scale: 1, rotate: 0, duration: 0.4 }, i - 0.3);
      }
      tl.to("[data-orbit]", { rotate: 180, ease: "none", duration: 2 }, 0);
    });
    return () => mm.revert();
  }, { scope: page });

  return (
    <div ref={page} className="min-h-screen overflow-x-clip bg-background">
      <div data-progress className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left scale-x-0 bg-primary" aria-hidden />

      {/* HERO */}
      <section data-hero className="relative overflow-hidden bg-hero">
        <div data-atmo className="pointer-events-none absolute inset-0 grid-lines" aria-hidden />
        <div data-speed="0.6" data-deco className="pointer-events-none absolute left-[8%] top-[30%] size-3 rounded-full bg-primary" aria-hidden />
        <div data-speed="1.2" data-deco className="pointer-events-none absolute right-[42%] top-[18%] size-16 rounded-2xl border-2 border-primary/40 rotate-12" aria-hidden />
        <div data-speed="0.3" data-deco className="pointer-events-none absolute bottom-[12%] left-[46%] font-mono text-sm text-primary/60" aria-hidden>{"</>"}</div>
        <div data-speed="0.9" data-deco className="pointer-events-none absolute right-[6%] bottom-[20%] size-24 rounded-full bg-accent/60 blur-xl" aria-hidden />

        <nav data-nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <a href="/" className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
            <SearchCompanion mood={mood} compact />
            GitHub Finder
          </a>
          <span className="hidden font-mono text-xs text-muted-foreground sm:block">public GitHub data · no login</span>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-10 md:grid-cols-[1.3fr_1fr] md:pb-36 md:pt-16">
          <div data-hero-copy>
            <h1 data-hl className="font-display text-5xl font-semibold leading-[0.95] tracking-tight text-foreground md:text-7xl">
              {["Every", "developer", "has a story."].map((w, i) => (
                <span key={w} className="block overflow-hidden pb-1"><span className={`inline-block ${i === 2 ? "italic text-primary" : ""}`}>{w}</span></span>
              ))}
            </h1>
            <p data-sub className="mt-6 max-w-md text-lg text-muted-foreground">Search any GitHub username and wander through their profile, repositories and favourite languages.</p>

            <form data-search onSubmit={onSubmit} className="mt-8 max-w-xl" noValidate>
              <label htmlFor="gh-user" className="sr-only">GitHub username</label>
              <div className="flex items-center gap-2 rounded-full border border-border bg-card p-2 pl-5 shadow-card transition focus-within:border-primary focus-within:shadow-glow">
                <span className="font-mono text-muted-foreground">@</span>
                <input
                  id="gh-user" ref={inputRef} value={query} autoComplete="off" spellCheck={false}
                  onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                  onChange={(e) => { setQuery(e.target.value); setFocused(true); setInputError(null); }}
                  placeholder="username"
                  aria-invalid={!!inputError} aria-describedby="gh-hint"
                  className="min-w-0 flex-1 bg-transparent py-2 font-mono text-lg text-foreground outline-none placeholder:text-muted-foreground/60"
                />
                <Button type="submit" disabled={state.status === "loading"} aria-label={state.status === "loading" ? "Searching" : "Explore"}
                  className="group h-12 min-w-12 rounded-full px-3 sm:px-5 hover:bg-secondary">
                  {state.status === "loading" ? <><Loader2 className="size-4 animate-spin" /><span className="hidden sm:inline">Searching</span></> : <><span className="hidden sm:inline">Explore</span><ArrowRight className="size-4 transition group-hover:translate-x-1" /></>}
                </Button>
              </div>
              <div id="gh-hint" data-hint className="mt-3 pl-5 text-sm text-muted-foreground">
                {inputError ? <span className="text-destructive">{inputError}</span> : (
                  <>Try{" "}{EXAMPLES.map((ex, i) => (
                    <span key={ex}><Button variant="link" type="button" onClick={() => { setQuery(ex); run(ex); }} className="h-auto p-0 font-mono">{ex}</Button>{i < EXAMPLES.length - 1 ? ", " : ""}</span>
                  ))}</>
                )}
              </div>
            </form>
            <RecentSearches items={history} storageAvailable={storageAvailable}
              onSearch={(username) => { setQuery(username); run(username); }}
              onClear={() => {
                historyRef.current = []; setHistory([]);
                try { setStorageAvailable(writeRecentSearches(window.localStorage, [])); }
                catch { setStorageAvailable(false); }
              }} />
          </div>
          <div data-companion-wrap className="pt-16">
            <SearchCompanion mood={mood} message={bubble} />
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section ref={resultsRef} className="mx-auto max-w-6xl scroll-mt-6 px-6 py-16" aria-live="polite">
        {state.status === "idle" && (
          <div data-reveal className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Results will appear here once you search for someone.
          </div>
        )}
        {state.status === "loading" && <ProfileSkeleton />}
        {state.status === "error" && (
          <ErrorState error={state.error} onRetry={() => run(state.username)}
            onTryAnother={() => { setQuery(""); setState({ status: "idle" }); window.scrollTo({ top: 0, behavior: "smooth" }); setTimeout(() => inputRef.current?.focus(), 400); }} />
        )}
        {state.status === "success" && (
          <div key={state.user.login} className="space-y-12">
            <ProfileCard user={state.user} repos={state.repos} />
            <div>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <h2 className="font-display text-3xl font-semibold text-foreground">Recently updated repositories</h2>
                <span className="font-mono text-sm text-muted-foreground">{state.repos.length} loaded</span>
              </div>
              <RepoGrid repos={state.repos} login={state.user.login} />
            </div>
          </div>
        )}
      </section>

      {/* PINNED STORY */}
      <section data-pin className="relative bg-deep-gradient text-deep-foreground">
        <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-[auto_1fr_1fr]">
          <div className="relative hidden h-64 w-1 overflow-hidden rounded-full bg-deep-foreground/15 md:block" aria-hidden>
            <div data-story-bar className="absolute inset-0 origin-top scale-y-0 bg-primary" />
          </div>
          <div className="relative grid">
            {STORY.map((s, i) => (
              <div key={s.title} data-panel className="col-start-1 row-start-1 max-md:row-auto max-md:mb-12 md:[grid-area:1/1]">
                <span className="font-mono text-sm text-primary">0{i + 1} / 03</span>
                <h2 className="mt-3 font-display text-4xl font-semibold md:text-6xl">{s.title}</h2>
                <p className="mt-4 max-w-md text-lg text-deep-foreground/75">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="relative hidden aspect-square md:grid">
            <div data-orbit className="absolute inset-6 rounded-full border border-dashed border-primary/40" aria-hidden>
              <span className="absolute -top-1.5 left-1/2 size-3 rounded-full bg-primary" />
            </div>
            {STORY.map((s) => (
              <div key={s.title} data-visual className="grid place-items-center [grid-area:1/1]">
                <div className="grid size-48 place-items-center rounded-[2.5rem] bg-primary text-primary-foreground shadow-glow">
                  <s.icon className="size-20" strokeWidth={1.5} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative overflow-hidden py-28">
        <div data-foot-layer className="pointer-events-none absolute -right-20 top-10 font-display text-[18rem] leading-none text-primary/10" aria-hidden>gh</div>
        <div className="relative mx-auto max-w-6xl px-6">
          <p data-reveal className="font-mono text-sm text-primary">How it works</p>
          <h2 data-reveal className="mt-3 max-w-2xl font-display text-4xl font-semibold text-foreground md:text-5xl">Three steps from a name to a whole body of work.</h2>
          <div data-steps className="mt-14 grid gap-6 md:grid-cols-3">
            {["Enter a GitHub username", "We fetch their public profile & repos", "Explore the developer's public work"].map((t, i) => (
              <div key={t} data-step className="rounded-3xl border border-border bg-card p-8 shadow-card">
                <div className="font-display text-6xl font-semibold text-primary">{i + 1}</div>
                <p className="mt-6 text-lg font-medium text-foreground">{t}</p>
              </div>
            ))}
          </div>
          <p data-reveal className="mt-10 max-w-2xl text-sm text-muted-foreground">
            A note on honesty: GitHub's public profile endpoints don't include daily contribution history, so Octoscope doesn't show a contribution calendar. The language bars above are calculated from the repositories it actually loaded.
          </p>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-base font-semibold text-foreground">Octoscope</span>
          <span>Uses the public GitHub REST API · not affiliated with GitHub.</span>
          <span>© {new Date().getFullYear()} Octoscope</span>
        </div>
      </footer>
    </div>
  );
}
