// ============================================================
// Game Guide — a field guide to TCG "mystery games" (JP + US).
//
// Plain English: a single, richly-explained reference page a vendor can
// reach from the calculator. It walks through every popular mystery-game
// format in Japan and the United States — what each one is, how it's
// actually played, WHERE the gamble sits, whether the player always walks
// away with something, the legal posture, and (the practical bit) whether
// MysteryCalc can price it and as which game type.
//
// This is static content — a Server Component with no state or data
// fetching. The source taxonomy lives in
// docs/research/japanese-vs-american-mystery-games.md; this page expands
// on it with extra play-detail and vendor-facing notes. Neutral, educational
// framing only — it explains the economics, it doesn't coach anyone to
// exploit players (a hard product rule).
// ============================================================

import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Calculator, Check, Minus, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Game Guide — mystery formats explained",
  description:
    "A plain-English field guide to TCG mystery games — oripa, kuji, fukubukuro, mystery boxes, slabs, walls of sleeves, razzes, box breaks and prize wheels. How each is played, where the gamble sits, the legal posture, and which ones MysteryCalc can price.",
};

// ------------------------------------------------------------
// The "gamble taxonomy" — the spine of the whole guide. Every format's
// risk reduces to one of these. Each gets a color from the brand family so
// the badges read consistently across the page.
// ------------------------------------------------------------
type GambleKind =
  | "value" // you always get something; you bet its value beats the price
  | "tier" // you always win a prize; the gamble is which tier
  | "single" // many pay, one wins, the rest get nothing
  | "skill" // a skill illusion over a programmed payout
  | "goodwill"; // value usually meets/beats price — barely a gamble

const GAMBLE: Record<
  GambleKind,
  { label: string; blurb: string; className: string }
> = {
  value: {
    label: "Value variance",
    blurb:
      "You always receive product — you're betting its market value beats what you paid. The house keeps an edge, so the average pull is worth less than the entry price; you're chasing the rare hit.",
    className:
      "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  },
  tier: {
    label: "Tier",
    blurb:
      "Near-zero risk of getting nothing — every play wins a prize. The gamble is purely its quality: a top-tier chase versus a low-tier consolation.",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  },
  single: {
    label: "Single winner",
    blurb:
      "Many people pay; exactly one wins the item; everyone else gets nothing for their money. This is the bright-line gambling structure — and the legally riskiest.",
    className:
      "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
  },
  skill: {
    label: "Skill illusion",
    blurb:
      "Feels like skill, but the payout is programmed. You're betting your cumulative spend stays below the prize's value against a machine tuned so it usually doesn't.",
    className:
      "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  },
  goodwill: {
    label: "Goodwill / +EV",
    blurb:
      "Barely a gamble: the contents usually meet or beat the price. The variance is in which goods you get, not whether you come out ahead.",
    className: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  },
};

// How a format maps onto MysteryCalc itself — the practical payoff of the page.
type CalcStatus =
  | { kind: "calc"; as: string } // can price it; "as" = the game type to pick
  | { kind: "trivial"; as: string } // priceable, simple math
  | { kind: "deferred" } // on the roadmap, not built
  | { kind: "out" }; // structurally not a fixed-pool game

type Game = {
  name: string;
  native?: string; // Japanese script where relevant
  gamble: GambleKind;
  everyoneWins: "yes" | "no" | "varies";
  tagline: string;
  played: string;
  gambleWhere: string;
  legal?: string;
  calc: CalcStatus;
};

// ------------------------------------------------------------
// JAPANESE FORMATS — the most popular four.
// ------------------------------------------------------------
const JP_GAMES: Game[] = [
  {
    name: "Oripa",
    native: "オリパ — “original pack”",
    gamble: "value",
    everyoneWins: "yes",
    tagline:
      "A shop assembles its own custom mystery pack and sells it at a fixed price. The dominant TCG mystery format in Japan.",
    played:
      "Two eras. Physical: a sealed pack or envelope of N cards. Online (now dominant — Clove/Cloove, DOPA, TCG Republic): you buy points, pull digitally, and watch an animated reveal. The online form added the hooks that define the genre — a finite pool with a live “cards remaining” counter so you watch the odds shift, instant buyback of unwanted pulls into points, “step-up” packs with improving guarantees, and a guaranteed minimum value floor per pull.",
    gambleWhere:
      "Everyone gets cards; you're betting their market value beats the entry price. Expected value sits below entry — the house edge is the whole business model.",
    legal:
      "A legal gray zone in Japan. It survives by being framed as a sale of goods (the cards are the product, not a “prize”), which sidesteps the Premiums Act (景品表示法). Risk rises if it's framed as betting or if ads overpromise. Context: comp-gacha was banned in 2012, the revised Premiums Act took effect Oct 2024, and the Consumer Affairs Agency has signaled crackdowns on fraudulent oripa.",
    calc: { kind: "calc", as: "Oripa" },
  },
  {
    name: "Ichiban Kuji",
    native: "一番くじ",
    gamble: "tier",
    everyoneWins: "yes",
    tagline:
      "A lottery-ticket format where every ticket wins a tiered prize. Pay per draw (~¥700–900).",
    played:
      "Each ticket shows a letter — A, B, C down to lower tiers. Top tiers (A–C) are 1-to-few premium items (figures, plush); lower tiers are towels, keychains, small goods. Exactly one “Last One” prize goes to whoever draws the final ticket, which drives a real meta-game of people buying out the rest of a set once few tickets remain to lock up that last prize. Some campaigns add a mail-in “Double / W chance” second draw.",
    gambleWhere:
      "Tier. You always walk away with a prize — the gamble is its quality, not whether you win.",
    legal:
      "Note for TCG vendors: kuji is mostly merch (figures/plush). TCG-themed kuji exists but isn't primarily a card-pulling game — it's the structural cousin of a prize wheel.",
    calc: { kind: "calc", as: "Kuji" },
  },
  {
    name: "Fukubukuro",
    native: "福袋 — “lucky bag”",
    gamble: "goodwill",
    everyoneWins: "yes",
    tagline:
      "A New-Year seasonal mystery bag — a fixed price for an assortment of goods usually worth more than the price.",
    played:
      "A traditional January ritual. Department-store bags are nearly always +EV (a goodwill / inventory-clearing gesture). Card shops sell card-themed bags too — but a TCG-shop bag skews more toward clearing inventory, so its expected value can be negative and the “win” is getting useful or desirable items rather than guaranteed money.",
    gambleWhere:
      "Lowest on the spectrum. The variance is in which goods you get, not whether you come out ahead. A borderline mystery game at best.",
    calc: { kind: "out" },
  },
  {
    name: "UFO Catcher / crane game",
    native: "クレーンゲーム",
    gamble: "skill",
    everyoneWins: "no",
    tagline:
      "A coin-op claw machine. Pay per play and grab a boxed prize — sealed packs, sometimes slabs or figures.",
    played:
      "Move → aim → drop → carry to the chute. Crucially, claw strength is programmed: the claw only grips firmly after a set number of plays or once a spend threshold is reached, tuning the machine to a target margin. The “skill” you feel is mostly stagecraft over a payout schedule.",
    gambleWhere:
      "A skill illusion over a programmed payout. You're betting your cumulative spend stays below the prize's value, against a machine designed so it usually doesn't.",
    calc: { kind: "out" },
  },
];

// ------------------------------------------------------------
// AMERICAN FORMATS — the most popular six.
// ------------------------------------------------------------
const US_GAMES: Game[] = [
  {
    name: "Mystery Box / Pack / Bag",
    gamble: "value",
    everyoneWins: "yes",
    tagline:
      "A fixed-price sealed product with varying contents — booster packs, singles, sometimes a slab. The closest US analog to physical oripa.",
    played:
      "You buy a sealed box at a set price; the contents vary. Better vendors publish an odds table — e.g. 44/100 land $220–299, 39/100 land $300–399, 14/100 land $400+, and 3/100 hit ~$1,100. That published distribution is exactly what a customer odds sheet formalizes.",
    gambleWhere:
      "Value variance — everyone gets product; you bet its value beats the price.",
    calc: { kind: "calc", as: "Mystery box / pack / bag" },
  },
  {
    name: "Mystery Slab",
    gamble: "value",
    everyoneWins: "yes",
    tagline:
      "A graded card hidden in an opaque slab or box — you don't know the card until it's revealed. A convention staple.",
    played:
      "Often sold as a guaranteed grade (e.g. “guaranteed PSA 10”) but unknown identity, with a top chase worth many multiples of entry. The pool is a stack of slabs; you pick or are dealt one.",
    gambleWhere:
      "Identity and value variance of a known-grade card.",
    legal:
      "2026 development: TPCi banned partnered vendors from selling graded slabs (and items over $1,000, and most Japanese Pokémon Center products) at its sanctioned events, effective May 30, 2026 at Indianapolis Regionals. It applies only to official partnered vendors at TPCi events — not private sales, card shows, LGS, eBay, or Whatnot.",
    calc: { kind: "calc", as: "Mystery slab lot" },
  },
  {
    name: "Wall of Sleeves / Prize Wall",
    gamble: "value",
    everyoneWins: "yes",
    tagline:
      "Hundreds-to-thousands of identical opaque sleeves; the customer picks one. The American storefront cousin of physical oripa.",
    played:
      "Often double-sided black sleeves on a literal wall. Contents range from a few cards, to a voucher (“you won a booster pack / ETB / booster box”), up to a chase card. The vouchers-for-sealed mixed into the pool are what distinguish it from a plain mystery box.",
    gambleWhere:
      "Value variance plus an illusion of agency — you “pick,” but the outcome is random.",
    calc: { kind: "calc", as: "Wall of sleeves / prize wall" },
  },
  {
    name: "Prize Wheel / Plinko",
    gamble: "tier",
    everyoneWins: "yes",
    tagline:
      "An LGS / convention staple. Pay a fixed price (or earn a spin with a minimum purchase) and spin a wheel or drop a Plinko chip into tiered segments.",
    played:
      "Segment size equals probability, so the odds are visible and transparent. Prizes run from a single pack or bulk commons up to an ETB, a slab, or store credit. The closest US analog to kuji — but typically with a much higher chance of a low-value “dud,” so it has a real floor of disappointment kuji lacks.",
    gambleWhere:
      "Transparent fixed-odds tier. The duds are the filler — model them as the low tier of the pool.",
    calc: { kind: "calc", as: "Prize wheel / Plinko" },
  },
  {
    name: "Live Box Breaks",
    gamble: "value",
    everyoneWins: "yes",
    tagline:
      "A seller opens a sealed box, case, or lot live on stream; buyers purchase slots beforehand. A massive, mainstream US category.",
    played:
      "On Whatnot, Twitch, or YouTube, buyers pre-purchase slots — a slot can be a Pokémon type, a specific pack, or (in sports) a team. You receive all cards that fall into your slot. Because everyone gets the cards from their slot, it generally navigates legality the way mystery boxes do.",
    gambleWhere:
      "Value variance on your slice of a single live opening.",
    legal:
      "Deferred in MysteryCalc: random sealed contents need a separate cost-and-pull-value model, not the fixed-pool math the other formats share.",
    calc: { kind: "deferred" },
  },
  {
    name: "Razz / Raffle / “break spots”",
    gamble: "single",
    everyoneWins: "no",
    tagline:
      "A seller lists one item and sells N spots at $X; one buyer wins it, everyone else gets nothing.",
    played:
      "Spots are claimed until the board fills, then a random draw (often a number wheel or RNG) picks the single winner. Structurally distinct from every format above, where everyone receives product.",
    gambleWhere:
      "The bright-line single-winner format — chance + consideration + prize, the classic gambling trifecta.",
    legal:
      "Outlawed in most US states unless charitable or licensed, so it's pushed into private Facebook groups. The legally riskiest mainstream format — yet, paradoxically, a defining one.",
    calc: { kind: "trivial", as: "Razz / raffle" },
  },
];

// The least → most "gambling-like" ordering, for the spectrum strip.
const SPECTRUM: { label: string; sub: string }[] = [
  { label: "Fukubukuro", sub: "often +EV, goodwill" },
  { label: "Kuji · Prize Wheel", sub: "always win a tier" },
  { label: "Oripa · Box · Slab · Wall · Break", sub: "value variance, house edge" },
  { label: "UFO Catcher", sub: "skill illusion + spend" },
  { label: "Razz / Raffle", sub: "one winner, rest lose all" },
];

export default function GuidePage() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      {/* Back to the calculator */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to the calculator
      </Link>

      {/* Hero */}
      <header className="mt-6 mb-12">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="size-4" />
          {APP_NAME} field guide
        </div>
        <h1 className="text-gradient-brand max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          A field guide to mystery games
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Every popular way vendors run a mystery game around Pokémon and TCG
          product — in Japan and the United States. What each format is, how
          it&apos;s actually played, where the gamble sits, the legal posture,
          and which ones you can price right here.
        </p>
      </header>

      {/* The three-way gamble taxonomy — the spine */}
      <section className="mb-14">
        <SectionHeading
          eyebrow="The core idea"
          title="Where exactly is the gamble?"
        >
          Strip away the theatrics and every mystery game&apos;s risk reduces to one
          of a few shapes. This is the single most useful lens — keep it in mind
          and the whole landscape clicks into place.
        </SectionHeading>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {(["value", "tier", "single"] as const).map((k) => (
            <div
              key={k}
              className="rounded-xl border bg-card p-5 ring-1 ring-foreground/5"
            >
              <Badge className={cn("mb-3", GAMBLE[k].className)}>
                {GAMBLE[k].label}
              </Badge>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {GAMBLE[k].blurb}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Two more shapes show up at the edges:{" "}
          <span className="font-medium text-foreground">
            {GAMBLE.skill.label}
          </span>{" "}
          (the claw machine) and{" "}
          <span className="font-medium text-foreground">
            {GAMBLE.goodwill.label}
          </span>{" "}
          (the lucky bag).
        </p>
      </section>

      {/* The gamble-locus spectrum */}
      <section className="mb-14">
        <SectionHeading
          eyebrow="The spectrum"
          title="From a discount with surprise to outright gambling"
        >
          The same formats line up neatly from least to most gambling-like by
          how much the player risks walking away empty-handed.
        </SectionHeading>
        <div className="mt-6 overflow-hidden rounded-2xl border bg-card p-5 ring-1 ring-foreground/5">
          {/* Five-stop ramp (sky → emerald → violet → amber → rose) mirroring
              the least-to-most-gambling ordering. Inline so all five stops
              land precisely — Tailwind only allows one `via-` stop. */}
          <div
            className="h-2.5 w-full rounded-full"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--color-sky-400), var(--color-emerald-400) 30%, var(--color-violet-500) 55%, var(--color-amber-400) 78%, var(--color-rose-500))",
            }}
          />
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {SPECTRUM.map((s, i) => (
              <div key={s.label}>
                <div className="text-xs font-semibold tracking-wide text-muted-foreground">
                  {i === 0
                    ? "LEAST"
                    : i === SPECTRUM.length - 1
                      ? "MOST"
                      : " "}
                </div>
                <div className="mt-1 text-sm font-semibold">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Japanese formats */}
      <section className="mb-14">
        <SectionHeading
          eyebrow="Japan"
          title="The Japanese formats"
          flag="🇯🇵"
        >
          An online, finite-pool, point-economy scene built around oripa and the
          always-win-a-tier kuji.
        </SectionHeading>
        <div className="mt-6 space-y-5">
          {JP_GAMES.map((g) => (
            <GameCard key={g.name} game={g} />
          ))}
        </div>
      </section>

      {/* American formats */}
      <section className="mb-14">
        <SectionHeading eyebrow="United States" title="The American formats" flag="🇺🇸">
          A physical / streaming, social scene where the legally-riskiest
          single-winner razz is, paradoxically, a defining genre.
        </SectionHeading>
        <div className="mt-6 space-y-5">
          {US_GAMES.map((g) => (
            <GameCard key={g.name} game={g} />
          ))}
        </div>
      </section>

      {/* JP vs US */}
      <section className="mb-14">
        <SectionHeading eyebrow="Compared" title="Japan vs. the United States">
          The same hobby, two very different scenes.
        </SectionHeading>
        <div className="mt-6 overflow-hidden rounded-2xl border ring-1 ring-foreground/5">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Dimension</th>
                <th className="px-4 py-3 font-semibold">Japan 🇯🇵</th>
                <th className="px-4 py-3 font-semibold">United States 🇺🇸</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                ["Primary channel", "Heavily online, brand-name platforms", "Convention floor, LGS, social media"],
                ["Transparency", "Finite pool + live “cards remaining” counter; instant point buyback", "Inconsistent — some vendors publish odds, many don't"],
                ["Maturity", "Mature (if legally gray) market", "Fragmented, less standardized, faster-moving"],
                ["“Everyone wins a tier”", "Strong (kuji)", "Weak — only the prize wheel approximates it"],
                ["Single-winner format", "Rare — clashes with oripa's “sale of goods” framing", "A defining sub-genre (razz), despite being illegal in most states"],
                ["Legal posture", "“Sale of goods, not a prize” sidesteps the Premiums Act", "“You always receive product” dodges the gambling trifecta — razzes fail that test"],
              ].map(([dim, jp, us]) => (
                <tr key={dim} className="bg-card align-top">
                  <td className="px-4 py-3 font-medium">{dim}</td>
                  <td className="px-4 py-3 text-muted-foreground">{jp}</td>
                  <td className="px-4 py-3 text-muted-foreground">{us}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Legal caution */}
      <section className="mb-14">
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          <p className="font-semibold">A note on legality</p>
          <p className="mt-1.5">
            This is a gambling-adjacent space and the rules vary by country and
            by US state. Single-winner razzes/raffles are illegal in most US
            states without a charitable or gaming license. The “you always
            receive product of some value” framing is what keeps boxes, walls,
            and breaks on the right side of the line — a razz fails that test.
            None of this is legal advice; check your local rules before running
            anything. {APP_NAME} is a math and disclosure tool, nothing more.
          </p>
        </div>
      </section>

      {/* CTA back to the calculator */}
      <section className="rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-gold/10 p-8 text-center ring-1 ring-foreground/5">
        <h2 className="text-2xl font-bold tracking-tight">
          Ready to price one?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          The calculator handles the whole finite-pool family — build a prize
          pool, solve for price, chances, or margin, and print a fair odds sheet
          for your customers.
        </p>
        <Link
          href="/"
          className="bg-gradient-brand mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 ring-1 ring-white/20 transition-transform hover:-translate-y-0.5"
        >
          <Calculator className="size-4" />
          Open the calculator
        </Link>
      </section>
    </div>
  );
}

// ------------------------------------------------------------
// Presentational sub-components.
// ------------------------------------------------------------

/** A consistent section header: small colored eyebrow, big title, lede. */
function SectionHeading({
  eyebrow,
  title,
  flag,
  children,
}: {
  eyebrow: string;
  title: string;
  flag?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 text-sm font-semibold tracking-wide text-primary uppercase">
        {eyebrow}
      </div>
      <h2 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight sm:text-3xl">
        {flag && <span aria-hidden>{flag}</span>}
        {title}
      </h2>
      {children && (
        <p className="mt-2 max-w-2xl text-muted-foreground">{children}</p>
      )}
    </div>
  );
}

/** One mystery-game format, fully explained. */
function GameCard({ game }: { game: Game }) {
  return (
    <article className="rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold tracking-tight">{game.name}</h3>
          {game.native && (
            <p className="mt-0.5 text-sm text-muted-foreground">{game.native}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={GAMBLE[game.gamble].className}>
            {GAMBLE[game.gamble].label}
          </Badge>
          <EveryoneWins value={game.everyoneWins} />
        </div>
      </div>

      <p className="mt-3 text-[0.95rem] leading-relaxed">{game.tagline}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="How it's played">{game.played}</Field>
        <Field label="Where the gamble is">{game.gambleWhere}</Field>
      </div>

      {game.legal && (
        <div className="mt-4">
          <Field label="Legal / context">{game.legal}</Field>
        </div>
      )}

      <CalcTag status={game.calc} />
    </article>
  );
}

/** A labeled paragraph used inside a game card. */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-foreground/90">
        {children}
      </p>
    </div>
  );
}

/** The "does everyone walk away with something?" chip. */
function EveryoneWins({ value }: { value: Game["everyoneWins"] }) {
  if (value === "no") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-800 dark:bg-rose-950 dark:text-rose-200">
        <Minus className="size-3" />
        May win nothing
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
      <Check className="size-3" />
      {value === "varies" ? "Usually gets something" : "Everyone wins something"}
    </span>
  );
}

/** The practical footer of each card — can MysteryCalc price this, and how? */
function CalcTag({ status }: { status: CalcStatus }) {
  if (status.kind === "out") {
    return (
      <div className="mt-5 border-t pt-4 text-sm text-muted-foreground">
        Not a fixed-pool game —{" "}
        <span className="font-medium text-foreground">out of scope</span> for the
        calculator.
      </div>
    );
  }
  if (status.kind === "deferred") {
    return (
      <div className="mt-5 border-t pt-4 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">On the roadmap</span> —
        needs its own pull-value model, not yet built.
      </div>
    );
  }
  const verb = status.kind === "trivial" ? "Priceable" : "Price it in the calculator";
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4 text-sm">
      <span className="inline-flex items-center gap-1.5 font-medium text-primary">
        <Calculator className="size-4" />
        {verb}
      </span>
      <span className="text-muted-foreground">
        as{" "}
        <Link
          href="/"
          className="font-semibold text-foreground underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
        >
          {status.as}
        </Link>
      </span>
    </div>
  );
}
