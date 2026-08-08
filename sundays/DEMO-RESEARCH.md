# DEMO RESEARCH - sundays

Researched 2026-08-07, retrofit pass (replaces an earlier note in this folder written for a thin
2-photo build).

Business: SUNdays - a surf cafe in the South End of Wrightsville Beach, NC. Phone (910) 256-2011,
email sundayssurfcafewb@gmail.com. Source site: https://sundayssurfcafe.com/ (title tag reads
"Sundays Cafe"). "South End, Wrightsville Beach, NC" is not a guess - it is printed on their own
logo graphic and on multiple pieces of their own merchandise (tote bags, drink cups) across five
different photographed assets in this folder, so it is treated as a confirmed fact, not an
invented specific.

**MID-SESSION COMPLICATION, worth recording.** An automated harvest/build pipeline re-ran on this
exact folder while this retrofit was in progress (new fetch timestamps ~22:01Z vs. the original
~21:12Z pass), overwrote the in-progress index.html with a fresh thin auto-build, and added four
new harvested assets (`site-5.jpg`, `site-6.png`, `site-7.jpg`, `site-8.jpg`) that had not been
seen yet. The rebuild below was redone against the post-regeneration file and asset set so nothing
here is stale.

## SANDBOX NOTE

WebSearch and PowerShell execution are both denied by permissions in this run (confirmed via
repeated attempts, including from a fresh subagent, which received the identical PowerShell
denial). The "WINNERS" list below is drawn from confident general knowledge only, per the task's
own fallback instruction ("otherwise only name sites you're highly confident are real, and say
so"). No URL below was fetched or verified live in this session.

## WINNERS (real surf-cafe / beach-town coffee-and-breakfast references, high confidence)

1. **Java Beach Cafe** - San Francisco, CA (Ocean Beach neighborhood). A well-known coffee shop
   literally at the surf break; the reference point for "coffee shop that is also a surf-town
   institution," which is exactly SUNdays' position at the South End of Wrightsville Beach.
2. **Backyard Bowls** - Honolulu, HI. Acai/coffee bowl chain with strong beach-culture branding;
   directly relevant since SUNdays' own photos show acai-style bowls ("pina colada blue bowl") as
   a real item.
3. **Kai Coffee Hawaii** - Hawaii-based coffee company with island/beach branding across multiple
   locations; reference for warm, sun-forward photography-led design over heavy copy.
4. **Surf Taco** - New Jersey shore towns. A regional beach-town quick-service brand built entirely
   around surf culture and casual counter service; reference for playful, photo-and-merch-forward
   branding (drink names, logo on cups/gear) rather than a formal restaurant site.

## WHAT WE APPLIED

1. **Photo-led hero instead of the no-photo panel treatment.** Both the original and the
   regenerated build used `hero-panel` (no real photo, or a decorative graphic mistaken for a
   logo - see below) because the automated pipeline judged the photo set too thin. With 18 real
   files actually on disk, a photo-led `hero-split` fits a beach cafe far better - matches Java
   Beach Cafe and Kai Coffee Hawaii both leading with a real place/product shot. The hero photo is
   `site-5.jpg`, a genuine sunset surf-lineup shot pulled directly off sundayssurfcafe.com in the
   second harvest pass - stronger and more evocative than the daytime ocean shot used in the first
   draft, so the daytime shot (`482064748_...jpg`) was moved into the gallery instead of dropped.
2. **Gallery expanded from a handful of thin/placeholder entries to 10 real, distinct photos**:
   the shop storefront with the team and the OPEN flag, the branded flag on sand, three real drink
   /food shots with their own printed names (Great White Mocha, Shark Attack Margarita, Fins Up
   Refresher, pina colada blue bowl), the daytime surf lineup, tote-bag merch on the boardwalk and
   laid out together, and the branded apparel.
3. **Services section kept to generic, honest categories** (coffee/espresso, breakfast/bowls,
   frozen drinks/refreshers, beach-adjacent seating) rather than promising a fixed menu or prices -
   the specific drink names seen in the photos are used only as photo captions, where they are
   literally the real sourced text visible in each image, not an invented menu.
4. **CTA changed from a bare "Call" button to "Stop In or Call"** - closer to how Java Beach Cafe
   and Surf Taco invite a walk-in, casual visit rather than a phone-first B2B contact.
5. **No hours or address block added** - neither was harvested, and none of the reference sites
   were used to justify inventing one. A factbox with only phone and email stays honest.
6. **Fixed a mislabeled field**: the "Facebook" row in the contact factbox actually linked to
   their website, not a Facebook page (BUILD-REPORT.json confirms `facebook: null`) - relabeled to
   "Website".
7. **Did NOT use the auto-classifier's choice of `site-7.jpg` as the business logo/brandmark.**
   The regenerated build had wired `site-7.jpg` into both the header brandmark and the OG image -
   viewed directly with the Read tool, it is a thin decorative wave-outline graphic (near-white,
   used as a section divider on the live site), not a wordmark or logo. Reverted the header to the
   text wordmark and pointed the OG/Twitter image at the real hero photo (`site-5.jpg`) instead.

## ASSET DECISIONS (18 files in assets/ after the mid-session re-harvest)

- **Used (12 of 18):** the hero photo (`site-5.jpg`, sunset surf lineup), 10 gallery photos, and
  the SUNdays logo graphic (`305802527_...jpg`) is not placed as a gallery photo (it is a wordmark
  graphic, not a photograph) but its "South End, Wrightsville Beach, NC" text is what grounds the
  location claim in the copy.
- **Deliberately left unused (6 of 18), all for a stated reason:**
  - `site-2.jpg` - a smaller second crop of the exact same flag-on-sand photo as `site-1.jpg`.
    Using both would be padding the gallery with the same shot twice.
  - `site-6.png`, `site-7.jpg`, `site-8.jpg` - all three are decorative wave-shape/line graphics
    (confirmed by direct viewing: solid or outlined pale teal wave shapes on white, 91-97% near-
    white pixel coverage per ASSET-LEDGER.json's own image_metrics, and `site-7.jpg` is explicitly
    tagged `"kind": "graphic"`). These are section-divider design elements from the live site's
    own theme, not photographs of the business, so they do not belong in a "Photos" gallery and
    were not used as a logo either (see point 7 above).
  - `759664875_...jpg` and `761669938_...jpg` - two more tote-bag-on-a-post/palm-tree product
    shots. A third tote photo (`762252388_...jpg`, showing three different colorways together) was
    kept because it is more visually distinct and communicates more (color range) in one frame;
    the other two are close duplicates of the same product-on-foliage composition and would repeat
    the gallery the same way `site-2.jpg` would have.

## WHAT NOT TO COPY

- Padding the gallery with a second crop of the same photo (`site-2.jpg`) or a third near-identical
  tote-bag shot
- Treating a decorative section-divider graphic as the business's logo (what the automated pass
  did with `site-7.jpg`) just because the harvester's "too small" filter let it through
- Inventing hours, an address, or an online-ordering link that was never harvested
- Turning the real drink names seen in photos (e.g. "Shark Attack Margarita") into an invented
  fixed-price menu on the page - they stay as honest photo captions only
