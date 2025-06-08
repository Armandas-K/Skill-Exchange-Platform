CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE OR REPLACE FUNCTION hash_password(input_pass VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    --hashes using a salt
    RETURN crypt(input_pass, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql;

--does not yet update status to completed
--could implement a date check every time an exchange is loaded on website?
CREATE OR REPLACE FUNCTION update_exchange_status(
    p_exchange_id INT,
    p_profile_id INT,
    p_action VARCHAR --'accept' or 'decline'
) RETURNS VARCHAR AS $$
DECLARE
    current_status exchange_status;
    profile_1 INT;
    profile_2 INT;
    result VARCHAR;
BEGIN
    --validate exchange exists and load profile ids and status
    SELECT profile_id_1, profile_id_2, status
    INTO profile_1, profile_2, current_status
    FROM exchange
    WHERE exchange_id = p_exchange_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'exchange id % does not exist.', p_exchange_id;
    END IF;

    --validate profile is in exchange
    IF p_profile_id NOT IN (profile_1, profile_2) THEN
        RAISE EXCEPTION 'profile id % is not in this exchange.', p_profile_id;
    END IF;

    --accept logic
    IF p_action = 'accept' THEN
        IF p_profile_id != profile_2 THEN
            RAISE EXCEPTION 'only the recipient (profile_id_2) can accept exchange request.';
        END IF;

        IF current_status = 'Requested' THEN
            --set to active if both have now accepted
            UPDATE exchange
            SET status = 'Active'
            WHERE exchange_id = p_exchange_id;

            result := 'exchange accepted and now active.';
        
        ELSIF current_status = 'Active' THEN
            --already active: redundant accept
            result := 'exchange already active.';
        
        --cannot accept if status is declined, completed or cancelled
        ELSE
            result := format('cannot accept exchange in status %s.', current_status);
        END IF;

    --decline logic
    ELSIF p_action = 'decline' THEN
        IF current_status = 'Requested' THEN
            UPDATE exchange
            SET status = 'Declined'
            WHERE exchange_id = p_exchange_id;

            result := 'Exchange declined.';

        ELSIF current_status = 'Active' THEN
            UPDATE exchange
            SET status = 'Cancelled'
            WHERE exchange_id = p_exchange_id;
            --could reduce reputation points for cancelling exchange?

            result := 'Active exchange cancelled.';

        --cannot decline if status id declined, completed or cancelled
        ELSE
            result := format('Cannot decline exchange in status %s.', current_status);
        END IF;

    ELSE
        RAISE EXCEPTION 'Invalid action: %. Must be "accept" or "decline".', p_action;
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql;