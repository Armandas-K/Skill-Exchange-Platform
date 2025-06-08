-- =====================
-- ENUM TYPES
-- =====================

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

-- =====================
-- TABLE CREATION
-- =====================

CREATE TABLE account (
    account_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    preferences TEXT NOT NULL DEFAULT '{}',
    join_date DATE DEFAULT CURRENT_DATE NOT NULL,
    language language DEFAULT 'English' NOT NULL
);

CREATE TABLE skill_profile (
    profile_id SERIAL PRIMARY KEY,
    account_id INT REFERENCES account(account_id) ON DELETE CASCADE NOT NULL,
    name VARCHAR NOT NULL,
    location VARCHAR,
    reputation_points INT DEFAULT 0 NOT NULL,
    languages language[] NOT NULL,
    desired_skills tag[] DEFAULT '{}' NOT NULL
);

CREATE TABLE skill_listing (
    skill_id SERIAL PRIMARY KEY,
    profile_id INT REFERENCES skill_profile(profile_id) ON DELETE CASCADE NOT NULL,
    skill VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    languages language[] NOT NULL,
    tags tag[] DEFAULT '{}' NOT NULL
);

CREATE TABLE review (
    review_id SERIAL PRIMARY KEY,
    reviewer_profile_id INT REFERENCES skill_profile(profile_id),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================
-- DEMO DATA INSERTION
-- =====================

-- Accounts
INSERT INTO account (email, password, language) VALUES
('admin@gmail.com', 'admin', '{}', 'English'),
('lebo@example.com', 'hashed_password', 'English'),
('jane@example.com', 'hashed_password', 'English'),
('musa@example.com', 'hashed_password', 'Zulu'),
('peter@example.com', 'hashed_password', 'English');

-- Profiles
INSERT INTO skill_profile (account_id, name, location, reputation_points, languages, desired_skills) VALUES
(1, 'Lebo B.', 'Makers Valley', 20, ARRAY['English']::language[], ARRAY['Business']::tag[]),
(2, 'Jane D.', 'Makers Valley', 10, ARRAY['English']::language[], ARRAY['Business']::tag[]),
(3, 'Musa K.', 'Makers Valley', 15, ARRAY['Zulu']::language[], ARRAY['Music']::tag[]),
(4, 'Peter S.', 'Makers Valley', 8, ARRAY['English']::language[], ARRAY['Programming']::tag[]);

-- Skills
INSERT INTO skill_listing (profile_id, skill, description, languages, tags) VALUES
(1, 'Hair Braiding', 'Professional hair braiding services.', ARRAY['English']::language[], ARRAY['Business']::tag[]),
(1, 'Sewing', 'Tailored clothing and repairs.', ARRAY['English']::language[], ARRAY['Business']::tag[]),
(2, 'Cooking', 'Traditional cooking classes.', ARRAY['English']::language[], ARRAY['Business']::tag[]),
(3, 'Drumming', 'Percussion and drumming lessons.', ARRAY['Zulu']::language[], ARRAY['Music']::tag[]),
(4, 'Web Development', 'Full-stack web development tutoring.', ARRAY['English']::language[], ARRAY['Programming']::tag[]);
