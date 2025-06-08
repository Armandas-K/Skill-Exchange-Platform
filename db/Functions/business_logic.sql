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

CREATE OR REPLACE FUNCTION add_qualification(
    p_account_id INT,
    p_title VARCHAR,
    p_start DATE,
    p_end DATE DEFAULT NULL,
    p_institution VARCHAR DEFAULT NULL,
    p_verified BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
BEGIN
    INSERT INTO qualification (
        account_id,
        qualification_title,
        start_date,
        end_date,
        institution,
        verified
    ) VALUES (
        p_account_id,
        p_title,
        p_start,
        p_end,
        p_institution,
        p_verified
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_skill_listing(
    p_profile_id INT,
    p_skill VARCHAR,
    p_description VARCHAR,
    p_languages language[],
    p_tags tag[]
) RETURNS INT AS $$
DECLARE
    new_skill_id INT;
BEGIN
    INSERT INTO skill_listing (
        profile_id,
        skill,
        description,
        languages,
        tags
    ) VALUES (
        p_profile_id,
        p_skill,
        p_description,
        p_languages,
        p_tags
    )
    RETURNING skill_id INTO new_skill_id;

    RETURN new_skill_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_exchange(
    p_profile_id_1 INT,
    p_profile_id_2 INT,
    p_skill_id_1 INT,
    p_skill_id_2 INT,
    p_location VARCHAR,
    p_date_start TIMESTAMP,
    p_date_end TIMESTAMP
) RETURNS INT AS $$
DECLARE
    new_exchange_id INT;
BEGIN
    INSERT INTO exchange (
        profile_id_1,
        profile_id_2,
        skill_id_1,
        skill_id_2,
        location,
        date_start,
        date_end
    ) VALUES (
        p_profile_id_1,
        p_profile_id_2,
        p_skill_id_1,
        p_skill_id_2,
        p_location,
        p_date_start,
        p_date_end
    )
    RETURNING exchange_id INTO new_exchange_id;

    RETURN new_exchange_id;
END;
$$ LANGUAGE plpgsql;