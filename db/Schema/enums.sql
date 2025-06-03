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
    'Accepted',
    'Declined',
    'Active',
    'Completed',
    'Canceled'
);