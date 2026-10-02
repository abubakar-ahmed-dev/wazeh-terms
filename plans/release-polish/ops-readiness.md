# Operational readiness checklist (WI-13) — owner decisions required

For the next deploy and any high-attention public window. No infrastructure
change is made by this file.

## Before the release-polish deploy

- [ ] Single new revision from `release-polish` after review (one deploy;
      no revision churn). Verify `status.traffic` after deploy and pin
      explicitly if needed — recorded lesson from the 2026-10-01 incident.
- [ ] Re-run the rollback drill on the new revision; record the known-good
      revision name in `docs/DEPLOYMENT.md` §4.
- [ ] Confirm all six samples on the live path (the sixth, TC-015, is new);
      re-run the five-case smoke list plus TC-015.
- [ ] Update the release row (commit, image digest, flags unchanged, notice
      `gemini-free-demo-v1` unchanged).

## Quota / provider headroom (Free tier)

- [ ] Check Gemini API credit balance and RPM/RPD quota the morning of any
      public window. Quota exhaustion = every extraction 503s.
- [ ] Decide whether to keep the demo-upload flag ON for the window; the
      one-line rollback (`CUSTOM_UPLOAD_ENABLED: "false"` + redeploy) stays
      available.
- [ ] Spot-check `/health`, one sample, and one upload after any flag change.

## Cold start vs cost

- [ ] Owner decision: `min-instances=1` during the window (first-click
      latency today = instance spin-up + secret resolution on top of the
      ~20 s machine time). Record cost acceptance and the revert step
      (`--min-instances 0` after the window).

## Monitoring / contacts

- [ ] Confirm the spending alert still routes to the owner.
- [ ] Confirm release contact record (sole operator: owner; backup not
      assigned) is current in `docs/DEPLOYMENT.md` §4.
- [ ] During the window: watch Cloud Run request/error rates and 429/503
      rates (rate limit + service busy are expected under burst, not errors).

## Hygiene actions pending (need a commit opportunity)

- [ ] Commit `sources/` permitted files only (link lists `.md` + inventory
      per `sources/README.md`; PDFs/captures stay ignored). Currently
      untracked-by-intent.
- [ ] License decision: repository stays `UNLICENSED` unless the owner
      applies a distribution license; record the decision wherever external
      usage requirements demand one.
