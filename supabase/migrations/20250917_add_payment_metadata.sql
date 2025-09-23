-- Add updated_at column to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger for payments updated_at
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add metadata column for additional payment info
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata JSONB;
