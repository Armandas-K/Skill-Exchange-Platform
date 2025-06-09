-- Enable required extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ENUM types
CREATE TYPE language AS ENUM (
    'English',
    'Zulu',
    'Sesotho',
    'Setswana',
    'Afrikaans',
    'Xhosa'
);

CREATE TYPE tag AS ENUM (
    'Programming',
    'Maths',
    'Writing',
    'Music',
    'Business'
);

CREATE TYPE exchange_status AS ENUM (
    'Requested',
    'Declined',
    'Active',
    'Completed',
    'Cancelled'
);

-- Tables
CREATE TABLE account (
    account_id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password VARCHAR NOT NULL, --hashed
    preferences TEXT DEFAULT '' NOT NULL,
    join_date DATE DEFAULT CURRENT_DATE NOT NULL,
    language language DEFAULT 'English' NOT NULL --system language
);

CREATE TABLE skill_profile (
    profile_id SERIAL PRIMARY KEY,
    account_id INT REFERENCES account(account_id) ON DELETE CASCADE NOT NULL,
    name VARCHAR NOT NULL,
    location VARCHAR, --optional / out of scope
    reputation_points INT DEFAULT 0 NOT NULL,
    languages language[] DEFAULT ARRAY['English']::language[] NOT NULL, --users languages
    desired_skills tag[] DEFAULT '{}'::tag[] NOT NULL
);

-- Should support school and work experience
-- But table definition might be a bit ambiguous
CREATE TABLE qualification (
    qualification_id SERIAL PRIMARY KEY,
    account_id INT REFERENCES account(account_id) ON DELETE CASCADE NOT NULL,
    qualification_title VARCHAR NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE, --NULL for ongoing
    institution VARCHAR, --NULL for self taught?
    verified BOOLEAN DEFAULT FALSE --maybe out of scope for now
);

CREATE TABLE skill_listing (
    skill_id SERIAL PRIMARY KEY,
    profile_id INT REFERENCES skill_profile(profile_id) ON DELETE CASCADE NOT NULL,
    skill VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    languages language[] DEFAULT ARRAY['English']::language[] NOT NULL, --probably redundant but could help with searching?
    tags tag[] DEFAULT '{}'::tag[] NOT NULL
);

CREATE TABLE exchange (
    exchange_id SERIAL PRIMARY KEY,
    profile_id_1 INT REFERENCES skill_profile(profile_id) ON DELETE CASCADE NOT NULL,
    profile_id_2 INT REFERENCES skill_profile(profile_id) ON DELETE CASCADE NOT NULL,
    skill_id_1 INT REFERENCES skill_listing(skill_id) ON DELETE CASCADE NOT NULL,
    skill_id_2 INT REFERENCES skill_listing(skill_id) ON DELETE CASCADE NOT NULL,
    status exchange_status DEFAULT 'Requested' NOT NULL,
    location VARCHAR NOT NULL,
    date_start TIMESTAMP NOT NULL,
    date_end TIMESTAMP NOT NULL,
    CHECK (profile_id_1 <> profile_id_2) --prevent self-exchange
);

-- Views
CREATE OR REPLACE VIEW view_accounts_with_profiles AS
SELECT
    a.account_id,
    a.email,
    a.language AS system_language,
    a.join_date,
    p.profile_id,
    p.name,
    p.reputation_points,
    p.languages AS spoken_languages,
    p.desired_skills
FROM account a
JOIN skill_profile p ON a.account_id = p.account_id;

CREATE OR REPLACE VIEW view_skill_listings AS
SELECT
    s.skill_id,
    s.skill,
    s.description,
    s.languages AS skill_languages,
    s.tags,
    p.profile_id,
    p.name AS profile_name,
    a.email AS account_email
FROM skill_listing s
JOIN skill_profile p ON s.profile_id = p.profile_id
JOIN account a ON p.account_id = a.account_id;

CREATE OR REPLACE VIEW view_qualifications AS
SELECT
    q.qualification_id,
    q.account_id,
    a.email,
    q.qualification_title,
    q.start_date,
    q.end_date,
    q.institution,
    q.verified
FROM qualification q
JOIN account a ON q.account_id = a.account_id;

CREATE OR REPLACE VIEW view_exchanges AS
SELECT
    e.exchange_id,
    e.status,
    e.location,
    e.date_start,
    e.date_end,
    e.profile_id_1,
    p1.name AS profile_1_name,
    a1.email AS account_1_email,
    e.profile_id_2,
    p2.name AS profile_2_name,
    a2.email AS account_2_email,
    e.skill_id_1,
    s1.skill AS skill_1_name,
    e.skill_id_2,
    s2.skill AS skill_2_name
FROM exchange e
JOIN skill_profile p1 ON e.profile_id_1 = p1.profile_id
JOIN account a1 ON p1.account_id = a1.account_id
JOIN skill_profile p2 ON e.profile_id_2 = p2.profile_id
JOIN account a2 ON p2.account_id = a2.account_id
JOIN skill_listing s1 ON e.skill_id_1 = s1.skill_id
JOIN skill_listing s2 ON e.skill_id_2 = s2.skill_id;

-- Functions
CREATE OR REPLACE FUNCTION hash_password(input_pass VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
  RETURN crypt(input_pass, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_account(
    p_email VARCHAR,
    p_password VARCHAR,
    p_name VARCHAR,
    p_location VARCHAR,
    p_language language DEFAULT 'English',
    p_preferences TEXT DEFAULT '',
    p_languages language[] DEFAULT ARRAY['English']::language[]
) RETURNS INT AS $$
DECLARE
    new_account_id INT;
    new_profile_id INT;
BEGIN
    INSERT INTO account (email, password, language, preferences)
    VALUES (
        p_email,
        hash_password(p_password),
        p_language,
        p_preferences
    )
    RETURNING account_id INTO new_account_id;

    INSERT INTO skill_profile (account_id, name, location, languages)
    VALUES (
        new_account_id,
        p_name,
        p_location,
        p_languages
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
    FROM account
    WHERE email = p_email
      AND password = crypt(p_password, password);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid email or password';
    END IF;

    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- --------------------
-- Test Data (AFTER function definitions!)
-- --------------------

-- Insert accounts (must run after hash_password is defined)
INSERT INTO account (email, password, preferences, language)
VALUES 
('alice@example.com', hash_password('alicepass'), '', 'English'),
('bob@example.com', hash_password('bobpass'), '', 'Zulu'),
('carol@example.com', hash_password('carolpass'), '', 'Afrikaans');

-- Skill Profiles
INSERT INTO skill_profile (account_id, name, location, languages, desired_skills)
VALUES 
((SELECT account_id FROM account WHERE email = 'alice@example.com'),
 'Alice Smith', 'Johannesburg',
 ARRAY['English', 'Zulu']::language[],
 ARRAY['Programming', 'Maths']::tag[]),

((SELECT account_id FROM account WHERE email = 'bob@example.com'),
 'Bob Mokoena', 'Durban',
 ARRAY['Zulu']::language[],
 ARRAY['Music', 'Writing']::tag[]),

((SELECT account_id FROM account WHERE email = 'carol@example.com'),
 'Carol Van Wyk', 'Cape Town',
 ARRAY['Afrikaans', 'English']::language[],
 ARRAY['Business']::tag[]);

-- Qualifications
INSERT INTO qualification (account_id, qualification_title, start_date, end_date, institution, verified)
VALUES 
((SELECT account_id FROM account WHERE email = 'alice@example.com'),
 'BSc Computer Science', '2019-01-01', '2022-12-31', 'University of Joburg', TRUE),

((SELECT account_id FROM account WHERE email = 'bob@example.com'),
 'Diploma in Music', '2020-01-01', NULL, 'Durban College of Arts', FALSE);

-- Skill Listings
INSERT INTO skill_listing (profile_id, skill, description, languages, tags)
VALUES 
((SELECT profile_id FROM skill_profile WHERE name = 'Alice Smith'),
 'JavaScript Basics', 'Beginner-friendly JavaScript lessons',
 ARRAY['English']::language[], ARRAY['Programming']::tag[]),

((SELECT profile_id FROM skill_profile WHERE name = 'Bob Mokoena'),
 'Guitar Lessons', 'Acoustic guitar for beginners',
 ARRAY['Zulu']::language[], ARRAY['Music']::tag[]),

((SELECT profile_id FROM skill_profile WHERE name = 'Carol Van Wyk'),
 'Business Planning', 'How to launch a small business',
 ARRAY['Afrikaans', 'English']::language[], ARRAY['Business']::tag[]);

-- Exchanges
INSERT INTO exchange (
  profile_id_1, profile_id_2,
  skill_id_1, skill_id_2,
  status, location, date_start, date_end
) VALUES
(
  (SELECT profile_id FROM skill_profile WHERE name = 'Alice Smith'),
  (SELECT profile_id FROM skill_profile WHERE name = 'Bob Mokoena'),
  (SELECT skill_id FROM skill_listing WHERE skill = 'JavaScript Basics'),
  (SELECT skill_id FROM skill_listing WHERE skill = 'Guitar Lessons'),
  'Requested', 'Durban', '2025-06-10 14:00', '2025-06-10 16:00'
),
(
  (SELECT profile_id FROM skill_profile WHERE name = 'Bob Mokoena'),
  (SELECT profile_id FROM skill_profile WHERE name = 'Carol Van Wyk'),
  (SELECT skill_id FROM skill_listing WHERE skill = 'Guitar Lessons'),
  (SELECT skill_id FROM skill_listing WHERE skill = 'Business Planning'),
  'Completed', 'Cape Town', '2025-06-01 10:00', '2025-06-01 12:00'
);
