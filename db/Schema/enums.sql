CREATE TYPE language AS ENUM (
    'English',
    'French',
    'Zulu',
    'Sesotho',
    'Setswana',
    'Afrikaans',
    'Xhosa'
);

CREATE TYPE tag AS ENUM (
    --some academic subjects
    'Maths',
    'Physics',
    'Chemistry',
    'Biology',
    'Economics',
    'Business',
    'History',
    'Geography',
    'Politics',
    'Psychology',
    'Philosophy',
    'Art',
    'Music',
    'Programming',
    'IT',
    'Engineering',
    --more practical skills
    'Languages',
    'DIY',
    'Carpentry',
    'Plumbing',
    'Electrical',
    'Cooking',
    'Gardening',
    'Mechanics',
    'Crafts',
    'Design',
    'Life_Skills',
    'Personal_Finance',
    'Fitness',
    'First_Aid'
);

CREATE TYPE exchange_status AS ENUM (
    'Requested',
    'Declined',
    'Active',
    'Completed',
    'Cancelled'
);