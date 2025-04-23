--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 17.4

-- Started on 2025-04-23 17:27:51

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 216 (class 1259 OID 16401)
-- Name: Conversation; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."Conversation" (
    conversation_id uuid NOT NULL,
    name character varying(255),
    avatar bytea,
    background bytea
);


ALTER TABLE public."Conversation" OWNER TO "user";

--
-- TOC entry 215 (class 1259 OID 16389)
-- Name: User; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public."User" (
    user_id uuid NOT NULL,
    username character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    public_key character varying NOT NULL,
    private_key character varying
);


ALTER TABLE public."User" OWNER TO "user";

--
-- TOC entry 3359 (class 0 OID 16401)
-- Dependencies: 216
-- Data for Name: Conversation; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."Conversation" (conversation_id, name, avatar, background) FROM stdin;
\.


--
-- TOC entry 3358 (class 0 OID 16389)
-- Dependencies: 215
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public."User" (user_id, username, password_hash, email, updated_at, public_key, private_key) FROM stdin;
\.


--
-- TOC entry 3214 (class 2606 OID 16407)
-- Name: Conversation Conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY (conversation_id);


--
-- TOC entry 3208 (class 2606 OID 16400)
-- Name: User User_email_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key" UNIQUE (email);


--
-- TOC entry 3210 (class 2606 OID 16396)
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (user_id);


--
-- TOC entry 3212 (class 2606 OID 16398)
-- Name: User User_username_key; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_username_key" UNIQUE (username);


-- Completed on 2025-04-23 17:28:01

--
-- PostgreSQL database dump complete
--

