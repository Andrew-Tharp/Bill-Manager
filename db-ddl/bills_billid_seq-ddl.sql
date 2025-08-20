-- SEQUENCE: public.bills_billid_seq

-- DROP SEQUENCE IF EXISTS public.bills_billid_seq;

CREATE SEQUENCE IF NOT EXISTS public.bills_billid_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2000000
    CACHE 1;

ALTER SEQUENCE public.bills_billid_seq
    OWNED BY public.bills.billid;

ALTER SEQUENCE public.bills_billid_seq
    OWNER TO postgres;