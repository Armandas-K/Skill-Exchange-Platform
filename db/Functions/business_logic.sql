CREATE OR REPLACE FUNCTION create_account (
	p_email VARCHAR,
	p_password VARCHAR,
	p_language language DEFAULT 'English',
	p_name VARCHAR,
	p_location VARCHAR DEFAULT 'NONE'
)
