import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Building2, ExternalLink, GitFork, MapPin, Star, ArrowUpRight, Users, BookMarked, RotateCcw, Clock, WifiOff } from "lucide-react";
import { languageBreakdown, type GHRepo, type GHUser, type GitHubError } from "@/lib/github";
import { Button } from "@/components/ui/button";

export function ProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading profile" className="space-y-8">
      <div className="grid gap-8 rounded-3xl border border-border bg-card p-6 shadow-card md:grid-cols-[180px_1fr] md:p-10">
        <div className="skeleton size-36 rounded-full! md:size-44" />
        <div className="space-y-4">
          <div className="skeleton h-9 w-2/3" />
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-4/5" />
          <div className="grid grid-cols-3 gap-3 pt-4">
            {[0, 1, 2].map((i) => <div key={i} className="skeleton h-20 rounded-2xl!" />)}
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <div className="skeleton h-5 w-1/2" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-3/4" />
            <div className="flex gap-3 pt-2"><div className="skeleton h-4 w-16" /><div className="skeleton h-4 w-10" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-2xl bg-muted p-3 sm:p-4">
      <Icon className="size-4 text-primary" aria-hidden />
      <div data-count={value} className="mt-2 break-all font-display text-base font-semibold text-foreground sm:text-3xl">{value.toLocaleString()}</div>
      <div className="text-[10px] uppercase text-muted-foreground sm:text-xs">{label}</div>
    </div>
  );
}

export function ProfileCard({ user, repos }: { user: GHUser; repos: GHRepo[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const langs = languageBreakdown(repos);
  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from("[data-avatar]", { scale: 0.6, rotate: -10, opacity: 0, duration: 0.7, ease: "back.out(1.8)" })
      .from("[data-pf]", { y: 20, opacity: 0, stagger: 0.07, duration: 0.5 }, "-=0.45");
    ref.current?.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
      const obj = { v: 0 };
      tl.to(obj, { v: Number(el.dataset['count']), duration: 1.1, ease: "power2.out", onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString(); } }, 0.3);
    });
    tl.from("[data-bar]", { scaleX: 0, transformOrigin: "left", stagger: 0.08, duration: 0.8 }, 0.5);
  }, { scope: ref, dependencies: [user.login], revertOnUpdate: true });

  return (
    <div ref={ref} className="grid gap-8 rounded-3xl border border-border bg-card p-6 shadow-card md:grid-cols-[180px_1fr] md:p-10">
      <img data-avatar src={user.avatar_url} alt={`${user.login}'s avatar`} className="size-36 rounded-full border-4 border-accent object-cover md:size-44" />
      <div>
        <h2 data-pf className="font-display text-3xl font-semibold text-foreground md:text-5xl">{user.name ?? user.login}</h2>
        <a data-pf href={user.html_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-mono text-sm text-primary hover:underline">
          @{user.login} <ExternalLink className="size-3.5" />
        </a>
        {user.bio && <p data-pf className="mt-4 max-w-2xl text-muted-foreground">{user.bio}</p>}
        {(user.location || user.company) && (
          <div data-pf className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {user.location && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{user.location}</span>}
            {user.company && <span className="inline-flex items-center gap-1.5"><Building2 className="size-4" />{user.company}</span>}
          </div>
        )}
        <div data-pf className="mt-6 grid grid-cols-3 gap-3">
          <Stat icon={BookMarked} label="Repos" value={user.public_repos} />
          <Stat icon={Users} label="Followers" value={user.followers} />
          <Stat icon={Users} label="Following" value={user.following} />
        </div>
        {langs.length > 0 && (
          <div data-pf className="mt-6">
            <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Languages across their latest {repos.length} public repos</div>
            <div className="space-y-2">
              {langs.map((l) => (
                <div key={l.lang} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 truncate font-mono text-foreground">{l.lang}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div data-bar className="h-full rounded-full bg-primary" style={{ width: `${l.pct}%` }} />
                  </div>
                  <span className="w-10 text-right text-muted-foreground">{l.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <a data-pf href={user.html_url} target="_blank" rel="noreferrer" className="group mt-8 inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-secondary-foreground transition hover:shadow-glow">
          View on GitHub <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>
    </div>
  );
}

const PAGE = 9;

export function RepoGrid({ repos, login }: { repos: GHRepo[]; login: string }) {
  const [shown, setShown] = useState(PAGE);
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cards = gsap.utils.toArray<HTMLElement>("[data-repo]:not([data-in])");
    cards.forEach((c) => c.setAttribute("data-in", ""));
    gsap.from(cards, {
      y: 40, opacity: 0, scale: 0.96, duration: 0.6, ease: "power3.out", stagger: 0.06,
      scrollTrigger: { trigger: ref.current, start: "top 85%" },
    });
  }, { scope: ref, dependencies: [shown, login] });

  if (repos.length === 0)
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
        @{login} doesn't have any public repositories yet.
      </div>
    );

  return (
    <div ref={ref}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {repos.slice(0, shown).map((r) => (
          <a key={r.id} data-repo href={r.html_url} target="_blank" rel="noreferrer"
            className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-card focus-visible:outline-2 focus-visible:outline-ring">
            <div className="flex items-start justify-between gap-3">
              <h3 className="truncate font-mono text-base font-semibold text-foreground">{r.name}</h3>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
            </div>
            <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">{r.description ?? "No description provided."}</p>
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              {r.language && <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary" />{r.language}</span>}
              <span className="inline-flex items-center gap-1"><Star className="size-3.5" />{r.stargazers_count.toLocaleString()}</span>
              <span className="inline-flex items-center gap-1"><GitFork className="size-3.5" />{r.forks_count.toLocaleString()}</span>
              {r.fork && <span className="rounded-full bg-muted px-2 py-0.5">fork</span>}
            </div>
          </a>
        ))}
      </div>
      {shown < repos.length && (
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => setShown((s) => s + PAGE)} className="h-auto rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary">
            Show more ({repos.length - shown} left)
          </Button>
        </div>
      )}
    </div>
  );
}

export function ErrorState({ error, onRetry, onTryAnother }: { error: GitHubError; onRetry: () => void; onTryAnother: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.from(ref.current, { y: 24, opacity: 0, duration: 0.5, ease: "power3.out" });
  }, { dependencies: [error], revertOnUpdate: true });
  const Icon = error.kind === "rate-limit" ? Clock : error.kind === "network" ? WifiOff : RotateCcw;
  return (
    <div ref={ref} role="alert" className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-8 text-center shadow-card">
      <Icon className="mx-auto size-8 text-primary" />
      <h2 className="mt-4 font-display text-2xl font-semibold text-foreground">
        {error.kind === "not-found" ? "GitHub user not found." : error.kind === "rate-limit" ? "Taking a short breather" : "Something went wrong"}
      </h2>
      <p className="mt-2 text-muted-foreground">
        {error.message}
        {error.kind === "rate-limit" && error.resetAt && ` You can search again around ${error.resetAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`}
      </p>
      {error.kind === "not-found" ? (
        <Button onClick={onTryAnother} className="group mt-6 h-auto rounded-full px-6 py-3 transition hover:shadow-glow">
          Try another username <ArrowUpRight className="size-4 transition group-hover:rotate-45" />
        </Button>
      ) : error.kind !== "rate-limit" ? (
        <Button onClick={onRetry} className="mt-6 h-auto rounded-full px-6 py-3 transition hover:shadow-glow">
          <RotateCcw className="size-4" /> Retry
        </Button>
      ) : null}
    </div>
  );
}
