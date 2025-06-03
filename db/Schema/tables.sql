CREATE TABLE user (
    account_id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password VARCHAR NOT NULL, --hashed
    preferences TEXT,
    join_date DATE DEFAULT CURRENT_DATE,
    language language DEFAULT 'ENGLISH' --system language
);

CREATE TABLE skill_profile (
    profile_id SERIAL PRIMARY KEY,
    account_id INT REFERENCES user(account_id) ON DELETE CASCADE NOT NULL,
    name VARCHAR NOT NULL,
    location VARCHAR, --optional
    reputation_points INT DEFAULT 0,
    languages language[], --users languages
    desired_skills tag[]
);