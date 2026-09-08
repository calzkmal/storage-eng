-- An unqualified name in either function could otherwise resolve through a
-- caller-controlled search_path. Neither is SECURITY DEFINER today, so this is
-- latent rather than live, but it removes the trap before someone adds one.
alter function public.consume_rate_limit(text, integer, integer) set search_path = '';
alter function public.cap_attempts_per_learner() set search_path = '';

-- Make the grant explicit rather than relying on the default for service_role.
revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
