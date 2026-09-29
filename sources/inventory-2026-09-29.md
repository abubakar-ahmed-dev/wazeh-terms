# sources/ — reviewed-file inventory, 2026-09-29

Provenance metadata for files downloaded by the owner (retrieval dates in the
per-folder `links.md` files). PDFs stay local-only (`.gitignore`); this
inventory is the committed record of **what was reviewed and which bytes it
was**. A hash here means the file was opened and its text layer inspected for
the Phase 09 seed — it does **not** by itself approve a rule.

## UAE — official legislation (retrieved 2026-09-29, uaelegislation.gov.ae)

| File (in `sources/uae/`) | SHA-256 | Official URL | Findings |
| --- | --- | --- | --- |
| `Federal Decree by Law No. (33) of 2021 Concerning Regulating Labour Relations.pdf` | `f58777b34ca69bc71003518a104f7b014b2e4073207bd25a6cf5e80f183e081c` | https://uaelegislation.gov.ae/en/legislations/1541/download | 46 pp, English text layer. **Base text only** — no `Decree-Law 20 of 2023` amendment text inside; commencement "as of 02 February 2022" on the signature page. Article 6(4) present as quoted in the seed. Amendment cross-check: pending (14/2022, 20/2023, 9/2024). |
| `Cabinet Resolution No. (1) of 2022 … Executive Regulation ….pdf` | `eb41435e2e1ce0f731441165387a3404501e75b0ac7160dfaa550299c46d13b2` | https://uaelegislation.gov.ae/en/legislations/1547/download | 31 pp, English text layer. In force as of 02 February 2022. Article 16 (Wages) mirrors Decree-Law Art 22 via WPS. No seed rule points at it yet; kept as a verified approved source version. |

## UAE — u.ae official portal pages (retrieved 2026-09-28; `official_guidance` class only)

| File | SHA-256 | Official URL | Findings |
| --- | --- | --- | --- |
| `employment-laws-and-regulations-in-the-private-sector.pdf` | `961157efe32025c4c32b46a870b651ee2d2494d07694da2bdbe58cf9326834e8` | https://u.ae/en/information-and-services/jobs/Sector-of-employment/employment-in-the-private-sector/employment-laws-and-regulations-in-the-private-sector | Overview page. **Guidance, not law** (owner decision 2026-09-29). Names Decree-Law 33/2021 as amended by Decree-Law 20/2023 and effective 2 Feb 2022. |
| `payment-of-wages.pdf` | `852b45231c8631394ca031fda31d91ed4b21e665cc26b6d10c9d25ea10b45465` | https://u.ae/en/information-and-services/jobs/Sector-of-employment/employment-in-the-private-sector/payment-of-wages | 7 pp. "When Should Employers Pay Salaries?" states salaries for the previous month are due on the first day of each Gregorian month (WPS). Cites Ministerial Resolution 340/2026, whose own official copy is **unverified** — guidance claim stays on this page's wording only. |
| `employment-contracts-duration-and-models-in-the-private-sector.pdf` | `9ad88f93b5008f7cd73266d2d234f7c6014d53a7b9642ba34becd323d8787ac3` | …/employment-contracts-duration-and-models-in-the-private-sector | Guidance; no seed rule. |
| `employment-in-the-private-sector-labour-rights.pdf` | `2b8f75b8bd94ef2f4017175c2d24dfd12780c3045dfa56e1858909255f779720` | …/labour-rights | Guidance; no seed rule. |
| `employment-in-the-private-sector-working-hours.pdf` | `09d5c772a40f03647299b2a790f3936627677af7a04198826c3b5f6b143d552f` | …/working-hours | Guidance; no seed rule. |

## UAE — third-party, not sole evidence

| File | SHA-256 | URL | Finding |
| --- | --- | --- | --- |
| `Ministerial Resolution 340 of 2026 (UAE WPS).pdf` | `11d0544e9e221265c51a2edbcaea092774231b300ddeb999cade512f990c8e5d` | https://www.fit.ae/news-and-blogs/uae-mohre-resolution-340-2026-wps-changes | News-blog copy. **No rule may be approved or published from it** (owner decision 2026-09-29). WPS-resolution rule deferred from the initial seed. |

## Pakistan — BEOE (retrieved 2026-09-28; official domain)

| File (in `sources/pakistan/`) | SHA-256 | Official URL | Findings |
| --- | --- | --- | --- |
| `Emigration_Rules_1979_Updated_2023.pdf` | `cba24713cff34561c297a1abf8c508c45dec399c25d556f1ad07b72a99a0e0fb` | https://beoe.gov.pk/files/legal-framework/Emigration_Rules_1979_Updated_2023.pdf | 28 pp, English text layer. **Consolidated text** — inline SRO 1058(I)/2023 (08-08-2023) amendment markers present. Rule 15 "Service Charges, their distribution etc." spans printed pages 8 (contents) / 11–12 (text). |
| `Emigration Ordinance 1979.pdf` | `3fdec704504241186d48c2c203cf892a9be11945e57cef7a706bd4ed5a17bad1` | https://beoe.gov.pk/files/legal-framework/ordinance.pdf | Parent law; kept as verified source, no seed rule. |
| `fee-structure-emigrant.pdf` | `29acb73104a7c02232b798a635091bdd68fd8ee483792aa8618d6d4dbf10ef7c` | https://beoe.gov.pk/fee-structure-emigrant | Page printout: OEP route total Rs 22,200 / direct route Rs 9,200 component table. Guidance; Pakistan-side context only. |
| `procedure-for-overseas-employment.pdf` | `62955e725f32d9ab9532e69e15cb6ab3e245e61f7715261e3fc511a9e790dd6b` | https://beoe.gov.pk/files/legal-framework/procedure-for-overseas-employment.pdf | Guidance; no seed rule. |
| `frequently-asked-questions.pdf` | `c632ecf84ed59b09a8e8c6321992d08e89d75d25e6b311a5258ee65eba2c9ade` | https://beoe.gov.pk/faqs | Guidance; no seed rule. |
| `how-to-get-emigrants-protection.pdf` | `27a92f63fc2615750eca9a3db4185f9aee3e556d42a1c86d7bfa18b087d60937` | https://beoe.gov.pk/how-to-get-emigrants-protection | Guidance; candidate for official next-steps context. |
| `foreign-jobs.pdf` | `fe9513b66f66bef4592926ea0ca86d72b839d0615ec847979ee82636537d3c0c` | https://beoe.gov.pk/foreign-jobs?country_name=United+Arab+Emirates | Listing page; **synthetic-test provenance only** (`docs/SOURCES.md` §6). |

## Open items blocking approvals

1. Amendment cross-check for Decree-Law 33/2021 Articles 6 and 22. Automated
   access to `uaelegislation.gov.ae` is blocked by a Cloudflare challenge
   (403 on `curl`/fetch, 2026-09-29); access restrictions are not bypassed.
   Owner to download the official amendment texts — search the portal for:
   - Federal Decree-Law No. 14 of 2022 (amending 33/2021)
   - Federal Decree-Law No. 20 of 2023 (amending 33/2021)
   - Federal Decree-Law No. 9 of 2024 (amending 33/2021)
   and add them under `## OFFICIAL PDFs WEBPAGE LINKS` in `sources/uae/links.md`
   in the same `Link:/Retrieved:/Type:` format. Until then the worker-charge
   rule stays `draft` (unpublished) and the check stays open.
2. Owner approval of the revised seed package (final claims/pinpoints) before
   import + publish.
3. Resolution 340/2026 official copy — deferred; does not block the seed.
