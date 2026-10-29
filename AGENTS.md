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

## Dessert architecture
- Keep avatar poses and companion state priority in browser-safe pure TypeScript (`dessert-state`) so behavior can be tested independently of WebGL.
- Preserve the browser-only dynamic Three.js import and existing local Express API boundary; no server rendering or cloud dependency is needed for the avatar.
- Avatar color roles live in global CSS tokens; dispose scene resources on unmount and respect reduced-motion settings inside the render loop.
- The canvas mount sets `data-scene-ready` after its first frame for browser verification; no public mood override or fabricated AI analysis is exposed.
- Companion chat state is ephemeral browser memory subscribed with useSyncExternalStore; it survives mode navigation, resets on reload or explicit New chat, and atomically claims a greeting once per session without storing private conversations on disk.
- Greeting joint motion is a pure elapsed-time function in dessert-greeting; mood-based joint and finger poses live in browser-safe dessert-gestures. Both modes show the existing articulated character, with restrained Mentor gestures and no Mentor greeting, so behavior is testable without WebGL.
- Companion measures visualViewport height on resize so mobile keyboards do not obscure the composer; compact CSS is scoped to Companion and short viewports, preserving Mentor and desktop layouts.
