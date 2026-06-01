-- Function to safely decrement menu item quantity
CREATE OR REPLACE FUNCTION decrement_menu_item_quantity(
  item_id UUID,
  decrement_by INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE menu_items
  SET
    quantity = GREATEST(0, quantity - decrement_by),
    updated_at = NOW()
  WHERE id = item_id;
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
BEGIN
  UPDATE menu_items
  SET
    quantity = quantity + increment_by,
    updated_at = NOW()
  WHERE id = item_id;
END;
$$;
