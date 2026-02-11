-- PAYMENT GATEWAY BACKEND DATABASE SCHEMA

-- accounts table
CREATE TABLE IF NOT EXISTS accounts (
  account_id VARCHAR(20) PRIMARY KEY,
  balance NUMERIC(20,7) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- transaction table
CREATE TABLE IF NOT EXISTS transactions (
  transaction_id SERIAL PRIMARY KEY,
  source_account_id VARCHAR(20) NOT NULL,
  destination_account_id VARCHAR(20) NOT NULL,
  amount NUMERIC(20,7) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'processing',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_source_account FOREIGN KEY (source_account_id) REFERENCES accounts(account_id),
  CONSTRAINT fk_destination_account FOREIGN KEY (destination_account_id) REFERENCES accounts(account_id),
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
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();