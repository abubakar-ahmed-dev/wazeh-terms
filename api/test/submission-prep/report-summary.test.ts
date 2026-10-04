/**
 * Report summary accuracy (submission-prep): the summary must distinguish a
 * completed official-source check (citation shown, other candidates gate-
 * withheld) from a check that genuinely was not performed. Found by
 * re-reading the 2026-10-03 prod2 reports: TC-012 displayed a verified
 * citation while its summary claimed the check was not performed.
 */
import { describe, expect, it } from 'vitest';

import {
  PARTIAL_SUMMARY,
  PARTIAL_SUMMARY_INCOMPLETE,
  PARTIAL_SUMMARY_WITHHELD,
  PARTIAL_SUMMARY_WITH_CITATION,
} from '../../src/services/analysis/report.js';

describe('partial summary wording matches the retrieval outcome', () => {
  it('citation + withheld candidates never claims the check was not performed', () => {
    const text = PARTIAL_SUMMARY_WITH_CITATION(1, 2);
    expect(text).toContain('1 finding carries an official-source citation');
    expect(text).toContain('2 other possible official-source concerns were withheld');
    expect(text).not.toContain('was not performed');
  });

  it('pluralises correctly for multiple citations', () => {
    const text = PARTIAL_SUMMARY_WITH_CITATION(2, 1);
    expect(text).toContain('2 findings carry an official-source citation');
    expect(text).toContain('1 other possible official-source concern was withheld');
  });

  it('completed retrieval with only withholdings says the check ran', () => {
    const text = PARTIAL_SUMMARY_WITHHELD(4);
    expect(text).toContain('the official-source check ran');
    expect(text).toContain('4 possible concerns were withheld');
    expect(text).not.toContain('was not performed');
  });

  it('completed retrieval with neither citation nor withholding reports an incomplete result', () => {
    expect(PARTIAL_SUMMARY_INCOMPLETE).toContain('did not complete');
    expect(PARTIAL_SUMMARY_INCOMPLETE).not.toContain('was not performed');
  });

  it('keeps "not performed" reserved for unconfigured/failed/not-started retrieval', () => {
    expect(PARTIAL_SUMMARY).toContain('was not performed');
  });
});
