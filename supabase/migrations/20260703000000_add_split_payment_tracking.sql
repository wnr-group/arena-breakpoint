-- ================================================
-- Add Split Payment Tracking
-- ================================================
-- Purpose: Track payments split across multiple methods (cash/card/upi)
-- Date: 2026-07-03
-- ================================================

-- Add split payment columns to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS cash_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
ADD COLUMN IF NOT EXISTS card_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
ADD COLUMN IF NOT EXISTS upi_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL;

-- Add constraint to ensure split amounts equal amount_paid
ALTER TABLE public.bookings
ADD CONSTRAINT check_payment_split CHECK (
  cash_amount + card_amount + upi_amount = amount_paid
);

-- Add comments
COMMENT ON COLUMN public.bookings.cash_amount IS 'Amount paid via cash';
COMMENT ON COLUMN public.bookings.card_amount IS 'Amount paid via card';
COMMENT ON COLUMN public.bookings.upi_amount IS 'Amount paid via UPI';

-- Create function to automatically set payment_method based on split
-- This maintains backward compatibility with the single payment_method column
CREATE OR REPLACE FUNCTION set_payment_method_from_split()
RETURNS TRIGGER AS $$
BEGIN
  -- Count how many payment methods were used
  IF (NEW.cash_amount > 0 AND NEW.card_amount = 0 AND NEW.upi_amount = 0) THEN
    NEW.payment_method = 'cash';
  ELSIF (NEW.card_amount > 0 AND NEW.cash_amount = 0 AND NEW.upi_amount = 0) THEN
    NEW.payment_method = 'card';
  ELSIF (NEW.upi_amount > 0 AND NEW.cash_amount = 0 AND NEW.card_amount = 0) THEN
    NEW.payment_method = 'upi';
  ELSE
    -- Multiple payment methods used
    NEW.payment_method = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set payment_method
DROP TRIGGER IF EXISTS trigger_set_payment_method ON public.bookings;
CREATE TRIGGER trigger_set_payment_method
  BEFORE INSERT OR UPDATE OF cash_amount, card_amount, upi_amount
  ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_payment_method_from_split();

-- Backfill existing bookings based on their payment_method
UPDATE public.bookings
SET
  cash_amount = CASE WHEN payment_method = 'cash' THEN amount_paid ELSE 0 END,
  card_amount = CASE WHEN payment_method = 'card' THEN amount_paid ELSE 0 END,
  upi_amount = CASE WHEN payment_method = 'upi' THEN amount_paid ELSE 0 END
WHERE payment_method IS NOT NULL AND amount_paid > 0;
