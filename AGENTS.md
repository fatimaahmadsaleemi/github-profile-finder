<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Reuse SearchCompanion's SVG for compact branding and the interactive explorer, with expressions driven by search state and animations scoped and cleaned up through GSAP.
- Keep recent searches in the public-only recent-searches utility using guarded browser storage after hydration; only completed successful requests update history.
- Preserve the existing GitHub data layer and abort-controller identity guard so older requests cannot replace newer results or update history.
- Limit Bun's concurrent package downloads in bunfig.toml to avoid rate-limit bursts while preserving the registry, locked versions, and supply-chain release-age guard.
