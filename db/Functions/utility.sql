CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE OR REPLACE FUNCTION hash_password(input_pass VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
  --hashes using a salt
  RETURN crypt(input_pass, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql;
