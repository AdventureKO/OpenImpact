# OpenImpact demo checklist (≈2 weeks / class presentation)

Use this so the **distinct story** lands in under **3 minutes**: *donors see where dollars went; organizations prove it.*

## Before you present

1. **Fresh install** (or use **Profile → Reset demo seed data**) so demo seeds run — see `utils/hydrateDemoTransparency.js` (bundled posts, **sample incoming donations** for org **Funds** totals, and sample integrity scores for `prj-1` … `prj-3`).
2. **Two accounts ready**: one **Contributor**, one **Organization** (register twice or document passwords).
3. **Know the hero causes**: `prj-1` Clean Water, `prj-2` School Supplies, `prj-3` Reforestation — they ship **pre-loaded transparency posts** on first launch.
4. **Organization accounts** with an empty **My causes** list automatically get **stub entries** for those three ids (marked internally as demo stubs) so **Funds** matches bundled incoming donations without manual setup.

## Script A — Transparency-first (recommended)

| Step | Who | Action |
|------|-----|--------|
| 1 | Contributor | Home → **Browse** → open **Clean Water for Village A** (`prj-1`) → **Transparency feed** — show **stage + allocation** badges on seeded posts. |
| 2 | Contributor | **Track** → expand same cause → **Integrity** stars (demo averages on seeded causes). |
| 3 | Contributor | **Donate** (small amount) to `prj-1` → complete mock payment. |
| 4 | Contributor | **My impact** → pick that donation → **Official updates since my gift** — if empty, tap **Show full transparency feed** (seeded posts are older than “now”; this button is expected). Explain: *live org posts after donation appear here.* |
| 5 | Organization | **My causes** → open cause → post **one new update** with **Purchasing** + **Program** + optional photo — switch back to Contributor **My impact** to show the filtered view working. |

## Script B — Org-led (if you start with org)

| Step | Who | Action |
|------|-----|--------|
| 1 | Organization | **Funds** (bundled `demo-inc-*` rows sum per cause) / **Causes** → show totals and **Post transparency update** (stage + use-of-funds + optional photo). |
| 2 | Contributor | Donate → Track **Simulate next stage (demo)** on the journey bar → explain real product would advance from **org + backend**, not the button. |

## Technical notes (say once if asked)

- Data is **local** (AsyncStorage / SecureStore) — fine for prototype; production needs an API and verified org accounts.
- **`demoTransparencyHydratedVersion`** in storage controls one-time merge of demo JSON; bump **`DEMO_TRANSPARENCY_VERSION`** in `hydrateDemoTransparency.js` after editing bundled data so existing installs pick up changes.
- **Incoming demo rows** use ids prefixed with `demo-inc-` (`data/demoIncomingDonations.json`). **Transparency posts** use ids prefixed with `demo-seed-`. **Reset demo seed data** strips those prefixes and re-hydrates.

## Files worth knowing

| Area | Location |
|------|-----------|
| Demo feeds JSON | `data/demoTransparencyFeeds.json` |
| Demo incoming (Funds) | `data/demoIncomingDonations.json` |
| Hydration & reset | `utils/hydrateDemoTransparency.js` (`resetDemoSeedData`) |
| Reset button | Profile → **Reset demo seed data (rehearsal)** |
| Cause feed UI | `app/org-cause-detail.tsx` |
| My impact | `app/my-impact.tsx` |
