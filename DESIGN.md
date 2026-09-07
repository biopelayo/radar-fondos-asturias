---
name: "Radar Fondos Asturias"
description: "An evidence-first funding intelligence workspace built as a live official dossier."
colors:
  ground: "#051018"
  rail: "#020d15"
  raised: "#0a161e"
  raised-emphasis: "#0e1d26"
  rule: "#324751"
  rule-soft: "#20323b"
  text-primary: "#dddcd9"
  text-secondary: "#8f999e"
  text-reading: "#c5c7c5"
  signal-acid: "#d0dc2b"
  signal-acid-dim: "#9ca529"
  signal-acid-hover: "#e1eb4c"
  signal-cyan: "#1b92ac"
  signal-amber: "#e3a01e"
  signal-coral: "#d96a4d"
  action-ink: "#061018"
typography:
  view-display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(30px, 4vw, 48px)"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "normal"
  dossier-display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(25px, 2.1vw, 34px)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "0.01em"
  section-title:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.04em"
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "normal"
  label:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "8px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.08em"
  metric:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
rounded:
  square: "0px"
spacing:
  micro: "4px"
  xs: "8px"
  sm: "13px"
  md: "18px"
  lg: "24px"
  xl: "34px"
components:
  button-primary:
    backgroundColor: "{colors.signal-acid}"
    textColor: "{colors.action-ink}"
    typography: "{typography.section-title}"
    rounded: "{rounded.square}"
    padding: "12px"
    height: "71px"
  button-primary-hover:
    backgroundColor: "{colors.signal-acid-hover}"
    textColor: "{colors.action-ink}"
    rounded: "{rounded.square}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.square}"
    padding: "0 9px"
    height: "40px"
  opportunity-selected:
    backgroundColor: "{colors.raised-emphasis}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.square}"
    padding: "12px 10px"
  tab-active:
    backgroundColor: "rgba(208, 220, 43, 0.06)"
    textColor: "{colors.signal-acid}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
    padding: "5px 8px"
    height: "30px"
---

# Design System: Radar Fondos Asturias

## Overview

**Creative North Star: "Gazette Lab / Dossier Workbench"**

Radar Fondos Asturias is an operating surface, not a promotional dashboard. It translates fragmented official notices into the visual language of an evidence room: a dark, ruled workspace where the selected dossier is the largest object, its source is always visible, and the next human-controlled action remains close at hand. The mood is authoritative, ambitious, scientific and financially focused, with enough density for serious daily use and enough hierarchy to stay calm while scanning.

The visual system treats official provenance, eligibility, money, deadlines and blockers as first-class information. Chartreuse creates the decisive thread through the interface; cyan identifies source and system evidence; amber asks for verification; coral identifies risk. Structure comes from aligned columns, 1px rules and tonal planes—not floating cards or decorative depth.

The shipped name is visually presented as “RADAR / FONDOS · ASTURIAS.” Preserve the identity as an operational wordmark rather than turning it into a marketing logo lockup.

**Key Characteristics:**

- A dossier-led desktop workspace with a ranked ledger, central evidence record, action rail and capital pipeline.
- Near-black blue surfaces separated by cool blue-gray rules.
- Compressed, forceful headings; compact humanist body text; monospaced metadata and financial numerals.
- Square controls and hard-edged cells with almost no decorative ornament.
- Explicit source, freshness, demo, eligibility and human-control language at the point of decision.

## Colors

The palette is a near-black institutional field punctuated by a deliberately scarce fluorescent signal system.

### Primary

- **Decision Acid** (`signal-acid`): the main action and selection signal. Use it for money, the selected opportunity, active navigation, confirmed requirements, progress bars and the explicit “Preparar candidatura” action.
- **Dim Decision Acid** (`signal-acid-dim`): the lower-intensity edge for active tabs, notices and secondary interactive emphasis.
- **Decision Acid Hover** (`signal-acid-hover`): the primary-action hover surface only; it should read as a small increase in energy, not a new brand color.

### Secondary

- **Evidence Cyan** (`signal-cyan`): official sources, source references, loading state and information that has been located or externally grounded.
- **Verification Amber** (`signal-amber`): unknown or pending facts, approaching deadlines, partial/stale health and demonstration-data caveats.
- **Blocker Coral** (`signal-coral`): hard eligibility failures, low score bands and urgent deadlines. Reserve it for conditions that materially threaten action.

### Neutral

- **Night Ledger** (`ground`): global page field and pipeline ground.
- **Archive Rail** (`rail`): navigation, bottom navigation, radar field and the deepest structural plane.
- **Dossier Field** (`raised`): restrained hover and secondary plane.
- **Selected Field** (`raised-emphasis`): active row and active navigation background.
- **Structural Rule** (`rule`): primary dividers, control borders and table frames.
- **Quiet Rule** (`rule-soft`): internal row separators, tracks and low-emphasis boundaries.
- **Paper White** (`text-primary`): default text and primary labels.
- **Archive Gray** (`text-secondary`): support copy, labels, secondary values and inactive navigation.
- **Reading Gray** (`text-reading`): longer dossier and blocker prose where softer contrast improves sustained reading.
- **Action Ink** (`action-ink`): dark text and icon color placed on Decision Acid.

**The Rare Acid Rule.** Decision Acid is the interface’s scarce currency. Apply it only to the current choice, money, confirmed fit or an intentional action; a screen full of chartreuse has no hierarchy.

**The Labeled State Rule.** Color is reinforcement, never the whole message. Pair every state hue with text, an icon, a number, a border or a distinct position.

## Typography

**Display Font:** Barlow Condensed, with Arial Narrow and sans-serif fallbacks.  
**Body Font:** Manrope, with system-ui and sans-serif fallbacks.  
**Metadata / Numeric Font:** JetBrains Mono, with monospace fallback.

The combination has three jobs: compressed display type gives long official titles authority without consuming unnecessary width; Manrope keeps explanations legible; JetBrains Mono makes dates, amounts, scores, references and system labels feel measured and comparable. The repository bundles the declared weights through Fontsource, while the CSS fallbacks remain part of the system for resilient rendering.

### Hierarchy

- **View Display** (`view-display`): uppercase page titles on secondary views. Use sparingly and allow the condensed face to carry scale.
- **Dossier Display** (`dossier-display`): the selected opportunity title. It may wrap over many lines; never truncate the title in the central dossier.
- **Section Title** (`section-title`): uppercase headings for summary, fit, requirements, rail groups and pipeline labels.
- **Body** (`body`): plain-language dossier summaries. Smaller UI copy ranges from 9–12px with line-height increased when the text must be read rather than merely scanned.
- **Label** (`label`): uppercase metadata, source labels, table headers and state names. Letter spacing typically ranges from 0.07–0.13em.
- **Metric** (`metric`): money and scoring numerals. Key values expand beyond the base role, including the 55px countdown; retain tabular, monospaced alignment.

**The Three-Voice Rule.** Condensed type names the work, humanist type explains it, and mono type measures or verifies it. Do not swap those responsibilities for decorative variety.

**The Full Dossier Title Rule.** Ledger rows may clamp titles to two lines for scanning, but the selected dossier always reveals the complete official title.

## Layout

The desktop shell begins with a fixed 230px navigation rail and a 76px top bar. The main decision view is a four-part workbench: a left opportunity ledger, a dominant central dossier, a right action rail and a 122px capital pipeline spanning the full width below them. At wide sizes the three upper columns use `minmax(300px, 25%)`, `minmax(460px, 1fr)` and `minmax(270px, 22%)`; the center remains the visual and semantic anchor.

Spacing is compact and cell-based. Repeated increments cluster around 8px for micro-gaps, 13px for dense control and row padding, 18px for panels and 24px for dossier sections. Secondary full-page views use 34px outer padding. Preserve alignment across ruled boundaries: a shared edge is more important than adding breathing room to one isolated component.

### Responsive behavior

- At 1280px and below, the workbench uses approximately 315px / flexible 450px minimum / 275px columns; the four-metric band becomes two columns and the pipeline tightens.
- At 1060px and below, the workbench becomes a document flow: ledger, dossier, then action rail. The action rail uses two columns and the pipeline becomes a three-column grid.
- At 920px and below, the 230px rail becomes a 260px off-canvas drawer with a dark scrim. It moves for 200ms and supports explicit close behavior.
- At 900px and below, tables that require comparison preserve their column widths and scroll horizontally; the radar becomes a single-column plot followed by its reading guide.
- At 620px and below, the ledger becomes a horizontal, snap-aligned selector of 300px cards. The dossier metrics remain a two-column grid, fit reasons stack, requirement rows reflow into label/state plus a full-width evidence line, and the action rail becomes one column. The capital pipeline becomes a horizontal strip.
- At 540px and below, the top bar reduces to 64px, the off-canvas menu is replaced by a fixed 66px five-item bottom navigation, and the compact health label plus manual refresh remain visible. The main shell reserves space for that bottom bar.
- The implementation maintains a 320px minimum canvas. At 200% zoom, preserve the same reflow and scrolling strategies rather than shrinking type or compressing controls further.

**The Dossier-First Rule.** Responsive adaptation may change the ledger and action rail from columns into a sequence, but it must never demote or hide the complete selected dossier.

**The Honest Overflow Rule.** When comparative columns cannot remain legible, keep their meaningful width and allow horizontal scrolling. Never squeeze source, evidence or financial data into unreadable fragments.

## Elevation & Depth

This is a flat, ruled system. Depth comes from `ground`, `rail`, `raised` and `raised-emphasis` planes, plus strong shared borders; cards do not float. The only resting shadow in the shipped interface is a restrained four-pixel translucent halo around the 8px freshness/health indicator. A 62% black scrim separates the open tablet drawer from page content. The top bar uses a nearly opaque version of the ground color, not blur or glass.

**The Ruled-Plane Rule.** Use tonal steps and structural borders to show containment. Do not add drop shadows to panels, tables, dossiers, controls or pipeline stages.

**The Status-Halo Exception.** A soft halo may accompany the tiny health indicator because it communicates live system state; it is not a reusable card-elevation treatment.

## Shapes

The form language is square. Buttons, search fields, tabs, navigation selections, tables, score boxes, notices and identity marks all use zero corner radius. Primary structure uses 1px Structural Rule borders; internal grids use 1px Quiet Rule separators. The selected ledger row uses a 1px inset Decision Acid outline, and active navigation uses a 2px acid edge marker.

Small state marks are also square in the current implementation. Circular meaning comes from line icons such as checks, alerts and radar geometry—not from rounded containers. Lucide icons are normally 14–24px and remain unfilled except where a saved bookmark intentionally fills.

**The Square Means Serious Rule.** Do not round a component to make it feel friendlier. Clarity, copy and spacing carry approachability; geometry carries institutional precision.

## Components

### Navigation and shell

The desktop rail is persistent, dark and vertically organized. Each navigation item is a full-width text button with an 18px icon, a 44px minimum height and a two-pixel left active marker. Hover moves onto Dossier Field; active state moves onto Selected Field and turns the icon acid. The rail terminates in detected capital and data-health blocks so system context stays visible.

On compact mobile, the fixed bottom bar exposes five primary destinations—Mesa, Radar, Expedientes, Fuentes and Perfil. Active state combines acid text/icon, an acid top rule and a raised background, and also exposes `aria-current="page"`.

### Status and top bar

The top bar pairs a two-line breadcrumb with freshness, manual refresh and a private-profile control. Health always has a visible label as well as a colored 8px marker: fresh uses acid, loading uses cyan, and partial or stale uses amber. The profile control collapses to initials on tablet and remains available on mobile.

### Search and filter tabs

Search is a transparent, square field inside a Structural Rule frame, with a muted search icon and 11px text. Type filters are compact mono controls that scroll horizontally when needed. The active filter uses acid text, a dim acid border, a faint acid wash and `aria-pressed="true"`; inactive tabs stay muted rather than disappearing.

### Ranked opportunity ledger

Rows are semantic buttons designed for rapid comparison. A row combines ordinal rank, a two-line-clamped title, issuer, source/type, numeric score and deadline. Hover adds only a faint cyan wash. Selection uses Selected Field plus an inset acid outline and `aria-current`; it does not lift or animate. Score bands use the visible number and border along with acid, amber or coral. Urgent deadlines add coral to explicit deadline copy.

### Dossier

The dossier is the largest surface. Its header pairs issuer and complete title with source and official reference. A ruled four-cell metric band follows with capital, score, deadline and application state. Below it, plain-language summary, fit reasons and the requirement matrix remain in reading order. The content scrolls within its desktop column and becomes ordinary document flow on narrower screens.

Requirement states are always icon-plus-word pairs: `cumple` is acid with a check, `pendiente` and `desconocido` are amber with distinct icons, and `bloqueo` is coral with an alert. Each row also carries its evidence or an explicit missing-evidence phrase.

### Action rail

The rail converts evidence into a controlled next step. It includes a large mono countdown, unresolved blockers, official evidence links, save/source actions and one dominant primary action. Evidence links expose source, label, date and verified/pending icon. The preparation button is a solid acid rectangle with dark type, leading document icon and trailing arrow; hover shifts to Decision Acid Hover. A blocked opportunity disables it with reduced opacity and explanatory copy.

### Secondary buttons and fields

Secondary actions are transparent, square, 40px-minimum controls with a Structural Rule border; hover changes the border to Dim Decision Acid. Profile fields are borderless on the surrounding dark plane, using a single Quiet Rule underline. Labels are uppercase mono above the editable value. Disabled buttons use 48% opacity and a not-allowed cursor.

### Tables, lists and notices

Source, application, deadline and requirement data use shared ruled rows rather than standalone cards. Headers are short uppercase mono labels; primary values remain brighter and usually larger. Privacy and methodology notices use a Dim Decision Acid border, a very faint acid wash and an acid icon without rounding or elevation.

### Capital pipeline

The pipeline is a full-width sequence of stage cells, each showing stage label, count and amount. Arrows bridge the shared borders. The first detected count receives acid emphasis; later empty stages remain visible so absence reads as a real process state. On mobile, fixed-width stages scroll horizontally instead of collapsing.

### Radar

The radar is a secondary exploration view. It uses concentric Structural Rule rings on Archive Rail, with acid as the default point color, cyan for tenders and amber for financing. Point labels display the score, and an adjacent ranked reading guide explains the plot; the visualization never replaces the default dossier workflow.

### Interaction and accessibility

All buttons, links, inputs, textareas and file actions share a 2px acid `:focus-visible` outline with 2px offset. Native semantic controls are retained, table-like structures expose table roles and column headers, decorative icons are hidden from assistive technology, and meaningful icons have labels. Filter selection, current opportunity and current mobile route are announced through ARIA state.

The tablet drawer moves focus to its close button when opened, closes with Escape or the scrim, and returns focus to the menu trigger when appropriate. It is not implemented as a full focus trap, so future work must not claim modal behavior without adding it. Reduced-motion preference collapses transition and animation durations to 0.01ms. Keep controls keyboard operable, maintain visible focus over all color states, and preserve text labels whenever an icon carries consequential meaning.

### Data-state language

Use direct Spanish operational language: “Datos al día,” “Actualizando,” “Actualización parcial” and “Copia local disponible” describe freshness; “Por verificar,” “Sin extraer,” “Pendiente de aportar” and “Consultar la disposición” describe missing evidence; “No iniciada,” “En preparación” and the remaining application stages describe workflow. Demonstration records are explicitly labeled “Datos de demostración,” while live records say “Metadatos oficiales” or “Fuentes oficiales · verificar bases.” Never turn an inferred score or collected amount into a promise of eligibility or award.

Application language must preserve human control. The primary verb is “Preparar,” never “Solicitar automáticamente,” and its supporting line says the expediente is created under the user’s order. Final review, identification, signature and submission remain manual.

**The Evidence Before Action Rule.** Every consequential recommendation keeps source, freshness, requirements and unresolved evidence visible before the preparation control.

**The State Is a Sentence Rule.** If a user could misunderstand the consequence of a color or number, add the words that state what happened, what is unknown or what must happen next.

## Do's and Don'ts

### Do:

- **Do** preserve the ledger → dossier → action-rail sequence on desktop and its equivalent reading order on narrow screens.
- **Do** keep official source, reference, freshness and demonstration status adjacent to the data they qualify.
- **Do** reserve Decision Acid for money, selection, verified fit, active navigation and explicit human-controlled action.
- **Do** use 1px ruled grids and tonal planes to organize dense information.
- **Do** combine state color with a word, icon, value or distinct border treatment.
- **Do** keep full official titles in the dossier even when the ranked ledger clamps them.
- **Do** use horizontal scrolling for comparisons and pipeline stages when reflow would destroy meaning.
- **Do** preserve keyboard focus, reduced-motion behavior, semantic roles and at least a 320px usable canvas.

### Don't:

- **Don't** introduce rounded cards, pill controls, floating panels, glassmorphism, gradients or decorative drop shadows.
- **Don't** spread chartreuse across ordinary copy or low-priority decoration; its rarity creates priority.
- **Don't** represent eligibility, freshness, urgency, verification or score by color alone.
- **Don't** hide unknown values behind reassuring defaults. Say “Por verificar,” “Sin extraer” or the specific evidence still required.
- **Don't** turn the radar into the primary workflow or let visualization displace the official dossier.
- **Don't** truncate the selected official title, provenance or decisive blocker to make a grid neater.
- **Don't** claim automatic submission, guaranteed eligibility, expected award or verified production data when the record does not support it.
- **Don't** add motion for decoration. The shipped system only animates the tablet navigation handoff, and reduced-motion preference must remain authoritative.
