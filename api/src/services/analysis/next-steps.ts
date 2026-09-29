/**
 * Server-side allowlist for `officialNextSteps` (docs/API.md §6): links come
 * only from reviewed SOURCES.md candidates — never from document text or
 * model output. PK-side help and UAE-side worker-rights context.
 */
export interface OfficialNextStep {
  readonly label: string;
  readonly url: string;
}

export const OFFICIAL_NEXT_STEPS: readonly OfficialNextStep[] = [
  {
    label: "BEOE: how to get an emigrant's protection (Pakistan)",
    url: 'https://beoe.gov.pk/how-to-get-emigrants-protection',
  },
  {
    label: 'UAE Government: protection of workers’ rights',
    url: 'https://u.ae/en/information-and-services/jobs/employment-in-the-private-sector/labour-rights',
  },
];
