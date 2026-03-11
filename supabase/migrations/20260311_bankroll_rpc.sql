-- RPC function to handle bankroll transactions (deposit/withdraw) atomically
CREATE OR REPLACE FUNCTION handle_bankroll_transaction(
  p_bookie_id UUID,
  p_amount DECIMAL,
  p_type TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_current_balance DECIMAL;
  v_new_balance DECIMAL;
  v_transaction_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get and lock the bookie row for update
  SELECT current_balance INTO v_current_balance
  FROM bookies
  WHERE id = p_bookie_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bookie not found';
  END IF;

  -- Calculate new balance
  -- Note: p_amount should be positive for deposits, negative for withdrawals in this RPC's logic
  -- but we can handle it based on p_type to be safer if needed.
  -- Here we assume caller sends the signed amount.
  v_new_balance := v_current_balance + p_amount;

  -- Check for sufficient balance on withdrawals
  IF p_type = 'withdraw' AND v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Update bookie balance
  UPDATE bookies
  SET current_balance = v_new_balance,
      updated_at = NOW()
  WHERE id = p_bookie_id;

  -- Create transaction record
  INSERT INTO bankroll_transactions (
    user_id,
    bookie_id,
    type,
    amount,
    balance_before,
    balance_after,
    description
  )
  VALUES (
    v_user_id,
    p_bookie_id,
    p_type,
    p_amount,
    v_current_balance,
    v_new_balance,
    COALESCE(p_description, INITCAP(p_type))
  )
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance
  );
END;
$$;
