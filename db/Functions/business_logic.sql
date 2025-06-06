CREATE OR REPLACE FUNCTION create_account(
    p_email VARCHAR,
    p_password VARCHAR,
    p_language language DEFAULT 'English',
    p_name VARCHAR,
    p_location VACRHAR
) RETURNS INT AS $$
DECLARE
    new_account_id INT;
    new_profile_id INT;
BEGIN
    --add user entry
    INSERT INTO account (email, password, language)
    VALUES (
        p_email,
        hash_password(p_password),
        p_language
    )
    RETURNING account_id INTO new_account_id;

    --add profile entry
    INSERT INTO skill_profile (account_id, name, location)
    VALUES (
        new_account_id,
        p_name,
        p_location
    )
    RETURNING profile_id INTO new_profile_id;

    RETURN new_account_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION login_user(
    p_email VARCHAR,
    p_password VARCHAR
) RETURNS INT AS $$
DECLARE
    user_id INT;
BEGIN
    SELECT account_id INTO user_id
    FROM users
    WHERE email = p_email
      AND password = crypt(p_password, password); --compare hashes

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid email or password';
    END IF;

    RETURN user_id;
END;
$$ LANGUAGE plpgsql;