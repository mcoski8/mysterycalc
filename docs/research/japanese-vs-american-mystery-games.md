# Research 001 — Japanese vs. American TCG "Mystery Games"

> **Status:** COMPLETE — foundational research, reviewed and converged with Gemini (gemini-2.5-pro).
> **Date:** 2026-06-05
> **Purpose:** Map the most popular "mystery game" formats vendors run around Pokémon / TCG product — in Japan and in the United States — including how each is played, *where the gamble sits*, and how the two markets differ. This is the first research deliverable for MysteryCalc and the shared vocabulary every later decision will reference.
> **How this was produced:** Web research (June 2026) synthesized into a framework, then run past Gemini as a domain co-reviewer across two rounds. We converged on the full set below; the one factual dispute (the TPCi event-ban date) was resolved against live 2026 sources. See §7.

---

## 1. What "mystery game" means here

A **mystery game** is any format where a customer pays a **fixed, known price** for an outcome with **unknown contents/value**. The product is the surprise. They sit on a spectrum from "basically a discount sale with surprise" to "outright gambling."

The single most useful lens is **where exactly the gamble is**. Across every format below, the gamble is one of three things:

- **Value variance** — you always *receive something*, but its market value may be far above or (usually) below what you paid. The house keeps an edge.
- **Tier** — you always *win a prize*, but which tier (good vs. junk) is random. Near-zero risk of getting *nothing*.
- **Single-winner** — many people pay; *one* wins the item; everyone else gets nothing for their money. This is the bright-line "real gambling" structure.

Keep this three-way distinction in mind — it's the spine of the whole document and §6 lays every format onto it.

---

## 2. Japanese games (the most popular four)

### 2.1 Oripa (オリパ — "original pack")
**What it is:** A shop assembles its *own* custom mystery pack and sells it at a fixed price; you receive a randomized set of cards. This is the dominant TCG mystery format in Japan.

**How it's played — two eras:**
- **Physical (in-store):** a sealed pack/envelope containing N cards.
- **Online oripa (now dominant** — platforms like Clove/Cloove, DOPA, TCG Republic): you buy **points**, "pull" digitally, and watch an animated reveal. The online form added features the physical one can't have, and these are the heart of its appeal:
  - **Finite pool with a "remaining cards" counter** — the site shows exactly which chase cards are *still left* in the pool, so you can see the odds shifting in real time. (Powerful psychological hook.)
  - **Instant buyback** — convert unwanted pulls back into points immediately instead of having them shipped.
  - **"Step-up" packs** — sequential pulls with improving guarantees as you go.
  - **Guaranteed minimum** rarity/value floor per pull.
  - **"Provably fair" / RNG** claims — note: usually a *marketing* term, not a cryptographically verifiable system. The user is trusting the platform's stated odds.

**Where the gamble is:** **Value variance.** Everyone gets cards; you're betting their market value beats the entry price. Expected value is almost always *below* entry (house edge) — you're chasing the rare hit.

**Legal framing:** A **gray zone** in Japan. It generally survives by being framed as a **sale of goods** — the cards *are* the product, not a "prize/omake" — which sidesteps the **Premiums Act (景品表示法)**. Risk rises if it's framed as betting (**gambling law, 賭博罪**) or if ads lie ("high-value card guaranteed"). Context: **comp-gacha (コンプガチャ) was banned in 2012**; the **revised Premiums Act took effect Oct 2024**; and the **Consumer Affairs Agency has signaled crackdowns on fraudulent oripa**.

### 2.2 Ichiban Kuji (一番くじ) — and the kuji format generally
**What it is:** A lottery-ticket format. You pay per draw (~¥700–900) and **every ticket wins a tiered prize.**

**How it's played:** Each ticket shows a letter (A, B, C … down to lower tiers). Top tiers (A–C) are 1-to-few-quantity premium items (figures, plush); lower tiers are towels, keychains, etc. Exactly **one "Last One" prize** goes to whoever draws the *final* ticket — which drives a real meta-game of people **"buying out the rest"** of a set when few tickets remain to lock up that last prize. Some campaigns add a **"Double/W chance"** mail-in second draw.

**Where the gamble is:** **Tier.** Near-zero risk of getting *nothing* — you always walk away with a prize; the gamble is its quality.

**Note for our scope:** kuji is mostly **merch** (figures/plush). TCG-*themed* kuji exists, but it is **not primarily a card-singles-pulling game** — it's the structural cousin, important to understand but not the core.

### 2.3 Fukubukuro (福袋 — "lucky bag")
**What it is:** A **New-Year seasonal** mystery bag. Fixed price, assortment of goods usually totaling **more** than the price. Card shops sell card-themed fukubukuro.

**Where the gamble is:** **Lowest on the spectrum.** Department-store bags are nearly always **+EV** (a goodwill / inventory-clearing tradition). **TCG-shop bags are more of an inventory-clearing tool** — EV can be negative, and the "win" is getting *useful/desirable* items rather than guaranteed money. The variance is in *which* goods, not whether you come out ahead. A borderline "mystery game."

### 2.4 UFO Catcher / crane (claw) game
**What it is:** A coin-op machine; you pay per play and use a claw to grab a boxed prize (sealed packs, sometimes slabs/figures). SEGA's "UFO Catcher" brand is the generic term in Japan.

**How it's played:** Move → aim → drop → carry to chute. **Crucially, claw strength is programmed** — the claw grips firmly only after a set number of plays / once a spend threshold is reached, tuning the machine to a target margin.

**Where the gamble is:** A **skill *illusion* over a programmed payout.** You're betting your *cumulative spend* stays below the prize's value, against a machine designed so it usually doesn't.

---

## 3. American games (the most popular six)

### A. Mystery Box / Mystery Pack / Mystery Bag
**What it is:** A fixed-price *sealed* product; contents (booster packs, singles, sometimes a slab) vary. **Better vendors publish an odds table** (e.g. 44/100 land $220–299, 39/100 $300–399, 14/100 $400+, 3/100 ~$1100). The closest US analog to **physical oripa**.
**Gamble:** **Value variance** — everyone gets product; you bet its value beats the price.

### B. Mystery Slab
**What it is:** Specifically a **graded card in an opaque slab/box** — you don't know the *card* until revealed. Often "guaranteed PSA 10" *grade* but unknown *identity*, with a top chase worth many multiples of entry. A convention staple.
**Gamble:** **Identity/value variance** of a known-grade card.
**Key 2026 development:** **TPCi banned partnered vendors from selling graded slabs (and items >$1,000, and most Japanese Pokémon Center products) at its sanctioned events**, effective **May 30, 2026 at Indianapolis Regionals**. It applies *only* to official partnered vendors at TPCi events — **not** private sales, unofficial card shows, LGS, eBay, or Whatnot. (See §7 — this was the one point we had to resolve against the live sources.)

### C. Wall of Sleeves / "Prize Wall" / pick-a-sleeve
**What it is:** Hundreds-to-thousands of identical opaque (often double-sided black) sleeves; the customer **chooses one**. Contents range from a few cards, to a **voucher** ("you won a booster pack / ETB / booster box"), to a chase card. The American storefront cousin of physical oripa — distinguished by the **vouchers-for-sealed** mixed into the pool.
**Gamble:** **Value variance + an illusion of agency** — you "pick," but the outcome is random.

### D. Razz / Raffle / "break spots"
**What it is:** A seller lists **one** item, sells N spots at $X; **one** buyer wins it, everyone else gets nothing.
**Gamble:** The **bright-line single-winner** format — chance + consideration + prize, the classic gambling trifecta. **Outlawed in most US states** unless charitable/licensed, so it's pushed into private Facebook groups. Structurally distinct from A/B/C (where everyone receives product).

### E. Live Box Breaks
**What it is:** A seller opens a sealed box/case/lot **live on stream** (Whatnot, Twitch, YouTube). Buyers purchase **"slots"** beforehand — a slot can be a Pokémon type, a specific pack, or (in sports) a team. **You receive all cards that fall into your slot.** A massive, mainstream US category.
**Gamble:** **Value variance on your *slice*** of the product — like a mystery box, but you're buying a piece of a single live opening. Because *everyone gets the cards from their slot*, it generally navigates legality the way mystery boxes do (unlike a razz, where most get nothing).

### F. Prize Wheel / Plinko
**What it is:** An LGS / convention staple. Pay a fixed price (or earn a spin with a minimum purchase, e.g. "$25 spent = one spin") and spin a physical wheel / drop a Plinko chip into tiered prize segments — from a single pack or bulk commons up to an ETB, a slab, or store credit.
**Gamble:** **Transparent fixed-odds tier** (segment size = probability). The **closest US analog to kuji** — but typically with a much higher chance of a low-value "dud," so it has a real floor of disappointment kuji lacks.

---

## 4. US vs. Japan — the core differences

| Dimension | Japan | United States |
|---|---|---|
| **Primary channel** | Heavily **online** (brand-name platforms) | **Convention floor / LGS / social-media** driven |
| **Transparency** | Finite pool + **live "remaining cards" counter**; instant point-buyback | Inconsistent; *some* vendors publish odds tables, many don't |
| **Maturity** | Mature (if legally gray) market with established platforms | Fragmented, less standardized, faster-moving |
| **"Everyone wins a tier" model** | Strong (**kuji**) | Weak — only the **prize wheel** approximates it |
| **Single-winner format** | Rare (clashes with oripa's "sale of goods" framing) | A **defining sub-genre** (razz/raffle), despite being illegal in most states |
| **Legal posture** | "Sale of goods, not a prize" sidesteps the Premiums Act; gambling-law risk if framed as betting | Boxes lean on "you always receive product of some value" to dodge the gambling trifecta; **razzes fail that test** |

**The one-line summary:** Japan's scene is an *online, finite-pool, point-economy* built around oripa and the always-win-a-tier kuji; America's is a *physical/streaming, social* scene where the legally-riskiest single-winner razz format is, paradoxically, a defining genre.

---

## 5. The "gamble-locus" spectrum

From least to most gambling-like:

```
LEAST  ─────────────────────────────────────────────────────────────►  MOST
gamble                                                                  gamble

Fukubukuro   →   Kuji / Prize Wheel   →   Oripa / Mystery Box /    →  UFO Catcher  →  Razz /
(often +EV,      (always win a prize;      Slab / Wall / Box Break    (skill illusion   Raffle
 goodwill)        gamble = tier)           (gamble = value variance,   over programmed   (single
                                            house-edge EV<1)           payout)           winner;
                                                                                         most lose
                                                                                         everything)
```

- **Fukubukuro** — value usually meets/exceeds price; gamble is *which* goods.
- **Kuji / Prize Wheel** — guaranteed a tangible prize; gamble is the *tier* (the wheel adds a real "dud" floor).
- **Oripa / Mystery Box / Slab / Wall / Box Break** — guaranteed *product*, but real value variance with a house edge (EV < 1). The crowded center of the hobby.
- **UFO Catcher** — adds a volatile skill/spend component against a machine tuned to a margin; acquisition cost is unpredictable.
- **Razz / Raffle** — pure chance, zero-sum for the player pool; one winner, everyone else loses their stake. Closest to traditional gambling.

---

## 6. Quick-reference master table

| Game | Market | How it's played | Where the gamble is | Everyone gets something? |
|---|---|---|---|---|
| Oripa | JP | Buy fixed-price custom pack / online point-pull | Value variance | Yes (cards) |
| Ichiban Kuji | JP | Pay per draw, every ticket = tiered prize; "Last One" | Tier | Yes (prize) |
| Fukubukuro | JP | New-Year fixed-price lucky bag | Which goods (often +EV) | Yes (goods) |
| UFO Catcher | JP | Pay per claw play; programmed grip | Skill illusion + spend | No (may win nothing) |
| Mystery Box/Pack/Bag | US | Fixed-price sealed; sometimes published odds | Value variance | Yes (product) |
| Mystery Slab | US | Opaque graded card, known grade/unknown ID | Value variance | Yes (a slab) |
| Wall of Sleeves / Prize Wall | US | Pick one opaque sleeve (cards or voucher) | Value variance + fake agency | Yes (cards/voucher) |
| Razz / Raffle | US | N spots, one winner | **Single-winner** | **No (most lose all)** |
| Live Box Breaks | US | Buy a slot of a live-opened box/case | Value variance on your slice | Yes (your slot's cards) |
| Prize Wheel / Plinko | US | Spin/drop for a tiered prize | Transparent fixed-odds tier | Yes (a prize, incl. duds) |

---

## 7. Points of consensus & the one resolved disagreement

**Converged with Gemini on:** the full format list above (Gemini's two additions — **Live Box Breaks** and **Prize Wheels/Plinko** — were accepted and incorporated); the mechanics of each; the three-way gamble taxonomy; and the gamble-locus ordering. Gemini explicitly confirmed the set is "complete and accurate for the most popular, distinct archetypes" with no further omission it would insist on.

**Refinements Gemini contributed:** "provably fair" in online oripa is usually marketing, not verifiable crypto; the kuji **"buy out the rest"** meta-game for the Last One prize; and that **TCG-shop fukubukuro skews to inventory-clearing** (EV can be negative) vs. nearly-always-+EV department-store bags.

**Resolved disagreement — the TPCi ban date.** Gemini initially placed the graded-slab event ban in the 2024-25 season. Live June-2026 sources (PokeBeach, Dexerto, GameRant, Deltia's) all date it to **May 30, 2026, Indianapolis Regionals** — newer than Gemini's training cutoff. Gemini reviewed the sources and conceded; **we treat May 30, 2026 as authoritative.**

---

## 8. Implications for MysteryCalc (open threads for our discussion)

This research is descriptive; it doesn't decide the product. But it surfaces the questions our next discussion should answer:

- **"Calc" of what?** The recurring quantitative spine across *every* format above is **expected value vs. entry price** (the house edge), and — for finite-pool formats (online oripa, kuji, wall, prize wheel) — **odds that shift as the pool depletes.** A calculator that tells a buyer the EV / "is this -EV and by how much" / "what are the live odds given X cards remaining" is the obvious through-line.
- **Which formats are in scope?** The finite-pool, published-or-inferable-odds formats (oripa, mystery box with odds, wall, prize wheel, kuji) are *calculable*. Razz EV is trivially (stake × N) vs. one prize. Claw and unpublished-odds boxes are *not* cleanly calculable — a boundary we should set deliberately.
- **JP vs US framing.** The "remaining cards counter" culture in Japan is exactly the data a calculator consumes; the US scene's inconsistent odds disclosure is exactly the gap a calculator could fill.
- **Legal/tone caution:** this is a gambling-adjacent space. Whatever MysteryCalc is, we should decide early how it positions itself (neutral analysis tool vs. anything that could read as promoting gambling).

---

## 9. Sources

- Oripa basics & platforms: [Clove Mystery Packs](https://oripa.clove.jp/en/oripa/All), [TCG Republic — Oripa list](https://tcgrepublic.com/category/subcategory_page_9842.html), [QuickTCG — Oripa](https://quicktcg.com/pages/oripa)
- Oripa legality (JP): [オリパは違法？(type-n.com)](https://type-n.com/oripa-illegality/), [Comp Gacha / Premiums Act — Monolith Law](https://monolith.law/en/general-corporate/game-random-complete-illegal), [Loot Boxes in Japan — Lexology](https://www.lexology.com/library/detail.aspx?g=9207df10-a8a2-4f67-81c3-6a148a6100e2), [Gambling in Japan — Wikipedia](https://en.wikipedia.org/wiki/Gambling_in_Japan)
- Ichiban Kuji: [KUJIconnect](https://www.kujiconnect.com/ichiban-kuji), [How an Ichiban Kuji works — JumpIchiban](https://jumpichiban.com/en-us/blogs/infos/comment-fonctionne-une-loterie-ichiban-kuji), [Anime Yokocho guide](https://www.animeyokocho.com/articles/ichiban-kuji-guide-japan)
- Fukubukuro: [Tokyo Weekender lucky-bag guide](https://www.tokyoweekender.com/japan-life/japanese-lucky-bag-fukubukuro-shopping-guide-2026/), [KawaiiBox — Fukubukuro](https://www.kawaiibox.com/blogs/japan/fukubukuro)
- UFO Catcher / claw: [Claw machine — Wikipedia](https://en.wikipedia.org/wiki/Claw_machine), [Japanese claw machines — Lifun](https://lifunarcadegame.com/japanese-claw-machine/)
- US mystery slabs/boxes: [MysteryPokeSlabs](https://mysterypokeslabs.com/), [PokePrize](https://pokeprizemystery.com/products/pokeprize-mystery-slab), [Multiverse Mystery Slabs](https://multiversecomicbox.com/pokemon-mystery-slabs/)
- US razz/raffle legality & box breaks: [Razzing/Razzes/Raffles — Mike Kaminski (Medium)](https://medium.com/@authenticmemorabiliacompany/razzing-razzes-raffles-what-they-are-and-why-you-should-avoid-them-a025b0974821), [Legality of Box Breaks Q&A — Cardboard Connection](https://www.cardboardconnection.com/qa-legality-box-breaks-sweepstakes-law-blogs-dale-joerling), [Raffles vs Sweepstakes — RallyUp](https://rallyup.com/learn/understand-raffles-vs-sweepstakes/)
- TPCi 2026 event ban: [PokeBeach (2026-05)](https://www.pokebeach.com/2026/05/tpci-has-banned-sales-of-graded-slabs-and-pokemon-center-products-at-events), [Dexerto](https://www.dexerto.com/gaming/pokemon-reportedly-bans-graded-slabs-from-official-events-in-major-scalper-crackdown-3369803/), [GameRant](https://gamerant.com/pokemon-tcg-graded-slab-event-ban/), [Deltia's Gaming](https://deltiasgaming.com/graded-slabs-and-japanese-pokemon-center-products-banned-at-tpci-events/)

---

*Co-reviewed with Gemini (gemini-2.5-pro) via the `pal` MCP, two rounds, on 2026-06-05. Convergence reached; see §7.*
