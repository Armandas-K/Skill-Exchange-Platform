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
    p_start_date DATE,
    p_end_date DATE DEFAULT NULL,
    p_institution VARCHAR DEFAULT NULL,
    p_verified BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
DECLARE
    new_qualification_id INT;
    account_exists BOOLEAN;
BEGIN
    --validate account exists
    SELECT EXISTS (
        SELECT 1 FROM account WHERE account_id = p_account_id
    ) INTO account_exists;

    IF NOT account_exists THEN
        RAISE EXCEPTION 'account id % does not exist', p_account_id;
    END IF;

    --validate start date
    IF p_start_date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Start date (%) cannot be in the future', p_start_date;
    END IF;

    --also validate end date if given
    IF p_end_date IS NOT NULL THEN
        IF p_end_date < p_start_date THEN
            RAISE EXCEPTION 'End date (%) must be after start date (%).', p_end_date, p_start_date;
        ELSIF p_end_date > CURRENT_DATE THEN
            RAISE EXCEPTION 'End date (%) cannot be in the future.', p_end_date;
        END IF;
    END IF;

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
    RETURNING qualification_id INTO new_qualification_id;

    RETURN new_qualification_id;
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
    profile_exists BOOLEAN;
BEGIN
    --validate profile exists
    SELECT EXISTS (
        SELECT 1 FROM skill_profile WHERE profile_id = p_profile_id
    ) INTO profile_exists;

    IF NOT profile_exists THEN
        RAISE EXCEPTION 'profile id % does not exist', p_profile_id;
    END IF;

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
    p_skill_id_1 INT,
    p_skill_id_2 INT,
    p_location VARCHAR,
    p_date_start TIMESTAMP,
    p_date_end TIMESTAMP
) RETURNS INT AS $$
DECLARE
    new_exchange_id INT;
    profile_id_1 INT;
    profile_id_2 INT;
BEGIN

    --get profile ids from skill ids
    SELECT profile_id INTO profile_id_1 FROM skill_listing WHERE skill_id = p_skill_id_1;
    IF profile_id_1 IS NULL THEN
        RAISE EXCEPTION 'skill id % not found', p_skill_id_1;
    END IF;

    SELECT profile_id INTO profile_id_2 FROM skill_listing WHERE skill_id = p_skill_id_2;
    IF profile_id_2 IS NULL THEN
        RAISE EXCEPTION 'skill id % not found', p_skill_id_2;
    END IF;

    --validate profiles are different
    IF p_profile_id_1 = p_profile_id_2 THEN
        RAISE EXCEPTION 'cannot create exchange with same profile id %', p_profile_id_1;
    END IF;

    --validate dates
    IF p_date_start <= now() THEN
        RAISE EXCEPTION 'start date must be in the future';
    ELSIF p_date_end <= p_date_start THEN
        RAISE EXCEPTION 'end date must be after start date';
    END IF;

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