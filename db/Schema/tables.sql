CREATE TABLE user (
    account_id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password VARCHAR NOT NULL, --hashed
    preferences TEXT NOT NULL,
    join_date DATE DEFAULT CURRENT_DATE NOT NULL,
    language language DEFAULT 'English' NOT NULL --system language
);

CREATE TABLE skill_profile (
    profile_id SERIAL PRIMARY KEY,
    account_id INT REFERENCES user(account_id) ON DELETE CASCADE NOT NULL,
    name VARCHAR NOT NULL,
    location VARCHAR, --optional / out of scope
    reputation_points INT DEFAULT 0 NOT NULL,
    languages language[] NOT NULL, --users languages
    desired_skills tag[] DEFAULT '{}' NOT NULL
);

--should support school and work experience
--but table definition might be a bit ambiguous
CREATE TABLE qualification (
    qualification_id SERIAL PRIMARY KEY,
    account_id INT REFERENCES users(account_id) ON DELETE CASCADE NOT NULL,
    qualification_title VARCHAR NOT NULL,
    start DATE NOT NULL,
    end DATE, --NULL for ongoing
    institution VARCHAR, --NULL for self taught?
    verified BOOLEAN DEFAULT FALSE --maybe out of scope for now
);

CREATE TABLE skill_listing (
    skill_id SERIAL PRIMARY KEY,
    profile_id INT REFERENCES skill_profile(profile_id) ON DELETE CASCADE NOT NULL,
    skill VARCHAR NOT NULL,
    description VARCHAR NOT NULL,
    languages language[] NOT NULL, --probably redundant but could help with searching?
    tags tag[] DEFAULT '{}' NOT NULL
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
    date_end TIMESTAMP NOT NULL
);