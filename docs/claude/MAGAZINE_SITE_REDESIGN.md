# Chronicle Future Magazine and Website Redesign

## Assignment

Act as Chronicle Future's design director and lead frontend developer. Rework the website and publisher-produced magazine into one coherent editorial intelligence system.

Work only on `claude/magazine-site-redesign`. Read and follow the repository's `CLAUDE.md` before making changes. Never push directly to `main`.

## Product Model

Chronicle Future has three presentation layers:

1. Public global intelligence: major world signals, delayed market and commodity prices, and business/economic news.
2. Private location intelligence: authenticated locations, briefs, opportunities, risks, SWOT, and forecasts.
3. Publisher-produced magazine: Chronicle Future creates editions; monthly subscribers read published issues. Subscribers never receive production controls.

Preserve these product boundaries.

## Design Direction

The product should feel like a serious global intelligence publication combined with a precise decision-support tool.

- Editorial, credible, restrained, and information-dense.
- Strong typographic hierarchy influenced by quality financial journalism and modern intelligence reports.
- Preserve the recognizable ink, green, lime, and neutral direction, but formalize it into reusable design tokens.
- Use whitespace, rules, columns, typography, and data visualization deliberately.
- Avoid gradients, decorative blobs, generic SaaS styling, oversized dashboard text, excessive cards, and nested cards.
- Keep the two stacked header tickers: markets/commodities and the news wire.
- Ensure accessible contrast, keyboard operation, visible focus states, and reduced-motion behavior.
- Treat mobile layouts as first-class editorial compositions, not compressed desktop screens.

## Magazine System

Develop a flexible magazine system for weekly and monthly publisher-created editions.

Required surfaces:

- Edition cover with real subject imagery or a deliberate asset slot.
- Table of contents.
- Editor's note.
- Section opener.
- Lead analysis article.
- Standard article.
- Data brief and key-number treatment.
- Pull quote and source-note treatments.
- Opportunity, risk, and geographic SWOT presentations.
- Chart and timeline treatments using existing libraries where appropriate.
- Subscriber reading view.
- Publisher editing and publication controls that are visually distinct from the reader.
- Print and PDF styles with predictable page breaks.

Magazine production belongs only to the owner/publisher. Monthly subscribers may read published issues. One-time brief customers do not receive magazine access.

## Website System

Rework these existing surfaces without breaking their workflows:

- Public global intelligence feed.
- Authentication and account identity.
- Pricing and conversion sections.
- Location workspace.
- Brief archive and location actions.
- Full intelligence brief.
- Magazine library.
- Publisher studio.
- Loading, empty, error, and unavailable-data states.

The public landing screen must remain the usable global intelligence product, not become a conventional marketing page.

## Engineering Boundaries

Do not change, bypass, or weaken:

- Supabase authentication or RLS.
- Stripe pricing, checkout, subscriptions, or entitlements.
- Publisher/subscriber authorization.
- API contracts or production environment variables.
- The production Supabase project.
- The protected `main` branch.

The configured Supabase MCP connection is scoped to the isolated development project and is read-only. Use sanitized fixtures when visual work needs richer sample content.

## Delivery Sequence

1. Audit the existing visual system and document the intended system in the PR description.
2. Establish reusable CSS tokens and shared layout primitives.
3. Redesign the public intelligence feed and global header.
4. Redesign the private workspace and intelligence brief.
5. Build the magazine component system and publisher studio.
6. Verify responsive behavior at 1440px and 390px.
7. Verify print output and page breaks.
8. Resolve browser console errors and accessibility issues.
9. Open a pull request against `main` with screenshots, the Vercel Preview URL, and a security-impact statement.

Keep commits reviewable. Do not merge the pull request.
