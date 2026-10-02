# Rule candidates — owner source-check kickoff (WI-6)

Status: **proposals only**. No rule record may be created from this file
alone; each candidate needs the full `docs/SOURCES.md` procedure (source
check, exact version + pinpoint, actor/scope/conditions/dates) and **owner
approval** before any Sanity record exists. Ground truth for what is already
verified lives in `sources/inventory-2026-09-29.md`.

## Already approved (the current live rule)

- `ae-recruitment-costs-employer-bears` rev 1 — UAE Federal Decree-Law
  33/2021, Article (6) clause (4); verified live on the deployed path
  (TC-012 citation). Amendment cross-check per inventory: 14/2022, 20/2023,
  9/2024 do not touch Article 6.

## Candidate shortlist (ordered by evidence readiness)

1. **Contract duration / fixed-term models** (`contract_duration`,
   `renewal_terms`) — Decree-Law 33/2021 Article 8; the 14/2022 amendment
   **is retrieved and verified** (amends Article 8 only, 2 pp English text
   layer, in inventory). Strongest candidate: source versions complete.
   Open: exact clause pinpoint + current consolidated wording; owner
   approval of rule wording, actor, and scope.
2. **Wage payment timing** (`payment_frequency`) — Decree-Law 33/2021
   Article 22 with Cabinet Resolution 1/2022 (Executive Regulation,
   Article 16, WPS); both source versions retrieved and verified in the
   inventory (31 pp English). Also available as **guidance-labeled**
   support: the u.ae `payment-of-wages` page (guidance class, owner
   decision recorded) — keep guidance out of rule claims, use only as
   next-step pointer. Open: pinpoint + whether the MVP check is
   "frequency stated vs WPS monthly expectation" without overclaiming.
3. **Probation terms** (`probation_period`) — Decree-Law 33/2021 probation
   article (inventory notes Articles 6 and 22 untouched by all amendments;
   the probation article itself needs the source-check pass). Open:
   article number + clause pinpoint + 120-day/210-day condition structure
   from the official text.
4. **Working hours / overtime** (`ordinary_hours`, `overtime_terms`) —
   guidance pages retrieved (`employment-in-the-private-sector-working-hours`,
   guidance class). Rule-grade claim needs the Decree-Law articles
   (daily/hours caps, overtime rate) verified directly; guidance pages can
   seed the question text only.
5. **Dispute / complaint next steps** (`next_steps` allowlist, not a field
   rule) — Articles 54/60 as replaced by 20/2023 + 9/2024 (both retrieved,
   Arabic official, text layer verified). Arabic-English translation needs
   bilingual review before any display use.

## Pakistan-side (actor-distinct, no candidates yet)

The inventory's Pakistan materials (Emigration Ordinance 1979, Rules 1979,
OEP lists, fee structure) support the **actor distinction** the product
already makes (Pakistan-side recruiter fees vs UAE-side employer costs) but
no rule-backed claim is proposed from them yet — they need the same
source-check pass before any record.

## Conflict-pair candidate (WI-7 demo)

Best available pair for the side-by-side conflict demonstration: a
**guidance-class u.ae page** vs the **current Decree-Law article** where
they diverge in wording or emphasis (candidates: wage timing page vs
Article 22/WPS; working-hours page vs the Decree-Law hours articles). The
report would show both claims with sources, versions, and why the law text
governs. Requires: the law-side rule approved (items 1–2), guidance labeled
as guidance in the KB, and a demo case + report surfacing both.

## KB budget note

44 approved published records today; the filtered approved-projection is
the KB input. Each new rule adds a small number of records; the 150-document
Knowledge Base budget stays comfortable, but record the count after each
approval (WI-6 exit item).
