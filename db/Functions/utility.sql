CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE OR REPLACE FUNCTION hash_password(input_pass VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
  RETURN encode(digest(input_pass, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;
