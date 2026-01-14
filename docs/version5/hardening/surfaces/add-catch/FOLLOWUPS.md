# Followups

- [ ] Verify `session_id` on catch insert is constrained to the authenticated user (RLS or FK); document observed behavior with a negative test.
- [ ] Verify `venue_id` assignment rules on insert (does any authenticated user set arbitrary venue_id, or is there server-side validation?).
- [ ] Review storage policy scope: `catches_authenticated_manage` is bucket-wide; confirm whether per-user ownership/path constraints are required and document current behavior.
- [ ] Confirm behavior when catch insert fails after storage upload (orphaned objects) and capture any cleanup guidance.
- [ ] Confirm partial gallery upload behavior (failures are ignored) and whether this is acceptable; document observed outcome.
- [ ] Capture evidence that leaderboard and community stats triggers update derived data after insert.
- [ ] Validate admin block end-to-end (UI block + RLS denial if admin attempts insert).
