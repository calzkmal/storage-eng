-- A trigger function has no business being callable over the API. Postgres would
-- refuse it anyway, but the grant is noise in the audit surface.
revoke all on function public.cap_attempts_per_learner() from public, anon, authenticated;
