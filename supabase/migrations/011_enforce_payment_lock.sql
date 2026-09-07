-- ============================================================================================
-- MIGRATION: 011_enforce_payment_lock.sql
-- ============================================================================================
-- OBJECTIVE: Prevent new payments from being added when the balance for a component is already 0.
-- ============================================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.submit_student_payment(
    p_student_id UUID,
    p_academic_year TEXT,
    p_fee_component TEXT,
    p_amount DECIMAL,
    p_payment_date DATE,
    p_payment_mode TEXT,
    p_transaction_reference TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_auth_student_id UUID;
    v_required_amount DECIMAL(12,2);
    v_total_paid DECIMAL(12,2);
BEGIN
    SELECT student_id
    INTO v_auth_student_id
    FROM public.profiles
    WHERE user_id = auth.uid()
    LIMIT 1;

    IF v_auth_student_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: No student profile associated with your account.';
    END IF;

    IF v_auth_student_id <> p_student_id THEN
        RAISE EXCEPTION 'Unauthorized: You cannot submit payments for another student.';
    END IF;

    IF p_academic_year IS NULL OR btrim(p_academic_year) = '' THEN
        RAISE EXCEPTION 'Academic year is required.';
    END IF;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be greater than zero.';
    END IF;

    IF p_fee_component IS NULL
       OR p_fee_component NOT IN ('TUITION', 'TRANSPORT', 'HOSTEL') THEN
        RAISE EXCEPTION 'Invalid fee component. Allowed: TUITION, TRANSPORT, HOSTEL.';
    END IF;

    IF p_payment_mode IS NULL
       OR p_payment_mode NOT IN ('CASH', 'ONLINE', 'DD') THEN
        RAISE EXCEPTION 'Invalid payment mode. Allowed modes: CASH, ONLINE, DD.';
    END IF;

    -- Lock the official fee row so concurrent payment attempts serialize.
    SELECT
        CASE
            WHEN p_fee_component = 'TUITION' THEN tuition_fee
            WHEN p_fee_component = 'TRANSPORT' THEN transport_fee
            WHEN p_fee_component = 'HOSTEL' THEN hostel_fee
        END
    INTO v_required_amount
    FROM public.fee_structures
    WHERE student_id = p_student_id
      AND academic_year = p_academic_year
    FOR UPDATE;

    IF v_required_amount IS NULL THEN
        RAISE EXCEPTION 'No fee structure found for the selected academic year.';
    END IF;

    IF v_required_amount <= 0 THEN
        RAISE EXCEPTION 'The % fee is not applicable to your profile.', p_fee_component;
    END IF;

    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_paid
    FROM public.payments
    WHERE student_id = p_student_id
      AND academic_year = p_academic_year
      AND fee_component = p_fee_component;

    -- NEW: Payment Lock check
    IF v_total_paid >= v_required_amount THEN
        RAISE EXCEPTION 'Payment cannot be added because the balance for % is already fully paid.', p_fee_component;
    END IF;

    IF (v_total_paid + p_amount) > v_required_amount THEN
        RAISE EXCEPTION
            'Overpayment detected. Remaining balance: ₹%',
            (v_required_amount - v_total_paid);
    END IF;

    INSERT INTO public.payments (
        student_id,
        academic_year,
        fee_component,
        amount,
        payment_date,
        payment_mode,
        transaction_reference
    )
    VALUES (
        p_student_id,
        p_academic_year,
        p_fee_component,
        p_amount,
        COALESCE(p_payment_date, CURRENT_DATE),
        p_payment_mode,
        p_transaction_reference
    );
END;
$$;

COMMIT;
