-- Enable realtime for live auction updates
ALTER TABLE public.auctions REPLICA IDENTITY FULL;
ALTER TABLE public.bids REPLICA IDENTITY FULL;
ALTER TABLE public.players REPLICA IDENTITY FULL;
ALTER TABLE public.teams REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.auctions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;

-- RPC: place a bid (admin only). Validates budget and increment.
CREATE OR REPLACE FUNCTION public.place_bid(
  _auction_id uuid,
  _team_id uuid,
  _amount bigint
) RETURNS public.bids
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _auction public.auctions;
  _team public.teams;
  _bid public.bids;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can place bids';
  END IF;

  SELECT * INTO _auction FROM public.auctions WHERE id = _auction_id FOR UPDATE;
  IF _auction.status <> 'live' THEN
    RAISE EXCEPTION 'Auction is not live';
  END IF;
  IF _auction.current_player_id IS NULL THEN
    RAISE EXCEPTION 'No player currently on the block';
  END IF;
  IF _amount <= _auction.current_bid THEN
    RAISE EXCEPTION 'Bid must exceed current bid (%).', _auction.current_bid;
  END IF;

  SELECT * INTO _team FROM public.teams WHERE id = _team_id;
  IF _team.budget < _amount THEN
    RAISE EXCEPTION 'Team budget (%) is below the bid (%).', _team.budget, _amount;
  END IF;

  INSERT INTO public.bids (auction_id, team_id, player_id, amount)
  VALUES (_auction_id, _team_id, _auction.current_player_id, _amount)
  RETURNING * INTO _bid;

  UPDATE public.auctions
  SET current_bid = _amount, current_team_id = _team_id
  WHERE id = _auction_id;

  RETURN _bid;
END;
$$;

-- RPC: finalize current player (sold to highest bidder or unsold), then clear block.
CREATE OR REPLACE FUNCTION public.finalize_current_player(_auction_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _a public.auctions;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can finalize sales';
  END IF;

  SELECT * INTO _a FROM public.auctions WHERE id = _auction_id FOR UPDATE;
  IF _a.current_player_id IS NULL THEN
    RAISE EXCEPTION 'No player on the block';
  END IF;

  IF _a.current_team_id IS NOT NULL AND _a.current_bid > 0 THEN
    UPDATE public.players
    SET team_id = _a.current_team_id, auction_value = _a.current_bid
    WHERE id = _a.current_player_id;

    UPDATE public.teams
    SET budget = budget - _a.current_bid
    WHERE id = _a.current_team_id;
  END IF;

  UPDATE public.auctions
  SET current_player_id = NULL, current_team_id = NULL, current_bid = 0
  WHERE id = _auction_id;
END;
$$;

-- RPC: put a player on the block
CREATE OR REPLACE FUNCTION public.set_current_player(_auction_id uuid, _player_id uuid, _base_price bigint DEFAULT 0)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can set the current player';
  END IF;

  UPDATE public.auctions
  SET current_player_id = _player_id,
      current_team_id = NULL,
      current_bid = COALESCE(_base_price, 0),
      status = 'live'
  WHERE id = _auction_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_bid(uuid, uuid, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_current_player(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_current_player(uuid, uuid, bigint) TO authenticated;