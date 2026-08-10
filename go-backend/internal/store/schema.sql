--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Homebrew)
-- Dumped by pg_dump version 14.17 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: refresh_car_model_derived(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.refresh_car_model_derived(p_model_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE "car_models" m
    SET "variant_count" = d.cnt,
        "has_petrol"    = d.petrol,
        "has_diesel"    = d.diesel,
        "has_cng"       = d.cng,
        "has_electric"  = d.electric
    FROM (
        SELECT
            COUNT(v."id")                                          AS cnt,
            COALESCE(bool_or(i."fuel_type" = 1), false)            AS petrol,
            COALESCE(bool_or(i."fuel_type" = 2), false)            AS diesel,
            COALESCE(bool_or(i."fuel_type" = 3), false)            AS cng,
            COALESCE(bool_or(e."id" IS NOT NULL), false)           AS electric
        FROM "car_variants" v
        LEFT JOIN "car_powertrains_ice" i
               ON i."variant_id" = v."id" AND i."is_deleted" = false
        LEFT JOIN "car_powertrains_electric" e
               ON e."variant_id" = v."id" AND e."is_deleted" = false
        WHERE v."model_id" = p_model_id
    ) d
    WHERE m."id" = p_model_id;
END;
$$;


--
-- Name: trg_car_powertrain_derived(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_car_powertrain_derived() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_model_id     INTEGER;
    v_old_model_id INTEGER;
BEGIN
    IF TG_OP <> 'INSERT' THEN
        SELECT "model_id" INTO v_old_model_id FROM "car_variants" WHERE "id" = OLD."variant_id";
        IF v_old_model_id IS NOT NULL THEN
            PERFORM refresh_car_model_derived(v_old_model_id);
        END IF;
    END IF;

    IF TG_OP <> 'DELETE' THEN
        SELECT "model_id" INTO v_model_id FROM "car_variants" WHERE "id" = NEW."variant_id";
        IF v_model_id IS NOT NULL AND v_model_id IS DISTINCT FROM v_old_model_id THEN
            PERFORM refresh_car_model_derived(v_model_id);
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$;


--
-- Name: trg_car_variant_derived(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_car_variant_derived() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM refresh_car_model_derived(OLD."model_id");
        RETURN OLD;
    END IF;

    PERFORM refresh_car_model_derived(NEW."model_id");
    -- A variant moved between models leaves the old model stale.
    IF TG_OP = 'UPDATE' AND OLD."model_id" IS DISTINCT FROM NEW."model_id" THEN
        PERFORM refresh_car_model_derived(OLD."model_id");
    END IF;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: ad_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_campaigns (
    id integer NOT NULL,
    placement_id integer NOT NULL,
    advertiser_id integer,
    name character varying(150) NOT NULL,
    creative_image_url character varying(255) NOT NULL,
    target_url character varying(255) NOT NULL,
    start_date timestamp(3) without time zone,
    end_date timestamp(3) without time zone,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by integer,
    updated_at timestamp(3) without time zone NOT NULL,
    updated_by integer,
    priority integer DEFAULT 0 NOT NULL
);


--
-- Name: ad_campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ad_campaigns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ad_campaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ad_campaigns_id_seq OWNED BY public.ad_campaigns.id;


--
-- Name: ad_clicks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_clicks (
    id bigint NOT NULL,
    campaign_id integer NOT NULL,
    user_id integer,
    page_url character varying(255),
    device_type character varying(20),
    ip_address character varying(45),
    clicked_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    impression_id bigint,
    placement_id integer,
    referrer_url character varying(255),
    session_id character varying(100),
    user_agent character varying(255)
);


--
-- Name: ad_clicks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ad_clicks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ad_clicks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ad_clicks_id_seq OWNED BY public.ad_clicks.id;


--
-- Name: ad_impressions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_impressions (
    id bigint NOT NULL,
    campaign_id integer NOT NULL,
    user_id integer,
    page_url character varying(255),
    device_type character varying(20),
    ip_address character varying(45),
    viewed_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    placement_id integer,
    referrer_url character varying(255),
    session_id character varying(100),
    user_agent character varying(255)
);


--
-- Name: ad_impressions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ad_impressions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ad_impressions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ad_impressions_id_seq OWNED BY public.ad_impressions.id;


--
-- Name: ad_placements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_placements (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    dimensions character varying(20) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by integer,
    updated_at timestamp(3) without time zone NOT NULL,
    updated_by integer,
    page_type integer NOT NULL,
    ad_type integer NOT NULL
);


--
-- Name: ad_placements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ad_placements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ad_placements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ad_placements_id_seq OWNED BY public.ad_placements.id;


--
-- Name: admin_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_logs (
    id bigint NOT NULL,
    admin_id integer NOT NULL,
    description character varying(255),
    ip_address character varying(45),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: admin_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_logs_id_seq OWNED BY public.admin_logs.id;


--
-- Name: admin_otp_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_otp_verifications (
    id integer NOT NULL,
    admin_id integer NOT NULL,
    mobile character varying(15) NOT NULL,
    otp_code character varying(6) NOT NULL,
    purpose character varying(20) NOT NULL,
    ip_address character varying(45),
    expires_at timestamp(3) without time zone NOT NULL,
    verified_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: admin_otp_verifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_otp_verifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_otp_verifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_otp_verifications_id_seq OWNED BY public.admin_otp_verifications.id;


--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    mobile character varying(15) NOT NULL,
    password_hash character varying(255),
    role_id integer NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    access_start_date date,
    access_end_date date,
    last_login_at timestamp(3) without time zone,
    last_login_ip character varying(45),
    failed_login_attempts integer DEFAULT 0 NOT NULL,
    is_locked boolean DEFAULT false NOT NULL,
    lock_type character varying(20),
    locked_by integer,
    locked_at timestamp(3) without time zone,
    locked_reason character varying(255),
    unlocked_by integer,
    unlocked_at timestamp(3) without time zone,
    created_by integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: admin_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_users_id_seq OWNED BY public.admin_users.id;


--
-- Name: advertisers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.advertisers (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    contact_name character varying(100) NOT NULL,
    contact_mobile character varying(15) NOT NULL,
    contact_email character varying(150) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by integer,
    is_active boolean DEFAULT true NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    updated_by integer
);


--
-- Name: advertisers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.advertisers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: advertisers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.advertisers_id_seq OWNED BY public.advertisers.id;


--
-- Name: ai_articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_articles (
    id integer NOT NULL,
    category_id integer NOT NULL,
    brand_id integer NOT NULL,
    model_id integer,
    title character varying(200) NOT NULL,
    slug character varying(200) NOT NULL,
    excerpt character varying(300) NOT NULL,
    body text NOT NULL,
    cover_image_url character varying(255) NOT NULL,
    meta_title character varying(160) NOT NULL,
    meta_description character varying(300) NOT NULL,
    meta_keywords character varying(255) NOT NULL,
    status integer NOT NULL,
    ai_provider integer NOT NULL,
    ai_model character varying(100) NOT NULL,
    published_article_id integer,
    reviewed_by integer,
    reviewed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone,
    source_image_pool_id integer NOT NULL
);


--
-- Name: ai_articles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_articles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_articles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_articles_id_seq OWNED BY public.ai_articles.id;


--
-- Name: ai_automation_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_automation_rules (
    id integer NOT NULL,
    feature_key integer NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    frequency_minutes integer DEFAULT 180 NOT NULL,
    count_per_run integer DEFAULT 1 NOT NULL,
    auto_delete boolean DEFAULT false NOT NULL,
    keep_latest integer,
    next_run_at timestamp(3) without time zone,
    last_run_at timestamp(3) without time zone,
    created_by integer,
    updated_by integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone,
    auto_publish boolean DEFAULT false NOT NULL,
    delete_strategy character varying(20) DEFAULT 'latest'::character varying NOT NULL,
    language character varying(20) DEFAULT 'english'::character varying NOT NULL,
    max_total integer
);


--
-- Name: ai_automation_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_automation_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_automation_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_automation_rules_id_seq OWNED BY public.ai_automation_rules.id;


--
-- Name: ai_faqs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_faqs (
    id integer NOT NULL,
    model_id integer NOT NULL,
    question character varying(255) NOT NULL,
    answer text NOT NULL,
    status integer NOT NULL,
    ai_provider integer NOT NULL,
    ai_model character varying(100) NOT NULL,
    published_faq_id integer,
    reviewed_by integer,
    reviewed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone
);


--
-- Name: ai_faqs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_faqs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_faqs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_faqs_id_seq OWNED BY public.ai_faqs.id;


--
-- Name: ai_image_pool; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_image_pool (
    id integer NOT NULL,
    feature_key integer NOT NULL,
    image_url character varying(255) NOT NULL,
    original_filename character varying(255),
    is_used boolean DEFAULT false NOT NULL,
    used_for_id integer,
    used_at timestamp(3) without time zone,
    uploaded_by integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ai_image_pool_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_image_pool_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_image_pool_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_image_pool_id_seq OWNED BY public.ai_image_pool.id;


--
-- Name: ai_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_logs (
    id bigint NOT NULL,
    feature_key integer NOT NULL,
    action character varying(50) NOT NULL,
    status integer NOT NULL,
    message character varying(500) NOT NULL,
    meta jsonb,
    duration_ms integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ai_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_logs_id_seq OWNED BY public.ai_logs.id;


--
-- Name: ai_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_settings (
    id integer NOT NULL,
    provider integer NOT NULL,
    base_url character varying(255),
    api_key text,
    model character varying(100) NOT NULL,
    created_by integer NOT NULL,
    updated_by integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone
);


--
-- Name: ai_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_settings_id_seq OWNED BY public.ai_settings.id;


--
-- Name: ai_story_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_story_items (
    id integer NOT NULL,
    group_id integer NOT NULL,
    source_image_pool_id integer NOT NULL,
    media_type character varying(10) NOT NULL,
    media_url character varying(255) NOT NULL,
    description character varying(300) NOT NULL,
    link character varying(255),
    status integer NOT NULL,
    ai_provider integer NOT NULL,
    ai_model character varying(100) NOT NULL,
    published_story_item_id integer,
    reviewed_by integer,
    reviewed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone
);


--
-- Name: ai_story_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_story_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_story_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_story_items_id_seq OWNED BY public.ai_story_items.id;


--
-- Name: article_brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.article_brands (
    id integer NOT NULL,
    article_id integer NOT NULL,
    brand_id integer NOT NULL
);


--
-- Name: article_brands_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.article_brands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: article_brands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.article_brands_id_seq OWNED BY public.article_brands.id;


--
-- Name: article_car_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.article_car_models (
    id integer NOT NULL,
    article_id integer NOT NULL,
    model_id integer NOT NULL
);


--
-- Name: article_car_models_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.article_car_models_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: article_car_models_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.article_car_models_id_seq OWNED BY public.article_car_models.id;


--
-- Name: article_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.article_categories (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    slug character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by integer,
    updated_by integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: article_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.article_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: article_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.article_categories_id_seq OWNED BY public.article_categories.id;


--
-- Name: article_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.article_comments (
    id integer NOT NULL,
    article_id integer NOT NULL,
    user_id integer NOT NULL,
    parent_comment_id integer,
    body text NOT NULL,
    status character varying(20) DEFAULT 'visible'::character varying NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: article_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.article_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: article_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.article_comments_id_seq OWNED BY public.article_comments.id;


--
-- Name: articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articles (
    id integer NOT NULL,
    category_id integer NOT NULL,
    author_id integer NOT NULL,
    created_by integer,
    updated_by integer,
    title character varying(200) NOT NULL,
    slug character varying(200) NOT NULL,
    excerpt character varying(300),
    body text,
    cover_image_url character varying(255),
    read_time_minutes integer,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    scheduled_at timestamp(3) without time zone,
    published_at timestamp(3) without time zone,
    view_count integer DEFAULT 0 NOT NULL,
    meta_title character varying(160),
    meta_description character varying(300),
    meta_keywords character varying(255),
    og_image_url character varying(255),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: articles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.articles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: articles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.articles_id_seq OWNED BY public.articles.id;


--
-- Name: attribute_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attribute_options (
    id integer NOT NULL,
    category character varying(30) NOT NULL,
    name character varying(50) NOT NULL,
    slug character varying(50) NOT NULL
);


--
-- Name: attribute_options_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attribute_options_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: attribute_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attribute_options_id_seq OWNED BY public.attribute_options.id;


--
-- Name: banners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banners (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    tag_label character varying(100) NOT NULL,
    heading character varying(200) NOT NULL,
    highlight_text character varying(150) NOT NULL,
    description character varying(300) NOT NULL,
    media_type integer NOT NULL,
    image_url character varying(255),
    video_url character varying(255),
    cta_text character varying(50) NOT NULL,
    cta_link character varying(255) NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    click_count integer DEFAULT 0 NOT NULL,
    created_by integer NOT NULL,
    updated_by integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone
);


--
-- Name: banners_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.banners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: banners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.banners_id_seq OWNED BY public.banners.id;


--
-- Name: body_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.body_types (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    slug character varying(50) NOT NULL,
    icon_url character varying(255),
    description character varying(255),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: body_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.body_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: body_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.body_types_id_seq OWNED BY public.body_types.id;


--
-- Name: brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brands (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    logo_url character varying(255),
    country_origin_id integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
,
    display_order integer DEFAULT 0 NOT NULL);


--
-- Name: brands_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.brands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: brands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.brands_id_seq OWNED BY public.brands.id;


--
-- Name: buy_new_car_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.buy_new_car_leads (
    id integer NOT NULL,
    user_id integer,
    name character varying(100),
    mobile character varying(15) NOT NULL,
    brand_id integer,
    model_id integer,
    city_id integer,
    interest_type character varying(30),
    status character varying(20) DEFAULT 'new'::character varying NOT NULL,
    lead_channel character varying(30),
    utm_source character varying(100),
    utm_medium character varying(100),
    utm_campaign character varying(150),
    landing_page character varying(255),
    device_type character varying(20),
    ip_address character varying(45),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    email character varying(150),
    updated_at timestamp(3) without time zone NOT NULL,
    variant_id integer
);


--
-- Name: buy_new_car_leads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.buy_new_car_leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: buy_new_car_leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.buy_new_car_leads_id_seq OWNED BY public.buy_new_car_leads.id;


--
-- Name: buy_used_car_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.buy_used_car_leads (
    id integer NOT NULL,
    user_id integer,
    name character varying(100),
    mobile character varying(15) NOT NULL,
    brand_id integer,
    model_id integer,
    listing_id integer,
    status character varying(20) DEFAULT 'new'::character varying NOT NULL,
    lead_channel character varying(30),
    utm_source character varying(100),
    utm_medium character varying(100),
    utm_campaign character varying(150),
    landing_page character varying(255),
    device_type character varying(20),
    ip_address character varying(45),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: buy_used_car_leads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.buy_used_car_leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: buy_used_car_leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.buy_used_car_leads_id_seq OWNED BY public.buy_used_car_leads.id;


--
-- Name: car_color_shades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.car_color_shades (
    id integer NOT NULL,
    color_id integer NOT NULL,
    color_hex character varying(7) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: car_color_shades_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.car_color_shades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: car_color_shades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.car_color_shades_id_seq OWNED BY public.car_color_shades.id;


--
-- Name: car_colors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.car_colors (
    id integer NOT NULL,
    model_id integer NOT NULL,
    color_name character varying(50) NOT NULL,
    image_url character varying(255),
    additional_cost numeric(8,2)
);


--
-- Name: car_colors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.car_colors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: car_colors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.car_colors_id_seq OWNED BY public.car_colors.id;


--
-- Name: car_faqs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.car_faqs (
    id integer NOT NULL,
    model_id integer NOT NULL,
    question character varying(255) NOT NULL,
    answer text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    view_count integer DEFAULT 0 NOT NULL
);


--
-- Name: car_faqs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.car_faqs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: car_faqs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.car_faqs_id_seq OWNED BY public.car_faqs.id;


--
-- Name: car_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.car_images (
    id integer NOT NULL,
    model_id integer NOT NULL,
    color_id integer,
    image_url character varying(255) NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    angle character varying(30)
);


--
-- Name: car_images_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.car_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: car_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.car_images_id_seq OWNED BY public.car_images.id;


--
-- Name: car_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.car_models (
    id integer NOT NULL,
    brand_id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    body_type_id integer,
    launch_status character varying(20) DEFAULT 'available'::character varying NOT NULL,
    expected_launch_date date,
    price_min numeric(12,2),
    price_max numeric(12,2),
    rating_avg numeric(3,2),
    cover_image_url character varying(255),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    has_petrol boolean DEFAULT false NOT NULL,
    has_diesel boolean DEFAULT false NOT NULL,
    has_cng boolean DEFAULT false NOT NULL,
    has_electric boolean DEFAULT false NOT NULL,
    variant_count integer DEFAULT 0 NOT NULL
);


--
-- Name: car_models_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.car_models_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: car_models_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.car_models_id_seq OWNED BY public.car_models.id;


--
-- Name: car_powertrains_electric; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.car_powertrains_electric (
    id integer NOT NULL,
    variant_id integer NOT NULL,
    num_motors integer,
    motor_type character varying(50),
    battery_capacity numeric(6,2),
    battery_chemistry character varying(30),
    thermal_management_system character varying(50),
    drivetrain_id integer,
    power_ps integer,
    torque_nm integer,
    claimed_range integer,
    real_world_range integer,
    top_speed_kmph integer,
    top_speed_time_sec numeric(5,2),
    ac_charging_output numeric(5,2),
    ac_charging_time numeric(5,2),
    dc_charging_output numeric(5,2),
    dc_fast_charging_time character varying(50),
    battery_warranty_km integer,
    battery_warranty_years integer,
    motor_warranty_km integer,
    motor_warranty_years integer,
    standard_warranty_km character varying(20),
    standard_warranty_years integer,
    is_default boolean DEFAULT false NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_by integer,
    deleted_at timestamp(3) without time zone,
    expires_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    charging_options_raw character varying(255),
    charging_port character varying(30),
    emission_norm_compliance character varying(30),
    motor_power_kw numeric(6,2),
    regenerative_braking boolean DEFAULT false NOT NULL,
    regenerative_braking_levels integer
);


--
-- Name: car_powertrains_electric_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.car_powertrains_electric_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: car_powertrains_electric_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.car_powertrains_electric_id_seq OWNED BY public.car_powertrains_electric.id;


--
-- Name: car_powertrains_ice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.car_powertrains_ice (
    id integer NOT NULL,
    variant_id integer NOT NULL,
    fuel_type integer NOT NULL,
    fuel_type_sub_category character varying(30),
    fuel_tank_capacity numeric(5,2),
    cng_tank_capacity numeric(5,2),
    kerb_weight integer,
    engine_displacement numeric(5,2),
    cubic_capacity integer,
    cylinders integer,
    num_gears integer,
    is_four_by_four boolean DEFAULT false NOT NULL,
    drivetrain_id integer,
    power_ps integer,
    power_min_rpm integer,
    power_max_rpm integer,
    torque_nm integer,
    torque_min_rpm integer,
    torque_max_rpm integer,
    claimed_fe numeric(5,2),
    real_world_mileage numeric(5,2),
    top_speed_kmph integer,
    top_speed_time_sec numeric(5,2),
    is_default boolean DEFAULT false NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_by integer,
    deleted_at timestamp(3) without time zone,
    expires_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    emission_norm_compliance character varying(30),
    turbo_charger boolean DEFAULT false NOT NULL
);


--
-- Name: car_powertrains_ice_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.car_powertrains_ice_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: car_powertrains_ice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.car_powertrains_ice_id_seq OWNED BY public.car_powertrains_ice.id;


--
-- Name: car_variants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.car_variants (
    id integer NOT NULL,
    model_id integer NOT NULL,
    variant_name character varying(100) NOT NULL,
    price numeric(12,2) NOT NULL,
    seating_capacity integer NOT NULL,
    transmission_id integer NOT NULL,
    is_top_seller boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    boot_space_litres integer,
    front_brake_type character varying(50),
    front_suspension character varying(100),
    ground_clearance_mm integer,
    height_mm integer,
    length_mm integer,
    rear_brake_type character varying(50),
    rear_suspension character varying(100),
    steering_type character varying(50),
    wheel_base_mm integer,
    width_mm integer
);


--
-- Name: car_variants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.car_variants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: car_variants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.car_variants_id_seq OWNED BY public.car_variants.id;


--
-- Name: cities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cities (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    is_metro boolean DEFAULT false NOT NULL,
    is_top_city boolean DEFAULT false NOT NULL,
    is_sell_car_enabled boolean DEFAULT false NOT NULL,
    logo_url character varying(255),
    state_id integer NOT NULL
);


--
-- Name: cities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cities_id_seq OWNED BY public.cities.id;


--
-- Name: countries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.countries (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(5) NOT NULL,
    currency character varying(50),
    currency_symbol character varying(10),
    currency_code character varying(10),
    exchange_rate numeric(12,6),
    distance_unit character varying(10) DEFAULT 'KM'::character varying,
    fuel_unit character varying(10) DEFAULT 'Liter'::character varying,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: countries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.countries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: countries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.countries_id_seq OWNED BY public.countries.id;


--
-- Name: feature_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: feature_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.feature_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: feature_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.feature_categories_id_seq OWNED BY public.feature_categories.id;


--
-- Name: features; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.features (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    category_id integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: features_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.features_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: features_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.features_id_seq OWNED BY public.features.id;


--
-- Name: insurance_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insurance_leads (
    id integer NOT NULL,
    user_id integer,
    name character varying(100),
    mobile character varying(15) NOT NULL,
    brand_id integer,
    model_id integer,
    registration_number character varying(20),
    city_id integer,
    status character varying(20) DEFAULT 'new'::character varying NOT NULL,
    lead_channel character varying(30),
    utm_source character varying(100),
    utm_medium character varying(100),
    utm_campaign character varying(150),
    landing_page character varying(255),
    device_type character varying(20),
    ip_address character varying(45),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    current_insurance_company character varying(150),
    had_claim boolean,
    insurance_type character varying(20),
    policy_expiry_date date,
    registration_state_id integer,
    registration_year integer,
    variant_id integer
);


--
-- Name: insurance_leads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.insurance_leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: insurance_leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.insurance_leads_id_seq OWNED BY public.insurance_leads.id;


--
-- Name: lead_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_activities (
    id bigint NOT NULL,
    lead_type character varying(30) NOT NULL,
    lead_id integer NOT NULL,
    admin_id integer NOT NULL,
    activity_type character varying(20),
    notes character varying(500),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: lead_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lead_activities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lead_activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lead_activities_id_seq OWNED BY public.lead_activities.id;


--
-- Name: lenders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lenders (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    logo_url character varying(255),
    min_interest_rate numeric(4,2),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by integer,
    max_interest_rate numeric(4,2),
    max_loan_amount numeric(12,2),
    max_tenure_years integer,
    updated_at timestamp(3) without time zone NOT NULL,
    updated_by integer
);


--
-- Name: lenders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lenders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lenders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lenders_id_seq OWNED BY public.lenders.id;


--
-- Name: loan_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loan_leads (
    id integer NOT NULL,
    user_id integer,
    name character varying(100),
    mobile character varying(15) NOT NULL,
    brand_id integer,
    model_id integer,
    lender_id integer,
    loan_amount numeric(12,2),
    tenure_years integer,
    monthly_income numeric(10,2),
    status character varying(20) DEFAULT 'new'::character varying NOT NULL,
    lead_channel character varying(30),
    utm_source character varying(100),
    utm_medium character varying(100),
    utm_campaign character varying(150),
    landing_page character varying(255),
    device_type character varying(20),
    ip_address character varying(45),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    interest_rate numeric(4,2),
    updated_at timestamp(3) without time zone NOT NULL,
    variant_id integer
);


--
-- Name: loan_leads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.loan_leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: loan_leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.loan_leads_id_seq OWNED BY public.loan_leads.id;


--
-- Name: mileage_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mileage_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    model_id integer,
    odometer integer NOT NULL,
    fuel_filled numeric(5,2) NOT NULL,
    distance_covered integer,
    mileage_result numeric(5,2),
    logged_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: mileage_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mileage_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mileage_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mileage_logs_id_seq OWNED BY public.mileage_logs.id;


--
-- Name: new_car_offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.new_car_offers (
    id integer NOT NULL,
    model_id integer NOT NULL,
    variant_id integer,
    city_id integer,
    offer_type integer,
    offer_amount numeric(10,2),
    description character varying(255),
    valid_from date,
    valid_until date,
    is_active boolean DEFAULT true NOT NULL,
    image_url character varying(255) NOT NULL
);


--
-- Name: new_car_offers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.new_car_offers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: new_car_offers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.new_car_offers_id_seq OWNED BY public.new_car_offers.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    title character varying(150),
    message character varying(300),
    type character varying(30),
    reference_type character varying(30),
    reference_id integer,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: page_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_views (
    id bigint NOT NULL,
    page_type character varying(30),
    page_id integer,
    user_id integer,
    page_url character varying(255),
    device_type character varying(20),
    ip_address character varying(45),
    viewed_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: page_views_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.page_views_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: page_views_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.page_views_id_seq OWNED BY public.page_views.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    module character varying(50) NOT NULL,
    action character varying(20) NOT NULL,
    permission_key character varying(100) NOT NULL
);


--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: price_drop_alert_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_drop_alert_leads (
    id integer NOT NULL,
    user_id integer,
    mobile character varying(15) NOT NULL,
    email character varying(150),
    brand_id integer,
    model_id integer,
    alert_type character varying(20),
    is_active boolean DEFAULT true NOT NULL,
    notified_at timestamp(3) without time zone,
    lead_channel character varying(30),
    utm_source character varying(100),
    utm_medium character varying(100),
    utm_campaign character varying(150),
    landing_page character varying(255),
    device_type character varying(20),
    ip_address character varying(45),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    price_at_subscription numeric(12,2),
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: price_drop_alert_leads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.price_drop_alert_leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: price_drop_alert_leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.price_drop_alert_leads_id_seq OWNED BY public.price_drop_alert_leads.id;


--
-- Name: review_category_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_category_scores (
    id integer NOT NULL,
    review_id integer NOT NULL,
    category character varying(30),
    score numeric(2,1)
);


--
-- Name: review_category_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.review_category_scores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: review_category_scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.review_category_scores_id_seq OWNED BY public.review_category_scores.id;


--
-- Name: review_helpful_votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_helpful_votes (
    id integer NOT NULL,
    review_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: review_helpful_votes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.review_helpful_votes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: review_helpful_votes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.review_helpful_votes_id_seq OWNED BY public.review_helpful_votes.id;


--
-- Name: review_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_images (
    id integer NOT NULL,
    review_id integer NOT NULL,
    image_url character varying(255) NOT NULL
);


--
-- Name: review_images_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.review_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: review_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.review_images_id_seq OWNED BY public.review_images.id;


--
-- Name: review_replies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_replies (
    id integer NOT NULL,
    review_id integer NOT NULL,
    user_id integer,
    admin_id integer,
    body text NOT NULL,
    status character varying(20) DEFAULT 'visible'::character varying NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: review_replies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.review_replies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: review_replies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.review_replies_id_seq OWNED BY public.review_replies.id;


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    user_id integer NOT NULL,
    model_id integer NOT NULL,
    variant_id integer,
    rating numeric(2,1),
    title character varying(150),
    body text,
    ownership_duration character varying(50),
    km_driven integer,
    is_verified_owner boolean DEFAULT false NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    rejected_reason character varying(255),
    helpful_count integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id integer NOT NULL,
    permission_id integer NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    role_name character varying(50) NOT NULL,
    parent_role_id integer,
    created_by integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: search_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.search_logs (
    id bigint NOT NULL,
    user_id integer,
    search_query character varying(255),
    results_count integer,
    page_url character varying(255),
    device_type character varying(20),
    ip_address character varying(45),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    session_id character varying(100),
    user_agent character varying(255)
);


--
-- Name: search_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.search_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: search_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.search_logs_id_seq OWNED BY public.search_logs.id;


--
-- Name: sell_car_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sell_car_leads (
    id integer NOT NULL,
    user_id integer,
    name character varying(100),
    mobile character varying(15) NOT NULL,
    brand_id integer,
    model_id integer,
    year integer,
    km_driven integer,
    city_id integer,
    status character varying(20) DEFAULT 'new'::character varying NOT NULL,
    lead_channel character varying(30),
    utm_source character varying(100),
    utm_medium character varying(100),
    utm_campaign character varying(150),
    landing_page character varying(255),
    device_type character varying(20),
    ip_address character varying(45),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: sell_car_leads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sell_car_leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sell_car_leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sell_car_leads_id_seq OWNED BY public.sell_car_leads.id;


--
-- Name: seo_meta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_meta (
    id integer NOT NULL,
    static_page_slug character varying(100),
    meta_title character varying(255),
    meta_description text,
    meta_keywords text,
    canonical_url character varying(255),
    updated_by integer,
    updated_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by integer,
    entity_id integer,
    h1_tag character varying(255),
    og_description text,
    og_image character varying(255),
    og_title character varying(255),
    robots_meta character varying(100),
    status boolean DEFAULT true NOT NULL,
    page_type integer NOT NULL,
    article_schema text,
    author_schema text,
    breadcrumb_schema text,
    faq_schema text,
    review_schema text,
    vehicle_schema text
);


--
-- Name: seo_meta_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.seo_meta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: seo_meta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.seo_meta_id_seq OWNED BY public.seo_meta.id;


--
-- Name: seo_redirects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_redirects (
    id integer NOT NULL,
    old_path character varying(255) NOT NULL,
    new_path character varying(255) NOT NULL,
    redirect_type integer DEFAULT 301 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: seo_redirects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.seo_redirects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: seo_redirects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.seo_redirects_id_seq OWNED BY public.seo_redirects.id;


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    id integer NOT NULL,
    maintenance_mode boolean DEFAULT false NOT NULL,
    maintenance_message text,
    support_email character varying(255),
    contact_email character varying(255),
    contact_number character varying(20),
    whatsapp_number character varying(20),
    address text,
    facebook_url character varying(255),
    instagram_url character varying(255),
    twitter_url character varying(255),
    youtube_url character varying(255),
    linkedin_url character varying(255),
    created_by integer NOT NULL,
    updated_by integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone
);


--
-- Name: site_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.site_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: site_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.site_settings_id_seq OWNED BY public.site_settings.id;


--
-- Name: sitemap_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sitemap_entries (
    id integer NOT NULL,
    page_type character varying(30) NOT NULL,
    page_id integer,
    url_path character varying(255) NOT NULL,
    priority numeric(2,1) DEFAULT 0.5,
    change_frequency character varying(20),
    is_included boolean DEFAULT true NOT NULL,
    last_modified timestamp(3) without time zone
);


--
-- Name: sitemap_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sitemap_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sitemap_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sitemap_entries_id_seq OWNED BY public.sitemap_entries.id;


--
-- Name: soft_leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.soft_leads (
    id integer NOT NULL,
    user_id integer,
    mobile character varying(15),
    brand_id integer,
    model_id integer,
    calculator_type character varying(20),
    input_summary character varying(255),
    status character varying(20) DEFAULT 'new'::character varying NOT NULL,
    lead_channel character varying(30),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    device_type character varying(20),
    ip_address character varying(45),
    landing_page character varying(255),
    updated_at timestamp(3) without time zone NOT NULL,
    utm_campaign character varying(150),
    utm_medium character varying(100),
    utm_source character varying(100)
);


--
-- Name: soft_leads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.soft_leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: soft_leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.soft_leads_id_seq OWNED BY public.soft_leads.id;


--
-- Name: states; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.states (
    id integer NOT NULL,
    country_id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(10)
,
    slug character varying(100) NOT NULL);


--
-- Name: states_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.states_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: states_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.states_id_seq OWNED BY public.states.id;


--
-- Name: story_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.story_groups (
    id integer NOT NULL,
    title character varying(100) NOT NULL,
    cover_media_type character varying(10) NOT NULL,
    cover_media_url character varying(255) NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    display_order integer NOT NULL,
    created_by integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by integer,
    updated_at timestamp(3) without time zone
);


--
-- Name: story_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.story_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: story_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.story_groups_id_seq OWNED BY public.story_groups.id;


--
-- Name: story_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.story_items (
    id integer NOT NULL,
    group_id integer NOT NULL,
    media_type character varying(10) NOT NULL,
    media_url character varying(255) NOT NULL,
    description character varying(300),
    link character varying(255),
    view_count integer DEFAULT 0 NOT NULL,
    display_order integer NOT NULL,
    created_by integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by integer,
    updated_at timestamp(3) without time zone,
    end_at timestamp(3) without time zone,
    start_at timestamp(3) without time zone,
    status character varying(10) DEFAULT 'draft'::character varying NOT NULL
);


--
-- Name: story_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.story_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: story_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.story_items_id_seq OWNED BY public.story_items.id;


--
-- Name: testimonials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.testimonials (
    id integer NOT NULL,
    user_id integer,
    customer_name character varying(100) NOT NULL,
    customer_city character varying(100),
    photo_url character varying(255),
    rating numeric(2,1),
    quote character varying(500) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    rejected_reason character varying(255),
    reviewed_by integer,
    reviewed_at timestamp(3) without time zone,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: testimonials_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.testimonials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: testimonials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.testimonials_id_seq OWNED BY public.testimonials.id;


--
-- Name: used_car_listing_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.used_car_listing_images (
    id integer NOT NULL,
    listing_id integer NOT NULL,
    image_url character varying(255) NOT NULL,
    is_primary boolean DEFAULT false NOT NULL
);


--
-- Name: used_car_listing_images_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.used_car_listing_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: used_car_listing_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.used_car_listing_images_id_seq OWNED BY public.used_car_listing_images.id;


--
-- Name: used_car_listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.used_car_listings (
    id integer NOT NULL,
    seller_id integer NOT NULL,
    model_id integer NOT NULL,
    variant_id integer,
    powertrain_type character varying(10),
    powertrain_id integer,
    year integer,
    registration_number character varying(20),
    km_driven integer,
    owner_count integer,
    color character varying(50),
    price numeric(12,2),
    city_id integer NOT NULL,
    insurance_valid_till date,
    is_inspected boolean DEFAULT false NOT NULL,
    inspection_report_url character varying(255),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: used_car_listings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.used_car_listings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: used_car_listings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.used_car_listings_id_seq OWNED BY public.used_car_listings.id;


--
-- Name: user_addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_addresses (
    id integer NOT NULL,
    user_id integer NOT NULL,
    address_type character varying(20),
    address_line1 character varying(255),
    address_line2 character varying(255),
    city_id integer NOT NULL,
    pincode character varying(10),
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_addresses_id_seq OWNED BY public.user_addresses.id;


--
-- Name: user_otp_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_otp_verifications (
    id integer NOT NULL,
    mobile character varying(15) NOT NULL,
    otp_code character varying(6) NOT NULL,
    purpose character varying(20) NOT NULL,
    ip_address character varying(45),
    expires_at timestamp(3) without time zone NOT NULL,
    verified_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    email character varying(150)
);


--
-- Name: user_otp_verifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_otp_verifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_otp_verifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_otp_verifications_id_seq OWNED BY public.user_otp_verifications.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150),
    mobile character varying(15) NOT NULL,
    password_hash character varying(255),
    city_id integer,
    is_verified boolean DEFAULT true NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    failed_login_attempts integer DEFAULT 0 NOT NULL,
    is_locked boolean DEFAULT false NOT NULL,
    locked_at timestamp(3) without time zone,
    locked_reason character varying(255),
    last_login_at timestamp(3) without time zone,
    last_login_ip character varying(45),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: variant_features; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.variant_features (
    id integer NOT NULL,
    variant_id integer NOT NULL,
    feature_id integer NOT NULL,
    value character varying(100),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: variant_features_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.variant_features_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: variant_features_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.variant_features_id_seq OWNED BY public.variant_features.id;


--
-- Name: ad_campaigns id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_campaigns ALTER COLUMN id SET DEFAULT nextval('public.ad_campaigns_id_seq'::regclass);


--
-- Name: ad_clicks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_clicks ALTER COLUMN id SET DEFAULT nextval('public.ad_clicks_id_seq'::regclass);


--
-- Name: ad_impressions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_impressions ALTER COLUMN id SET DEFAULT nextval('public.ad_impressions_id_seq'::regclass);


--
-- Name: ad_placements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_placements ALTER COLUMN id SET DEFAULT nextval('public.ad_placements_id_seq'::regclass);


--
-- Name: admin_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_logs ALTER COLUMN id SET DEFAULT nextval('public.admin_logs_id_seq'::regclass);


--
-- Name: admin_otp_verifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_otp_verifications ALTER COLUMN id SET DEFAULT nextval('public.admin_otp_verifications_id_seq'::regclass);


--
-- Name: admin_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users ALTER COLUMN id SET DEFAULT nextval('public.admin_users_id_seq'::regclass);


--
-- Name: advertisers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advertisers ALTER COLUMN id SET DEFAULT nextval('public.advertisers_id_seq'::regclass);


--
-- Name: ai_articles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_articles ALTER COLUMN id SET DEFAULT nextval('public.ai_articles_id_seq'::regclass);


--
-- Name: ai_automation_rules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_automation_rules ALTER COLUMN id SET DEFAULT nextval('public.ai_automation_rules_id_seq'::regclass);


--
-- Name: ai_faqs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_faqs ALTER COLUMN id SET DEFAULT nextval('public.ai_faqs_id_seq'::regclass);


--
-- Name: ai_image_pool id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_image_pool ALTER COLUMN id SET DEFAULT nextval('public.ai_image_pool_id_seq'::regclass);


--
-- Name: ai_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_logs ALTER COLUMN id SET DEFAULT nextval('public.ai_logs_id_seq'::regclass);


--
-- Name: ai_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_settings ALTER COLUMN id SET DEFAULT nextval('public.ai_settings_id_seq'::regclass);


--
-- Name: ai_story_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_story_items ALTER COLUMN id SET DEFAULT nextval('public.ai_story_items_id_seq'::regclass);


--
-- Name: article_brands id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_brands ALTER COLUMN id SET DEFAULT nextval('public.article_brands_id_seq'::regclass);


--
-- Name: article_car_models id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_car_models ALTER COLUMN id SET DEFAULT nextval('public.article_car_models_id_seq'::regclass);


--
-- Name: article_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_categories ALTER COLUMN id SET DEFAULT nextval('public.article_categories_id_seq'::regclass);


--
-- Name: article_comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_comments ALTER COLUMN id SET DEFAULT nextval('public.article_comments_id_seq'::regclass);


--
-- Name: articles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles ALTER COLUMN id SET DEFAULT nextval('public.articles_id_seq'::regclass);


--
-- Name: attribute_options id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attribute_options ALTER COLUMN id SET DEFAULT nextval('public.attribute_options_id_seq'::regclass);


--
-- Name: banners id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banners ALTER COLUMN id SET DEFAULT nextval('public.banners_id_seq'::regclass);


--
-- Name: body_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.body_types ALTER COLUMN id SET DEFAULT nextval('public.body_types_id_seq'::regclass);


--
-- Name: brands id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands ALTER COLUMN id SET DEFAULT nextval('public.brands_id_seq'::regclass);


--
-- Name: buy_new_car_leads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buy_new_car_leads ALTER COLUMN id SET DEFAULT nextval('public.buy_new_car_leads_id_seq'::regclass);


--
-- Name: buy_used_car_leads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buy_used_car_leads ALTER COLUMN id SET DEFAULT nextval('public.buy_used_car_leads_id_seq'::regclass);


--
-- Name: car_color_shades id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_color_shades ALTER COLUMN id SET DEFAULT nextval('public.car_color_shades_id_seq'::regclass);


--
-- Name: car_colors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_colors ALTER COLUMN id SET DEFAULT nextval('public.car_colors_id_seq'::regclass);


--
-- Name: car_faqs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_faqs ALTER COLUMN id SET DEFAULT nextval('public.car_faqs_id_seq'::regclass);


--
-- Name: car_images id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_images ALTER COLUMN id SET DEFAULT nextval('public.car_images_id_seq'::regclass);


--
-- Name: car_models id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_models ALTER COLUMN id SET DEFAULT nextval('public.car_models_id_seq'::regclass);


--
-- Name: car_powertrains_electric id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_powertrains_electric ALTER COLUMN id SET DEFAULT nextval('public.car_powertrains_electric_id_seq'::regclass);


--
-- Name: car_powertrains_ice id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_powertrains_ice ALTER COLUMN id SET DEFAULT nextval('public.car_powertrains_ice_id_seq'::regclass);


--
-- Name: car_variants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_variants ALTER COLUMN id SET DEFAULT nextval('public.car_variants_id_seq'::regclass);


--
-- Name: cities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities ALTER COLUMN id SET DEFAULT nextval('public.cities_id_seq'::regclass);


--
-- Name: countries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries ALTER COLUMN id SET DEFAULT nextval('public.countries_id_seq'::regclass);


--
-- Name: feature_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_categories ALTER COLUMN id SET DEFAULT nextval('public.feature_categories_id_seq'::regclass);


--
-- Name: features id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.features ALTER COLUMN id SET DEFAULT nextval('public.features_id_seq'::regclass);


--
-- Name: insurance_leads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_leads ALTER COLUMN id SET DEFAULT nextval('public.insurance_leads_id_seq'::regclass);


--
-- Name: lead_activities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities ALTER COLUMN id SET DEFAULT nextval('public.lead_activities_id_seq'::regclass);


--
-- Name: lenders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lenders ALTER COLUMN id SET DEFAULT nextval('public.lenders_id_seq'::regclass);


--
-- Name: loan_leads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_leads ALTER COLUMN id SET DEFAULT nextval('public.loan_leads_id_seq'::regclass);


--
-- Name: mileage_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mileage_logs ALTER COLUMN id SET DEFAULT nextval('public.mileage_logs_id_seq'::regclass);


--
-- Name: new_car_offers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.new_car_offers ALTER COLUMN id SET DEFAULT nextval('public.new_car_offers_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: page_views id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_views ALTER COLUMN id SET DEFAULT nextval('public.page_views_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: price_drop_alert_leads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_drop_alert_leads ALTER COLUMN id SET DEFAULT nextval('public.price_drop_alert_leads_id_seq'::regclass);


--
-- Name: review_category_scores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_category_scores ALTER COLUMN id SET DEFAULT nextval('public.review_category_scores_id_seq'::regclass);


--
-- Name: review_helpful_votes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_helpful_votes ALTER COLUMN id SET DEFAULT nextval('public.review_helpful_votes_id_seq'::regclass);


--
-- Name: review_images id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_images ALTER COLUMN id SET DEFAULT nextval('public.review_images_id_seq'::regclass);


--
-- Name: review_replies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_replies ALTER COLUMN id SET DEFAULT nextval('public.review_replies_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: search_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_logs ALTER COLUMN id SET DEFAULT nextval('public.search_logs_id_seq'::regclass);


--
-- Name: sell_car_leads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sell_car_leads ALTER COLUMN id SET DEFAULT nextval('public.sell_car_leads_id_seq'::regclass);


--
-- Name: seo_meta id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_meta ALTER COLUMN id SET DEFAULT nextval('public.seo_meta_id_seq'::regclass);


--
-- Name: seo_redirects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_redirects ALTER COLUMN id SET DEFAULT nextval('public.seo_redirects_id_seq'::regclass);


--
-- Name: site_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings ALTER COLUMN id SET DEFAULT nextval('public.site_settings_id_seq'::regclass);


--
-- Name: sitemap_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sitemap_entries ALTER COLUMN id SET DEFAULT nextval('public.sitemap_entries_id_seq'::regclass);


--
-- Name: soft_leads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.soft_leads ALTER COLUMN id SET DEFAULT nextval('public.soft_leads_id_seq'::regclass);


--
-- Name: states id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.states ALTER COLUMN id SET DEFAULT nextval('public.states_id_seq'::regclass);


--
-- Name: story_groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_groups ALTER COLUMN id SET DEFAULT nextval('public.story_groups_id_seq'::regclass);


--
-- Name: story_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_items ALTER COLUMN id SET DEFAULT nextval('public.story_items_id_seq'::regclass);


--
-- Name: testimonials id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials ALTER COLUMN id SET DEFAULT nextval('public.testimonials_id_seq'::regclass);


--
-- Name: used_car_listing_images id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.used_car_listing_images ALTER COLUMN id SET DEFAULT nextval('public.used_car_listing_images_id_seq'::regclass);


--
-- Name: used_car_listings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.used_car_listings ALTER COLUMN id SET DEFAULT nextval('public.used_car_listings_id_seq'::regclass);


--
-- Name: user_addresses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_addresses ALTER COLUMN id SET DEFAULT nextval('public.user_addresses_id_seq'::regclass);


--
-- Name: user_otp_verifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_otp_verifications ALTER COLUMN id SET DEFAULT nextval('public.user_otp_verifications_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: variant_features id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.variant_features ALTER COLUMN id SET DEFAULT nextval('public.variant_features_id_seq'::regclass);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: ad_campaigns ad_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_campaigns
    ADD CONSTRAINT ad_campaigns_pkey PRIMARY KEY (id);


--
-- Name: ad_clicks ad_clicks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_clicks
    ADD CONSTRAINT ad_clicks_pkey PRIMARY KEY (id);


--
-- Name: ad_impressions ad_impressions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_impressions
    ADD CONSTRAINT ad_impressions_pkey PRIMARY KEY (id);


--
-- Name: ad_placements ad_placements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_placements
    ADD CONSTRAINT ad_placements_pkey PRIMARY KEY (id);


--
-- Name: admin_logs admin_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_pkey PRIMARY KEY (id);


--
-- Name: admin_otp_verifications admin_otp_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_otp_verifications
    ADD CONSTRAINT admin_otp_verifications_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: advertisers advertisers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advertisers
    ADD CONSTRAINT advertisers_pkey PRIMARY KEY (id);


--
-- Name: ai_articles ai_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_articles
    ADD CONSTRAINT ai_articles_pkey PRIMARY KEY (id);


--
-- Name: ai_automation_rules ai_automation_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_automation_rules
    ADD CONSTRAINT ai_automation_rules_pkey PRIMARY KEY (id);


--
-- Name: ai_faqs ai_faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_faqs
    ADD CONSTRAINT ai_faqs_pkey PRIMARY KEY (id);


--
-- Name: ai_image_pool ai_image_pool_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_image_pool
    ADD CONSTRAINT ai_image_pool_pkey PRIMARY KEY (id);


--
-- Name: ai_logs ai_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_logs
    ADD CONSTRAINT ai_logs_pkey PRIMARY KEY (id);


--
-- Name: ai_settings ai_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_settings
    ADD CONSTRAINT ai_settings_pkey PRIMARY KEY (id);


--
-- Name: ai_story_items ai_story_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_story_items
    ADD CONSTRAINT ai_story_items_pkey PRIMARY KEY (id);


--
-- Name: article_brands article_brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_brands
    ADD CONSTRAINT article_brands_pkey PRIMARY KEY (id);


--
-- Name: article_car_models article_car_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_car_models
    ADD CONSTRAINT article_car_models_pkey PRIMARY KEY (id);


--
-- Name: article_categories article_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_categories
    ADD CONSTRAINT article_categories_pkey PRIMARY KEY (id);


--
-- Name: article_comments article_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_comments
    ADD CONSTRAINT article_comments_pkey PRIMARY KEY (id);


--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_pkey PRIMARY KEY (id);


--
-- Name: attribute_options attribute_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attribute_options
    ADD CONSTRAINT attribute_options_pkey PRIMARY KEY (id);


--
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (id);


--
-- Name: body_types body_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.body_types
    ADD CONSTRAINT body_types_pkey PRIMARY KEY (id);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: buy_new_car_leads buy_new_car_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buy_new_car_leads
    ADD CONSTRAINT buy_new_car_leads_pkey PRIMARY KEY (id);


--
-- Name: buy_used_car_leads buy_used_car_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buy_used_car_leads
    ADD CONSTRAINT buy_used_car_leads_pkey PRIMARY KEY (id);


--
-- Name: car_color_shades car_color_shades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_color_shades
    ADD CONSTRAINT car_color_shades_pkey PRIMARY KEY (id);


--
-- Name: car_colors car_colors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_colors
    ADD CONSTRAINT car_colors_pkey PRIMARY KEY (id);


--
-- Name: car_faqs car_faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_faqs
    ADD CONSTRAINT car_faqs_pkey PRIMARY KEY (id);


--
-- Name: car_images car_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_images
    ADD CONSTRAINT car_images_pkey PRIMARY KEY (id);


--
-- Name: car_models car_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_models
    ADD CONSTRAINT car_models_pkey PRIMARY KEY (id);


--
-- Name: car_powertrains_electric car_powertrains_electric_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_powertrains_electric
    ADD CONSTRAINT car_powertrains_electric_pkey PRIMARY KEY (id);


--
-- Name: car_powertrains_ice car_powertrains_ice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_powertrains_ice
    ADD CONSTRAINT car_powertrains_ice_pkey PRIMARY KEY (id);


--
-- Name: car_variants car_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_variants
    ADD CONSTRAINT car_variants_pkey PRIMARY KEY (id);


--
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: feature_categories feature_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_categories
    ADD CONSTRAINT feature_categories_pkey PRIMARY KEY (id);


--
-- Name: features features_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.features
    ADD CONSTRAINT features_pkey PRIMARY KEY (id);


--
-- Name: insurance_leads insurance_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_leads
    ADD CONSTRAINT insurance_leads_pkey PRIMARY KEY (id);


--
-- Name: lead_activities lead_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_pkey PRIMARY KEY (id);


--
-- Name: lenders lenders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lenders
    ADD CONSTRAINT lenders_pkey PRIMARY KEY (id);


--
-- Name: loan_leads loan_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_leads
    ADD CONSTRAINT loan_leads_pkey PRIMARY KEY (id);


--
-- Name: mileage_logs mileage_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mileage_logs
    ADD CONSTRAINT mileage_logs_pkey PRIMARY KEY (id);


--
-- Name: new_car_offers new_car_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.new_car_offers
    ADD CONSTRAINT new_car_offers_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: page_views page_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: price_drop_alert_leads price_drop_alert_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_drop_alert_leads
    ADD CONSTRAINT price_drop_alert_leads_pkey PRIMARY KEY (id);


--
-- Name: review_category_scores review_category_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_category_scores
    ADD CONSTRAINT review_category_scores_pkey PRIMARY KEY (id);


--
-- Name: review_helpful_votes review_helpful_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_helpful_votes
    ADD CONSTRAINT review_helpful_votes_pkey PRIMARY KEY (id);


--
-- Name: review_images review_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_images
    ADD CONSTRAINT review_images_pkey PRIMARY KEY (id);


--
-- Name: review_replies review_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_replies
    ADD CONSTRAINT review_replies_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: search_logs search_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_logs
    ADD CONSTRAINT search_logs_pkey PRIMARY KEY (id);


--
-- Name: sell_car_leads sell_car_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sell_car_leads
    ADD CONSTRAINT sell_car_leads_pkey PRIMARY KEY (id);


--
-- Name: seo_meta seo_meta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_meta
    ADD CONSTRAINT seo_meta_pkey PRIMARY KEY (id);


--
-- Name: seo_redirects seo_redirects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_redirects
    ADD CONSTRAINT seo_redirects_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: sitemap_entries sitemap_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sitemap_entries
    ADD CONSTRAINT sitemap_entries_pkey PRIMARY KEY (id);


--
-- Name: soft_leads soft_leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.soft_leads
    ADD CONSTRAINT soft_leads_pkey PRIMARY KEY (id);


--
-- Name: states states_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.states
    ADD CONSTRAINT states_pkey PRIMARY KEY (id);


--
-- Name: story_groups story_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_groups
    ADD CONSTRAINT story_groups_pkey PRIMARY KEY (id);


--
-- Name: story_items story_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_items
    ADD CONSTRAINT story_items_pkey PRIMARY KEY (id);


--
-- Name: testimonials testimonials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_pkey PRIMARY KEY (id);


--
-- Name: used_car_listing_images used_car_listing_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.used_car_listing_images
    ADD CONSTRAINT used_car_listing_images_pkey PRIMARY KEY (id);


--
-- Name: used_car_listings used_car_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.used_car_listings
    ADD CONSTRAINT used_car_listings_pkey PRIMARY KEY (id);


--
-- Name: user_addresses user_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_addresses
    ADD CONSTRAINT user_addresses_pkey PRIMARY KEY (id);


--
-- Name: user_otp_verifications user_otp_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_otp_verifications
    ADD CONSTRAINT user_otp_verifications_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: variant_features variant_features_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.variant_features
    ADD CONSTRAINT variant_features_pkey PRIMARY KEY (id);


--
-- Name: ad_clicks_campaign_id_clicked_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ad_clicks_campaign_id_clicked_at_idx ON public.ad_clicks USING btree (campaign_id, clicked_at);


--
-- Name: ad_clicks_impression_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ad_clicks_impression_id_idx ON public.ad_clicks USING btree (impression_id);


--
-- Name: ad_clicks_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ad_clicks_session_id_idx ON public.ad_clicks USING btree (session_id);


--
-- Name: ad_impressions_campaign_id_viewed_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ad_impressions_campaign_id_viewed_at_idx ON public.ad_impressions USING btree (campaign_id, viewed_at);


--
-- Name: ad_impressions_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ad_impressions_session_id_idx ON public.ad_impressions USING btree (session_id);


--
-- Name: ad_placements_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ad_placements_slug_key ON public.ad_placements USING btree (slug);


--
-- Name: admin_logs_admin_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_logs_admin_id_created_at_idx ON public.admin_logs USING btree (admin_id, created_at);


--
-- Name: admin_otp_verifications_mobile_purpose_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_otp_verifications_mobile_purpose_idx ON public.admin_otp_verifications USING btree (mobile, purpose);


--
-- Name: admin_users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX admin_users_email_key ON public.admin_users USING btree (email);


--
-- Name: admin_users_mobile_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX admin_users_mobile_key ON public.admin_users USING btree (mobile);


--
-- Name: admin_users_role_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_users_role_id_idx ON public.admin_users USING btree (role_id);


--
-- Name: ai_automation_rules_feature_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ai_automation_rules_feature_key_key ON public.ai_automation_rules USING btree (feature_key);


--
-- Name: ai_image_pool_feature_key_is_used_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_image_pool_feature_key_is_used_idx ON public.ai_image_pool USING btree (feature_key, is_used);


--
-- Name: ai_logs_feature_key_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_logs_feature_key_created_at_idx ON public.ai_logs USING btree (feature_key, created_at);


--
-- Name: article_brands_article_id_brand_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX article_brands_article_id_brand_id_key ON public.article_brands USING btree (article_id, brand_id);


--
-- Name: article_brands_brand_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX article_brands_brand_id_idx ON public.article_brands USING btree (brand_id);


--
-- Name: article_car_models_article_id_model_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX article_car_models_article_id_model_id_key ON public.article_car_models USING btree (article_id, model_id);


--
-- Name: article_car_models_model_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX article_car_models_model_id_idx ON public.article_car_models USING btree (model_id);


--
-- Name: article_categories_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX article_categories_slug_key ON public.article_categories USING btree (slug);


--
-- Name: articles_category_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX articles_category_id_idx ON public.articles USING btree (category_id);


--
-- Name: articles_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX articles_slug_key ON public.articles USING btree (slug);


--
-- Name: articles_status_is_active_published_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX articles_status_is_active_published_at_idx ON public.articles USING btree (status, is_active, published_at);


--
-- Name: attribute_options_category_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX attribute_options_category_slug_key ON public.attribute_options USING btree (category, slug);


--
-- Name: banners_is_active_display_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX banners_is_active_display_order_idx ON public.banners USING btree (is_active, display_order);


--
-- Name: body_types_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX body_types_slug_key ON public.body_types USING btree (slug);


--
-- Name: brands_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX brands_slug_key ON public.brands USING btree (slug);


--
-- Name: buy_new_car_leads_brand_id_model_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX buy_new_car_leads_brand_id_model_id_idx ON public.buy_new_car_leads USING btree (brand_id, model_id);


--
-- Name: buy_new_car_leads_mobile_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX buy_new_car_leads_mobile_idx ON public.buy_new_car_leads USING btree (mobile);


--
-- Name: buy_new_car_leads_status_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX buy_new_car_leads_status_created_at_idx ON public.buy_new_car_leads USING btree (status, created_at);


--
-- Name: buy_used_car_leads_brand_id_model_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX buy_used_car_leads_brand_id_model_id_idx ON public.buy_used_car_leads USING btree (brand_id, model_id);


--
-- Name: buy_used_car_leads_mobile_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX buy_used_car_leads_mobile_idx ON public.buy_used_car_leads USING btree (mobile);


--
-- Name: buy_used_car_leads_status_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX buy_used_car_leads_status_created_at_idx ON public.buy_used_car_leads USING btree (status, created_at);


--
-- Name: car_colors_model_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX car_colors_model_id_idx ON public.car_colors USING btree (model_id);


--
-- Name: car_faqs_model_id_display_order_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX car_faqs_model_id_display_order_key ON public.car_faqs USING btree (model_id, display_order);


--
-- Name: car_images_model_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX car_images_model_id_idx ON public.car_images USING btree (model_id);


--
-- Name: car_models_body_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX car_models_body_status_idx ON public.car_models USING btree (body_type_id, launch_status);


--
-- Name: car_models_body_type_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX car_models_body_type_id_idx ON public.car_models USING btree (body_type_id);


--
-- Name: car_models_brand_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX car_models_brand_id_idx ON public.car_models USING btree (brand_id);


--
-- Name: car_models_brand_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX car_models_brand_status_idx ON public.car_models USING btree (brand_id, launch_status);


--
-- Name: car_models_browse_price_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX car_models_browse_price_idx ON public.car_models USING btree (launch_status, price_min) WHERE (variant_count > 0);


--
-- Name: car_models_browse_rating_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX car_models_browse_rating_idx ON public.car_models USING btree (launch_status, rating_avg DESC NULLS LAST, created_at DESC) WHERE (variant_count > 0);


--
-- Name: car_models_has_cng_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX car_models_has_cng_idx ON public.car_models USING btree (launch_status) WHERE has_cng;


--
-- Name: car_models_has_diesel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX car_models_has_diesel_idx ON public.car_models USING btree (launch_status) WHERE has_diesel;


--
-- Name: car_models_has_electric_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX car_models_has_electric_idx ON public.car_models USING btree (launch_status) WHERE has_electric;


--
-- Name: car_models_has_petrol_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX car_models_has_petrol_idx ON public.car_models USING btree (launch_status) WHERE has_petrol;


--
-- Name: car_models_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX car_models_slug_key ON public.car_models USING btree (slug);


--
-- Name: car_powertrains_electric_variant_id_is_deleted_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX car_powertrains_electric_variant_id_is_deleted_idx ON public.car_powertrains_electric USING btree (variant_id, is_deleted);


--
-- Name: car_powertrains_ice_variant_id_is_deleted_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX car_powertrains_ice_variant_id_is_deleted_idx ON public.car_powertrains_ice USING btree (variant_id, is_deleted);


--
-- Name: car_variants_model_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX car_variants_model_id_idx ON public.car_variants USING btree (model_id);


--
-- Name: car_variants_model_id_variant_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX car_variants_model_id_variant_name_key ON public.car_variants USING btree (model_id, variant_name);


--
-- Name: cities_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cities_slug_key ON public.cities USING btree (slug);


--
-- Name: cities_state_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cities_state_id_idx ON public.cities USING btree (state_id);


--
-- Name: feature_categories_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX feature_categories_name_key ON public.feature_categories USING btree (name);


--
-- Name: features_category_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX features_category_id_idx ON public.features USING btree (category_id);


--
-- Name: features_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX features_name_key ON public.features USING btree (name);


--
-- Name: insurance_leads_brand_id_model_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX insurance_leads_brand_id_model_id_idx ON public.insurance_leads USING btree (brand_id, model_id);


--
-- Name: insurance_leads_mobile_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX insurance_leads_mobile_idx ON public.insurance_leads USING btree (mobile);


--
-- Name: insurance_leads_status_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX insurance_leads_status_created_at_idx ON public.insurance_leads USING btree (status, created_at);


--
-- Name: lead_activities_admin_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lead_activities_admin_id_idx ON public.lead_activities USING btree (admin_id);


--
-- Name: lead_activities_lead_type_lead_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lead_activities_lead_type_lead_id_idx ON public.lead_activities USING btree (lead_type, lead_id);


--
-- Name: loan_leads_brand_id_model_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX loan_leads_brand_id_model_id_idx ON public.loan_leads USING btree (brand_id, model_id);


--
-- Name: loan_leads_mobile_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX loan_leads_mobile_idx ON public.loan_leads USING btree (mobile);


--
-- Name: loan_leads_status_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX loan_leads_status_created_at_idx ON public.loan_leads USING btree (status, created_at);


--
-- Name: new_car_offers_is_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX new_car_offers_is_active_idx ON public.new_car_offers USING btree (is_active);


--
-- Name: new_car_offers_model_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX new_car_offers_model_id_idx ON public.new_car_offers USING btree (model_id);


--
-- Name: permissions_permission_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX permissions_permission_key_key ON public.permissions USING btree (permission_key);


--
-- Name: price_drop_alert_leads_brand_id_model_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX price_drop_alert_leads_brand_id_model_id_idx ON public.price_drop_alert_leads USING btree (brand_id, model_id);


--
-- Name: price_drop_alert_leads_is_active_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX price_drop_alert_leads_is_active_created_at_idx ON public.price_drop_alert_leads USING btree (is_active, created_at);


--
-- Name: price_drop_alert_leads_mobile_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX price_drop_alert_leads_mobile_idx ON public.price_drop_alert_leads USING btree (mobile);


--
-- Name: review_helpful_votes_review_id_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX review_helpful_votes_review_id_user_id_key ON public.review_helpful_votes USING btree (review_id, user_id);


--
-- Name: reviews_model_id_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reviews_model_id_status_idx ON public.reviews USING btree (model_id, status);


--
-- Name: role_permissions_permission_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX role_permissions_permission_id_idx ON public.role_permissions USING btree (permission_id);


--
-- Name: search_logs_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX search_logs_created_at_idx ON public.search_logs USING btree (created_at);


--
-- Name: search_logs_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX search_logs_user_id_idx ON public.search_logs USING btree (user_id);


--
-- Name: sell_car_leads_brand_id_model_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sell_car_leads_brand_id_model_id_idx ON public.sell_car_leads USING btree (brand_id, model_id);


--
-- Name: sell_car_leads_mobile_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sell_car_leads_mobile_idx ON public.sell_car_leads USING btree (mobile);


--
-- Name: sell_car_leads_status_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sell_car_leads_status_created_at_idx ON public.sell_car_leads USING btree (status, created_at);


--
-- Name: seo_meta_page_type_entity_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX seo_meta_page_type_entity_id_key ON public.seo_meta USING btree (page_type, entity_id);


--
-- Name: seo_redirects_old_path_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX seo_redirects_old_path_key ON public.seo_redirects USING btree (old_path);


--
-- Name: soft_leads_brand_id_model_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX soft_leads_brand_id_model_id_idx ON public.soft_leads USING btree (brand_id, model_id);


--
-- Name: soft_leads_mobile_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX soft_leads_mobile_idx ON public.soft_leads USING btree (mobile);


--
-- Name: soft_leads_status_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX soft_leads_status_created_at_idx ON public.soft_leads USING btree (status, created_at);


--
-- Name: states_country_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX states_country_id_idx ON public.states USING btree (country_id);


--
-- Name: story_groups_display_order_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX story_groups_display_order_key ON public.story_groups USING btree (display_order);


--
-- Name: story_items_group_id_display_order_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX story_items_group_id_display_order_key ON public.story_items USING btree (group_id, display_order);


--
-- Name: used_car_listings_city_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX used_car_listings_city_id_idx ON public.used_car_listings USING btree (city_id);


--
-- Name: used_car_listings_model_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX used_car_listings_model_id_idx ON public.used_car_listings USING btree (model_id);


--
-- Name: used_car_listings_seller_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX used_car_listings_seller_id_idx ON public.used_car_listings USING btree (seller_id);


--
-- Name: used_car_listings_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX used_car_listings_status_idx ON public.used_car_listings USING btree (status);


--
-- Name: user_otp_verifications_mobile_purpose_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_otp_verifications_mobile_purpose_idx ON public.user_otp_verifications USING btree (mobile, purpose);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_mobile_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_mobile_key ON public.users USING btree (mobile);


--
-- Name: variant_features_feature_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX variant_features_feature_id_idx ON public.variant_features USING btree (feature_id);


--
-- Name: variant_features_variant_id_feature_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX variant_features_variant_id_feature_id_key ON public.variant_features USING btree (variant_id, feature_id);


--
-- Name: car_powertrains_electric car_powertrains_electric_derived_aiud; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER car_powertrains_electric_derived_aiud AFTER INSERT OR DELETE OR UPDATE OF variant_id, is_deleted ON public.car_powertrains_electric FOR EACH ROW EXECUTE FUNCTION public.trg_car_powertrain_derived();


--
-- Name: car_powertrains_ice car_powertrains_ice_derived_aiud; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER car_powertrains_ice_derived_aiud AFTER INSERT OR DELETE OR UPDATE OF variant_id, fuel_type, is_deleted ON public.car_powertrains_ice FOR EACH ROW EXECUTE FUNCTION public.trg_car_powertrain_derived();


--
-- Name: car_variants car_variants_derived_aiud; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER car_variants_derived_aiud AFTER INSERT OR DELETE OR UPDATE OF model_id ON public.car_variants FOR EACH ROW EXECUTE FUNCTION public.trg_car_variant_derived();


--
-- Name: ad_campaigns ad_campaigns_advertiser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_campaigns
    ADD CONSTRAINT ad_campaigns_advertiser_id_fkey FOREIGN KEY (advertiser_id) REFERENCES public.advertisers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ad_campaigns ad_campaigns_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_campaigns
    ADD CONSTRAINT ad_campaigns_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ad_campaigns ad_campaigns_placement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_campaigns
    ADD CONSTRAINT ad_campaigns_placement_id_fkey FOREIGN KEY (placement_id) REFERENCES public.ad_placements(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ad_campaigns ad_campaigns_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_campaigns
    ADD CONSTRAINT ad_campaigns_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ad_clicks ad_clicks_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_clicks
    ADD CONSTRAINT ad_clicks_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ad_clicks ad_clicks_impression_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_clicks
    ADD CONSTRAINT ad_clicks_impression_id_fkey FOREIGN KEY (impression_id) REFERENCES public.ad_impressions(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ad_clicks ad_clicks_placement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_clicks
    ADD CONSTRAINT ad_clicks_placement_id_fkey FOREIGN KEY (placement_id) REFERENCES public.ad_placements(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ad_clicks ad_clicks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_clicks
    ADD CONSTRAINT ad_clicks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ad_impressions ad_impressions_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_impressions
    ADD CONSTRAINT ad_impressions_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ad_impressions ad_impressions_placement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_impressions
    ADD CONSTRAINT ad_impressions_placement_id_fkey FOREIGN KEY (placement_id) REFERENCES public.ad_placements(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ad_impressions ad_impressions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_impressions
    ADD CONSTRAINT ad_impressions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ad_placements ad_placements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_placements
    ADD CONSTRAINT ad_placements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ad_placements ad_placements_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_placements
    ADD CONSTRAINT ad_placements_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: admin_logs admin_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: admin_otp_verifications admin_otp_verifications_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_otp_verifications
    ADD CONSTRAINT admin_otp_verifications_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: admin_users admin_users_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: admin_users admin_users_locked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_locked_by_fkey FOREIGN KEY (locked_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: admin_users admin_users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: admin_users admin_users_unlocked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_unlocked_by_fkey FOREIGN KEY (unlocked_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: advertisers advertisers_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advertisers
    ADD CONSTRAINT advertisers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: advertisers advertisers_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advertisers
    ADD CONSTRAINT advertisers_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_articles ai_articles_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_articles
    ADD CONSTRAINT ai_articles_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ai_articles ai_articles_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_articles
    ADD CONSTRAINT ai_articles_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.article_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ai_articles ai_articles_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_articles
    ADD CONSTRAINT ai_articles_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.car_models(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_articles ai_articles_published_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_articles
    ADD CONSTRAINT ai_articles_published_article_id_fkey FOREIGN KEY (published_article_id) REFERENCES public.articles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_articles ai_articles_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_articles
    ADD CONSTRAINT ai_articles_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_articles ai_articles_source_image_pool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_articles
    ADD CONSTRAINT ai_articles_source_image_pool_id_fkey FOREIGN KEY (source_image_pool_id) REFERENCES public.ai_image_pool(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ai_automation_rules ai_automation_rules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_automation_rules
    ADD CONSTRAINT ai_automation_rules_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_automation_rules ai_automation_rules_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_automation_rules
    ADD CONSTRAINT ai_automation_rules_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_faqs ai_faqs_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_faqs
    ADD CONSTRAINT ai_faqs_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.car_models(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ai_faqs ai_faqs_published_faq_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_faqs
    ADD CONSTRAINT ai_faqs_published_faq_id_fkey FOREIGN KEY (published_faq_id) REFERENCES public.car_faqs(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_faqs ai_faqs_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_faqs
    ADD CONSTRAINT ai_faqs_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_image_pool ai_image_pool_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_image_pool
    ADD CONSTRAINT ai_image_pool_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_settings ai_settings_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_settings
    ADD CONSTRAINT ai_settings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ai_settings ai_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_settings
    ADD CONSTRAINT ai_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ai_story_items ai_story_items_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_story_items
    ADD CONSTRAINT ai_story_items_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.story_groups(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ai_story_items ai_story_items_published_story_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_story_items
    ADD CONSTRAINT ai_story_items_published_story_item_id_fkey FOREIGN KEY (published_story_item_id) REFERENCES public.story_items(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_story_items ai_story_items_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_story_items
    ADD CONSTRAINT ai_story_items_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ai_story_items ai_story_items_source_image_pool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_story_items
    ADD CONSTRAINT ai_story_items_source_image_pool_id_fkey FOREIGN KEY (source_image_pool_id) REFERENCES public.ai_image_pool(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: article_brands article_brands_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_brands
    ADD CONSTRAINT article_brands_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: article_brands article_brands_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_brands
    ADD CONSTRAINT article_brands_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: article_car_models article_car_models_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_car_models
    ADD CONSTRAINT article_car_models_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: article_car_models article_car_models_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_car_models
    ADD CONSTRAINT article_car_models_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.car_models(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: article_categories article_categories_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_categories
    ADD CONSTRAINT article_categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: article_categories article_categories_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_categories
    ADD CONSTRAINT article_categories_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: article_comments article_comments_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_comments
    ADD CONSTRAINT article_comments_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: article_comments article_comments_parent_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_comments
    ADD CONSTRAINT article_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.article_comments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: article_comments article_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.article_comments
    ADD CONSTRAINT article_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: articles articles_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: articles articles_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.article_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: articles articles_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: articles articles_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles
    ADD CONSTRAINT articles_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: banners banners_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: banners banners_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: brands brands_country_origin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_country_origin_id_fkey FOREIGN KEY (country_origin_id) REFERENCES public.countries(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: buy_new_car_leads buy_new_car_leads_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buy_new_car_leads
    ADD CONSTRAINT buy_new_car_leads_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: buy_new_car_leads buy_new_car_leads_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buy_new_car_leads
    ADD CONSTRAINT buy_new_car_leads_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: buy_new_car_leads buy_new_car_leads_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buy_new_car_leads
    ADD CONSTRAINT buy_new_car_leads_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.car_models(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: buy_new_car_leads buy_new_car_leads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buy_new_car_leads
    ADD CONSTRAINT buy_new_car_leads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: buy_new_car_leads buy_new_car_leads_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buy_new_car_leads
    ADD CONSTRAINT buy_new_car_leads_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.car_variants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: buy_used_car_leads buy_used_car_leads_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buy_used_car_leads
    ADD CONSTRAINT buy_used_car_leads_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: buy_used_car_leads buy_used_car_leads_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buy_used_car_leads
    ADD CONSTRAINT buy_used_car_leads_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.used_car_listings(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: buy_used_car_leads buy_used_car_leads_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buy_used_car_leads
    ADD CONSTRAINT buy_used_car_leads_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.car_models(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: buy_used_car_leads buy_used_car_leads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buy_used_car_leads
    ADD CONSTRAINT buy_used_car_leads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: car_color_shades car_color_shades_color_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_color_shades
    ADD CONSTRAINT car_color_shades_color_id_fkey FOREIGN KEY (color_id) REFERENCES public.car_colors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: car_colors car_colors_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_colors
    ADD CONSTRAINT car_colors_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.car_models(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: car_faqs car_faqs_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_faqs
    ADD CONSTRAINT car_faqs_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.car_models(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: car_images car_images_color_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_images
    ADD CONSTRAINT car_images_color_id_fkey FOREIGN KEY (color_id) REFERENCES public.car_colors(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: car_images car_images_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_images
    ADD CONSTRAINT car_images_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.car_models(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: car_models car_models_body_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_models
    ADD CONSTRAINT car_models_body_type_id_fkey FOREIGN KEY (body_type_id) REFERENCES public.body_types(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: car_models car_models_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_models
    ADD CONSTRAINT car_models_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: car_powertrains_electric car_powertrains_electric_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_powertrains_electric
    ADD CONSTRAINT car_powertrains_electric_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: car_powertrains_electric car_powertrains_electric_drivetrain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_powertrains_electric
    ADD CONSTRAINT car_powertrains_electric_drivetrain_id_fkey FOREIGN KEY (drivetrain_id) REFERENCES public.attribute_options(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: car_powertrains_electric car_powertrains_electric_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_powertrains_electric
    ADD CONSTRAINT car_powertrains_electric_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.car_variants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: car_powertrains_ice car_powertrains_ice_deleted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_powertrains_ice
    ADD CONSTRAINT car_powertrains_ice_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: car_powertrains_ice car_powertrains_ice_drivetrain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_powertrains_ice
    ADD CONSTRAINT car_powertrains_ice_drivetrain_id_fkey FOREIGN KEY (drivetrain_id) REFERENCES public.attribute_options(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: car_powertrains_ice car_powertrains_ice_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_powertrains_ice
    ADD CONSTRAINT car_powertrains_ice_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.car_variants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: car_variants car_variants_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_variants
    ADD CONSTRAINT car_variants_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.car_models(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: car_variants car_variants_transmission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.car_variants
    ADD CONSTRAINT car_variants_transmission_id_fkey FOREIGN KEY (transmission_id) REFERENCES public.attribute_options(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: cities cities_state_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_state_id_fkey FOREIGN KEY (state_id) REFERENCES public.states(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: features features_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.features
    ADD CONSTRAINT features_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.feature_categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: insurance_leads insurance_leads_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_leads
    ADD CONSTRAINT insurance_leads_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: insurance_leads insurance_leads_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_leads
    ADD CONSTRAINT insurance_leads_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: insurance_leads insurance_leads_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_leads
    ADD CONSTRAINT insurance_leads_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.car_models(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: insurance_leads insurance_leads_registration_state_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_leads
    ADD CONSTRAINT insurance_leads_registration_state_id_fkey FOREIGN KEY (registration_state_id) REFERENCES public.states(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: insurance_leads insurance_leads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_leads
    ADD CONSTRAINT insurance_leads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: insurance_leads insurance_leads_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_leads
    ADD CONSTRAINT insurance_leads_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.car_variants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: lead_activities lead_activities_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_activities
    ADD CONSTRAINT lead_activities_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: lenders lenders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lenders
    ADD CONSTRAINT lenders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: lenders lenders_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lenders
    ADD CONSTRAINT lenders_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: loan_leads loan_leads_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_leads
    ADD CONSTRAINT loan_leads_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: loan_leads loan_leads_lender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_leads
    ADD CONSTRAINT loan_leads_lender_id_fkey FOREIGN KEY (lender_id) REFERENCES public.lenders(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: loan_leads loan_leads_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_leads
    ADD CONSTRAINT loan_leads_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.car_models(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: loan_leads loan_leads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_leads
    ADD CONSTRAINT loan_leads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: loan_leads loan_leads_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loan_leads
    ADD CONSTRAINT loan_leads_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.car_variants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: mileage_logs mileage_logs_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mileage_logs
    ADD CONSTRAINT mileage_logs_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.car_models(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: mileage_logs mileage_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mileage_logs
    ADD CONSTRAINT mileage_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: new_car_offers new_car_offers_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.new_car_offers
    ADD CONSTRAINT new_car_offers_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: new_car_offers new_car_offers_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.new_car_offers
    ADD CONSTRAINT new_car_offers_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.car_models(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: new_car_offers new_car_offers_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.new_car_offers
    ADD CONSTRAINT new_car_offers_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.car_variants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: page_views page_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: price_drop_alert_leads price_drop_alert_leads_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_drop_alert_leads
    ADD CONSTRAINT price_drop_alert_leads_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: price_drop_alert_leads price_drop_alert_leads_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_drop_alert_leads
    ADD CONSTRAINT price_drop_alert_leads_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.car_models(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: price_drop_alert_leads price_drop_alert_leads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_drop_alert_leads
    ADD CONSTRAINT price_drop_alert_leads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: review_category_scores review_category_scores_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_category_scores
    ADD CONSTRAINT review_category_scores_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: review_helpful_votes review_helpful_votes_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_helpful_votes
    ADD CONSTRAINT review_helpful_votes_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: review_helpful_votes review_helpful_votes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_helpful_votes
    ADD CONSTRAINT review_helpful_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: review_images review_images_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_images
    ADD CONSTRAINT review_images_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: review_replies review_replies_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_replies
    ADD CONSTRAINT review_replies_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: review_replies review_replies_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_replies
    ADD CONSTRAINT review_replies_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: review_replies review_replies_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_replies
    ADD CONSTRAINT review_replies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reviews reviews_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.car_models(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reviews reviews_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.car_variants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: roles roles_parent_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_parent_role_id_fkey FOREIGN KEY (parent_role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: search_logs search_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_logs
    ADD CONSTRAINT search_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sell_car_leads sell_car_leads_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sell_car_leads
    ADD CONSTRAINT sell_car_leads_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sell_car_leads sell_car_leads_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sell_car_leads
    ADD CONSTRAINT sell_car_leads_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sell_car_leads sell_car_leads_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sell_car_leads
    ADD CONSTRAINT sell_car_leads_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.car_models(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sell_car_leads sell_car_leads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sell_car_leads
    ADD CONSTRAINT sell_car_leads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: seo_meta seo_meta_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_meta
    ADD CONSTRAINT seo_meta_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: seo_meta seo_meta_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_meta
    ADD CONSTRAINT seo_meta_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: seo_redirects seo_redirects_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_redirects
    ADD CONSTRAINT seo_redirects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: site_settings site_settings_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: site_settings site_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: soft_leads soft_leads_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.soft_leads
    ADD CONSTRAINT soft_leads_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: soft_leads soft_leads_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.soft_leads
    ADD CONSTRAINT soft_leads_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.car_models(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: soft_leads soft_leads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.soft_leads
    ADD CONSTRAINT soft_leads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: states states_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.states
    ADD CONSTRAINT states_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: story_groups story_groups_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_groups
    ADD CONSTRAINT story_groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: story_groups story_groups_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_groups
    ADD CONSTRAINT story_groups_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: story_items story_items_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_items
    ADD CONSTRAINT story_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: story_items story_items_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_items
    ADD CONSTRAINT story_items_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.story_groups(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: story_items story_items_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_items
    ADD CONSTRAINT story_items_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: testimonials testimonials_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: testimonials testimonials_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.admin_users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: testimonials testimonials_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: used_car_listing_images used_car_listing_images_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.used_car_listing_images
    ADD CONSTRAINT used_car_listing_images_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.used_car_listings(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: used_car_listings used_car_listings_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.used_car_listings
    ADD CONSTRAINT used_car_listings_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: used_car_listings used_car_listings_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.used_car_listings
    ADD CONSTRAINT used_car_listings_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.car_models(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: used_car_listings used_car_listings_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.used_car_listings
    ADD CONSTRAINT used_car_listings_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: used_car_listings used_car_listings_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.used_car_listings
    ADD CONSTRAINT used_car_listings_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.car_variants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_addresses user_addresses_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_addresses
    ADD CONSTRAINT user_addresses_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_addresses user_addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_addresses
    ADD CONSTRAINT user_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users users_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: variant_features variant_features_feature_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.variant_features
    ADD CONSTRAINT variant_features_feature_id_fkey FOREIGN KEY (feature_id) REFERENCES public.features(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: variant_features variant_features_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.variant_features
    ADD CONSTRAINT variant_features_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.car_variants(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\restrict lXmU4GEt7mx7LvAbBjpC06bEConofDmMhzUEb90Fk7S0vbi8xthvXgstiqx5dbn
CREATE TABLE public.fuel_prices (
    id bigint NOT NULL,
    city_id integer NOT NULL,
    fuel_type smallint NOT NULL,
    price numeric(10,2) NOT NULL,
    price_change numeric(10,2) DEFAULT 0 NOT NULL,
    applicable_on date NOT NULL,
    created_at timestamp(3) without time zone DEFAULT now() NOT NULL,
    CONSTRAINT fuel_prices_fuel_type_check CHECK ((fuel_type = ANY (ARRAY[1, 2, 3])))
);
ALTER TABLE public.fuel_prices OWNER TO postgres;
CREATE SEQUENCE public.fuel_prices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.fuel_prices_id_seq OWNER TO postgres;
ALTER SEQUENCE public.fuel_prices_id_seq OWNED BY public.fuel_prices.id;
ALTER TABLE ONLY public.fuel_prices ALTER COLUMN id SET DEFAULT nextval('public.fuel_prices_id_seq'::regclass);
ALTER TABLE ONLY public.fuel_prices
    ADD CONSTRAINT fuel_prices_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.fuel_prices
    ADD CONSTRAINT fuel_prices_unique UNIQUE (city_id, fuel_type, applicable_on);
CREATE INDEX fuel_prices_day_idx ON public.fuel_prices USING btree (applicable_on DESC);
CREATE INDEX fuel_prices_latest_idx ON public.fuel_prices USING btree (city_id, fuel_type, applicable_on DESC);
ALTER TABLE ONLY public.fuel_prices
    ADD CONSTRAINT fuel_prices_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id);
\unrestrict lXmU4GEt7mx7LvAbBjpC06bEConofDmMhzUEb90Fk7S0vbi8xthvXgstiqx5dbn

CREATE TABLE public.road_tax_rates (
    id integer NOT NULL,
    state_id integer NOT NULL,
    fuel_type text,
    basis text NOT NULL,
    slab_min numeric(12,2) DEFAULT 0 NOT NULL,
    slab_max numeric(12,2),
    rate_pct numeric(5,2) NOT NULL,
    min_amount numeric(12,2),
    effective_from date NOT NULL,
    source_url text,
    verified boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.road_tax_rates OWNER TO postgres;
ALTER TABLE ONLY public.road_tax_rates ADD CONSTRAINT road_tax_rates_pkey PRIMARY KEY (id);

CREATE TABLE public.road_tax_fixed_charges (
    id integer NOT NULL,
    state_id integer,
    registration numeric(10,2) DEFAULT 600 NOT NULL,
    hsrp numeric(10,2) DEFAULT 400 NOT NULL,
    fastag numeric(10,2) DEFAULT 500 NOT NULL,
    hypothecation numeric(10,2) DEFAULT 1500 NOT NULL,
    effective_from date NOT NULL,
    source_url text
);
ALTER TABLE public.road_tax_fixed_charges OWNER TO postgres;
ALTER TABLE ONLY public.road_tax_fixed_charges ADD CONSTRAINT road_tax_fixed_charges_pkey PRIMARY KEY (id);
