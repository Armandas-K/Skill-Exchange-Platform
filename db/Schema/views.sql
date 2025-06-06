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
  q.start_end,
  q.end_end,
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
  
  --profiles and users involved
  e.profile_id_1,
  p1.name AS profile_1_name,
  a1.email AS account_1_email,

  e.profile_id_2,
  p2.name AS profile_2_name,
  a2.email AS account_2_email,

  --skill listings being exchanged
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