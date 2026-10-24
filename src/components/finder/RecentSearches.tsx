import { History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RecentSearch } from "@/lib/recent-searches";

export function RecentSearches({ items, onSearch, onClear, storageAvailable }: {
  items: RecentSearch[];
  onSearch: (username: string) => void;
  onClear: () => void;
  storageAvailable: boolean;
}) {
  return (
    <section aria-label="Recent searches" className="mt-7 max-w-xl border-t border-border pt-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground"><History className="size-4 text-primary" />Recent Searches</h2>
        {items.length > 0 && <Button type="button" variant="ghost" size="icon" onClick={onClear} aria-label="Clear recent searches" title="Clear recent searches" className="size-8 text-muted-foreground"><Trash2 /></Button>}
      </div>
      {items.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item.login.toLowerCase()} className="min-w-0 max-w-full">
              <Button type="button" variant="outline" onClick={() => onSearch(item.login)} aria-label={`Search again for ${item.login}`} title={item.name ?? item.login} className="h-auto max-w-full gap-2 rounded-lg bg-card px-3 py-2">
                <img src={item.avatar_url} alt="" className="size-7 shrink-0 rounded-full object-cover" />
                <span className="min-w-0 text-left"><span className="block truncate font-mono text-xs">@{item.login}</span>{item.name && <span className="block max-w-32 truncate text-xs text-muted-foreground">{item.name}</span>}</span>
              </Button>
            </li>
          ))}
        </ul>
      ) : <p className="mt-3 text-sm text-muted-foreground">No explorers yet. Your next discovery starts here.</p>}
      {!storageAvailable && <p role="status" className="mt-2 text-xs text-muted-foreground">Recent searches are available for this visit, but can’t be saved on this device.</p>}
    </section>
  );
}