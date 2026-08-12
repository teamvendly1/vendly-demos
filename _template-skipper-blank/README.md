# _template-skipper-blank

The blank mold. Structure from Skipper's build (`small-town-landscaping`), zero of his content.

**SEND=NO. Never ship this folder as a customer demo.**

## What this is

Jacob, 2026-08-12: *"Create a blank template from the ones that I like, preferably Skipper's at this
point because it's had more editing time. Create a blank template from that and make a generator
from that. So that way every new business that we come across, we can generate a demo very fast and
just plug in their own uniqueness to it and send it to them after it passes audit."*

Everybody gets the same layout. Their own colour, logo, words, photos, reviews.

## How to use it

    node C:/VendlyVault/_remote/allowed/autodemo/generate-from-blank-mold.js \
      --facts <facts.json> [--out <dir>] [--dry]

`TEMPLATE.json` is the contract: every token, where it comes from, and what happens when the harvest
does not have it. Read it before writing a facts file.

## The rule this mold exists to enforce

**Unfillable sections skip. They never pad and never invent.**

No rating, the hero badge does not render. No reviews, the reviews page is not written and its nav
link comes out. No before/after pair, that section is cut whole. No service areas, the coverage band
goes. Nothing is ever borrowed from another business to fill a gap.

That is not fastidiousness. `anytime-towing` and `alpha-appliance` were cloned from Parkers and
shipped **Parkers' photos, Parkers' logo, Parkers' city and Parkers' copy** under other businesses'
names, because a clone keeps whatever the source had wherever the new business had nothing. A tow
company advertised "mild biodegradable detergents". This mold carries no content to leak.

## Skipper's directory is read-only

This was built by copying structure out of `small-town-landscaping` and tokenising it. Nothing in
his folder was modified, moved, renamed or deleted, and nothing ever should be. Same for
`rivertown-cooling`, `parkers-pressure-washing`, and every other live demo.

## What is different from the two earlier blanks

`_template-parkers-blank` and `_template-rivertown-blank` tokenised the HTML but **left the source's
photographs and logo in `assets/`** - roughly 8 MB of Parkers' real job photos and
`logo-parkers.png`, identical in both folders. Every asset here is an obvious placeholder named for
its **slot**, never for what a picture happens to show.

Also new here:

- **The hero rating badge is emitted.** The `.hero-rtb` CSS has existed on every build in this
  lineage and `hero-rtb` appeared **zero** times in any HTML. It renders now, and only from a real
  rating.
- **Every gallery photo is a lightbox button.** The photos page - the one page that is all photos -
  had a working lightbox script and not one wrapped image.
- **Sixteen palette values from one brand colour**, derived by lightness and contrast-checked with
  `lib/contrast.js`, so hue and saturation stay theirs and nobody hand-picks hexes.
- **"Licensed and insured" needs a source URL.** It is a legal claim, not a chip.
- **Section markers** (`<!--SECTION:name-->`) so a skipped section is removed whole, never half.

WCAG 2.1 AA is built in and never advertised.
