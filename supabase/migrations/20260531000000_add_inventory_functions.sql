-- Function to safely decrement menu item quantity
CREATE OR REPLACE FUNCTION decrement_menu_item_quantity(
  item_id UUID,
  decrement_by INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  new_quantity INTEGER;
BEGIN
  UPDATE menu_items
  SET
    quantity = GREATEST(0, quantity - decrement_by),
    updated_at = NOW()
  WHERE id = item_id
  RETURNING quantity INTO new_quantity;

  -- Mark as unavailable if quantity reaches 0
  IF new_quantity = 0 THEN
    UPDATE menu_items
    SET status = 'unavailable'
    WHERE id = item_id;
  END IF;
END;
$$;

-- Function to increment menu item quantity (for cancellations/returns)
CREATE OR REPLACE FUNCTION increment_menu_item_quantity(
  item_id UUID,
  increment_by INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  old_quantity INTEGER;
  new_quantity INTEGER;
BEGIN
  -- Get the current quantity before update
  SELECT quantity INTO old_quantity
  FROM menu_items
  WHERE id = item_id;

  UPDATE menu_items
  SET
    quantity = quantity + increment_by,
    updated_at = NOW()
  WHERE id = item_id
  RETURNING quantity INTO new_quantity;

  -- Mark as available if quantity increases from 0
  IF old_quantity = 0 AND new_quantity > 0 THEN
    UPDATE menu_items
    SET status = 'available'
    WHERE id = item_id;
  END IF;
END;
$$;
