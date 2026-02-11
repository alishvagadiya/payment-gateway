-- PAYMENT GATEWAY BACKEND DATABASE SCHEMA
-- amount will be stored in non decimal number
-- For Ex ->  100 -> 10000, 1 -> 100, 0.01 -> 1, 101.10-> 10110

-- accounts table
CREATE TABLE IF NOT EXISTS accounts (
  account_number SERIAL PRIMARY KEY,
  balance BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- transaction table
CREATE TABLE IF NOT EXISTS transactions (
  transaction_id SERIAL PRIMARY KEY,
  source_account_id INTEGER NOT NULL,
  destination_account_id INTEGER NOT NULL,
  amount BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'processing',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_source_account FOREIGN KEY (source_account_id) REFERENCES accounts(account_number),
  CONSTRAINT fk_destination_account FOREIGN KEY (destination_account_id) REFERENCES accounts(account_number),
  CONSTRAINT positive_amount CHECK (amount > 0)
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- trigger to auto update updated_at
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();