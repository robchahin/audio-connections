# ADR 0001 — Derived day numbers and a maintainer-owned schedule

- **Status:** Proposed
- **Date:** 2026-05-29
- **Deciders:** Rob Chahin (maintainer)
- **Supersedes:** the implicit "author sets `day` + `date` + `releaseAt` per file" convention

> Assumptions made while drafting (flag if wrong): ADRs live under `docs/adr/`;
> the schedule is a TypeScript module (maintainer-only, not contributor-facing);
> the schedule is a single full-history list with a frozen released prefix
> (alternative — a separate frozen ledger for the past — is noted in
> [Alternatives](#alternatives-considered)).

---

## Context

### How puzzles are authored today

> **Historical (describes the pre-ADR state this decision replaced).** This is
> the model as it was before this ADR shipped; for current authoring see
> PUZZLE_AUTHORS.md.

Each puzzle is one file, `src/puzzles/day-N.ts`, exporting a `Puzzle`:

```ts
{ day: 34, date: '2026-06-30', author: 'Thomas Ptacek',
  releaseAt: '2026-06-30T00:00:00Z', themes: [ /* 4 × 4 */ ] }
```

The loader (`src/puzzles.ts`) globs `day-*.ts`, asserts `day` matches the
filename number, asserts `day` is unique, and sorts by `day`. The picker
(`src/components/DayPicker.tsx`) renders **in `day` order** in every sort mode;
lock state comes from `releaseAt` via `isReleased`. The save system
(`src/storage.ts`) keys localStorage by the number: `audio-connections:day:34`.

### The problem

A contributor must keep the **same fact stored in three-to-four places**, all
mutually consistent, against PRs they cannot see:

| Fact | Stored in |
| --- | --- |
| Identity / order | the filename `day-34.ts` **and** the `day: 34` field (loader throws if they disagree) |
| Schedule | `date: '2026-06-30'` **and** `releaseAt: '2026-06-30T00:00:00Z'` (same date, twice) |

Worse, two independent **monotonic sequences** — the day *number* and the
calendar *date* — are hand-maintained with nothing enforcing they move
together. With multiple contributors opening PRs in parallel, collisions and
inversions are the default outcome, not a slip.

**Observed symptom (the trigger for this ADR).** Merged/open puzzles:

| Day | Date | Author |
| --- | --- | --- |
| 33 | Jun 12 | Frank Arana |
| 34 | Jun 30 | Thomas Ptacek (wanted a specific date) |
| 35 | Jun 14 | Frank Arana |
| 36 | Jun 15 | Thomas Ptacek |
| 37 (PR) | Jun 16 | — |
| 38 (PR) | Jun 13 | Bojan (trying to fill the gap) |
| 39 (PR) | Jun 17 | — |

Day 34 is numbered *before* 35/36 but dated *after* them. Because the picker
orders by number and `hideFutureLocked`/`Countdown` surface the
**lowest-numbered locked day**, the UI points players at day 34 / Jun 30 while
35 and 36 silently unlock two weeks earlier, and the archive shows a locked
day 34 wedged between unlocked neighbours. PR 38 ("fill the gap") makes it worse
by claiming a number after 37/39 but a date before all of them.

### Root cause

**The day number is _authored_ when it should be _derived_.** Number, order,
identity and schedule are conflated into one hand-set value. If the number were
computed from the schedule, picker-order and unlock-order could never disagree —
that invariant is exactly what is being violated.

### Historical note (why the seams are here)

Puzzles began as a single file extended by one author; `day` was just the array
index and `date` a label beside it. When the door opened to PRs, the file was
split one-per-day to let authors write in parallel without content conflicts.
That split solved **content** collisions but **copied the single-author counter
into every file and added a third copy (the filename)**. The shared sequence
never went away — it got smeared across N files where it is *harder* to keep
consistent. This ADR finishes the split: content goes in per-author files; the
one genuinely-global decision (order + dates) goes back into one owned place.

---

## Decision

Three principles:

1. **Derive the day number.** It is never authored or stored. It is the
   chronological rank of a puzzle's resolved release date.
2. **Decouple identity from position.** The save key / identity is a stable
   **slug** (the filename), independent of number and date.
3. **Make the schedule a separate, maintainer-owned artifact.** A contributor's
   PR carries *content only* and claims no global slot. Ordering and dates live
   in one list that one person edits, serially.

### 1. Puzzle files become content-only

```ts
// src/puzzles/tqbf-2.ts
import type { PuzzleContent } from '../types';

const puzzle: PuzzleContent = {
  author: 'Thomas Ptacek',
  // constraint?: '...'   // optional, unchanged
  themes: [ /* 4 × 4 — four *independent* categories, the normal case */ ],
};
export default puzzle;
```

- **No `day`, no `date`, no `releaseAt`.** Each was a duplicate of either the
  filename or the other date field.
- **`author` stays a content field** — never derived from filename or git
  committer (committer ≠ author; display names carry spaces/punctuation a
  filename can't).
- **The filename is the slug, and the slug is the identity.** One source of
  truth; the loader keys off it directly.

### 2. Slug naming scheme

`src/puzzles/<author-handle>-<disambiguator>.ts`. The default disambiguator is a
**per-author counter**, because a normal puzzle has no single subject to name —
it is four *independent* categories. e.g. `tqbf-1.ts`, `tqbf-2.ts`, `farana-1.ts`.

> **Why not name after a category?** A typical day's four categories are
> unrelated ("Songs About Women" / "Drugs" / "Covers" / "Ringo Sings"), so there
> is nothing to promote to the filename — picking one would misrepresent the
> file. The counter carries no meaning beyond uniqueness within the handle.

A **descriptive** disambiguator is allowed only for the rare genuinely-*themed*
day (the puzzle-wide `constraint` is set — e.g. an all-Beatles puzzle):
`tqbf-beatles.ts`. This is the exception, not the pattern.

- **The counter is an arbitrary per-author disambiguator**, not a sequence with
  meaning. It need not be gap-free, need not match the author's history (a
  released `day-N` file by the same author is untouched), need not match the day
  number. `farana-1` / `farana-2` just have to differ from each other.
- **Author prefix makes uniqueness a _local_ property.** A contributor only
  increments their *own* counter — verifiable from their own files, with zero
  knowledge of in-flight PRs. (Same "no global coordination" property the content
  split bought, extended to identity.)
- **Collisions are loud and early.** Two identical slugs = two PRs adding the
  same filename = a git conflict at merge, not a silent shipped duplicate.
- **Format check** (cheap regex in the existing validate step):
  `^[a-z0-9]+(-[a-z0-9]+)+\.ts$`.
- **Rename only before release.** The slug is the save key; renaming a
  *released* puzzle orphans player progress. Before scheduling, no saves exist,
  so renames are free.
- **The handle is never parsed for display** — it is purely a namespace device.
- Author handles: convention, documented in `PUZZLE_AUTHORS.md` (no enforced
  registry).

### 3. The schedule

A single maintainer-owned module:

```ts
// src/schedule.ts
export const LAUNCH_EPOCH = '2026-05-10'; // day 1's date (anchor)

export type ScheduleEntry = string | { slug: string; date: string };

export const schedule: ScheduleEntry[] = [
  { slug: 'day-1', date: '2026-05-10' },
  { slug: 'day-2', date: '2026-05-11' },
  /* … released prefix, kept as day-N ids … */
  // ── cutover ──
  { slug: 'farana-1', date: '2026-06-03' },
  { slug: 'farana-2', date: '2026-06-11' },
  { slug: 'tqbf-1', date: '2026-06-13' },
  // … backlog gets slotted here, in separate scheduling commits …
  { slug: 'tqbf-2', date: '2026-06-30' }, // held date (out-of-band request)
];
```

- **Calendar membership is authored; numbers are derived** from it.
- The resolver still supports a bare `'slug'` compact form for auto-dated test
  fixtures and historical migrations, but the live schedule is intentionally
  fully date-explicit so maintainers do not need to infer dates from
  `LAUNCH_EPOCH`, list length, and any held dates.
- `{ slug, date }` pins a specific calendar day. Multiple pinned rows may share
  one date when the maintainer intentionally ships two puzzles on the same day.
- **Membership in this list is what makes a puzzle live.** A file present in
  `src/puzzles/` but absent from the schedule is valid and simply does not
  appear — this is the **backlog / parking lot** (see Workflow & Reshuffling).

### 4. Derivation (the resolver)

A pure function `resolve(schedule, files) -> ResolvedPuzzle[]`, run at
build/runtime, **never writing back to files**. Rules:

1. **Reserve** every pinned date.
2. Walk the list; assign each entry
   `date = explicitDate ?? previousResolvedDate + 1 day`, skipping any reserved
   pin date so auto-dates never collide.
3. **Day number = rank by `(resolvedDate, schedule-list-index)`.** The
   list-index tiebreak makes ties well-defined, which is what allows two puzzles
   on one date (see below).

It must be **pure over the committed schedule** (reproducible on every build) —
so it may **not** read the wall clock. Anything calendar-relative (a pause, a
runway check) is either *recorded as data* (a pin) or lives in *CI*, never in
the resolver.

```ts
interface ResolvedPuzzle {
  slug: string;        // identity / save key
  day: number;         // derived display number
  releaseAt: string;   // derived ISO timestamp
  content: PuzzleContent;
}
```

---

## Semantics

### Missing days / pauses

Day numbers are **dense over puzzles, not over the calendar**. A 3-day pause
never skips a number — the next puzzle is still day N+1; only its *date* jumps:

```
day 30 → Jun 8     (ships)
          Jun 9,10 — nothing scheduled
day 31 → Jun 11    (+1 in number, +3 on the calendar)
```

Because the resolver can't see wall-clock, **a pause is expressed by pinning the
resuming entry's date**; `prev + 1` re-anchors from there. The failure mode to
prevent — a resumed puzzle auto-dating into the *past* and releasing instantly /
dumping catch-up puzzles — is blocked by a CI guard (below), not by the
resolver.

### Two puzzles on one date

Supported with no schema change: give two entries the same resolved date (an
explicit `date` equal to the predecessor's). The `(date, list-index)` tiebreak
gives them **consecutive, unique day numbers sharing one `releaseAt`** (day 40
and 41 both unlock Jun 20). Identity/navigation stay 1:1; only the date collides.

### Empty queue ("no future puzzles")

Falls out of defining **"today" = the latest _released_ puzzle** (highest rank
with `releaseAt ≤ now`) rather than "the puzzle dated today." The latest stays
"today" and persists until a new one is added; `Countdown` already no-ops when
there is no next entry. This definition also degrades cleanly through gaps and
two-per-day dates. **Action:** confirm/adjust how `todayDay` is derived in
`App.tsx` to match this.

---

## Workflow (chosen: scheduling is a separate, deliberate step)

**Merging and scheduling are distinct acts, possibly by different people at
different times.** Merging a content PR is an *isolated correctness* decision
(does this puzzle stand on its own — valid shape, playable tracks?) and any
reviewer can make it. Scheduling is a *queue-placement* decision (where does
this slot in without clashing with anything recent?) and belongs to whoever is
arranging the queue. Today these are fused; separating them is the point.

**Contributor PR**
- Adds exactly one file: `src/puzzles/<slug>.ts`, content only.
- Touches nothing shared → cannot conflict with another in-flight content PR.
- Carries **no number and no date**.
- CI validates puzzle shape + iTunes track resolution.
- On merge the puzzle joins the **backlog** (present in the dir, absent from the
  schedule) — accepted but not yet live.

**Scheduling (maintainer, separate commit)**
- When arranging the queue, add dated rows to `src/schedule.ts`.
- This commit is the *only* place a number/date comes into existence.
- Decouples *acceptance* from *scheduling*: good puzzles can sit in the backlog
  indefinitely; a busy week delays scheduling, not merging.

---

## Backlog depth vs schedule depth (the real win)

Today the queue is dated ~2 weeks out, and *that depth is itself the problem*:
with two weeks of committed-but-unreleased puzzles, a new submission is hard to
place without clashing with something already locked into that window —
contributors must author *around* a large fixed schedule.

The fix is to recognise that **backlog depth and schedule depth are different
things.** Unscheduled submissions accumulate into an arbitrarily deep **backlog**
(more content is good); the **committed schedule frontier stays shallow** (a few
days to ~2 weeks). You then *slot* puzzles from the deep backlog into the shallow
frontier as appropriate. A big pile of accepted-but-unscheduled puzzles is an
asset, not a scheduling burden, precisely because nothing about a backlog puzzle
is committed until it's placed.

This makes **conflict handling a placement concern, not a uniqueness rule.**
Conflicts (shared artist / track / theme) are *not permanent* — the same artist
can recur — they just **want to be spaced as far apart as possible.** So the
tooling is a *distance-maximising slotting aid*, not a binary reject:

> Given a backlog puzzle, find the schedule position that **maximises the gap**
> to the nearest already-scheduled puzzle sharing a track id, artist, or
> near-duplicate theme.

That promotes the old "adjacency conflict lint" from a Phase-3 warning to a
**Phase-2 workflow tool** — it's the mechanism that turns "a pile of puzzles"
into "the next good day."

## Reshuffling future puzzles

Reshuffles ("a song was pulled from iTunes", "two themes clash, space them out",
"push the tail back a day") stay schedule-only edits. After the backlog split,
the live schedule can be kept shallow, so the maintainability trade-off flips:
explicit dates are worth the small extra editing cost because a maintainer can
read the calendar directly instead of deriving dates from `LAUNCH_EPOCH`, list
length, and held-date pins.

Supporting changes, by phase:

- **Parking lot (Phase 1, part of core).** Dir-presence ≠ scheduled. Pull a
  puzzle whose song died by removing its slug from the schedule; the file stays
  for later repair; later dated rows can be adjusted deliberately if needed. No deletion, no
  renumbering.
- **`schedule:preview` dry-run (Phase 1).** Print the resolved table
  (`slug → day → date`) plus warnings, so a reshuffle is *visible before
  commit*. Trivial given a pure resolver; becomes the tool you live in.
- **Conflict-aware slotting (Phase 2).** See [Backlog depth vs schedule
  depth](#backlog-depth-vs-schedule-depth-the-real-win). The slotting aid both
  *reports* adjacency conflicts (repeated track id / artist / near-duplicate
  theme within a K-day window) over the resolved schedule **and** suggests the
  gap-maximising placement for a backlog puzzle. It should also be able to scan
  the *backlog itself* so a maintainer can see what's available to slot.
- **Continuous iTunes re-check (Phase 3).** A song can die *after* merge but
  *before* release. A scheduled job re-validates the committed frontier
  (the **next ~14–21 days** of *scheduled* puzzles, matching the current ~2 week
  runway) and alerts on any dead track, giving lead time to reshuffle. (Today's
  iTunes check is PR-time + a post-merge sweep only.) Backlog puzzles are
  re-checked when slotted, not continuously.

None of these need a new data concept (no `disabled` flag, no per-puzzle
reshuffle metadata) — they are all consequences of "schedule is a separate owned
list + derivation is a pure, previewable, lintable function".

---

## CI / validation

The resolver derives; **CI validates and never writes**. CI *may* read the wall
clock (it is a check, not the derivation):

1. Every scheduled slug has a file; report files in neither schedule nor a
   recognised backlog state (orphan detection).
2. No accidental date collisions; shared dates are allowed only when every entry
   on that date is explicit, which records an intentional two-puzzle day.
3. **Frozen released prefix:** for every already-released puzzle, derived
   `day` and `releaseAt` equal its historical values (guards live save keys at
   cutover).
4. **No past/instant release:** the earliest not-yet-released puzzle's resolved
   date ≥ deploy date — fail with "pin the resume date" otherwise.
5. **Frontier runway warning:** warn when fewer than ~5 *scheduled* future-dated
   puzzles remain, so the committed frontier's draining is visible *before* it
   empties. This is about the **schedule**, not the backlog — a healthy state is
   a shallow frontier refilled from a deep backlog, so also surface backlog
   depth (count of valid, unscheduled, conflict-free-slottable files) alongside
   it.

---

## Migration plan

Today = 2026-05-29; day 20 (May 29) is the latest released. **Compute the
reslug set against a future cutover date, not this snapshot.**

**Phase 1 — core + data migration**
1. Add `PuzzleContent` type; drop `day`/`date`/`releaseAt` from puzzle files.
2. Add `src/schedule.ts` + the pure `resolve()` with unit tests (gaps,
   two-per-day, pins, frozen prefix, runway/past-release guards).
3. Rework the loader: glob files for *validation*; derive the live, ordered,
   numbered, dated set from `resolve(schedule, files)`. Picker/Countdown consume
   resolved order (number == date rank), killing the inversion.
4. **Storage identity → string id:**
   - `key(id: string)` (numeric legacy ids serialize identically: `…:day:20`).
   - `PersistedGameState.day: number` → `id: string`; integrity check reads
     `parsed.id ?? String(parsed.day)` so existing numeric saves still load.
   - Released days keep `day-N` filenames → ids stay `"1"…"20"` → **no key
     rewrite, no lost saves.**
5. **Fix backup/transfer (concrete — both hard-assume numeric ids):**
   - `backup.ts` iterates `puzzles` and calls `loadState(puzzle.day)` /
     `clearState` / matches `record.day` — re-key all of these by the string id.
   - `transfer.ts`: `PerDayRecord.day: number` → `id: string`; `validateRecord`
     currently rejects non-number `day` (`typeof raw.day !== 'number'`) — accept
     a string id; **bump `FORMAT_VERSION`** (their own rule: repurposing a field
     requires it); the importer maps a legacy numeric `day` → its string id.
   - The envelope stays an *array* of records (`days: PerDayRecord[]`), so it's
     the per-record key that changes, not the container shape.
   *(Without this, slug-keyed saves are silently dropped from backup/restore.)*
   Existing tests pin the numeric path (`tests/save-transfer.spec.ts`,
   `game.spec.ts`'s `audio-connections:day:1`); keep them green for legacy ids
   and add slug-id coverage.
6. **`currentDay` pointer** stores the stable id, not the display number.
7. **Reslug all unreleased** (chosen scope) past the cutover to author slugs via
   `git mv`; keep the released prefix (and anything imminent) as `day-N`. Seed
   the schedule with explicit dated rows: released prefix as `day-N` ids, then
   the reslugged tail on its intended calendar days, including `tqbf-2` on
   `2026-06-30`. This also untangles 33–39 for free (none released yet).
   **The exact cutover day is TBD**
   — this won't ship for a couple of days, so compute the released/reslug split
   against the actual deploy date, not 2026-05-29; anything that will have
   released by deploy stays `day-N`.
8. Update `PUZZLE_AUTHORS.md` (slug scheme, no number/date) and `CONTRIBUTING.md`
   (backlog vs schedule, the separate scheduling step).

**Phase 2 — ergonomics & slotting**
9. `npm run schedule:preview` (resolved table + warnings).
10. Conflict-aware slotting aid (report adjacency conflicts + suggest the
    gap-maximising placement for a backlog puzzle; list slottable backlog).

**Phase 3 — proactive guards**
11. Continuous iTunes re-check over the committed frontier.
12. Frontier runway warning + backlog-depth surfacing in CI.

### Worked result for the current tangle

> **Illustrative (pre-implementation projection).** The slugs and day numbers
> below were placeholders from design time, when the cutover day was still TBD.
> What actually shipped reslugs days 23–36 (e.g. `bojanrajkovic-1`, not
> `bojan-1`); see `src/schedule.ts` for the live schedule and numbers. The
> mechanics the table demonstrates are unchanged.

Schedule tail `[farana-1, farana-2, tqbf-1, bojan-1, <pr37-slug>, <pr39-slug>,
{tqbf-2, 2026-06-30}]` resolves to (slugs are the authors' own counters, not the
day numbers):

| File (slug) | Save key | Day # | Date | Was |
| --- | --- | --- | --- | --- |
| `farana-1.ts` | `farana-1` | 33 | Jun 11 | day-33 |
| `farana-2.ts` | `farana-2` | 34 | Jun 12 | day-35 |
| `tqbf-1.ts` | `tqbf-1` | 35 | Jun 13 | day-36 |
| `bojan-1.ts` | `bojan-1` | 36 | Jun 14 | PR 38 |
| `<pr37-slug>.ts` | slug | 37 | Jun 15 | PR 37 |
| `<pr39-slug>.ts` | slug | 38 | Jun 16 | PR 39 |
| `tqbf-2.ts` | `tqbf-2` | 39 | **Jun 30** | day-34 |

tqbf's held date is honoured and naturally numbered last; the locked-gap
inversion is unrepresentable.

---

## Consequences

**Positive**
- Contributor PRs claim no slot → no number/date collisions; parallel-merge safe.
- Number == date rank by construction → picker/unlock inversions impossible.
- Reshuffles are one-line schedule edits; the parking lot makes yanking a dead
  puzzle trivial and reversible.
- Redundant fields removed; each fact stored once.
- Acceptance decoupled from scheduling; previewable, lintable queue.

**Negative / costs**
- A separate scheduling step (chosen deliberately).
- Mixed filenames during transition (`day-N` released, slugs after) until the
  back catalogue ages out.
- A small but real storage migration touching `storage.ts`, `backup.ts`,
  `transfer.ts`, and the `currentDay` pointer.
- **Accepted loss:** a player who *early-unlocked* an unreleased day (Konami /
  countdown) and saved progress loses that save when its file is reslugged.

---

## Alternatives considered

- **Date-only + CI (contributor sets `releaseAt`, number derived, CI rejects
  dupes/inversions).** Smaller change, but contributors still pick a global date
  → cross-PR collisions remain possible; only validated, not prevented.
- **Pure epoch + N deck (no dates anywhere but one constant).** Simplest, but
  cannot honour a specific calendar date (tqbf's held date) and can't represent
  a pause without re-introducing pins anyway.
- **Frozen ledger for the past + schedule for the future** (instead of one
  full-history list). Avoids ever re-deriving immutable history, at the cost of
  two artifacts. The single-list + CI-frozen-prefix approach was chosen for
  simplicity; revisit if the prefix check proves fragile.
- **Keep authoring the number, add validation only.** Treats the symptom; the
  two hand-maintained sequences and their merge contention remain.
