CREATE TABLE user {
    account_id SERIAL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    preferences STRING NOT NULL,
    join_date DATE DEFAULT CURRENT_DATE,
    language Language DEFAULT ENGLISH,
    PRIMARY KEY (account_id)
};

CREATE TABLE profile {
    profile_id SERIAL,
    account_id SERIAL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    reputation_points INT NOT NULL,
    languages Language[] NOT NULL,
    skill_listings INT[] NOT NULL,
    desired_skills Tag[],
    PRIMARY KEY (profile_id),
    FOREIGN KEY (account_id) REFERENCES user(account_id) NOT NULL
};