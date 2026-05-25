# VYVE Tier Badge System — Design Spec

## Tier ladder (10 levels max)

Duolingo's naming is good — gemstone progression reads as "premium" naturally and
non-fitness-specific. But their COLOURS are very neon/saturated. VYVE's brand is
darker, more refined, more "evening light" — so we adapt the palette to feel
considered, not gamer-y.

### The 10-tier palette

| Tier | Name      | Base       | Treatment notes                                      |
|------|-----------|------------|------------------------------------------------------|
| 1    | Bronze    | #B07F3A    | Warm matte bronze, simple flat fill                  |
| 2    | Silver    | #B8B9BD    | Cool brushed silver, subtle vertical sheen           |
| 3    | Gold      | #C9A84C    | VYVE brand gold, classic rich treatment              |
| 4    | Sapphire  | #4A6FA8    | Deep blue with inner glow                            |
| 5    | Ruby      | #9B3D4F    | Deep red, jewel-cut feel                             |
| 6    | Emerald   | #2E8262    | Forest green, subtle facet shimmer                   |
| 7    | Amethyst  | #6F4A8E    | Royal purple with shine                              |
| 8    | Pearl     | #E8E4D9    | Cream-white iridescent, opal-like                    |
| 9    | Obsidian  | #1A1F23    | Black volcanic glass with teal-edge glow             |
| 10   | Diamond   | gradient   | Multi-faceted prismatic — most metrics never reach   |

### Treatment principles

- **Materiality shift, not just colour shift.** Bronze feels MATTE. Silver feels
  BRUSHED. Gold feels POLISHED. Sapphire feels JEWEL-CUT. Pearl feels
  IRIDESCENT. Diamond feels PRISMATIC. The CSS uses linear-gradient + radial-
  gradient + inner shadow combinations to create the material feel without SVG
  illustrations.

- **Border + glow scales with tier.** Tier 1 = thin neutral border. Tier 5+ = 
  border picks up the tier accent. Tier 8+ adds an outer glow halo.

- **Size stays consistent.** Every tier badge is 44×44 in the row, 96×96 in the
  modal. Members shouldn't have to interpret "is this one taller than that one?"
  — only colour/material communicates rank.

- **Numeral inside the badge.** Each badge shows the tier number (1-10) inside.
  Optional: at higher tiers (6+) the numeral could be replaced with a small
  brand mark — but for v1 keep numerals everywhere for clarity.

## Locked vs earned vs current

- **Locked tier:** Faint outline only, no fill, no shadow, no glow. Numeral 
  visible but greyed.
- **Current tier (in-progress):** The TIER YOU'RE WORKING TOWARDS shows in full
  colour but with reduced saturation + soft inner glow. Acts as the "you're 
  here" marker.
- **Earned tier:** Full saturation + material treatment + shadow.

## The catalog row uses the CURRENT tier's badge

A member on Tier 4 of "Workouts logged" sees the Sapphire badge in the catalog.
When they cross to Tier 5, the badge transitions to Ruby. That transition IS
the moment. (Push notification + toast + badge update animation.)

## The modal shows ALL tiers

Tapping the row opens a modal with the full 7-tier ladder for that metric.
Each tier shows its badge at full size, its Lewis-approved name + copy, and
either an earned date or a target.
