# DEMO SHIP STANDARD - THE AUDIT THAT REPLACES JACOB'S EYES
Written 2026-08-12 after a day in which JACOB personally caught every defect below and Claude
either created it, missed it, or downgraded it.

**BUILD REFUSAL (2026-08-13):** ship-time checks here are not enough. Manufacture must refuse in
`_remote/allowed/autodemo/lib/build-refusal.js` — doctrine `_remote/state/BUILD-REFUSAL-LAW.md`,
forever `_tmp/EVERY-MISTAKE-BUILD-REFUSAL-FOREVER.txt`. An audit finding that is not a build
refusal will reship (Charlotte no-logo + dead tenant).

## WHY THIS EXISTS - THE TWO FAILURES IN MY AUDITING, NAMED
1. **I JUDGED AGAINST THE TICKET, NOT AGAINST "WOULD JACOB SHIP THIS."** Cursor asked me to confirm
   a gap fix; I confirmed the gap and stamped PASS while a caption he had already ordered removed
   sat on the page. The scope of the question is not the scope of the audit.
2. **I HAD A "MINOR" CATEGORY AND HE DOES NOT.** I called a cover-cropped family photo "worth a
   look, not disqualifying" and a meaningless hero "a preference, not a defect." He called both
   unshippable. **There is no minor. There is ship and do-not-ship.**

## THE ONE TEST
**Would Jacob stop scrolling and say "what the fuck"? Then it FAILS.**
Not "is it technically compliant". Not "did the gate pass". Not "was it in scope".

## EVERY ITEM BELOW IS HERE BECAUSE HE CAUGHT IT, NOT BECAUSE WE PREDICTED IT

### A. PHOTOS - the largest category, every one a real shipped defect
- [ ] **No visible caption on ANY photo, on ANY page, in ANY layer** - inline, overlay, figcaption,
      lightbox, aria-live. Removing inline captions did NOT remove lightbox captions. CHECK THE
      LIGHTBOX LAYER SEPARATELY BY OPENING ONE.
- [ ] **alt attribute present, specific, and DIFFERENT per image.** One identical alt on every image
      is a WCAG AA failure. Alt is not a caption - it stays.
- [ ] **Every photo depicts the thing it sits next to.** A tree photo on an irrigation card fails. A
      truck photo under "Customer reviews" fails. A Fourth of July graphic captioned "key
      duplication" fails. A vendor badge under "photographs we have published" fails.
- [ ] **No photo appears twice anywhere on the site.** SHA-256, not filename. One image under three
      service names has shipped.
- [ ] **No identifiable private individual** except the owner's own published photo of himself.
- [ ] **The owner's family photo is FULL, UNCROPPED, and NOT CLICKABLE.** object-fit contain.
- [ ] **If the harvest lacks a photo for a section, PULL DISTINCT STOCK** from `_assets/stock/<family>`
      (18 families, 504 images). NEVER skip the section. NEVER reuse another section's photo.
- [ ] **Jacob HARD 2026-08-13 ~10:59 — section correlate + stock-fill BAD slots.** Harvest floor
      still needs real business photos/reviews for identity. Demo layout MUST swap wrong-trade,
      cross-demo dupes, screenshots/UI chrome, blurry/tiny thumbs, or off-section art with
      copyright-free stock (Pexels DPAPI / `_assets/stock`). About = crew/shop for THAT trade;
      Services = real work for THAT service. Prefer their best shots in hero/gallery. Forever:
      `_tmp/DEMO-SECTION-PHOTO-CORRELATE-STOCK-FILL-FOREVER.txt`. Generator:
      `lib/section-photo-correlate.js` after stock-fill in `generate-from-blank-mold.js`.

### B. THE HERO - a stranger decides here
- [ ] **Reads as the trade in ONE GLANCE.** Wide establishing shot: finished work, a crew, a machine,
      a cut lawn. **NOT a close crop of one object.** A palm trunk with river rock has shipped.
- [ ] **Ranked on THREE terms, not one:** trade visible AND wide AND a quiet band for the type.
      A darkness-only sort picks dark meaningless photos - measured, not theorised.
- [ ] Headline is problem-to-promise, never the business name, never a category.
- [ ] **No panel, plate, card or bubble behind hero type.** Solve with the photo, then a full-bleed
      gradient with no edge, then type treatment. Never a box.
- [ ] Every hero string clears **4.5:1 measured against the real image region**, not a flat colour.
- [ ] Badge and primary CTA BOTH above the fold at 375px.

### C. THE REVIEW BADGE
- [ ] Renders ONLY from a real harvested rating AND count. No count -> no badge. **No placeholder,
      no default 4.9.** An invented rating is a fabricated claim about a real business.
- [ ] Logo, wording and number all name the SAME source. Facebook recommendations are not stars.
- [ ] Real Google/Facebook logo file. Never model-drawn - garbled marks are an AI tell.
- [ ] **Google mark = real G lettermark only** (Jacob FURIOUS 2026-08-12). Colorful circle / stroke-arc fake = FAIL. Machine: `Test-VendlyDemoGoogleMarkReal`. Text-only "Google" OK if no real SVG.
- [ ] **Service photo matches THAT service.** Irrigation = sprinklers/heads/trenching — never watering-can / pot / "nurturing plant". Drainage = pipe/swale/french drain — never scenic house/lawn. Machine: `Test-VendlyDemoPhotoSectionCorrelation` (IRRIGATION_WRONG_SERVICE_PHOTO / DRAINAGE_WRONG_SERVICE_PHOTO).
- [ ] **Review bodies = harvested human text only.** No invent, no duplicates, no mojibake, no em dashes/emoji, no ChatGPT cadence. Empty harvest → omit reviews section. Machine: `Test-VendlyDemoReviewBodies`.

### D. LAYOUT
- [ ] **No dead space anywhere.** AND: dead space that survives every spacing fix is probably NOT
      space - check for a section stuck at opacity:0 waiting on an IntersectionObserver that never
      fires. That cost four failed fixes in one day.
- [ ] Nothing overlaps the sticky bar. "Ask a question" landing on "Request a quote" has shipped.
- [ ] No text clipped, no orphaned word, no heading cut mid-phrase.
- [ ] No sideways scroll. CTA reachable one-handed.

### E. COPY
- [ ] **First person throughout.** "Photos WE published", never "photos THEY published". Mixed person
      in one scroll has shipped repeatedly.
- [ ] **No internal voice.** "We do not invent quote cards" is our generator talking. "(3 of 3)" is a
      build counter. Both have shipped live.
- [ ] **No CMS boilerplate.** "Just another WordPress site" has shipped in an H1.
- [ ] **No unescaped scrape output.** Raw Facebook post text with an HTML anchor has shipped as an H1.
- [ ] **No claim the harvest does not evidence** - no invented licence, insurance, years, response
      time, service area or price. "Licensed and insured" was removed from Skipper for this reason.
- [ ] ONE phone number in OUR copy: +1 774-426-9684. A client's own number on their own demo is
      correct. **RiverTown's 843-251-4307 must never appear elsewhere.**
- [ ] No retired price: 179, 249, 250, 319, 529.
- [ ] No emoji, no em dashes, plain ASCII, never "cheap".
- [ ] Keep the "preview built by Vendly, not an official or affiliated site" banner.

### F. IDENTITY AND PROVENANCE
- [ ] HARVEST.json names THIS business. Two demos shipped built entirely from Parkers' data.
- [ ] The header mark is a MARK, not a photograph. Border-uniformity: real marks 85-97, photos 5-44.
      If there is no usable mark, render the business name as TYPE. A wordmark is honest.
- [ ] Palette derived from THEIR logo, not the source demo's.

### G. THE THINGS THAT ARE NOT ON THE PAGE
- [ ] **The concierge tenant is REGISTERED and answers.** Skipper's chat was dead because his tenant
      404'd. Test it, do not assume it.
- [ ] The demo URL is live, 200, and is the page we meant.
- [ ] **Never sent to this recipient before.** One message per person, ever.

## HOW IT IS RUN - AND WHY IT CANNOT BE ME ALONE
**Every machine-checkable item above becomes a gate.** Captions, duplicate hashes, alt uniqueness,
photo-to-section mapping, retired prices, phone numbers, person consistency, CMS boilerplate,
identity, tenant liveness, once-per-recipient - all of these are code, not judgment.
**Human eyes are the LAST gate, not the only one.** Today the order was inverted: Jacob's eyes were
the first line of defence and that is the failure.
**The audit opens EVERY page and EVERY layer** - home, services, photos, reviews, contact, AND one
photo opened in the lightbox. Not the fold and one scroll.
**No item may be recorded as minor.** If it would make him stop scrolling, it FAILS.

## THE VERIFICATION RULE THAT COST US FOUR PASSES TODAY
**Verify on the RENDERED FRAME, never in the stylesheet or the source.** Four spacing fixes were
confirmed in CSS and changed nothing on screen. A hash proves a file changed, not that it reads
correctly - the family photo hash matched while the lettering still read backwards.


## MACHINE GATES (encoded 2026-08-12 — fail-closed, no "minor")
**VERIFY RULE IN CODE COMMENTS:** rendered frame > stylesheet; hash ≠ correct orientation.

Entrypoint: `_remote/allowed/lib/DemoShipStandardGate.ps1`
- `Test-VendlyDemoShipStandard` / `Assert-VendlyDemoShipStandard`
- `Assert-BodyDemoShipStandardGates` (gmail-send + fb-dm bodies)

Wired: `outreach-send-one.ps1` (after DemoImageGate), `gmail-send-mypc.ps1`, `fb-dm-lean-send.ps1`.

| Check | Function | Notes |
|-------|----------|-------|
| Visible captions + lightbox paint | `Test-VendlyDemoVisibleCaptions` | figcaption/corner/cap.hidden=false/family caption text |
| Alt present/specific/unique | `Test-VendlyDemoAltQuality` | skips aria-hidden, logo marks, empty v-lb-img shell |
| Photo↔section | `Test-VendlyDemoPhotoSectionCorrelation` | irrigation+tree heuristic |
| Hero 3-term (detail crop refuse) | `Test-VendlyDemoHeroRankSignals` | hardscape/trunk lead FAIL |
| Badge honesty | `Test-VendlyDemoBadgeHonesty` | rating without count FAIL |
| Family contain / no lightbox | `Test-VendlyDemoFamilyPhotoRules` | |
| Internal voice / CMS | `Test-VendlyDemoInternalVoice` (DemoVoiceGate) | |
| Concierge tenant | track probe `x-vendly-track-probe` | unknown_tenant FAIL |
| SHA dupes + logo-as-photo | **DemoImageGate** `Assert-VendlyDemoImagesOk` | already wired; not duplicated here |
| Once-per-recipient | outreach journals / FB already-messaged | not reimplemented |
| Pixel pass | `Assert-DemoPixelPassed` | already wired |

No item is "minor". Would Jacob say "what the fuck"? → FAIL.

## SEALY AUTOMOTIVE — JACOB FURIOUS 2026-08-13 ~09:2x (FOREVER)
His verdict is fact. Live: `https://teamvendly1.github.io/vendly-demos/sealy-automotive/`
Pixel frames: `_tmp/pixel-audit/sealy-automotive-0.png` .. `-3.png`
Honest status: `_tmp/GENERATOR-HONEST-STATUS-20260813.txt`

- [ ] **No Skipper / landscaping palette on a non-landscaping trade.** `#334918` (and derived greens) on auto / roofing / locksmith / plumbing = FAIL. Machine: `CLIENT_BRAND_COLOUR` in `Test-VendlyDemoCopyHygiene` + mold `resolveBrandForTrade` / `sanitizeFactsForMold`.
- [ ] **No weak marketing fluff as H1 lede / meta / about.** "A good mechanic." and short good/great/best tags = FAIL. Offer H1 alone does NOT clear LiveDemo quality. Machine: `WEAK_MARKETING_FLUFF` / `WEAK_HERO_LEDE` + `isWeakMarketingFluff` in facts-from-harvest.
- [ ] **Header reads as THIS trade, not a Skipper skin.** White logo plate on forest green for an auto shop = FAIL by eye even if contrast passes.
- [ ] **Photos depict THIS trade's work.** Manor / estate / scenic lawn on an auto explore card = FAIL. Alt that says "crew and job photo" while showing a mansion is a lie.
- [ ] **CLEARED_FOR_EYES is never quoted as a quality pass.** It means machine gates cleared for human attention. Pixel `machine_checks=pass` with `human_verdict=null` is not ship. Jacob's eyes caught what the door missed — that is a broken door, not a soft preference.
- [ ] **Mass-send is NOT authorized while blank mold still ships Skipper-skin clones.** Lovable (free) may help mock; paid Lovable = Jacob card tee only. Lovable does not fix this mold.

READY_TO_MASS_SEND = NO until the above refuses Sealy-class demos without Jacob.

## HYDRO CLEAN BIBLE DELTA — 2026-08-14 (Claude Code, audit-lens addition, not a mold rewrite)
Source: Jacob named `https://lowcountryhydroclean.com/` (~$4k agency build) as the quality bar
2026-08-14 ~00:33 ET. Cursor drove a real browser and wrote
`_tmp/reference-audit/lowcountry-hydro-clean/EYES-NOTES-2026-08-14.md`. Claude's own WebFetch
attempt on the same URL returned **HTTP 403 twice** (bot-protection wall) — this delta is therefore
built entirely from Cursor's live-browser eyes note, not independently re-verified by Claude.
Full findings and the reasoning behind each line: `_tmp/claude-desktop-out/OUT-HYDRO-CLEAN-AUDIT-DELTA-20260814.md`.
These are NEW checkable items only — every item already covered by sections A-G and the machine
gates table above (photo-section match, review honesty, tenant liveness, hero framing, header mark
vs photograph) is deliberately NOT repeated here.

### H. HEADER AND CONTACT PROMINENCE — the Bible does this and our mold-audits do not check it
- [ ] **Phone number sits in a persistent top bar or header, visible before or beside the logo** on
      every viewport — not buried only in the footer or a contact section a stranger has to scroll
      to find. Hydro Clean shows the phone ahead of the logo on every page load.
- [ ] **Every instance of the phone number on the page is a working `tel:` anchor** (click-to-call),
      never plain unlinked text. This is a mobile-usability fact, not a style preference — most
      prospects and most of our own leads open the page on a phone.
- [ ] **The header mark itself is legible and high-contrast at a glance**, independent of whether the
      palette matches the trade. Section F already checks "mark not photograph" and the Sealy
      addendum already checks palette-vs-trade; neither checks whether the mark is actually easy to
      read against its own background. A technically-correct mark that is hard to see on load FAILS.
- [ ] **Every review shown carries an attributable name** (first name + last initial, business name,
      or full name per the harvest) — never a quote presented as anonymous "Customer" when the
      harvest data includes a real name. **Show every review the harvest returned**, not one quote
      standing in for a "block" — Hydro Clean's reviews section reads as dense and human because it
      is not capped down to a single token quote.
- [ ] **Every nav menu item and every on-page CTA button resolves to a real in-page anchor or a real
      page returning 200.** Section G already requires the demo URL itself to be live and correct;
      this extends the same requirement to every internal link and button ON that page — no dead
      `#`, no CTA that scrolls nowhere, no nav item pointing at a section that does not exist.
- [ ] **CTA button copy names the trade's action, never a bare generic verb.** "Request Softwashing" /
      "Book an Estimate" / "Call for a Quote" passes; a CTA that says only "Submit", "Click Here", or
      "Learn More" with no trade or action context FAILS the same "would Jacob say what the fuck"
      test as a boilerplate hero.
- [ ] **Contact section includes a real lead form with at minimum name, phone or email, and a message
      field** — a bare `mailto:` link standing in as the entire contact method FAILS. If the harvest
      supports it, a service-area list (cities/counties served) appears near the form the way Hydro
      Clean lists its service area on the contact section.
- [ ] **Footer repeats the phone number and the service area**, not just legal boilerplate and social
      icons. The footer is a second trust surface, not a place attention goes to die.
