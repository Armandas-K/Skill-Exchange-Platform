--delete all table data
DELETE FROM exchange;
DELETE FROM skill_listing;
DELETE FROM qualification;
DELETE FROM skill_profile;
DELETE FROM account;

--create account main alice
SELECT create_account(
    p_email := 'test@example.com',
    p_password := 'test123',
    p_language := 'English',
    p_name := 'Alice Testuser',
    p_location := NULL
);

--create account bob
SELECT create_account(
    p_email := 'bob@example.com',
    p_password := 'bob123',
    p_language := 'French',
    p_name := 'Bob Example',
    p_location := NULL
);

--qualifications for alice
SELECT add_qualification(
    p_account_id := 1,
    p_title := 'Computer Science BSc',
    p_start_date := '2016-09-01',
    p_end_date := '2019-06-01',
    p_institution := 'Example University',
    p_verified := FALSE
);

SELECT add_qualification(
    p_account_id := 1,
    p_title := 'French Cooking Workshop',
    p_start_date := '2021-01-15',
    p_end_date := NULL, --ongoing
    p_institution := 'Culinary School',
    p_verified := FALSE
);

--skill listings
--alice: web dev + cooking
SELECT create_skill_listing(
    p_profile_id := 1,
    p_skill := 'Web Development',
    p_description := 'Frontend and backend web development',
    p_languages := ARRAY['English'],
    p_tags := ARRAY['Programming', 'IT']
);

SELECT create_skill_listing(
    p_profile_id := 1,
    p_skill := 'Home Cooking',
    p_description := 'Learn to cook healthy meals at home',
    p_languages := ARRAY['English'],
    p_tags := ARRAY['Cooking']
);

--bob: french tutor
SELECT create_skill_listing(
    p_profile_id := 2,
    p_skill := 'French Tutoring',
    p_description := 'Learn conversational and written French',
    p_languages := ARRAY['French', 'English'],
    p_tags := ARRAY['Languages']
);

--exchange
--alice request french, offers cooking
SELECT create_exchange(
    p_skill_id_1 := 2, -- Alice's "Home Cooking"
    p_skill_id_2 := 3, -- Bob's "French Tutoring"
    p_location := 'Online',
    p_date_start := CURRENT_DATE + INTERVAL '1 day',
    p_date_end := CURRENT_DATE + INTERVAL '2 days'
);

--bob accepts exchange
SELECT accept_exchange(
    p_exchange_id := 1,
    p_profile_id := 2
);

--alice login: test@example.com, test123