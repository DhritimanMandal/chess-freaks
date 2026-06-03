REVOKE EXECUTE ON FUNCTION public.place_bid(uuid, uuid, bigint) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.finalize_current_player(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_current_player(uuid, uuid, bigint) FROM PUBLIC, anon;