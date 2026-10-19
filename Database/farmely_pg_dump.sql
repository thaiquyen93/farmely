--
-- PostgreSQL database dump
--

\restrict 3PU8MefwnpGe1Fd2DrjTQASoHMh0Dd2t4v5e3JamsPik6kqJ4OZZiz8g7y8H388

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

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

ALTER TABLE IF EXISTS ONLY public.varieties DROP CONSTRAINT IF EXISTS varieties_crop_id_fkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.template_steps DROP CONSTRAINT IF EXISTS template_steps_template_id_fkey;
ALTER TABLE IF EXISTS ONLY public.site_visits DROP CONSTRAINT IF EXISTS site_visits_plot_id_fkey;
ALTER TABLE IF EXISTS ONLY public.service_requests DROP CONSTRAINT IF EXISTS service_requests_service_id_fkey;
ALTER TABLE IF EXISTS ONLY public.service_requests DROP CONSTRAINT IF EXISTS service_requests_rental_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sensor_readings DROP CONSTRAINT IF EXISTS sensor_readings_plot_id_fkey;
ALTER TABLE IF EXISTS ONLY public.rentals DROP CONSTRAINT IF EXISTS rentals_variety_id_fkey;
ALTER TABLE IF EXISTS ONLY public.rentals DROP CONSTRAINT IF EXISTS rentals_service_id_fkey;
ALTER TABLE IF EXISTS ONLY public.rentals DROP CONSTRAINT IF EXISTS rentals_plot_id_fkey;
ALTER TABLE IF EXISTS ONLY public.rentals DROP CONSTRAINT IF EXISTS rentals_parent_rental_id_fkey;
ALTER TABLE IF EXISTS ONLY public.rentals DROP CONSTRAINT IF EXISTS rentals_contract_id_fkey;
ALTER TABLE IF EXISTS ONLY public.process_templates DROP CONSTRAINT IF EXISTS process_templates_variety_id_fkey;
ALTER TABLE IF EXISTS ONLY public.process_templates DROP CONSTRAINT IF EXISTS process_templates_pt_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.plots DROP CONSTRAINT IF EXISTS plots_land_id_fkey;
ALTER TABLE IF EXISTS ONLY public.plot_variety_compatibility DROP CONSTRAINT IF EXISTS plot_variety_compatibility_variety_id_fkey;
ALTER TABLE IF EXISTS ONLY public.plot_variety_compatibility DROP CONSTRAINT IF EXISTS plot_variety_compatibility_plot_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_service_request_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_contract_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_cancellation_request_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
ALTER TABLE IF EXISTS ONLY public.knowledge_documents DROP CONSTRAINT IF EXISTS knowledge_documents_kd_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.issue_reports DROP CONSTRAINT IF EXISTS issue_reports_reported_by_fkey;
ALTER TABLE IF EXISTS ONLY public.issue_reports DROP CONSTRAINT IF EXISTS issue_reports_rental_id_fkey;
ALTER TABLE IF EXISTS ONLY public.issue_reports DROP CONSTRAINT IF EXISTS issue_reports_handled_by_fkey;
ALTER TABLE IF EXISTS ONLY public.harvest_results DROP CONSTRAINT IF EXISTS harvest_results_rental_id_fkey;
ALTER TABLE IF EXISTS ONLY public.harvest_results DROP CONSTRAINT IF EXISTS harvest_results_entered_by_fkey;
ALTER TABLE IF EXISTS ONLY public.farm_diaries DROP CONSTRAINT IF EXISTS farm_diaries_task_id_fkey;
ALTER TABLE IF EXISTS ONLY public.farm_diaries DROP CONSTRAINT IF EXISTS farm_diaries_rental_id_fkey;
ALTER TABLE IF EXISTS ONLY public.conversations DROP CONSTRAINT IF EXISTS conversations_rental_id_fkey;
ALTER TABLE IF EXISTS ONLY public.conversations DROP CONSTRAINT IF EXISTS conversations_plot_id_fkey;
ALTER TABLE IF EXISTS ONLY public.conversations DROP CONSTRAINT IF EXISTS conversations_participant_two_fkey;
ALTER TABLE IF EXISTS ONLY public.conversations DROP CONSTRAINT IF EXISTS conversations_participant_one_fkey;
ALTER TABLE IF EXISTS ONLY public.contracts DROP CONSTRAINT IF EXISTS contracts_renter_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contract_cancellations DROP CONSTRAINT IF EXISTS contract_cancellations_contract_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contract_cancellations DROP CONSTRAINT IF EXISTS contract_cancellations_cancelled_by_fkey;
ALTER TABLE IF EXISTS ONLY public.care_tasks DROP CONSTRAINT IF EXISTS care_tasks_task_assigned_to_fkey;
ALTER TABLE IF EXISTS ONLY public.care_tasks DROP CONSTRAINT IF EXISTS care_tasks_step_id_fkey;
ALTER TABLE IF EXISTS ONLY public.care_tasks DROP CONSTRAINT IF EXISTS care_tasks_service_request_id_fkey;
ALTER TABLE IF EXISTS ONLY public.care_tasks DROP CONSTRAINT IF EXISTS care_tasks_rental_id_fkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS trg_rentals_updated_at ON public.rentals;
DROP TRIGGER IF EXISTS trg_plots_updated_at ON public.plots;
DROP TRIGGER IF EXISTS trg_lands_updated_at ON public.lands;
DROP TRIGGER IF EXISTS trg_contracts_updated_at ON public.contracts;
DROP TRIGGER IF EXISTS trg_care_tasks_updated_at ON public.care_tasks;
DROP INDEX IF EXISTS public.idx_varieties_crop_id;
DROP INDEX IF EXISTS public.idx_users_status;
DROP INDEX IF EXISTS public.idx_users_role_id;
DROP INDEX IF EXISTS public.idx_ts_template_id;
DROP INDEX IF EXISTS public.idx_sreq_status;
DROP INDEX IF EXISTS public.idx_sreq_service_id;
DROP INDEX IF EXISTS public.idx_sreq_rental_id;
DROP INDEX IF EXISTS public.idx_site_visits_status;
DROP INDEX IF EXISTS public.idx_site_visits_plot_id;
DROP INDEX IF EXISTS public.idx_site_visits_date;
DROP INDEX IF EXISTS public.idx_sensor_recorded_at;
DROP INDEX IF EXISTS public.idx_sensor_plot_id;
DROP INDEX IF EXISTS public.idx_rentals_variety_id;
DROP INDEX IF EXISTS public.idx_rentals_status;
DROP INDEX IF EXISTS public.idx_rentals_service_id;
DROP INDEX IF EXISTS public.idx_rentals_plot_id;
DROP INDEX IF EXISTS public.idx_rentals_parent_id;
DROP INDEX IF EXISTS public.idx_rentals_dates;
DROP INDEX IF EXISTS public.idx_rentals_contract_id;
DROP INDEX IF EXISTS public.idx_ptx_type;
DROP INDEX IF EXISTS public.idx_ptx_status;
DROP INDEX IF EXISTS public.idx_ptx_contract_id;
DROP INDEX IF EXISTS public.idx_pt_variety_id;
DROP INDEX IF EXISTS public.idx_plots_status;
DROP INDEX IF EXISTS public.idx_plots_land_id;
DROP INDEX IF EXISTS public.idx_plots_is_published;
DROP INDEX IF EXISTS public.idx_notif_user_id;
DROP INDEX IF EXISTS public.idx_notif_unread;
DROP INDEX IF EXISTS public.idx_msg_sender_id;
DROP INDEX IF EXISTS public.idx_msg_created_at;
DROP INDEX IF EXISTS public.idx_msg_conversation_id;
DROP INDEX IF EXISTS public.idx_kd_created_by;
DROP INDEX IF EXISTS public.idx_ir_status;
DROP INDEX IF EXISTS public.idx_ir_reported_by;
DROP INDEX IF EXISTS public.idx_ir_rental_id;
DROP INDEX IF EXISTS public.idx_hr_rental_id;
DROP INDEX IF EXISTS public.idx_fd_task_id;
DROP INDEX IF EXISTS public.idx_fd_rental_id;
DROP INDEX IF EXISTS public.idx_ct_status;
DROP INDEX IF EXISTS public.idx_ct_rental_id;
DROP INDEX IF EXISTS public.idx_ct_due_date;
DROP INDEX IF EXISTS public.idx_ct_assigned_to;
DROP INDEX IF EXISTS public.idx_conv_rental_id;
DROP INDEX IF EXISTS public.idx_conv_p2;
DROP INDEX IF EXISTS public.idx_conv_p1;
DROP INDEX IF EXISTS public.idx_contracts_status;
DROP INDEX IF EXISTS public.idx_contracts_renter_id;
DROP INDEX IF EXISTS public.idx_cancel_status;
DROP INDEX IF EXISTS public.idx_cancel_contract_id;
DROP INDEX IF EXISTS public.idx_al_user_id;
DROP INDEX IF EXISTS public.idx_al_entity;
DROP INDEX IF EXISTS public.idx_al_created_at;
ALTER TABLE IF EXISTS ONLY public.varieties DROP CONSTRAINT IF EXISTS varieties_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.template_steps DROP CONSTRAINT IF EXISTS template_steps_pkey;
ALTER TABLE IF EXISTS ONLY public.site_visits DROP CONSTRAINT IF EXISTS site_visits_pkey;
ALTER TABLE IF EXISTS ONLY public.services DROP CONSTRAINT IF EXISTS services_service_code_key;
ALTER TABLE IF EXISTS ONLY public.services DROP CONSTRAINT IF EXISTS services_pkey;
ALTER TABLE IF EXISTS ONLY public.service_requests DROP CONSTRAINT IF EXISTS service_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.sensor_readings DROP CONSTRAINT IF EXISTS sensor_readings_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_role_name_key;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY public.rentals DROP CONSTRAINT IF EXISTS rentals_pkey;
ALTER TABLE IF EXISTS ONLY public.process_templates DROP CONSTRAINT IF EXISTS process_templates_pkey;
ALTER TABLE IF EXISTS ONLY public.plots DROP CONSTRAINT IF EXISTS plots_plot_code_key;
ALTER TABLE IF EXISTS ONLY public.plots DROP CONSTRAINT IF EXISTS plots_pkey;
ALTER TABLE IF EXISTS ONLY public.plot_variety_compatibility DROP CONSTRAINT IF EXISTS plot_variety_compatibility_pkey;
ALTER TABLE IF EXISTS ONLY public.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_pkey;
ALTER TABLE IF EXISTS ONLY public.lands DROP CONSTRAINT IF EXISTS lands_pkey;
ALTER TABLE IF EXISTS ONLY public.knowledge_documents DROP CONSTRAINT IF EXISTS knowledge_documents_pkey;
ALTER TABLE IF EXISTS ONLY public.issue_reports DROP CONSTRAINT IF EXISTS issue_reports_pkey;
ALTER TABLE IF EXISTS ONLY public.harvest_results DROP CONSTRAINT IF EXISTS harvest_results_pkey;
ALTER TABLE IF EXISTS ONLY public.farm_diaries DROP CONSTRAINT IF EXISTS farm_diaries_pkey;
ALTER TABLE IF EXISTS ONLY public.crops DROP CONSTRAINT IF EXISTS crops_pkey;
ALTER TABLE IF EXISTS ONLY public.crops DROP CONSTRAINT IF EXISTS crops_crop_name_key;
ALTER TABLE IF EXISTS ONLY public.conversations DROP CONSTRAINT IF EXISTS conversations_pkey;
ALTER TABLE IF EXISTS ONLY public.contracts DROP CONSTRAINT IF EXISTS contracts_pkey;
ALTER TABLE IF EXISTS ONLY public.contracts DROP CONSTRAINT IF EXISTS contracts_contract_number_key;
ALTER TABLE IF EXISTS ONLY public.contract_cancellations DROP CONSTRAINT IF EXISTS contract_cancellations_pkey;
ALTER TABLE IF EXISTS ONLY public.care_tasks DROP CONSTRAINT IF EXISTS care_tasks_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS public.varieties ALTER COLUMN variety_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.users ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.template_steps ALTER COLUMN step_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.site_visits ALTER COLUMN visit_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.services ALTER COLUMN service_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.service_requests ALTER COLUMN request_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sensor_readings ALTER COLUMN reading_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.roles ALTER COLUMN role_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.rentals ALTER COLUMN rental_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.process_templates ALTER COLUMN template_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.plots ALTER COLUMN plot_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.payment_transactions ALTER COLUMN transaction_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notifications ALTER COLUMN notification_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.messages ALTER COLUMN message_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.lands ALTER COLUMN land_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.knowledge_documents ALTER COLUMN document_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.issue_reports ALTER COLUMN issue_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.harvest_results ALTER COLUMN harvest_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.farm_diaries ALTER COLUMN diary_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.crops ALTER COLUMN crop_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.conversations ALTER COLUMN conversation_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.contracts ALTER COLUMN contract_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.contract_cancellations ALTER COLUMN cancellation_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.care_tasks ALTER COLUMN task_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN log_id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.varieties_variety_id_seq;
DROP TABLE IF EXISTS public.varieties;
DROP SEQUENCE IF EXISTS public.users_user_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.template_steps_step_id_seq;
DROP TABLE IF EXISTS public.template_steps;
DROP SEQUENCE IF EXISTS public.site_visits_visit_id_seq;
DROP TABLE IF EXISTS public.site_visits;
DROP SEQUENCE IF EXISTS public.services_service_id_seq;
DROP TABLE IF EXISTS public.services;
DROP SEQUENCE IF EXISTS public.service_requests_request_id_seq;
DROP TABLE IF EXISTS public.service_requests;
DROP SEQUENCE IF EXISTS public.sensor_readings_reading_id_seq;
DROP TABLE IF EXISTS public.sensor_readings;
DROP SEQUENCE IF EXISTS public.roles_role_id_seq;
DROP TABLE IF EXISTS public.roles;
DROP SEQUENCE IF EXISTS public.rentals_rental_id_seq;
DROP TABLE IF EXISTS public.rentals;
DROP SEQUENCE IF EXISTS public.process_templates_template_id_seq;
DROP TABLE IF EXISTS public.process_templates;
DROP SEQUENCE IF EXISTS public.plots_plot_id_seq;
DROP TABLE IF EXISTS public.plots;
DROP TABLE IF EXISTS public.plot_variety_compatibility;
DROP SEQUENCE IF EXISTS public.payment_transactions_transaction_id_seq;
DROP TABLE IF EXISTS public.payment_transactions;
DROP SEQUENCE IF EXISTS public.notifications_notification_id_seq;
DROP TABLE IF EXISTS public.notifications;
DROP SEQUENCE IF EXISTS public.messages_message_id_seq;
DROP TABLE IF EXISTS public.messages;
DROP SEQUENCE IF EXISTS public.lands_land_id_seq;
DROP TABLE IF EXISTS public.lands;
DROP SEQUENCE IF EXISTS public.knowledge_documents_document_id_seq;
DROP TABLE IF EXISTS public.knowledge_documents;
DROP SEQUENCE IF EXISTS public.issue_reports_issue_id_seq;
DROP TABLE IF EXISTS public.issue_reports;
DROP SEQUENCE IF EXISTS public.harvest_results_harvest_id_seq;
DROP TABLE IF EXISTS public.harvest_results;
DROP SEQUENCE IF EXISTS public.farm_diaries_diary_id_seq;
DROP TABLE IF EXISTS public.farm_diaries;
DROP SEQUENCE IF EXISTS public.crops_crop_id_seq;
DROP TABLE IF EXISTS public.crops;
DROP SEQUENCE IF EXISTS public.conversations_conversation_id_seq;
DROP TABLE IF EXISTS public.conversations;
DROP SEQUENCE IF EXISTS public.contracts_contract_id_seq;
DROP TABLE IF EXISTS public.contracts;
DROP SEQUENCE IF EXISTS public.contract_cancellations_cancellation_id_seq;
DROP TABLE IF EXISTS public.contract_cancellations;
DROP SEQUENCE IF EXISTS public.care_tasks_task_id_seq;
DROP TABLE IF EXISTS public.care_tasks;
DROP SEQUENCE IF EXISTS public.audit_logs_log_id_seq;
DROP TABLE IF EXISTS public.audit_logs;
DROP FUNCTION IF EXISTS public.trg_set_updated_at();
DROP CAST IF EXISTS (public.visitstatus AS character varying);
DROP CAST IF EXISTS (public.visitslot AS character varying);
DROP CAST IF EXISTS (character varying AS public.visitstatus);
DROP CAST IF EXISTS (character varying AS public.visitslot);
DROP CAST IF EXISTS (character varying AS public.userstatus);
DROP CAST IF EXISTS (character varying AS public.taskstatus);
DROP CAST IF EXISTS (character varying AS public.servicetype);
DROP CAST IF EXISTS (character varying AS public.requeststatus);
DROP CAST IF EXISTS (character varying AS public.rentalstatus);
DROP CAST IF EXISTS (character varying AS public.plotstatus);
DROP CAST IF EXISTS (character varying AS public.issuestatus);
DROP CAST IF EXISTS (character varying AS public.deliverytype);
DROP CAST IF EXISTS (character varying AS public.contractstatus);
DROP CAST IF EXISTS (character varying AS public.cancelstatus);
DROP CAST IF EXISTS (character varying AS public.activestatus);
DROP CAST IF EXISTS (public.userstatus AS character varying);
DROP CAST IF EXISTS (public.taskstatus AS character varying);
DROP CAST IF EXISTS (public.servicetype AS character varying);
DROP CAST IF EXISTS (public.requeststatus AS character varying);
DROP CAST IF EXISTS (public.rentalstatus AS character varying);
DROP CAST IF EXISTS (public.plotstatus AS character varying);
DROP CAST IF EXISTS (public.issuestatus AS character varying);
DROP CAST IF EXISTS (public.deliverytype AS character varying);
DROP CAST IF EXISTS (public.contractstatus AS character varying);
DROP CAST IF EXISTS (public.cancelstatus AS character varying);
DROP CAST IF EXISTS (public.activestatus AS character varying);
DROP TYPE IF EXISTS public.visitstatus;
DROP TYPE IF EXISTS public.visitslot;
DROP TYPE IF EXISTS public.visit_status_enum;
DROP TYPE IF EXISTS public.visit_slot_enum;
DROP TYPE IF EXISTS public.userstatus;
DROP TYPE IF EXISTS public.user_status_enum;
DROP TYPE IF EXISTS public.transaction_type_enum;
DROP TYPE IF EXISTS public.taskstatus;
DROP TYPE IF EXISTS public.task_status_enum;
DROP TYPE IF EXISTS public.servicetype;
DROP TYPE IF EXISTS public.service_type_enum;
DROP TYPE IF EXISTS public.requeststatus;
DROP TYPE IF EXISTS public.request_status_enum;
DROP TYPE IF EXISTS public.rentalstatus;
DROP TYPE IF EXISTS public.rental_status_enum;
DROP TYPE IF EXISTS public.plotstatus;
DROP TYPE IF EXISTS public.plot_status_enum;
DROP TYPE IF EXISTS public.payment_status_enum;
DROP TYPE IF EXISTS public.issuestatus;
DROP TYPE IF EXISTS public.issue_status_enum;
DROP TYPE IF EXISTS public.deliverytype;
DROP TYPE IF EXISTS public.delivery_type_enum;
DROP TYPE IF EXISTS public.conversation_type_enum;
DROP TYPE IF EXISTS public.conversation_status_enum;
DROP TYPE IF EXISTS public.contractstatus;
DROP TYPE IF EXISTS public.contract_status_enum;
DROP TYPE IF EXISTS public.cancelstatus;
DROP TYPE IF EXISTS public.cancel_status_enum;
DROP TYPE IF EXISTS public.activestatus;
DROP TYPE IF EXISTS public.active_status_enum;
--
-- Name: active_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.active_status_enum AS ENUM (
    'ACTIVE',
    'INACTIVE'
);


ALTER TYPE public.active_status_enum OWNER TO postgres;

--
-- Name: activestatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.activestatus AS ENUM (
    'ACTIVE',
    'INACTIVE'
);


ALTER TYPE public.activestatus OWNER TO postgres;

--
-- Name: cancel_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.cancel_status_enum AS ENUM (
    'PENDING',
    'APPROVED',
    'DONE'
);


ALTER TYPE public.cancel_status_enum OWNER TO postgres;

--
-- Name: cancelstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.cancelstatus AS ENUM (
    'APPROVED',
    'DONE',
    'PENDING'
);


ALTER TYPE public.cancelstatus OWNER TO postgres;

--
-- Name: contract_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.contract_status_enum AS ENUM (
    'PENDING_PAYMENT',
    'ACTIVE',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public.contract_status_enum OWNER TO postgres;

--
-- Name: contractstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.contractstatus AS ENUM (
    'ACTIVE',
    'CANCELLED',
    'COMPLETED',
    'PENDING_PAYMENT'
);


ALTER TYPE public.contractstatus OWNER TO postgres;

--
-- Name: conversation_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.conversation_status_enum AS ENUM (
    'OPEN',
    'CLOSED'
);


ALTER TYPE public.conversation_status_enum OWNER TO postgres;

--
-- Name: conversation_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.conversation_type_enum AS ENUM (
    'AI',
    'CUST_EXP',
    'STAFF_EXP'
);


ALTER TYPE public.conversation_type_enum OWNER TO postgres;

--
-- Name: delivery_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.delivery_type_enum AS ENUM (
    'PICKUP',
    'DELIVERY'
);


ALTER TYPE public.delivery_type_enum OWNER TO postgres;

--
-- Name: deliverytype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.deliverytype AS ENUM (
    'DELIVERY',
    'PICKUP'
);


ALTER TYPE public.deliverytype OWNER TO postgres;

--
-- Name: issue_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.issue_status_enum AS ENUM (
    'OPEN',
    'RESOLVED'
);


ALTER TYPE public.issue_status_enum OWNER TO postgres;

--
-- Name: issuestatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.issuestatus AS ENUM (
    'OPEN',
    'RESOLVED'
);


ALTER TYPE public.issuestatus OWNER TO postgres;

--
-- Name: payment_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status_enum AS ENUM (
    'PENDING',
    'SUCCESS',
    'FAILED'
);


ALTER TYPE public.payment_status_enum OWNER TO postgres;

--
-- Name: plot_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.plot_status_enum AS ENUM (
    'AVAIL',
    'RENT',
    'MAINT'
);


ALTER TYPE public.plot_status_enum OWNER TO postgres;

--
-- Name: plotstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.plotstatus AS ENUM (
    'AVAIL',
    'MAINT',
    'RENT'
);


ALTER TYPE public.plotstatus OWNER TO postgres;

--
-- Name: rental_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.rental_status_enum AS ENUM (
    'PENDING',
    'CONFIRMED',
    'ACTIVE',
    'DONE',
    'CANCELLED'
);


ALTER TYPE public.rental_status_enum OWNER TO postgres;

--
-- Name: rentalstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.rentalstatus AS ENUM (
    'ACTIVE',
    'CANCELLED',
    'CONFIRMED',
    'DONE',
    'PENDING'
);


ALTER TYPE public.rentalstatus OWNER TO postgres;

--
-- Name: request_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.request_status_enum AS ENUM (
    'PENDING',
    'ASSIGNED',
    'DONE'
);


ALTER TYPE public.request_status_enum OWNER TO postgres;

--
-- Name: requeststatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.requeststatus AS ENUM (
    'ASSIGNED',
    'DONE',
    'PENDING'
);


ALTER TYPE public.requeststatus OWNER TO postgres;

--
-- Name: service_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.service_type_enum AS ENUM (
    'A_LA_CARTE',
    'FULL'
);


ALTER TYPE public.service_type_enum OWNER TO postgres;

--
-- Name: servicetype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.servicetype AS ENUM (
    'A_LA_CARTE',
    'FULL'
);


ALTER TYPE public.servicetype OWNER TO postgres;

--
-- Name: task_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.task_status_enum AS ENUM (
    'PENDING',
    'IN_PROG',
    'DONE'
);


ALTER TYPE public.task_status_enum OWNER TO postgres;

--
-- Name: taskstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.taskstatus AS ENUM (
    'DONE',
    'IN_PROG',
    'PENDING'
);


ALTER TYPE public.taskstatus OWNER TO postgres;

--
-- Name: transaction_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.transaction_type_enum AS ENUM (
    'PAYMENT',
    'REFUND'
);


ALTER TYPE public.transaction_type_enum OWNER TO postgres;

--
-- Name: user_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_status_enum AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'BLOCKED'
);


ALTER TYPE public.user_status_enum OWNER TO postgres;

--
-- Name: userstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.userstatus AS ENUM (
    'ACTIVE',
    'BLOCKED',
    'INACTIVE'
);


ALTER TYPE public.userstatus OWNER TO postgres;

--
-- Name: visit_slot_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.visit_slot_enum AS ENUM (
    'MORNING',
    'AFTERNOON'
);


ALTER TYPE public.visit_slot_enum OWNER TO postgres;

--
-- Name: visit_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.visit_status_enum AS ENUM (
    'PENDING',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public.visit_status_enum OWNER TO postgres;

--
-- Name: visitslot; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.visitslot AS ENUM (
    'AFTERNOON',
    'MORNING'
);


ALTER TYPE public.visitslot OWNER TO postgres;

--
-- Name: visitstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.visitstatus AS ENUM (
    'CANCELLED',
    'COMPLETED',
    'CONFIRMED',
    'PENDING'
);


ALTER TYPE public.visitstatus OWNER TO postgres;

--
-- Name: CAST (public.activestatus AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.activestatus AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (public.cancelstatus AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.cancelstatus AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (public.contractstatus AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.contractstatus AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (public.deliverytype AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.deliverytype AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (public.issuestatus AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.issuestatus AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (public.plotstatus AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.plotstatus AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (public.rentalstatus AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.rentalstatus AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (public.requeststatus AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.requeststatus AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (public.servicetype AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.servicetype AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (public.taskstatus AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.taskstatus AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (public.userstatus AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.userstatus AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.activestatus); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.activestatus) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.cancelstatus); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.cancelstatus) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.contractstatus); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.contractstatus) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.deliverytype); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.deliverytype) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.issuestatus); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.issuestatus) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.plotstatus); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.plotstatus) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.rentalstatus); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.rentalstatus) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.requeststatus); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.requeststatus) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.servicetype); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.servicetype) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.taskstatus); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.taskstatus) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.userstatus); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.userstatus) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.visitslot); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.visitslot) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (character varying AS public.visitstatus); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (character varying AS public.visitstatus) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (public.visitslot AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.visitslot AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: CAST (public.visitstatus AS character varying); Type: CAST; Schema: -; Owner: -
--

CREATE CAST (public.visitstatus AS character varying) WITH INOUT AS IMPLICIT;


--
-- Name: trg_set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_set_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    log_id bigint NOT NULL,
    user_id integer,
    action character varying(100) NOT NULL,
    entity_name character varying(100),
    entity_id character varying(100),
    details jsonb,
    ip_address inet,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: TABLE audit_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.audit_logs IS 'Security audit trail for all sensitive operations';


--
-- Name: COLUMN audit_logs.details; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.audit_logs.details IS 'JSONB payload: before/after diff or extra context';


--
-- Name: audit_logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_log_id_seq OWNER TO postgres;

--
-- Name: audit_logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_log_id_seq OWNED BY public.audit_logs.log_id;


--
-- Name: care_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.care_tasks (
    task_id integer NOT NULL,
    rental_id integer NOT NULL,
    step_id integer,
    service_request_id integer,
    task_assigned_to integer,
    due_date date,
    status public.task_status_enum DEFAULT 'PENDING'::public.task_status_enum NOT NULL,
    evidence_image_url text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.care_tasks OWNER TO postgres;

--
-- Name: TABLE care_tasks; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.care_tasks IS 'Ground-level field tasks assigned to workers';


--
-- Name: COLUMN care_tasks.step_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.care_tasks.step_id IS 'Set when auto-generated from a process template step';


--
-- Name: COLUMN care_tasks.service_request_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.care_tasks.service_request_id IS 'Set when triggered by a customer service request';


--
-- Name: COLUMN care_tasks.evidence_image_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.care_tasks.evidence_image_url IS 'Photo proof of completion uploaded by worker';


--
-- Name: care_tasks_task_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.care_tasks_task_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.care_tasks_task_id_seq OWNER TO postgres;

--
-- Name: care_tasks_task_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.care_tasks_task_id_seq OWNED BY public.care_tasks.task_id;


--
-- Name: contract_cancellations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contract_cancellations (
    cancellation_id integer NOT NULL,
    contract_id integer NOT NULL,
    cancelled_by integer NOT NULL,
    reason text,
    status public.cancel_status_enum DEFAULT 'PENDING'::public.cancel_status_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone
);


ALTER TABLE public.contract_cancellations OWNER TO postgres;

--
-- Name: TABLE contract_cancellations; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.contract_cancellations IS 'Cancellation requests with refund-policy lifecycle for the entire contract';


--
-- Name: contract_cancellations_cancellation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contract_cancellations_cancellation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contract_cancellations_cancellation_id_seq OWNER TO postgres;

--
-- Name: contract_cancellations_cancellation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contract_cancellations_cancellation_id_seq OWNED BY public.contract_cancellations.cancellation_id;


--
-- Name: contracts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contracts (
    contract_id integer NOT NULL,
    renter_id integer NOT NULL,
    contract_number character varying(50) NOT NULL,
    total_amount numeric(15,2) NOT NULL,
    status public.contract_status_enum DEFAULT 'PENDING_PAYMENT'::public.contract_status_enum NOT NULL,
    reservation_expires_at timestamp with time zone,
    contract_document_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.contracts OWNER TO postgres;

--
-- Name: TABLE contracts; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.contracts IS 'Master agreement grouping multiple plot rentals';


--
-- Name: contracts_contract_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contracts_contract_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contracts_contract_id_seq OWNER TO postgres;

--
-- Name: contracts_contract_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contracts_contract_id_seq OWNED BY public.contracts.contract_id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversations (
    conversation_id integer NOT NULL,
    participant_one integer NOT NULL,
    participant_two integer,
    rental_id integer,
    plot_id integer,
    type character varying(255) NOT NULL,
    status character varying(255) DEFAULT 'OPEN'::public.conversation_status_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.conversations OWNER TO postgres;

--
-- Name: TABLE conversations; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.conversations IS '1-to-1 or AI-assisted chat sessions';


--
-- Name: COLUMN conversations.type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.conversations.type IS 'AI = AI chatbot | CUST_EXP = Customer-Expert | STAFF_EXP = Worker-Expert';


--
-- Name: conversations_conversation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.conversations_conversation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversations_conversation_id_seq OWNER TO postgres;

--
-- Name: conversations_conversation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.conversations_conversation_id_seq OWNED BY public.conversations.conversation_id;


--
-- Name: crops; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.crops (
    crop_id integer NOT NULL,
    crop_name character varying(150) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.crops OWNER TO postgres;

--
-- Name: TABLE crops; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.crops IS 'Master crop species catalogue (e.g. Tomato, Lettuce, Cabbage)';


--
-- Name: crops_crop_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.crops_crop_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.crops_crop_id_seq OWNER TO postgres;

--
-- Name: crops_crop_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.crops_crop_id_seq OWNED BY public.crops.crop_id;


--
-- Name: farm_diaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.farm_diaries (
    diary_id integer NOT NULL,
    rental_id integer NOT NULL,
    task_id integer,
    content text,
    image_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.farm_diaries OWNER TO postgres;

--
-- Name: TABLE farm_diaries; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.farm_diaries IS 'Chronological cultivation journal visible to customers';


--
-- Name: COLUMN farm_diaries.task_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.farm_diaries.task_id IS 'Auto-populated when synced from a completed care task';


--
-- Name: farm_diaries_diary_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.farm_diaries_diary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.farm_diaries_diary_id_seq OWNER TO postgres;

--
-- Name: farm_diaries_diary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.farm_diaries_diary_id_seq OWNED BY public.farm_diaries.diary_id;


--
-- Name: harvest_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.harvest_results (
    harvest_id integer NOT NULL,
    rental_id integer NOT NULL,
    entered_by integer NOT NULL,
    harvest_date date NOT NULL,
    yield_amount numeric(10,2),
    evidence_image_url text,
    delivery_type public.delivery_type_enum NOT NULL,
    customer_confirmed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.harvest_results OWNER TO postgres;

--
-- Name: TABLE harvest_results; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.harvest_results IS 'End-of-season harvest record and handover confirmation';


--
-- Name: COLUMN harvest_results.delivery_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.harvest_results.delivery_type IS 'PICKUP = customer collects | DELIVERY = farm delivers';


--
-- Name: harvest_results_harvest_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.harvest_results_harvest_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.harvest_results_harvest_id_seq OWNER TO postgres;

--
-- Name: harvest_results_harvest_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.harvest_results_harvest_id_seq OWNED BY public.harvest_results.harvest_id;


--
-- Name: issue_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.issue_reports (
    issue_id integer NOT NULL,
    rental_id integer NOT NULL,
    reported_by integer NOT NULL,
    handled_by integer,
    issue_type character varying(100),
    description text,
    image_url text,
    status public.issue_status_enum DEFAULT 'OPEN'::public.issue_status_enum NOT NULL,
    resolution_notes text,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.issue_reports OWNER TO postgres;

--
-- Name: TABLE issue_reports; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.issue_reports IS 'Field incident and pest/disease reports for expert review';


--
-- Name: issue_reports_issue_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.issue_reports_issue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.issue_reports_issue_id_seq OWNER TO postgres;

--
-- Name: issue_reports_issue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.issue_reports_issue_id_seq OWNED BY public.issue_reports.issue_id;


--
-- Name: knowledge_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knowledge_documents (
    document_id integer NOT NULL,
    kd_created_by integer NOT NULL,
    title character varying(255) NOT NULL,
    content text,
    file_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    author_name character varying(150),
    document_type character varying(50),
    file_size character varying(50),
    is_indexed_for_rag boolean,
    sections_count integer,
    status character varying(50),
    variety_id integer,
    version character varying(50)
);


ALTER TABLE public.knowledge_documents OWNER TO postgres;

--
-- Name: TABLE knowledge_documents; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.knowledge_documents IS 'Agricultural knowledge base authored by experts';


--
-- Name: knowledge_documents_document_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.knowledge_documents_document_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.knowledge_documents_document_id_seq OWNER TO postgres;

--
-- Name: knowledge_documents_document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.knowledge_documents_document_id_seq OWNED BY public.knowledge_documents.document_id;


--
-- Name: lands; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lands (
    land_id integer NOT NULL,
    land_name character varying(150) NOT NULL,
    address text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    description text,
    boundary_geojson text
);


ALTER TABLE public.lands OWNER TO postgres;

--
-- Name: TABLE lands; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.lands IS 'Farm zones containing multiple rental plots';


--
-- Name: lands_land_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lands_land_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lands_land_id_seq OWNER TO postgres;

--
-- Name: lands_land_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lands_land_id_seq OWNED BY public.lands.land_id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    message_id bigint NOT NULL,
    conversation_id integer NOT NULL,
    sender_id integer,
    content text NOT NULL,
    attachment_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: TABLE messages; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.messages IS 'Individual messages within a conversation thread';


--
-- Name: COLUMN messages.sender_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages.sender_id IS 'NULL = message generated by AI assistant';


--
-- Name: messages_message_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_message_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_message_id_seq OWNER TO postgres;

--
-- Name: messages_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_message_id_seq OWNED BY public.messages.message_id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    notification_id bigint NOT NULL,
    user_id integer NOT NULL,
    title character varying(255) NOT NULL,
    content text,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: TABLE notifications; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.notifications IS 'In-app push notifications for all system events';


--
-- Name: notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_notification_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_notification_id_seq OWNER TO postgres;

--
-- Name: notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_notification_id_seq OWNED BY public.notifications.notification_id;


--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_transactions (
    transaction_id integer NOT NULL,
    contract_id integer,
    service_request_id integer,
    cancellation_request_id integer,
    type character varying(255) NOT NULL,
    amount numeric(15,2) NOT NULL,
    payment_method character varying(50),
    gateway_ref character varying(100),
    status character varying(255) DEFAULT 'PENDING'::public.payment_status_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payment_transactions OWNER TO postgres;

--
-- Name: TABLE payment_transactions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.payment_transactions IS 'Financial ledger: all money-in and money-out events';


--
-- Name: COLUMN payment_transactions.cancellation_request_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_transactions.cancellation_request_id IS 'Populated only for REFUND transactions';


--
-- Name: COLUMN payment_transactions.type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.payment_transactions.type IS 'PAYMENT = incoming | REFUND = outgoing refund';


--
-- Name: payment_transactions_transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_transactions_transaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_transactions_transaction_id_seq OWNER TO postgres;

--
-- Name: payment_transactions_transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_transactions_transaction_id_seq OWNED BY public.payment_transactions.transaction_id;


--
-- Name: plot_variety_compatibility; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plot_variety_compatibility (
    plot_id integer NOT NULL,
    variety_id integer NOT NULL
);


ALTER TABLE public.plot_variety_compatibility OWNER TO postgres;

--
-- Name: TABLE plot_variety_compatibility; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.plot_variety_compatibility IS 'N:M bridge -- which varieties suit which plots';


--
-- Name: plots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.plots (
    plot_id integer NOT NULL,
    land_id integer NOT NULL,
    plot_code character varying(50) NOT NULL,
    area numeric(10,2) NOT NULL,
    image_url character varying(255),
    price_per_period numeric(15,2) NOT NULL,
    status character varying(255) DEFAULT 'AVAIL'::public.plot_status_enum NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    center_point text,
    polygon_coords text,
    boundary_geojson text,
    description text
);


ALTER TABLE public.plots OWNER TO postgres;

--
-- Name: TABLE plots; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.plots IS 'Individual rental plots -- the core land unit';


--
-- Name: COLUMN plots.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.plots.status IS 'AVAIL = available | RENT = rented | MAINT = maintenance';


--
-- Name: COLUMN plots.is_published; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.plots.is_published IS 'FALSE = hidden; TRUE = publicly listed on marketplace';


--
-- Name: plots_plot_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.plots_plot_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plots_plot_id_seq OWNER TO postgres;

--
-- Name: plots_plot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.plots_plot_id_seq OWNED BY public.plots.plot_id;


--
-- Name: process_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.process_templates (
    template_id integer NOT NULL,
    variety_id integer NOT NULL,
    pt_created_by integer NOT NULL,
    version character varying(20) DEFAULT '1.0'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.process_templates OWNER TO postgres;

--
-- Name: TABLE process_templates; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.process_templates IS 'Standard cultivation process template per variety, authored by experts';


--
-- Name: process_templates_template_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.process_templates_template_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.process_templates_template_id_seq OWNER TO postgres;

--
-- Name: process_templates_template_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.process_templates_template_id_seq OWNED BY public.process_templates.template_id;


--
-- Name: rentals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rentals (
    rental_id integer NOT NULL,
    contract_id integer NOT NULL,
    service_id integer,
    plot_id integer NOT NULL,
    variety_id integer NOT NULL,
    parent_rental_id integer,
    start_date date NOT NULL,
    end_date date NOT NULL,
    total_price numeric(15,2) NOT NULL,
    status character varying(255) DEFAULT 'PENDING'::public.rental_status_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_rentals_dates CHECK ((end_date > start_date))
);


ALTER TABLE public.rentals OWNER TO postgres;

--
-- Name: TABLE rentals; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.rentals IS 'Individual plot rental details within a contract';


--
-- Name: COLUMN rentals.service_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.rentals.service_id IS 'NULL = Self-growing mode; set = Full managed service';


--
-- Name: COLUMN rentals.parent_rental_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.rentals.parent_rental_id IS 'Self-referencing FK for contract renewals';


--
-- Name: rentals_rental_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rentals_rental_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rentals_rental_id_seq OWNER TO postgres;

--
-- Name: rentals_rental_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rentals_rental_id_seq OWNED BY public.rentals.rental_id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    role_id integer NOT NULL,
    role_name character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: TABLE roles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.roles IS 'Authorization roles: CUSTOMER, EXPERT, FIELD_WORKER, ADMIN';


--
-- Name: COLUMN roles.role_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.roles.role_name IS 'Role code, e.g. CUSTOMER / EXPERT / FIELD_WORKER / ADMIN';


--
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_role_id_seq OWNER TO postgres;

--
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- Name: sensor_readings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sensor_readings (
    reading_id bigint NOT NULL,
    plot_id integer NOT NULL,
    temperature numeric(5,2),
    air_humidity numeric(5,2),
    soil_humidity numeric(5,2),
    recorded_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sensor_readings OWNER TO postgres;

--
-- Name: TABLE sensor_readings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.sensor_readings IS 'IoT sensor data per plot -- simulated every 3 hours';


--
-- Name: sensor_readings_reading_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sensor_readings_reading_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sensor_readings_reading_id_seq OWNER TO postgres;

--
-- Name: sensor_readings_reading_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sensor_readings_reading_id_seq OWNED BY public.sensor_readings.reading_id;


--
-- Name: service_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_requests (
    request_id integer NOT NULL,
    rental_id integer NOT NULL,
    service_id integer NOT NULL,
    scheduled_date date,
    status character varying(255) DEFAULT 'PENDING'::public.request_status_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.service_requests OWNER TO postgres;

--
-- Name: TABLE service_requests; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.service_requests IS 'Ad-hoc service requests raised during an active rental';


--
-- Name: service_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.service_requests_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.service_requests_request_id_seq OWNER TO postgres;

--
-- Name: service_requests_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.service_requests_request_id_seq OWNED BY public.service_requests.request_id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    service_id integer NOT NULL,
    service_code character varying(255),
    service_name character varying(150) NOT NULL,
    service_type character varying(255) NOT NULL,
    price numeric(15,2) NOT NULL,
    unit character varying(50),
    description text,
    status character varying(255) DEFAULT 'ACTIVE'::public.active_status_enum NOT NULL
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: TABLE services; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.services IS 'Service catalogue: a-la-carte add-ons or full managed packages';


--
-- Name: COLUMN services.service_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.services.service_type IS 'A_LA_CARTE = one-off | FULL = full managed package';


--
-- Name: services_service_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.services_service_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.services_service_id_seq OWNER TO postgres;

--
-- Name: services_service_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.services_service_id_seq OWNED BY public.services.service_id;


--
-- Name: site_visits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.site_visits (
    visit_id integer NOT NULL,
    plot_id integer NOT NULL,
    visitor_name character varying(150) NOT NULL,
    visitor_phone character varying(20) NOT NULL,
    visit_date date NOT NULL,
    visit_slot public.visit_slot_enum NOT NULL,
    status public.visit_status_enum DEFAULT 'PENDING'::public.visit_status_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.site_visits OWNER TO postgres;

--
-- Name: TABLE site_visits; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.site_visits IS 'Pre-rental on-site visit appointments';


--
-- Name: COLUMN site_visits.visit_slot; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.site_visits.visit_slot IS 'MORNING = 08:00-11:00 | AFTERNOON = 14:00-17:00';


--
-- Name: site_visits_visit_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.site_visits_visit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.site_visits_visit_id_seq OWNER TO postgres;

--
-- Name: site_visits_visit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.site_visits_visit_id_seq OWNED BY public.site_visits.visit_id;


--
-- Name: template_steps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.template_steps (
    step_id integer NOT NULL,
    template_id integer NOT NULL,
    step_name character varying(255) NOT NULL,
    description text,
    day_offset integer NOT NULL,
    duration_days integer DEFAULT 1 NOT NULL,
    task_type character varying(255),
    min_temp numeric(38,2),
    max_temp numeric(38,2),
    min_humidity numeric(38,2),
    max_humidity numeric(38,2),
    materials_needed text
);


ALTER TABLE public.template_steps OWNER TO postgres;

--
-- Name: TABLE template_steps; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.template_steps IS 'Ordered steps within a cultivation process template';


--
-- Name: COLUMN template_steps.day_offset; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.template_steps.day_offset IS 'Days from rental start_date when this step begins';


--
-- Name: template_steps_step_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.template_steps_step_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.template_steps_step_id_seq OWNER TO postgres;

--
-- Name: template_steps_step_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.template_steps_step_id_seq OWNED BY public.template_steps.step_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    role_id integer NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(150) NOT NULL,
    phone_number character varying(20),
    address text,
    status public.user_status_enum DEFAULT 'ACTIVE'::public.user_status_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.users IS 'Platform user accounts with role-based access';


--
-- Name: COLUMN users.password_hash; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.password_hash IS 'BCrypt-hashed password';


--
-- Name: COLUMN users.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.status IS 'ACTIVE | INACTIVE | BLOCKED';


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: varieties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.varieties (
    variety_id integer NOT NULL,
    crop_id integer NOT NULL,
    variety_name character varying(150) NOT NULL,
    expected_duration integer NOT NULL,
    buffer_time integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.varieties OWNER TO postgres;

--
-- Name: TABLE varieties; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.varieties IS 'Specific cultivar with growth-cycle metadata';


--
-- Name: COLUMN varieties.expected_duration; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.varieties.expected_duration IS 'Growing cycle in days';


--
-- Name: COLUMN varieties.buffer_time; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.varieties.buffer_time IS 'Post-harvest buffer before plot is re-listed (days)';


--
-- Name: varieties_variety_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.varieties_variety_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.varieties_variety_id_seq OWNER TO postgres;

--
-- Name: varieties_variety_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.varieties_variety_id_seq OWNED BY public.varieties.variety_id;


--
-- Name: audit_logs log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN log_id SET DEFAULT nextval('public.audit_logs_log_id_seq'::regclass);


--
-- Name: care_tasks task_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.care_tasks ALTER COLUMN task_id SET DEFAULT nextval('public.care_tasks_task_id_seq'::regclass);


--
-- Name: contract_cancellations cancellation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_cancellations ALTER COLUMN cancellation_id SET DEFAULT nextval('public.contract_cancellations_cancellation_id_seq'::regclass);


--
-- Name: contracts contract_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts ALTER COLUMN contract_id SET DEFAULT nextval('public.contracts_contract_id_seq'::regclass);


--
-- Name: conversations conversation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations ALTER COLUMN conversation_id SET DEFAULT nextval('public.conversations_conversation_id_seq'::regclass);


--
-- Name: crops crop_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crops ALTER COLUMN crop_id SET DEFAULT nextval('public.crops_crop_id_seq'::regclass);


--
-- Name: farm_diaries diary_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.farm_diaries ALTER COLUMN diary_id SET DEFAULT nextval('public.farm_diaries_diary_id_seq'::regclass);


--
-- Name: harvest_results harvest_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.harvest_results ALTER COLUMN harvest_id SET DEFAULT nextval('public.harvest_results_harvest_id_seq'::regclass);


--
-- Name: issue_reports issue_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issue_reports ALTER COLUMN issue_id SET DEFAULT nextval('public.issue_reports_issue_id_seq'::regclass);


--
-- Name: knowledge_documents document_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_documents ALTER COLUMN document_id SET DEFAULT nextval('public.knowledge_documents_document_id_seq'::regclass);


--
-- Name: lands land_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lands ALTER COLUMN land_id SET DEFAULT nextval('public.lands_land_id_seq'::regclass);


--
-- Name: messages message_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN message_id SET DEFAULT nextval('public.messages_message_id_seq'::regclass);


--
-- Name: notifications notification_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.notifications_notification_id_seq'::regclass);


--
-- Name: payment_transactions transaction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions ALTER COLUMN transaction_id SET DEFAULT nextval('public.payment_transactions_transaction_id_seq'::regclass);


--
-- Name: plots plot_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plots ALTER COLUMN plot_id SET DEFAULT nextval('public.plots_plot_id_seq'::regclass);


--
-- Name: process_templates template_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_templates ALTER COLUMN template_id SET DEFAULT nextval('public.process_templates_template_id_seq'::regclass);


--
-- Name: rentals rental_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rentals ALTER COLUMN rental_id SET DEFAULT nextval('public.rentals_rental_id_seq'::regclass);


--
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- Name: sensor_readings reading_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensor_readings ALTER COLUMN reading_id SET DEFAULT nextval('public.sensor_readings_reading_id_seq'::regclass);


--
-- Name: service_requests request_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_requests ALTER COLUMN request_id SET DEFAULT nextval('public.service_requests_request_id_seq'::regclass);


--
-- Name: services service_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services ALTER COLUMN service_id SET DEFAULT nextval('public.services_service_id_seq'::regclass);


--
-- Name: site_visits visit_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_visits ALTER COLUMN visit_id SET DEFAULT nextval('public.site_visits_visit_id_seq'::regclass);


--
-- Name: template_steps step_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_steps ALTER COLUMN step_id SET DEFAULT nextval('public.template_steps_step_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: varieties variety_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.varieties ALTER COLUMN variety_id SET DEFAULT nextval('public.varieties_variety_id_seq'::regclass);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (log_id, user_id, action, entity_name, entity_id, details, ip_address, created_at) FROM stdin;
1	1	AUTH_LOGIN	users	1	{"method": "PASSWORD", "platform": "WEB"}	113.161.45.12	2026-10-12 12:44:59.161998+07
2	1	CONTRACT_CONFIRM	contracts	1	{"amount": 4200000, "contract_number": "FML-2026-001"}	113.161.45.12	2026-09-30 14:44:59.161998+07
3	7	TASK_FINISH	care_tasks	1	{"plot": "P-01", "step_name": "Làm đất & bón lót"}	14.241.12.88	2026-10-02 14:44:59.161998+07
4	4	CANCEL_REQUEST	contracts	3	{"reason": "Đi công tác nước ngoài"}	115.79.20.105	2026-10-09 14:44:59.161998+07
\.


--
-- Data for Name: care_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.care_tasks (task_id, rental_id, step_id, service_request_id, task_assigned_to, due_date, status, evidence_image_url, notes, created_at, updated_at) FROM stdin;
1	1	2	\N	8	2026-09-27	DONE	https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80	Đã xuống giống 25 cây cà chua con khỏe mạnh, tưới đẫm vi sinh Trichoderma.	2026-10-12 14:44:59.120059+07	2026-10-12 14:44:59.120059+07
2	1	3	\N	8	2026-10-07	DONE	https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80	Đã lắp giàn cọc chữ A, buộc dây cố định thân chính, bấm tỉa chồi nách sát gốc.	2026-10-12 14:44:59.120059+07	2026-10-12 14:44:59.120059+07
3	1	4	\N	8	2026-10-12	IN_PROG	\N	Đang tiến hành pha dịch đạm cá vi sinh bón gốc đợt 2.	2026-10-12 14:44:59.120059+07	2026-10-12 14:44:59.120059+07
4	2	8	\N	9	2026-09-24	DONE	https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80	Cấy cây xà lách con tỷ lệ sống 98%.	2026-10-12 14:44:59.120059+07	2026-10-12 14:44:59.120059+07
\.


--
-- Data for Name: contract_cancellations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contract_cancellations (cancellation_id, contract_id, cancelled_by, reason, status, created_at, processed_at) FROM stdin;
1	3	4	Khách hàng bận công tác dài ngày tại nước ngoài, không thể tiếp tục nhận rau thu hoạch.	APPROVED	2026-10-09 14:44:59.145301+07	2026-10-11 14:44:59.145301+07
\.


--
-- Data for Name: contracts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contracts (contract_id, renter_id, contract_number, total_amount, status, reservation_expires_at, contract_document_url, created_at, updated_at) FROM stdin;
1	1	HD-2026-FARM-001	3000000.00	ACTIVE	\N	\N	2026-09-12 14:44:59.106708+07	2026-10-12 14:44:59.106708+07
2	2	HD-2026-FARM-002	2850000.00	ACTIVE	\N	\N	2026-09-17 14:44:59.106708+07	2026-10-12 14:44:59.106708+07
3	3	HD-2026-FARM-003	1400000.00	ACTIVE	\N	\N	2026-10-02 14:44:59.106708+07	2026-10-12 14:44:59.106708+07
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversations (conversation_id, participant_one, participant_two, rental_id, plot_id, type, status, created_at) FROM stdin;
1	1	5	1	1	CUST_EXP	OPEN	2026-10-12 14:44:59.13019+07
2	2	6	2	2	CUST_EXP	OPEN	2026-10-12 14:44:59.13019+07
3	8	5	3	3	STAFF_EXP	OPEN	2026-10-12 14:44:59.13019+07
\.


--
-- Data for Name: crops; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.crops (crop_id, crop_name, created_at) FROM stdin;
1	Rau muống cạn	2026-10-12 14:44:59.090298+07
2	Cải ngọt / Cải bẹ	2026-10-12 14:44:59.090298+07
3	Xà lách xoăn	2026-10-12 14:44:59.090298+07
4	Cà chua bi (Cherry)	2026-10-12 14:44:59.090298+07
5	Dưa leo baby	2026-10-12 14:44:59.090298+07
6	Đậu cô ve	2026-10-12 14:44:59.090298+07
7	Mướp hương	2026-10-12 14:44:59.090298+07
8	Rau mồng tơi	2026-10-12 14:44:59.090298+07
9	Ớt cay / Ớt chỉ thiên	2026-10-12 14:44:59.090298+07
10	Rau dền (đỏ/cơm)	2026-10-12 14:44:59.090298+07
\.


--
-- Data for Name: farm_diaries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.farm_diaries (diary_id, rental_id, task_id, content, image_url, created_at) FROM stdin;
1	1	1	Hôm nay bác Lực đã hoàn thành cấy cây con giống F1 ra luống P-01. Cây bén rễ xanh tươi.	https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80	2026-09-27 14:44:59.124172+07
2	1	2	Cây cà chua bi phát triển vượt bậc, đã hoàn thành lên giàn chữ A và bấm tỉa lá chân thông thoáng.	https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80	2026-10-07 14:44:59.124172+07
\.


--
-- Data for Name: harvest_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.harvest_results (harvest_id, rental_id, entered_by, harvest_date, yield_amount, evidence_image_url, delivery_type, customer_confirmed, created_at) FROM stdin;
1	3	7	2026-10-10	32.50	/images/harvest/rau-muong-p03.jpg	DELIVERY	t	2026-10-10 14:44:59.15088+07
\.


--
-- Data for Name: issue_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.issue_reports (issue_id, rental_id, reported_by, handled_by, issue_type, description, image_url, status, resolution_notes, resolved_at, created_at) FROM stdin;
1	1	1	5	SÂU BỆNH - RẦY MỀM	Phát hiện rầy mềm xuất hiện ở mặt dưới một số lá tầng gốc của cây cà chua bi P-01.	/images/issues/ray-mem-p01.jpg	RESOLVED	Đã phân công công nhân phun chế phẩm thảo mộc Gừng Ớt Tỏi theo tài liệu DOC-01, rầy mềm đã bị khống chế hoàn toàn.	2026-10-11 14:44:59.152871+07	2026-10-09 14:44:59.152871+07
2	2	2	6	ẨM ĐỘ - CẢNH BÁO TƯỚI	Cảm biến IoT báo độ ẩm đất thửa P-02 giảm xuống 52%, thấp hơn ngưỡng khuyến nghị 65%.	/images/issues/do-am-p02.jpg	OPEN	\N	\N	2026-10-12 10:44:59.152871+07
\.


--
-- Data for Name: knowledge_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knowledge_documents (document_id, kd_created_by, title, content, file_url, created_at, author_name, document_type, file_size, is_indexed_for_rag, sections_count, status, variety_id, version) FROM stdin;
1	5	Sách Hướng Dẫn Đào Tạo Sản Xuất Rau An Toàn Theo VietGAP	Tài liệu hướng dẫn chuẩn quốc gia 200 trang gồm 12 module: Đánh giá vùng đất, giá thể, nguồn nước, phân bón hữu cơ, bảo vệ thực vật sinh học, cách ly PHI và truy xuất nguồn gốc.	/docs/rau_an_toan_vietgap_huyen.pdf	2026-09-12 14:44:59.14046+07	\N	\N	\N	\N	\N	\N	\N	\N
2	5	Quy Trình Sử Dụng Nguyên Liệu Hữu Cơ, Phân Bón Hữu Cơ Phối Hợp Phân Vô Cơ Cho Sản Xuất Rau An Toàn (TBKT 01-104: 2021/BVTV)	Tiến bộ kỹ thuật ban hành bởi Cục BVTV - Bộ NN&PTNT hướng dẫn định mức N-P-K quy đổi, ủ hoai phân chuồng thay thế 50% vô cơ và phác đồ dinh dưỡng cho từng nhóm rau.	/docs/210219_pl_qt_tbkt_rau_an_toanpdf.pdf	2026-09-17 14:44:59.14046+07	\N	\N	\N	\N	\N	\N	\N	\N
3	5	Quyết Định 288/QĐ-BVTV-KH Công Nhận Tiến Bộ Kỹ Thuật Sản Xuất Rau Hữu Cơ Tiêu Chuẩn Quốc Gia	Quyết định pháp lý công nhận quy trình kỹ thuật sản xuất rau hữu cơ, kiểm soát vùng đệm cách ly môi trường, cấm hóa chất độc hại và kim loại nặng.	/docs/21.03,01_QD288 TBKT rau huu cơ.pdf	2026-09-20 14:44:59.14046+07	\N	\N	\N	\N	\N	\N	\N	\N
4	6	Quy Trình Quản Lý Dịch Hại Tổng Hợp (IPM) Trên Cây Trồng Nông Nghiệp	Quy trình kỹ thuật IPM cập nhật ban hành 2025 quy định cơ chế bẫy dính vàng, bẫy pheromone, bảo vệ sinh thái thiên địch và ngưỡng phòng trừ sinh học an toàn.	/docs/quy_trinh_ipm_na_712025pdf.pdf	2026-09-24 14:44:59.14046+07	\N	\N	\N	\N	\N	\N	\N	\N
5	6	Quy Trình Quản Lý Tổng Hợp Sâu Bệnh Hại & Nấm Đối Kháng Sinh Học (TBKT 01-114: 2021/BVTV)	Quy trình phòng trừ nấm bệnh thối rễ, xì mủ, héo xanh bằng nấm đối kháng Trichoderma sinh học và chế phẩm sinh học thân thiện môi trường.	/docs/211225__quy_trinh_qlsb_sau_riengrevised_3pdf.pdf	2026-09-27 14:44:59.14046+07	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: lands; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lands (land_id, land_name, address, created_at, updated_at, description, boundary_geojson) FROM stdin;
1	Trang trại Happy Valley Củ Chi	Đường Nhuận Đức, Xã Nhuận Đức, Huyện Củ Chi, TP. Hồ Chí Minh	2026-10-12 14:44:59.085131+07	2026-10-14 01:35:00.470533+07	Nông trại sinh thái Củ Chi với hệ sinh thái công nghệ cao, trạm cảm biến IoT và quy trình canh tác VietGAP hữu cơ chuẩn hóa.	{"type":"Polygon","coordinates":[[[106.342, 10.686], [106.352, 10.686], [106.352, 10.696], [106.342, 10.696], [106.342, 10.686]]]}
2	Trang trại Cao nguyên Mộc Châu	Tiểu khu Mía Đường, Thị trấn Nông trường Mộc Châu, Sơn La	2026-10-12 14:44:59.085131+07	2026-10-14 01:35:00.470533+07	Khu canh tác chuyên canh ôn đới cao nguyên với khí hậu quanh năm mát mẻ, thích hợp dâu tây và rau ôn đới.	\N
3	Trang trại Thung lũng Sinh thái Đà Lạt	Xã Tà Nung, TP. Đà Lạt, Tỉnh Lâm Đồng	2026-10-12 14:44:59.085131+07	2026-10-14 01:35:00.470533+07	Thung lũng sinh thái xanh mát tại Đà Lạt, đất đỏ bazan giàu dinh dưỡng và nguồn nước suối tự nhiên.	\N
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (message_id, conversation_id, sender_id, content, attachment_url, created_at) FROM stdin;
1	1	1	Chào chuyên gia Nam, cà chua bi của tôi ở thửa P-01 độ ẩm 68% đã đạt chuẩn chưa ạ?	\N	2026-10-12 12:44:59.135002+07
2	1	5	Chào anh Quyền! Độ ẩm 68% là hoàn hảo cho giai đoạn cây chuẩn bị bung hoa nhé.	\N	2026-10-12 12:59:59.135002+07
3	1	1	Cảm ơn Thạc sĩ rất nhiều!	\N	2026-10-12 13:14:59.135002+07
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (notification_id, user_id, title, content, is_read, created_at) FROM stdin;
1	1	Hợp đồng FML-2026-001 đã kích hoạt	Thửa đất P-01 của bạn đã bắt đầu chu kỳ canh tác cà chua bi Cherry VietGAP.	f	2026-09-30 14:44:59.160027+07
2	1	Nhật ký đồng ruộng vừa cập nhật	Kỹ thuật viên Lê Văn Bảy vừa hoàn thành và đăng tải ảnh tưới phân hữu cơ.	t	2026-10-10 14:44:59.160027+07
3	2	Cảnh báo cảm biến độ ẩm thửa P-02	Độ ẩm đất thửa P-02 hiện tại là 52%. Kỹ sư Đặng Thị Thu Thảo đang xử lý.	f	2026-10-12 10:44:59.160027+07
4	7	Nhiệm vụ mới được giao	Bạn có nhiệm vụ tưới nước bổ sung cho thửa P-01 vào sáng mai.	f	2026-10-12 08:44:59.160027+07
5	4	Yêu cầu hủy hợp đồng được phê duyệt	Yêu cầu hủy hợp đồng FML-2026-003 đã được duyệt theo chính sách hoàn tiền Farmely.	t	2026-10-11 14:44:59.160027+07
\.


--
-- Data for Name: payment_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_transactions (transaction_id, contract_id, service_request_id, cancellation_request_id, type, amount, payment_method, gateway_ref, status, created_at) FROM stdin;
1	1	\N	\N	PAYMENT	3000000.00	VIETQR	VQR-MBB-20261001-09823	SUCCESS	2026-09-12 14:44:59.117456+07
2	2	\N	\N	PAYMENT	2850000.00	VIETQR	VQR-ICB-20261005-11029	SUCCESS	2026-09-17 14:44:59.117456+07
3	3	\N	\N	PAYMENT	1400000.00	VIETQR	VQR-VCB-20261010-88412	SUCCESS	2026-10-02 14:44:59.117456+07
4	\N	\N	\N	PAYMENT	1800000.00	VNPAY	FARMELY_4_92443	PENDING	2026-10-13 23:39:52.333222+07
5	\N	\N	\N	PAYMENT	1800000.00	VNPAY	FARMELY_5_97214	PENDING	2026-10-13 23:39:57.213475+07
6	\N	4	\N	PAYMENT	33000000.00	VNPAY	VNPAY_15703576	SUCCESS	2026-10-13 23:48:26.622372+07
7	\N	5	\N	PAYMENT	9100000.00	VNPAY	FARMELY_7_13422	PENDING	2026-10-13 23:58:33.417535+07
\.


--
-- Data for Name: plot_variety_compatibility; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.plot_variety_compatibility (plot_id, variety_id) FROM stdin;
1	1
1	2
1	3
1	4
1	8
1	10
2	1
2	2
2	3
2	6
2	8
2	10
3	4
3	5
3	6
3	7
4	3
4	4
4	6
4	9
5	1
5	5
5	7
5	8
5	9
6	1
6	2
6	8
6	10
13	1
13	2
13	3
13	10
14	2
14	3
14	8
14	10
15	4
15	5
15	6
15	7
16	3
16	4
16	9
17	1
17	3
17	5
17	8
18	2
18	3
18	6
18	10
19	1
19	4
19	7
19	9
20	4
20	5
20	6
20	7
21	1
21	2
21	3
21	5
21	8
22	2
22	3
22	8
22	10
\.


--
-- Data for Name: plots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.plots (plot_id, land_id, plot_code, area, image_url, price_per_period, status, is_published, created_at, updated_at, center_point, polygon_coords, boundary_geojson, description) FROM stdin;
1	1	P-01	150.00	https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80	1200000.00	RENT	t	2026-10-12 14:44:59.086121+07	2026-10-14 01:35:00.484098+07	[106.344998, 10.689116]	[[[106.343813, 10.689452], [106.345118, 10.690545], [106.346782, 10.688616], [106.345463, 10.687517], [106.343813, 10.689452]]]	{"type":"Polygon","coordinates":[[[106.343813, 10.689452], [106.345118, 10.690545], [106.346782, 10.688616], [106.345463, 10.687517], [106.343813, 10.689452]]]}	\N
2	1	P-02	180.00	https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80	1450000.00	RENT	t	2026-10-12 14:44:59.086121+07	2026-10-14 01:35:00.484098+07	[106.346448, 10.690328]	[[[106.345257, 10.690661], [106.346562, 10.691754], [106.348241, 10.689832], [106.346922, 10.688733], [106.345257, 10.690661]]]	{"type":"Polygon","coordinates":[[[106.345257, 10.690661], [106.346562, 10.691754], [106.348241, 10.689832], [106.346922, 10.688733], [106.345257, 10.690661]]]}	\N
3	1	P-03	200.00	https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=800&q=80	1700000.00	RENT	t	2026-10-12 14:44:59.086121+07	2026-10-14 01:35:00.484098+07	[106.347897, 10.69154]	[[[106.3467, 10.69187], [106.348006, 10.692963], [106.3497, 10.691048], [106.348381, 10.689948], [106.3467, 10.69187]]]	{"type":"Polygon","coordinates":[[[106.3467, 10.69187], [106.348006, 10.692963], [106.3497, 10.691048], [106.348381, 10.689948], [106.3467, 10.69187]]]}	\N
4	1	P-04	160.00	https://images.unsplash.com/photo-1592417817098-8f3d69103632?auto=format&fit=crop&w=800&q=80	1300000.00	AVAIL	t	2026-10-12 14:44:59.086121+07	2026-10-14 01:35:00.484098+07	[106.349347, 10.692751]	[[[106.348144, 10.693079], [106.34945, 10.694172], [106.351159, 10.692263], [106.34984, 10.691164], [106.348144, 10.693079]]]	{"type":"Polygon","coordinates":[[[106.348144, 10.693079], [106.34945, 10.694172], [106.351159, 10.692263], [106.34984, 10.691164], [106.348144, 10.693079]]]}	\N
5	1	P-05	175.00	https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80	1350000.00	AVAIL	t	2026-10-12 14:44:59.086121+07	2026-10-14 01:35:00.484098+07	[106.346829, 10.686978]	[[[106.345638, 10.687311], [106.346959, 10.688411], [106.348622, 10.686482], [106.347288, 10.685376], [106.345638, 10.687311]]]	{"type":"Polygon","coordinates":[[[106.345638, 10.687311], [106.346959, 10.688411], [106.348622, 10.686482], [106.347288, 10.685376], [106.345638, 10.687311]]]}	\N
6	1	P-06	190.00	https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80	1500000.00	MAINT	t	2026-10-12 14:44:59.086121+07	2026-10-14 01:35:00.484098+07	[106.348296, 10.688198]	[[[106.347099, 10.688528], [106.348419, 10.689628], [106.350098, 10.687705], [106.348764, 10.686599], [106.347099, 10.688528]]]	{"type":"Polygon","coordinates":[[[106.347099, 10.688528], [106.348419, 10.689628], [106.350098, 10.687705], [106.348764, 10.686599], [106.347099, 10.688528]]]}	\N
13	1	P-07	155.00	https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80	1250000.00	RENT	t	2026-10-12 15:33:16.041206+07	2026-10-14 01:35:00.484098+07	[106.349763, 10.689417]	[[[106.34856, 10.689744], [106.34988, 10.690844], [106.351575, 10.688929], [106.35024, 10.687823], [106.34856, 10.689744]]]	{"type":"Polygon","coordinates":[[[106.34856, 10.689744], [106.34988, 10.690844], [106.351575, 10.688929], [106.35024, 10.687823], [106.34856, 10.689744]]]}	\N
14	1	P-08	165.00	https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=800&q=80	1300000.00	AVAIL	t	2026-10-12 15:33:16.04323+07	2026-10-14 01:35:00.484098+07	[106.35123, 10.690636]	[[[106.35002, 10.690961], [106.351341, 10.692061], [106.353051, 10.690153], [106.351716, 10.689046], [106.35002, 10.690961]]]	{"type":"Polygon","coordinates":[[[106.35002, 10.690961], [106.351341, 10.692061], [106.353051, 10.690153], [106.351716, 10.689046], [106.35002, 10.690961]]]}	\N
15	1	P-09	170.00	https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80	1400000.00	AVAIL	t	2026-10-12 15:33:16.043843+07	2026-10-14 01:35:00.484098+07	[106.34866, 10.68484]	[[[106.347463, 10.68517], [106.348799, 10.686277], [106.350463, 10.684348], [106.349113, 10.683234], [106.347463, 10.68517]]]	{"type":"Polygon","coordinates":[[[106.347463, 10.68517], [106.348799, 10.686277], [106.350463, 10.684348], [106.349113, 10.683234], [106.347463, 10.68517]]]}	\N
16	1	P-10	175.00	https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80	1450000.00	AVAIL	t	2026-10-12 15:33:16.044213+07	2026-10-14 01:35:00.484098+07	[106.35016, 10.68594]	[[[106.348963, 10.68627], [106.350299, 10.687377], [106.351963, 10.685448], [106.350613, 10.684334], [106.348963, 10.68627]]]	{"type":"Polygon","coordinates":[[[106.348963, 10.68627], [106.350299, 10.687377], [106.351963, 10.685448], [106.350613, 10.684334], [106.348963, 10.68627]]]}	\N
17	1	P-11	180.00	https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80	1500000.00	AVAIL	t	2026-10-12 15:33:16.044515+07	2026-10-14 01:35:00.484098+07	[106.35166, 10.68704]	[[[106.350463, 10.68737], [106.351799, 10.688477], [106.353463, 10.686548], [106.352113, 10.685434], [106.350463, 10.68737]]]	{"type":"Polygon","coordinates":[[[106.350463, 10.68737], [106.351799, 10.688477], [106.353463, 10.686548], [106.352113, 10.685434], [106.350463, 10.68737]]]}	\N
18	1	P-12	160.00	https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80	1350000.00	AVAIL	t	2026-10-12 15:33:16.044814+07	2026-10-14 01:35:00.484098+07	[106.35316, 10.68814]	[[[106.351963, 10.68847], [106.353299, 10.689577], [106.354963, 10.687648], [106.353613, 10.686534], [106.351963, 10.68847]]]	{"type":"Polygon","coordinates":[[[106.351963, 10.68847], [106.353299, 10.689577], [106.354963, 10.687648], [106.353613, 10.686534], [106.351963, 10.68847]]]}	\N
19	1	P-13	165.00	https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80	1350000.00	RENT	t	2026-10-12 15:33:16.04587+07	2026-10-14 01:35:00.484098+07	[106.350491, 10.682701]	[[[106.349288, 10.683029], [106.350639, 10.684143], [106.352303, 10.682213], [106.350938, 10.681093], [106.349288, 10.683029]]]	{"type":"Polygon","coordinates":[[[106.349288, 10.683029], [106.350639, 10.684143], [106.352303, 10.682213], [106.350938, 10.681093], [106.349288, 10.683029]]]}	\N
20	1	P-14	175.00	https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80	1550000.00	AVAIL	t	2026-10-12 15:33:16.046261+07	2026-10-14 01:35:00.484098+07	[106.351992, 10.683936]	[[[106.350783, 10.684261], [106.352134, 10.685375], [106.353813, 10.683453], [106.352448, 10.682332], [106.350783, 10.684261]]]	{"type":"Polygon","coordinates":[[[106.350783, 10.684261], [106.352134, 10.685375], [106.353813, 10.683453], [106.352448, 10.682332], [106.350783, 10.684261]]]}	\N
21	1	P-15	180.00	https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80	1650000.00	AVAIL	t	2026-10-12 15:33:16.046599+07	2026-10-14 01:35:00.484098+07	[106.353493, 10.685171]	[[[106.352278, 10.685493], [106.353629, 10.686607], [106.355323, 10.684692], [106.353958, 10.683572], [106.352278, 10.685493]]]	{"type":"Polygon","coordinates":[[[106.352278, 10.685493], [106.353629, 10.686607], [106.355323, 10.684692], [106.353958, 10.683572], [106.352278, 10.685493]]]}	\N
22	1	P-16	150.00	https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=800&q=80	1200000.00	RENT	t	2026-10-12 15:33:16.046893+07	2026-10-14 01:35:00.484098+07	[106.354994, 10.686406]	[[[106.353773, 10.686725], [106.355124, 10.687839], [106.356834, 10.685931], [106.355468, 10.684811], [106.353773, 10.686725]]]	{"type":"Polygon","coordinates":[[[106.353773, 10.686725], [106.355124, 10.687839], [106.356834, 10.685931], [106.355468, 10.684811], [106.353773, 10.686725]]]}	\N
\.


--
-- Data for Name: process_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.process_templates (template_id, variety_id, pt_created_by, version, created_at) FROM stdin;
1	1	5	v1.5 (Chuẩn VietGAP)	2026-10-12 14:44:59.098502+07
2	2	5	v1.6 (Chuẩn VietGAP)	2026-10-12 14:44:59.098502+07
3	3	5	v1.8 (Chuẩn VietGAP)	2026-10-12 14:44:59.098502+07
4	4	5	v2.3 (Chuẩn VietGAP)	2026-10-12 14:44:59.098502+07
5	5	5	v2.0 (Chuẩn VietGAP)	2026-10-12 14:44:59.098502+07
6	6	5	v1.5 (Chuẩn VietGAP)	2026-10-12 14:44:59.098502+07
7	7	5	v1.7 (Chuẩn VietGAP)	2026-10-12 14:44:59.098502+07
8	8	5	v1.4 (Chuẩn VietGAP)	2026-10-12 14:44:59.098502+07
9	9	5	v2.1 (Chuẩn VietGAP)	2026-10-12 14:44:59.098502+07
10	10	5	v1.3 (Chuẩn VietGAP)	2026-10-12 14:44:59.098502+07
\.


--
-- Data for Name: rentals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rentals (rental_id, contract_id, service_id, plot_id, variety_id, parent_rental_id, start_date, end_date, total_price, status, created_at, updated_at) FROM stdin;
1	1	15	1	4	\N	2026-09-12	2026-12-01	3000000.00	ACTIVE	2026-10-12 14:44:59.110615+07	2026-10-12 14:44:59.110615+07
2	2	15	2	3	\N	2026-09-17	2026-11-01	2850000.00	ACTIVE	2026-10-12 14:44:59.110615+07	2026-10-12 14:44:59.110615+07
3	3	\N	3	5	\N	2026-10-02	2026-11-26	1400000.00	ACTIVE	2026-10-12 14:44:59.110615+07	2026-10-12 14:44:59.110615+07
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (role_id, role_name) FROM stdin;
1	CUSTOMER
2	EXPERT
3	FIELD_WORKER
4	ADMIN
\.


--
-- Data for Name: sensor_readings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sensor_readings (reading_id, plot_id, temperature, air_humidity, soil_humidity, recorded_at) FROM stdin;
1	1	24.50	82.00	68.00	2026-10-11 23:44:59.128034+07
2	1	27.20	75.00	65.50	2026-10-12 02:44:59.128034+07
3	1	31.80	62.00	61.00	2026-10-12 05:44:59.128034+07
4	1	33.50	55.00	58.20	2026-10-12 08:44:59.128034+07
5	1	30.00	68.00	63.40	2026-10-12 11:44:59.128034+07
6	1	26.80	76.50	66.80	2026-10-12 14:44:59.128034+07
7	1	26.53	76.10	66.42	2026-10-12 22:05:04.41876+07
8	2	28.45	72.89	65.22	2026-10-12 22:05:04.46203+07
9	3	28.74	71.89	64.75	2026-10-12 22:05:04.467039+07
10	4	28.65	72.86	64.87	2026-10-12 22:05:04.47857+07
11	1	26.30	76.91	66.68	2026-10-12 22:05:19.41609+07
12	2	28.76	72.22	64.70	2026-10-12 22:05:19.426601+07
13	3	28.86	72.88	64.68	2026-10-12 22:05:19.430077+07
14	4	28.79	72.05	64.79	2026-10-12 22:05:19.434078+07
15	1	26.36	76.51	66.56	2026-10-12 22:05:34.424683+07
16	2	28.88	72.14	65.11	2026-10-12 22:05:34.433763+07
17	3	29.10	73.43	64.73	2026-10-12 22:05:34.442973+07
18	4	29.02	71.97	65.14	2026-10-12 22:05:34.448675+07
19	1	26.23	76.47	66.94	2026-10-12 22:05:49.416842+07
20	2	29.19	73.13	64.75	2026-10-12 22:05:49.430645+07
21	3	28.98	72.93	64.36	2026-10-12 22:05:49.437073+07
22	4	29.25	71.67	65.62	2026-10-12 22:05:49.44458+07
23	1	23.64	81.42	67.76	2026-10-11 22:06:00.728739+07
24	1	24.62	83.82	68.01	2026-10-11 23:06:00.728739+07
25	1	24.99	85.68	68.75	2026-10-12 00:06:00.728739+07
26	1	24.14	80.43	69.75	2026-10-12 01:06:00.728739+07
27	1	23.98	79.71	70.21	2026-10-12 02:06:00.728739+07
28	1	23.73	83.40	70.58	2026-10-12 03:06:00.728739+07
29	1	23.86	81.90	67.60	2026-10-12 04:06:00.728739+07
30	1	25.04	83.98	68.52	2026-10-12 05:06:00.728739+07
31	1	28.07	74.76	63.64	2026-10-12 06:06:00.728739+07
32	1	29.49	73.91	66.82	2026-10-12 07:06:00.728739+07
33	1	28.38	72.94	64.22	2026-10-12 08:06:00.728739+07
34	1	27.02	70.71	63.44	2026-10-12 09:06:00.728739+07
35	1	28.13	71.65	64.92	2026-10-12 10:06:00.728739+07
36	1	32.12	58.94	59.02	2026-10-12 11:06:00.728739+07
37	1	33.71	55.75	58.59	2026-10-12 12:06:00.728739+07
38	1	32.86	55.37	56.82	2026-10-12 13:06:00.728739+07
39	1	33.51	58.76	59.50	2026-10-12 14:06:00.728739+07
40	1	33.13	61.06	59.01	2026-10-12 15:06:00.728739+07
41	1	28.51	66.74	60.44	2026-10-12 16:06:00.728739+07
42	1	28.95	67.99	61.10	2026-10-12 17:06:00.728739+07
43	1	29.07	68.47	63.02	2026-10-12 18:06:00.728739+07
44	1	30.18	69.75	60.39	2026-10-12 19:06:00.728739+07
45	1	25.39	83.82	66.19	2026-10-12 20:06:00.728739+07
46	1	23.83	80.48	67.27	2026-10-12 21:06:00.728739+07
47	1	23.74	85.10	66.21	2026-10-12 22:06:00.728739+07
48	1	23.53	84.21	65.97	2026-10-12 22:06:04.416931+07
49	2	29.23	74.07	65.23	2026-10-12 22:06:04.425481+07
50	3	28.98	72.31	64.51	2026-10-12 22:06:04.433327+07
51	4	29.57	71.98	65.69	2026-10-12 22:06:04.440367+07
52	1	23.48	84.89	66.54	2026-10-12 22:06:19.412803+07
53	2	29.42	73.93	65.41	2026-10-12 22:06:19.422629+07
54	3	28.98	71.57	64.93	2026-10-12 22:06:19.42995+07
55	4	29.57	72.00	65.69	2026-10-12 22:06:19.437315+07
56	1	23.58	84.10	66.39	2026-10-12 22:06:34.428848+07
57	2	29.29	73.21	64.81	2026-10-12 22:06:34.436382+07
58	3	29.23	70.85	64.63	2026-10-12 22:06:34.443631+07
59	4	29.26	72.11	65.65	2026-10-12 22:06:34.451659+07
60	1	23.46	83.41	66.92	2026-10-12 22:06:49.418306+07
61	2	29.17	73.09	64.93	2026-10-12 22:06:49.423879+07
62	3	29.18	70.64	64.50	2026-10-12 22:06:49.428777+07
63	4	29.44	71.87	65.46	2026-10-12 22:06:49.435117+07
64	1	23.46	83.92	66.58	2026-10-12 22:07:04.420928+07
65	2	29.31	73.02	64.46	2026-10-12 22:07:04.426931+07
66	3	28.98	71.63	64.41	2026-10-12 22:07:04.435569+07
67	4	29.79	72.45	65.33	2026-10-12 22:07:04.439575+07
68	1	23.31	84.40	66.85	2026-10-12 22:07:19.420682+07
69	2	29.14	72.63	65.00	2026-10-12 22:07:19.424687+07
70	3	28.76	70.78	63.89	2026-10-12 22:07:19.429773+07
71	4	29.98	73.00	65.74	2026-10-12 22:07:19.434332+07
72	1	23.17	84.91	66.38	2026-10-12 22:07:34.415365+07
73	2	29.09	73.43	64.99	2026-10-12 22:07:34.422637+07
74	3	28.42	71.44	64.04	2026-10-12 22:07:34.426144+07
75	4	29.64	73.30	65.38	2026-10-12 22:07:34.433144+07
76	1	23.14	85.37	66.87	2026-10-12 22:07:49.430919+07
77	2	28.92	74.03	65.27	2026-10-12 22:07:49.439444+07
78	3	28.13	71.99	64.31	2026-10-12 22:07:49.44933+07
79	4	29.47	72.37	64.89	2026-10-12 22:07:49.456876+07
80	1	23.33	85.01	66.84	2026-10-12 22:08:04.416728+07
81	2	28.69	74.92	65.79	2026-10-12 22:08:04.422302+07
82	3	28.32	72.02	64.80	2026-10-12 22:08:04.429836+07
83	4	29.20	72.07	65.29	2026-10-12 22:08:04.434846+07
84	1	23.45	84.12	66.49	2026-10-12 22:08:19.42002+07
85	2	28.69	75.34	65.61	2026-10-12 22:08:19.424028+07
86	3	28.27	71.99	64.51	2026-10-12 22:08:19.429542+07
87	4	28.91	71.13	64.95	2026-10-12 22:08:19.434541+07
88	1	23.42	84.53	66.51	2026-10-12 22:08:34.411452+07
89	2	28.70	74.86	65.74	2026-10-12 22:08:34.420058+07
90	3	28.11	71.45	64.82	2026-10-12 22:08:34.427143+07
91	4	29.06	71.18	64.56	2026-10-12 22:08:34.433676+07
92	1	23.16	84.24	66.29	2026-10-12 22:08:49.421258+07
93	2	28.97	75.78	65.39	2026-10-12 22:08:49.424846+07
94	3	28.13	72.32	64.83	2026-10-12 22:08:49.434123+07
95	4	28.74	71.93	65.03	2026-10-12 22:08:49.440277+07
96	1	22.98	85.10	66.16	2026-10-12 22:09:04.422975+07
97	2	29.28	76.64	64.82	2026-10-12 22:09:04.428503+07
98	3	28.17	72.35	65.15	2026-10-12 22:09:04.435524+07
99	4	28.99	72.34	64.50	2026-10-12 22:09:04.442047+07
100	1	23.03	85.54	66.31	2026-10-12 22:09:19.425168+07
101	2	29.54	77.51	64.96	2026-10-12 22:09:19.430795+07
102	3	28.35	73.14	65.14	2026-10-12 22:09:19.433794+07
103	4	29.13	72.23	63.92	2026-10-12 22:09:19.438863+07
104	1	22.88	85.52	66.02	2026-10-12 22:09:34.423338+07
105	2	29.44	78.23	65.54	2026-10-12 22:09:34.428426+07
106	3	28.50	72.91	64.61	2026-10-12 22:09:34.433903+07
107	4	28.96	72.13	64.29	2026-10-12 22:09:34.436905+07
108	1	22.88	85.79	65.84	2026-10-12 22:09:41.998419+07
109	1	23.06	85.43	66.33	2026-10-12 22:09:49.414463+07
110	2	29.19	78.97	65.27	2026-10-12 22:09:49.421117+07
111	3	28.65	72.76	64.39	2026-10-12 22:09:49.425127+07
112	4	29.02	72.94	64.54	2026-10-12 22:09:49.43165+07
113	1	23.18	84.58	65.93	2026-10-12 22:10:04.420806+07
114	2	28.94	78.60	65.34	2026-10-12 22:10:04.423806+07
115	3	28.78	73.43	64.34	2026-10-12 22:10:04.426805+07
116	4	29.19	72.59	64.35	2026-10-12 22:10:04.434424+07
117	1	23.51	84.30	65.78	2026-10-12 22:10:19.42461+07
118	2	28.89	78.34	65.54	2026-10-12 22:10:19.428503+07
119	3	29.05	74.09	64.49	2026-10-12 22:10:19.433823+07
120	4	29.22	71.87	64.55	2026-10-12 22:10:19.436832+07
121	1	23.66	84.72	65.47	2026-10-12 22:10:34.424348+07
122	2	29.11	77.56	66.01	2026-10-12 22:10:34.428347+07
123	3	28.74	73.54	64.42	2026-10-12 22:10:34.430857+07
124	4	29.11	72.36	64.87	2026-10-12 22:10:34.436864+07
125	1	23.37	84.70	65.13	2026-10-12 22:10:49.415761+07
126	2	29.44	77.34	65.73	2026-10-12 22:10:49.420253+07
127	3	29.00	73.19	64.32	2026-10-12 22:10:49.42725+07
128	4	28.77	72.45	65.45	2026-10-12 22:10:49.430688+07
129	1	23.24	85.62	65.21	2026-10-12 22:11:04.416214+07
130	2	29.43	76.84	65.67	2026-10-12 22:11:04.420729+07
131	3	29.22	72.98	63.85	2026-10-12 22:11:04.426998+07
132	4	28.50	73.32	65.92	2026-10-12 22:11:04.43367+07
133	1	23.18	84.73	65.80	2026-10-12 22:11:19.420704+07
134	2	29.20	76.94	65.48	2026-10-12 22:11:19.426116+07
135	3	29.25	73.86	64.02	2026-10-12 22:11:19.432385+07
136	4	28.30	73.26	65.46	2026-10-12 22:11:19.440874+07
137	1	23.52	84.42	65.33	2026-10-12 22:11:34.413322+07
138	2	29.54	77.33	65.03	2026-10-12 22:11:34.41958+07
139	3	28.95	73.37	63.74	2026-10-12 22:11:34.424596+07
140	4	28.56	73.09	65.15	2026-10-12 22:11:34.431673+07
141	1	23.29	84.05	65.58	2026-10-12 22:11:49.421655+07
142	2	29.19	76.66	64.48	2026-10-12 22:11:49.427662+07
143	3	29.15	73.58	63.73	2026-10-12 22:11:49.434972+07
144	4	28.38	72.98	65.15	2026-10-12 22:11:49.438476+07
145	1	22.97	84.27	65.89	2026-10-12 22:12:04.41526+07
146	2	29.28	75.80	64.33	2026-10-12 22:12:04.42044+07
147	3	28.95	74.50	63.35	2026-10-12 22:12:04.42544+07
148	4	28.45	73.01	65.05	2026-10-12 22:12:04.430957+07
149	1	22.98	83.34	65.55	2026-10-12 22:12:19.423559+07
150	2	29.40	75.08	64.32	2026-10-12 22:12:19.43008+07
151	3	28.80	74.41	63.62	2026-10-12 22:12:19.43508+07
152	4	28.46	72.63	65.45	2026-10-12 22:12:19.438588+07
153	1	23.24	83.99	65.49	2026-10-12 22:12:34.415696+07
154	2	29.56	75.05	63.88	2026-10-12 22:12:34.420408+07
155	3	29.15	74.18	64.21	2026-10-12 22:12:34.423401+07
156	4	28.79	72.17	65.54	2026-10-12 22:12:34.430462+07
157	1	23.24	84.73	65.15	2026-10-12 22:12:49.42203+07
158	2	29.73	74.16	63.83	2026-10-12 22:12:49.42658+07
159	3	29.11	73.83	64.48	2026-10-12 22:12:49.433169+07
160	4	28.84	72.24	65.23	2026-10-12 22:12:49.436534+07
161	1	23.35	85.13	64.66	2026-10-12 22:13:04.41921+07
162	2	29.69	73.46	64.00	2026-10-12 22:13:04.423217+07
163	3	29.31	74.45	63.92	2026-10-12 22:13:04.426219+07
164	4	28.72	72.70	65.22	2026-10-12 22:13:04.430207+07
165	1	23.45	85.47	64.14	2026-10-12 22:13:19.423733+07
166	2	29.64	74.26	64.42	2026-10-12 22:13:19.426728+07
167	3	29.33	74.14	64.49	2026-10-12 22:13:19.428727+07
168	4	28.94	73.14	65.76	2026-10-12 22:13:19.433987+07
169	1	23.75	86.33	64.57	2026-10-12 22:13:34.425626+07
170	2	29.81	74.13	63.86	2026-10-12 22:13:34.428823+07
171	3	29.01	73.96	64.25	2026-10-12 22:13:34.432301+07
172	4	28.62	72.71	65.96	2026-10-12 22:13:34.438381+07
173	1	23.62	85.56	64.08	2026-10-12 22:13:49.412637+07
174	2	29.64	73.66	63.71	2026-10-12 22:13:49.415893+07
175	3	29.14	74.20	64.71	2026-10-12 22:13:49.421408+07
176	4	28.64	71.81	66.42	2026-10-12 22:13:49.424453+07
177	1	23.76	84.70	64.04	2026-10-12 22:14:04.421493+07
178	2	29.56	73.93	63.52	2026-10-12 22:14:04.426008+07
179	3	29.28	74.58	65.15	2026-10-12 22:14:04.430174+07
180	4	28.95	72.31	66.17	2026-10-12 22:14:04.43218+07
181	1	23.83	83.79	64.51	2026-10-12 22:14:19.413722+07
182	2	29.40	73.83	63.97	2026-10-12 22:14:19.418755+07
183	3	29.53	74.36	65.07	2026-10-12 22:14:19.421759+07
184	4	28.95	71.72	66.56	2026-10-12 22:14:19.426762+07
185	1	23.70	84.23	64.90	2026-10-12 22:14:34.419308+07
186	2	29.46	74.36	63.57	2026-10-12 22:14:34.422317+07
187	3	29.47	74.96	65.16	2026-10-12 22:14:34.425315+07
188	4	28.68	71.14	66.90	2026-10-12 22:14:34.428754+07
189	1	23.41	84.09	65.03	2026-10-12 22:14:49.412859+07
190	2	29.66	74.10	63.30	2026-10-12 22:14:49.416783+07
191	3	29.65	75.51	65.27	2026-10-12 22:14:49.421294+07
192	4	28.87	70.64	67.15	2026-10-12 22:14:49.42334+07
193	1	23.43	84.84	64.67	2026-10-12 22:15:04.425379+07
194	2	29.58	73.65	63.65	2026-10-12 22:15:04.431898+07
195	3	29.78	76.24	65.41	2026-10-12 22:15:04.440474+07
196	4	28.57	71.29	67.49	2026-10-12 22:15:04.44596+07
197	1	23.56	84.88	64.80	2026-10-12 22:15:19.421641+07
198	2	29.37	74.34	63.78	2026-10-12 22:15:19.426824+07
199	3	29.54	75.39	64.98	2026-10-12 22:15:19.430336+07
200	4	28.87	71.76	67.97	2026-10-12 22:15:19.433337+07
201	1	23.64	84.89	64.41	2026-10-12 22:15:34.41256+07
202	2	29.12	73.56	64.05	2026-10-12 22:15:34.415561+07
203	3	29.89	75.18	64.74	2026-10-12 22:15:34.419525+07
204	4	29.05	71.73	68.34	2026-10-12 22:15:34.423526+07
205	1	23.47	84.35	63.83	2026-10-12 22:15:49.418804+07
206	2	29.09	72.70	63.87	2026-10-12 22:15:49.422647+07
207	3	29.80	74.53	65.23	2026-10-12 22:15:49.426654+07
208	4	29.26	72.56	68.24	2026-10-12 22:15:49.432998+07
209	1	23.77	84.94	63.80	2026-10-12 22:16:04.42603+07
210	2	29.34	73.28	63.74	2026-10-12 22:16:04.431708+07
211	3	30.02	73.62	65.44	2026-10-12 22:16:04.438709+07
212	4	29.44	73.47	67.95	2026-10-12 22:16:04.444541+07
213	1	24.03	84.84	64.18	2026-10-12 22:16:19.413495+07
214	2	29.18	73.67	64.12	2026-10-12 22:16:19.416589+07
215	3	29.80	74.16	65.07	2026-10-12 22:16:19.418596+07
216	4	29.18	72.53	68.27	2026-10-12 22:16:19.423095+07
217	1	24.26	85.45	63.93	2026-10-12 22:16:34.41962+07
218	2	28.94	73.60	64.55	2026-10-12 22:16:34.4228+07
219	3	29.71	74.25	65.48	2026-10-12 22:16:34.4258+07
220	4	28.99	72.70	67.73	2026-10-12 22:16:34.4327+07
221	1	24.15	85.12	64.40	2026-10-12 22:16:49.422461+07
222	2	29.14	73.44	64.48	2026-10-12 22:16:49.425461+07
223	3	29.78	74.81	65.09	2026-10-12 22:16:49.428965+07
224	4	29.03	73.24	67.70	2026-10-12 22:16:49.434935+07
225	1	24.12	84.14	63.81	2026-10-12 22:17:04.417206+07
226	2	28.94	73.21	64.49	2026-10-12 22:17:04.420717+07
227	3	29.64	74.77	64.51	2026-10-12 22:17:04.424718+07
228	4	29.21	72.50	67.86	2026-10-12 22:17:04.427718+07
229	1	24.15	84.52	63.77	2026-10-12 22:17:19.424215+07
230	2	28.63	72.29	65.06	2026-10-12 22:17:19.428453+07
231	3	29.97	75.60	65.07	2026-10-12 22:17:19.432463+07
232	4	29.34	73.17	68.36	2026-10-12 22:17:19.43568+07
233	1	23.90	85.04	63.34	2026-10-12 22:17:34.423992+07
234	2	28.68	72.52	65.07	2026-10-12 22:17:34.428495+07
235	3	29.87	76.26	64.66	2026-10-12 22:17:34.431501+07
236	4	29.15	72.85	68.76	2026-10-12 22:17:34.438502+07
237	1	24.05	84.56	63.65	2026-10-12 22:17:49.420478+07
238	2	28.63	71.99	65.04	2026-10-12 22:17:49.423483+07
239	3	29.60	76.85	65.01	2026-10-12 22:17:49.425554+07
240	4	29.08	73.55	68.25	2026-10-12 22:17:49.428992+07
241	1	24.11	85.15	63.91	2026-10-12 22:18:04.413915+07
242	2	28.83	71.18	65.04	2026-10-12 22:18:04.416914+07
243	3	29.61	77.84	65.54	2026-10-12 22:18:04.419557+07
244	4	28.94	74.51	68.27	2026-10-12 22:18:04.422472+07
245	1	24.20	85.32	63.58	2026-10-12 22:18:19.418826+07
246	2	28.55	71.89	65.04	2026-10-12 22:18:19.422362+07
247	3	29.40	78.70	65.58	2026-10-12 22:18:19.42528+07
248	4	29.04	73.51	67.86	2026-10-12 22:18:19.43132+07
249	1	24.47	85.89	63.00	2026-10-12 22:18:34.424658+07
250	2	28.48	72.42	65.57	2026-10-12 22:18:34.427647+07
251	3	29.70	78.30	66.12	2026-10-12 22:18:34.429153+07
252	4	29.30	73.35	68.26	2026-10-12 22:18:34.433159+07
253	1	24.45	86.72	62.59	2026-10-12 22:18:49.41862+07
254	2	28.59	71.46	65.95	2026-10-12 22:18:49.42279+07
255	3	29.47	77.99	65.66	2026-10-12 22:18:49.425789+07
256	4	29.22	73.95	68.32	2026-10-12 22:18:49.429293+07
257	1	24.72	86.38	62.02	2026-10-12 22:19:04.411001+07
258	2	28.86	70.72	65.87	2026-10-12 22:19:04.418529+07
259	3	29.46	78.17	65.36	2026-10-12 22:19:04.422537+07
260	4	29.44	73.94	68.87	2026-10-12 22:19:04.425653+07
261	1	24.56	87.11	62.35	2026-10-12 22:19:19.418574+07
262	2	28.73	70.67	65.31	2026-10-12 22:19:19.426682+07
263	3	29.22	78.75	65.51	2026-10-12 22:19:19.434203+07
264	4	29.40	74.65	68.91	2026-10-12 22:19:19.441932+07
265	1	24.80	87.06	62.83	2026-10-12 22:19:34.42363+07
266	2	28.96	70.78	65.52	2026-10-12 22:19:34.431001+07
267	3	29.15	78.63	65.25	2026-10-12 22:19:34.438227+07
268	4	29.13	74.81	68.84	2026-10-12 22:19:34.445763+07
269	1	24.58	86.22	63.27	2026-10-12 22:19:49.428355+07
270	2	29.21	71.18	65.79	2026-10-12 22:19:49.432981+07
271	3	29.47	79.03	65.41	2026-10-12 22:19:49.439509+07
272	4	29.45	75.28	69.25	2026-10-12 22:19:49.446285+07
273	1	24.61	85.43	62.91	2026-10-12 22:20:04.425005+07
274	2	29.06	71.35	65.70	2026-10-12 22:20:04.428511+07
275	3	29.20	78.32	65.23	2026-10-12 22:20:04.431522+07
276	4	29.34	74.42	69.73	2026-10-12 22:20:04.438662+07
277	1	24.32	84.50	63.29	2026-10-12 22:20:19.419888+07
278	2	29.11	72.08	65.49	2026-10-12 22:20:19.424889+07
279	3	28.98	78.87	65.51	2026-10-12 22:20:19.432527+07
280	4	29.59	75.29	69.89	2026-10-12 22:20:19.436045+07
281	1	24.60	84.22	63.22	2026-10-12 22:20:34.423498+07
282	2	28.81	72.70	65.41	2026-10-12 22:20:34.428335+07
283	3	29.22	78.36	65.14	2026-10-12 22:20:34.433686+07
284	4	29.62	74.58	70.08	2026-10-12 22:20:34.440232+07
\.


--
-- Data for Name: service_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service_requests (request_id, rental_id, service_id, scheduled_date, status, created_at) FROM stdin;
1	1	1	2026-10-13	ASSIGNED	2026-10-12 08:44:59.147004+07
2	1	4	2026-10-09	DONE	2026-10-08 14:44:59.147004+07
3	2	2	2026-10-14	PENDING	2026-10-12 12:44:59.147004+07
4	1	1	2026-10-14	ASSIGNED	2026-10-13 23:48:26.70311+07
5	1	1	2026-10-14	PENDING	2026-10-13 23:58:33.41936+07
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (service_id, service_code, service_name, service_type, price, unit, description, status) FROM stdin;
1	S01	Tưới nước bổ sung	A_LA_CARTE	25000.00	lần/luống	Tưới nước theo thông số kỹ thuật được giao hoặc đặt lẻ. Minh chứng: Độ ẩm trước/sau, ảnh tưới	ACTIVE
2	S02	Làm cỏ luống & rãnh	A_LA_CARTE	50000.00	luống/10m2	Làm sạch cỏ dại trong phạm vi được giao theo yêu cầu hoặc định kỳ. Minh chứng: Ảnh trước-sau	ACTIVE
3	S03	Xới đất, làm tơi bề mặt	A_LA_CARTE	40000.00	luống	Xới và làm tơi lớp đất mặt khi hiện trường phù hợp. Minh chứng: Ảnh đất tơi xốp	ACTIVE
4	S04	Bón phân theo giai đoạn	A_LA_CARTE	60000.00	lần/luống	Bón loại phân hữu cơ và liều lượng đã được duyệt. Minh chứng: Ảnh bao bì phân & mặt luống	ACTIVE
5	S05	Phủ gốc / phủ luống	A_LA_CARTE	70000.00	luống	Phủ vật liệu (rơm rạ, màng phủ) giữ ẩm hạn chế cỏ. Minh chứng: Ảnh phủ luống	ACTIVE
6	S06	Gieo hạt / trồng cây giống	A_LA_CARTE	80000.00	luống	Gieo hạt hoặc cấy cây giống theo mật độ quy định đầu vụ. Minh chứng: Ảnh mật độ cấy	ACTIVE
7	S07	Trồng dặm bổ sung	A_LA_CARTE	20000.00	lần/10 cây	Thay thế cây chết hoặc không đạt chuẩn sau kiểm tra tỷ lệ sống. Minh chứng: Ảnh cây bén rễ	ACTIVE
8	S08	Tỉa cây / tỉa lá / định chồi	A_LA_CARTE	45000.00	lần/luống	Tỉa nhánh gốc, chồi nách hoặc lá già sát gốc. Minh chứng: Ảnh luống sau khi tỉa	ACTIVE
9	S09	Làm giàn / buộc đỡ cây	A_LA_CARTE	120000.00	giàn/luống	Lắp cọc giàn chữ A hoặc buộc đỡ thân chống gãy đổ. Minh chứng: Ảnh giàn hoàn thiện	ACTIVE
10	S10	Xử lý sâu bệnh đã duyệt	A_LA_CARTE	90000.00	lần phun	Phun chế phẩm sinh học (BT, Neem, nấm xanh) sau phê duyệt. Minh chứng: Ảnh phun & cách ly	ACTIVE
11	S11	Vệ sinh khu canh tác	A_LA_CARTE	50000.00	lần/plot	Thu gom rác, tàn dư lá cành sau tỉa trong phạm vi plot. Minh chứng: Ảnh sạch sẽ	ACTIVE
12	S12	Thu hoạch và cân sản lượng	A_LA_CARTE	80000.00	lần/vụ	Thu hái đúng độ tuổi và cân đo sản lượng thực tế. Minh chứng: Ảnh cân sản phẩm	ACTIVE
13	S13	Phân loại / đóng gói	A_LA_CARTE	35000.00	kg	Sơ chế, phân loại rau an toàn và đóng túi bảo quản. Minh chứng: Ảnh sản phẩm đóng gói	ACTIVE
14	S14	Gói ủy thác chăm sóc tạm thời	FULL	350000.00	gói/tuần	Chăm sóc ngắn hạn trong thời hạn gói (7 ngày). Minh chứng: Ảnh bằng chứng từng task	ACTIVE
15	S15	Gói chăm sóc toàn vụ	FULL	1800000.00	vụ/luống	Trọn gói Assisted-growing theo Process Template từ làm đất đến thu hoạch	ACTIVE
\.


--
-- Data for Name: site_visits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.site_visits (visit_id, plot_id, visitor_name, visitor_phone, visit_date, visit_slot, status, created_at) FROM stdin;
1	1	Lô Thái Quyền	0901234567	2026-10-07	MORNING	COMPLETED	2026-10-05 14:44:59.142395+07
2	2	Đào Duy Anh	0912345678	2026-10-14	MORNING	CONFIRMED	2026-10-10 14:44:59.142395+07
3	3	Tạ Nguyễn Khôi Nguyên	0988776655	2026-10-15	AFTERNOON	PENDING	2026-10-11 14:44:59.142395+07
\.


--
-- Data for Name: template_steps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.template_steps (step_id, template_id, step_name, description, day_offset, duration_days, task_type, min_temp, max_temp, min_humidity, max_humidity, materials_needed) FROM stdin;
1	1	Làm đất &amp; Bón lót	Xới đất tơi xốp sâu 15cm, đánh luống cao 20cm. Bón lót phân trùn quế 1.5kg/m2 + vôi bột khử chua + nấm đối kháng Trichoderma. San phẳng mặt luống.. Minh chứng: Ảnh mặt luống phẳng &amp; bao bì phân lót	0	1	SOIL_PREP	20.00	35.00	60.00	85.00	\N
2	1	Gieo hạt &amp; Tưới đẫm	Ngâm hạt nước ấm (2 sôi 3 lạnh) 3 giờ, ủ nứt nanh. Gieo theo rạch cách nhau 15cm, hạt cách 3cm. Phủ lớp rơm rạ mục mỏng và tưới đẫm nước.. Minh chứng: Ảnh rạch gieo hạt &amp; luống sau tưới	0	1	PLANTING	25.00	35.00	75.00	90.00	\N
3	1	Tưới giữ ẩm &amp; Kiểm tra mầm	Tưới phun sương mịn ngày 2 lần (7h sáng và 16h chiều). Kiểm tra tỷ lệ nảy mầm, duy trì độ ẩm đất trên 70%.. Minh chứng: Ảnh mầm nhú xanh đều trên hàng	3	1	IRRIGATION	22.00	35.00	70.00	85.00	\N
4	1	Tỉa dặm &amp; Định mật độ	Cây đạt 2 lá mầm, nhổ bỏ cây còi cọc, tỉa khoảng cách cây trên hàng 4-5cm. Nhổ sạch cỏ dại phát sinh.. Minh chứng: Ảnh mật độ cây sau khi tỉa dặm	7	1	CARE	22.00	35.00	70.00	80.00	\N
5	1	Bón thúc đợt 1 (Đạm cá hữu cơ)	Hòa đạm cá ủ men vi sinh (hoặc bánh dầu hoai mục) tỷ lệ 1:200 tưới đều gốc. Xới nhẹ váng đất bề mặt giúp rễ hô hấp tốt.. Minh chứng: Ảnh thùng phân hòa loãng &amp; tưới luống	10	1	FERTILIZATION	22.00	35.00	70.00	80.00	\N
6	1	Kiểm tra sâu hại &amp; Phun BT	Kiểm tra mặt dưới lá tìm sâu tơ, sâu xanh. Phun phòng trừ bằng vi khuẩn Bacillus thuringiensis (BT - Delfin WG 15g/16L) vào chiều mát.. Minh chứng: Ảnh bình phun &amp; nhãn thuốc BT	15	1	PEST_CONTROL	20.00	32.00	65.00	80.00	\N
7	1	Bón thúc đợt 2 (Dịch chuối Humic)	Tưới bổ sung dịch chuối lên men giàu kali + Acid Humic giúp thân mập, bẹ lá dày, ngọn vươn nhanh.. Minh chứng: Ảnh rễ cây mọc khỏe &amp; ngọn xanh bóng	18	1	FERTILIZATION	22.00	35.00	70.00	85.00	\N
8	1	Cách ly an toàn &amp; Chỉ tưới nước	Kiểm tra sâu bệnh lần cuối, tuyệt đối ngừng toàn bộ phân bón và thuốc BVTV. Chỉ duy trì tưới nước sạch đủ ẩm.. Minh chứng: Ảnh luống rau đồng đều trước thu hoạch	23	1	SAFETY_INTERVAL	22.00	35.00	70.00	80.00	\N
9	1	Thu hoạch &amp; Nghiệm thu sản lượng	Cắt ngọn sát gốc chừa lại 3cm nách lá để tái sinh (hoặc nhổ tỉa cả gốc). Cân điện tử, đóng sọt giao khách/lưu kho.. Minh chứng: Ảnh cân điện tử hiển thị số kg &amp; sọt rau	26	1	HARVEST	20.00	32.00	60.00	75.00	\N
10	2	Lên luống &amp; Bón lót	Lên luống cao 20cm rãnh rộng 30cm thoát nước. Bón lót phân trùn quế 1.2kg/m2 + vôi bột khử khuẩn + lân vi sinh. Cào phẳng.. Minh chứng: Ảnh luống cao ráo và phân bón lót	0	1	SOIL_PREP	20.00	32.00	60.00	75.00	\N
11	2	Cấy cây con giống F1	Cấy cây con 10-12 ngày tuổi (3 lá thật) theo khoảng cách 15x15cm. Ấn nhẹ gốc, tưới đẫm nước bằng vòi sen mịn.. Minh chứng: Ảnh hàng cây sau cấy thẳng hàng	1	1	PLANTING	22.00	32.00	70.00	85.00	\N
12	2	Tưới hồi xanh &amp; Kích rễ	Tưới phân bón lá kích rễ hữu cơ sinh học (Roots 2 hoặc Acid Humic loãng). Bù cây héo chết nếu có.. Minh chứng: Ảnh đọt non nhú lá mới	5	1	FERTILIZATION	22.00	32.00	65.00	75.00	\N
13	2	Bón thúc đợt 1 &amp; Xới xáo	Tưới đạm hữu cơ vi sinh (phân đạm cá hoặc bánh dầu hoai). Xới nhẹ phá váng đất mặt, nhặt sạch cỏ dại.. Minh chứng: Ảnh gốc cải xanh và đất tơi xốp	10	1	FERTILIZATION	20.00	32.00	65.00	75.00	\N
14	2	Phòng trừ bọ nhảy sọc cong	Kiểm tra mật độ bọ nhảy. Phun thảo mộc Matrine (Wotac 5EC) hoặc nấm ký sinh Metarhizium (nấm xanh) lúc sáng sớm lúc bọ chưa bay.. Minh chứng: Ảnh thao tác phun kỹ mặt lá và đất	15	1	PEST_CONTROL	20.00	30.00	60.00	75.00	\N
15	2	Bón thúc đợt 2 &amp; Nuôi bẹ lá	Tưới bổ sung dịch đạm Amino Acid + dịch rong biển giúp bẹ cải nở tròn, giòn dẻo, ngọt vị.. Minh chứng: Ảnh bẹ lá cải nở to đều	20	1	FERTILIZATION	22.00	32.00	65.00	75.00	\N
16	2	Cách ly tuyệt đối &amp; Phòng thối nhũn	Ngừng toàn bộ phân bón. Nếu có vết đốm lá vi khuẩn phun nhẹ Kasugamycin (Kasumin 2SL), duy trì cách ly 5 ngày trước thu.. Minh chứng: Ảnh luống cải tươi tốt không sâu bệnh	26	1	SAFETY_INTERVAL	20.00	32.00	60.00	70.00	\N
17	2	Thu hoạch &amp; Nghiệm thu	Cắt sát gốc khi bẹ cải đẫy sức trước khi trổ hoa. Loại bỏ lá già sát đất, cân trọng lượng, chụp ảnh lưu kết quả thu hoạch.. Minh chứng: Ảnh cân ký sản lượng &amp; sọt cải thành phẩm	32	1	HARVEST	20.00	30.00	60.00	75.00	\N
18	3	Xử lý đất giá thể &amp; Lên luống	Đất phối trộn nhiều xơ dừa hoai, phân trùn quế, nấm Trichoderma. Lên luống cao 20cm đảm bảo thoát nước tối đa.. Minh chứng: Ảnh luống đất tơi mịn, xốp	0	1	SOIL_PREP	18.00	28.00	60.00	70.00	\N
19	3	Cấy cây giống từ vỉ ươm	Cấy cây con 12 ngày tuổi mật độ 20x20cm. Tưới phun sương nhẹ nhàng, che lưới đen giảm bức xạ nắng 2 ngày đầu.. Minh chứng: Ảnh luống cấy phủ lưới che mát	1	1	PLANTING	18.00	26.00	65.00	75.00	\N
20	3	Bén rễ &amp; Dỡ lưới che	Dỡ lưới che để cây đón nắng. Duy trì tưới phun sương 2 lần/ngày (8h sáng và 15h chiều). Nhặt lá chân úa.. Minh chứng: Ảnh cây đứng thẳng bén rễ xanh	6	1	CARE	18.00	28.00	60.00	70.00	\N
21	3	Bón thúc đợt 1 &amp; Bả ốc sên	Tưới dịch trùn quế loãng kích thích xòe tán. Rải bả mồi sinh học Ferric Phosphate (Snail Kill) quanh mép luống trừ ốc sên.. Minh chứng: Ảnh bả ốc rải quanh mép &amp; gốc rau	12	1	FERTILIZATION	18.00	28.00	60.00	70.00	\N
22	3	Kiểm tra rệp &amp; Phun dầu khoáng	Vạch kẽ lá kiểm tra rệp muội. Phun dầu khoáng sinh học SK Enspray 99EC nồng độ 0.3% phủ đều 2 mặt lá.. Minh chứng: Ảnh kiểm tra kẽ lá xà lách sạch sâu	20	1	PEST_CONTROL	18.00	26.00	55.00	70.00	\N
23	3	Bón thúc đợt 2 &amp; Phun Canxi-Bo	Phun Canxi-Bo hữu cơ ngừa hiện tượng cháy bìa lá (Tip-burn). Tưới gốc bổ sung dịch bánh dầu hoai mục.. Minh chứng: Ảnh tán xà lách xoăn cuộn dày	28	1	FERTILIZATION	18.00	28.00	60.00	70.00	\N
24	3	Cách ly phân thuốc &amp; Tưới gốc	Ngừng toàn bộ phân bón lá và thuốc. Chỉ tưới nước sạch trực tiếp vào gốc, tránh đọng nước trên bẹ lá sinh nấm.. Minh chứng: Ảnh bụi xà lách nở tròn đều	36	1	SAFETY_INTERVAL	18.00	26.00	55.00	65.00	\N
25	3	Thu hoạch &amp; Đóng gói	Dùng dao cắt ngang gốc sáng sớm khi sương vừa tan. Xếp khay xốp bọc màng thực phẩm, cân ký nghiệm thu.. Minh chứng: Ảnh cân điện tử &amp; cây xà lách tươi giòn	42	1	HARVEST	16.00	25.00	50.00	65.00	\N
26	4	Làm đất sâu &amp; Bón lót đáy	Đào hố sâu 25cm bón lót phân chuồng hoai 2kg/gốc + vôi bột khử chua + lân super + Trichoderma ngừa héo rũ gốc.. Minh chứng: Ảnh hố bón lót &amp; rãnh luống sâu	0	1	SOIL_PREP	20.00	30.00	60.00	75.00	\N
27	4	Cấy cây con &amp; Định vị	Cấy cây con 4 lá thật mật độ 50x70cm. Cắm que tre nhỏ định vị thân mềm tránh gió lay đổ ngã. Tưới đẫm nước.. Minh chứng: Ảnh hàng cây con cắm que định vị	1	1	PLANTING	20.00	28.00	65.00	75.00	\N
28	4	Bén rễ &amp; Tưới kích rễ đợt 1	Tưới phân kích rễ Humic + đạm cá loãng. Kiểm tra độ ẩm đất duy trì 65-75%.. Minh chứng: Ảnh rễ phát triển đọt non vươn cao	10	1	FERTILIZATION	20.00	30.00	65.00	75.00	\N
29	4	Cắm cọc giàn &amp; Buộc dây treo	Cắm cọc tre cao 1.8m hoặc buộc dây treo trần nhà lưới. Quấn thân cà chua theo dây. Vặt bỏ các lá già sát đất.. Minh chứng: Ảnh giàn cọc &amp; thân cây quấn dây	18	1	PRUNING	20.00	30.00	60.00	70.00	\N
30	4	Tỉa chồi nách &amp; Bón thúc thân	Vặt sạch toàn bộ chồi phụ ở nách lá, chỉ giữ 1 thân chính duy nhất. Bón thúc NPK hữu cơ 20-20-15 quanh tán cây.. Minh chứng: Ảnh nách lá sau khi vặt sạch chồi	28	1	PRUNING	20.00	30.00	60.00	75.00	\N
31	4	Bón đón hoa &amp; Phòng bọ trĩ	Phun vi lượng Bo chống rụng hoa. Phun phòng bọ trĩ bằng tinh dầu Neem phối hợp Abamectin sinh học.. Minh chứng: Ảnh chùm nụ hoa đầu tiên xuất hiện	40	1	FERTILIZATION	20.00	28.00	60.00	70.00	\N
32	4	Hỗ trợ thụ phấn &amp; Phun Canxi-Bo	Rung nhẹ dây giàn lúc 8:30 sáng giúp phấn hoa bung đều. Phun Canxi-Bo sữa sinh học ngăn thối đít quả.. Minh chứng: Ảnh chùm quả non xanh đậu đều	48	1	CARE	20.00	28.00	60.00	70.00	\N
33	4	Tỉa lá già &amp; Bón thúc quả lớn	Cắt tỉa lá già vàng bên dưới chùm quả thứ nhất. Bón thúc Kali hữu cơ (dịch chuối ủ vi sinh) giúp quả bóng mọng.. Minh chứng: Ảnh các chùm quả lớn đẫy sức	58	1	PRUNING	20.00	30.00	65.00	75.00	\N
34	4	Ngừng thuốc BVTV &amp; Thúc ngọt	Ngừng toàn bộ thuốc BVTV. Tưới thúc kali lần cuối giúp quả chuyển màu đỏ tươi và tăng độ ngọt (Brix).. Minh chứng: Ảnh quả bắt đầu chuyển màu vàng cam	68	1	SAFETY_INTERVAL	20.00	30.00	60.00	70.00	\N
35	4	Thu hoạch đợt 1 (Quả chín đỏ)	Dùng kéo cắt từng chùm hoặc quả đơn đạt độ chín 85%. Cân điện tử, chụp ảnh hiện trường lưu Harvest Result.. Minh chứng: Ảnh chùm quả chín đỏ rực &amp; cân ký	75	1	HARVEST	20.00	28.00	55.00	65.00	\N
36	4	Thu hoạch vét &amp; Thu dọn tàn dư	Thu toàn bộ quả còn lại, cắt dây hạ giàn, thu gom gốc rễ chuyển sang chế độ Maintenance nghỉ đất.. Minh chứng: Ảnh Plot dọn sạch tàn dư chuẩn bị ải	82	1	HARVEST	20.00	30.00	55.00	65.00	\N
37	5	Làm đất xốp &amp; Bón lót rãnh	Đánh luống cao 25cm, rạch rãnh bón lót phân trùn quế 2kg/m2 + lân nung chảy + nấm đối kháng Trichoderma. Lấp đất màu.. Minh chứng: Ảnh luống cao rãnh rạch phân lót	0	1	SOIL_PREP	22.00	32.00	65.00	75.00	\N
38	5	Cấy cây con bầu ươm	Cấy cây con 8 ngày tuổi mật độ 40x50cm. Tưới đẫm nước xung quanh bầu rễ.. Minh chứng: Ảnh bầu cây con thẳng hàng trên luống	1	1	PLANTING	22.00	32.00	70.00	80.00	\N
39	5	Bén rễ &amp; Bón kích ngọn đọt	Cây bén rễ nhanh, tưới thúc đạm cá hữu cơ loãng kích thích phát triển rễ phụ và ngọn leo.. Minh chứng: Ảnh ngọn non vươn tua cuốn	7	1	FERTILIZATION	22.00	32.00	70.00	80.00	\N
40	5	Cắm giàn chữ A &amp; Căng lưới	Cắm cọc tre chữ A cao 2m, giăng lưới cước mắt 15cm. Cố định ngọn leo vào mắt lưới đầu tiên.. Minh chứng: Ảnh giàn lưới chữ A hoàn thiện	14	1	PRUNING	22.00	32.00	65.00	75.00	\N
41	5	Vặt nhánh gốc &amp; Bấm hoa sớm	Vặt sạch toàn bộ nhánh phụ và hoa từ nách lá 1 đến 5 để cây dồn sức nuôi thân leo lên đỉnh giàn.. Minh chứng: Ảnh thân chính sạch nhánh dưới gốc	20	1	PRUNING	22.00	32.00	65.00	75.00	\N
42	5	Bón thúc nuôi quả &amp; Phòng nấm	Bón thúc NPK 16-16-16 hữu cơ. Phun phòng nấm phấn trắng bằng Bacillus amyloliquefaciens (Serenade ASO).. Minh chứng: Ảnh hoa cái nở rộ trên các nách lá	28	1	FERTILIZATION	22.00	30.00	65.00	75.00	\N
43	5	Tưới đủ ẩm &amp; Bổ sung Kali	Dưa leo nuôi quả rất cần nước, tưới 2 lần/ngày không để khô hạn làm đắng trái. Bổ sung dịch chuối ủ men.. Minh chứng: Ảnh chùm quả non suôn thẳng	35	1	IRRIGATION	22.00	32.00	70.00	80.00	\N
44	5	Ngừng thuốc BVTV &amp; Cách ly	Ngừng hoàn toàn mọi loại thuốc BVTV, đảm bảo an toàn tuyệt đối khi thu hoạch.. Minh chứng: Ảnh quả dưa leo xanh mướt	42	1	SAFETY_INTERVAL	22.00	30.00	65.00	75.00	\N
45	5	Thu hoạch rộ lứa đầu	Thu hoạch quả dài 10-12cm khi vỏ còn lớp phấn trắng mịn. Cắt bằng kéo, thu cách ngày 1 lần.. Minh chứng: Ảnh sọt dưa leo baby &amp; cân ký	46	1	HARVEST	20.00	30.00	60.00	70.00	\N
46	5	Thu hoạch vét &amp; Vệ sinh giàn	Thu hết lứa quả cuối, cắt gốc dây dưa, tháo gỡ lưới thu gom tàn dư chuẩn bị phơi ải đất.. Minh chứng: Ảnh dọn sạch giàn lưới sau thu hoạch	56	1	HARVEST	22.00	32.00	60.00	70.00	\N
47	6	Làm đất &amp; Bón lót luống	Lên luống cao 25cm thoát nước tốt. Bón lót phân chuồng hoai mục + lân super + vôi bột khử khuẩn. Rạch hàng.. Minh chứng: Ảnh luống cao ráo bón lót phân hoai	0	1	SOIL_PREP	20.00	30.00	60.00	70.00	\N
48	6	Gieo hạt hốc	Gieo 2 hạt/hốc cách nhau 30cm, sâu 2cm. Phủ tro trấu mỏng giữ ẩm, tưới nhẹ bằng ô doa.. Minh chứng: Ảnh hốc gieo hạt phủ tro trấu	1	1	PLANTING	20.00	30.00	65.00	75.00	\N
49	6	Tỉa định cây &amp; Xới nhẹ	Hạt mọc mầm đều, tỉa giữ lại 1 cây khỏe nhất/hốc. Dùng cào nhỏ xới nhẹ váng đất quanh gốc.. Minh chứng: Ảnh mầm đậu xanh khỏe 1 cây/hốc	5	1	CARE	20.00	30.00	65.00	75.00	\N
50	6	Bón thúc đợt 1 &amp; Vun nhẹ gốc	Tưới thúc đạm cá hữu cơ loãng. Vun một lớp đất mỏng vào cổ rễ giúp cây đứng vững.. Minh chứng: Ảnh gốc đậu được vun đất màu	14	1	FERTILIZATION	20.00	30.00	65.00	75.00	\N
51	6	Cắm giàn leo chữ A	Cắm giàn tre chữ A cao 1.8m, buộc nẹp ngang. Hướng dẫn ngọn đậu bám vào thân cọc.. Minh chứng: Ảnh giàn cọc tre thẳng tắp	20	1	PRUNING	20.00	30.00	60.00	70.00	\N
52	6	Bón thúc đón hoa &amp; Phun Bo	Bón NPK hữu cơ cân đối. Phun phân bón lá Bo sinh học chống rụng hoa tăng tỷ lệ đậu quả.. Minh chứng: Ảnh chùm hoa đậu trắng tím nở rộ	30	1	FERTILIZATION	20.00	28.00	60.00	70.00	\N
53	6	Phòng dòi đục thân &amp; Sâu quả	Phun chế phẩm vi khuẩn BT hoặc Emamectin benzoate (Tasieu 1.9EC) phòng sâu đục quả. Bắt đầu thời kỳ cách ly.. Minh chứng: Ảnh phun thuốc sinh học đều giàn	38	1	PEST_CONTROL	20.00	28.00	60.00	70.00	\N
54	6	Thu hoạch lứa đầu	Thu hoạch quả bánh tẻ màu xanh tươi, hạt chưa gồ to. Hái nhẹ tay tránh rách cành hoa.. Minh chứng: Ảnh rổ đậu cô ve tươi giòn	45	1	HARVEST	20.00	28.00	55.00	65.00	\N
55	6	Thu hoạch lứa 2 &amp; Dọn tàn dư	Thu hết các quả còn lại, cắt bỏ dây đậu gom vào khu ủ rác hữu cơ.. Minh chứng: Ảnh cân ký sản lượng cuối vụ	52	1	HARVEST	20.00	30.00	55.00	65.00	\N
56	7	Đào hố &amp; Bón lót đáy	Đào hố 40x40cm, sâu 30cm. Bón lót 3kg phân chuồng ủ hoai + 100g lân + vôi khử trùng + nấm Trichoderma. Lấp đất ủ 2 ngày.. Minh chứng: Ảnh hố phân lót đáy tơi xốp	0	1	SOIL_PREP	22.00	35.00	65.00	75.00	\N
57	7	Cấy cây con bầu ươm	Ngâm ủ hạt gieo bầu 7 ngày trước. Cấy cây con 2 lá thật vào hố, khoảng cách hốc 1m. Tưới đẫm nước.. Minh chứng: Ảnh cây con mướp trong hố đất	1	1	PLANTING	25.00	35.00	70.00	85.00	\N
58	7	Bén rễ &amp; Bón thúc kích ngọn	Cây bén rễ nhú tua cuốn, tưới dịch trùn quế loãng kích thích thân dây vươn dài khỏe.. Minh chứng: Ảnh ngọn mướp mập mạp xanh tốt	10	1	FERTILIZATION	25.00	35.00	70.00	80.00	\N
59	7	Bắt giàn mái bằng / Giàn lưới	Làm giàn mái bằng hoặc giàn lưới cao 2m. Cắm cọc dắt ngọn mướp bò lên mặt giàn.. Minh chứng: Ảnh ngọn mướp leo chạm mặt giàn	18	1	PRUNING	25.00	35.00	65.00	75.00	\N
60	7	Bấm ngọn chính kích nhánh cái	Khi ngọn chính bò lên giàn được 1m, bấm ngọn sinh trưởng để kích thích bung nhiều nhánh cấp 1 mang hoa cái.. Minh chứng: Ảnh vết bấm ngọn &amp; các chồi nhánh	28	1	PRUNING	25.00	35.00	65.00	75.00	\N
61	7	Treo bẫy ruồi vàng &amp; Bón hoa	Treo bẫy dẫn dụ Pheromone (Vizubon-D) ngoài rìa giàn trừ ruồi đục quả. Bón NPK hữu cơ nuôi hoa.. Minh chứng: Ảnh bẫy ruồi vàng treo đầu giàn	38	1	PEST_CONTROL	25.00	32.00	65.00	75.00	\N
62	7	Nuôi quả lớn &amp; Tưới đủ nước	Mướp nuôi quả cần rất nhiều nước, tưới giữ ẩm 70-80%. Bổ sung dịch chuối trứng giàu Kali.. Minh chứng: Ảnh quả mướp non treo lủng lẳng	48	1	IRRIGATION	25.00	35.00	70.00	80.00	\N
63	7	Cách ly tuyệt đối &amp; Tỉa lá già	Ngừng toàn bộ thuốc BVTV. Cắt bỏ bớt các lá già vàng phía dưới giúp giàn thông thoáng đón gió.. Minh chứng: Ảnh giàn mướp thông thoáng, sai quả	56	1	SAFETY_INTERVAL	25.00	35.00	65.00	75.00	\N
64	7	Thu hoạch đợt 1 (Quả thẳng thơm)	Cắt quả khi đạt độ dài 25-30cm, vỏ mềm thơm ngát. Cân ký và chụp ảnh nghiệm thu.. Minh chứng: Ảnh quả mướp hương trên cân điện tử	60	1	HARVEST	22.00	32.00	60.00	70.00	\N
65	7	Thu hoạch đợt 2 &amp; Vệ sinh giàn	Thu các lứa quả còn lại, cắt gốc dọn dây tàn dư để chuẩn bị chu kỳ nghỉ đất.. Minh chứng: Ảnh dọn sạch giàn chuẩn bị cày ải	68	1	HARVEST	25.00	35.00	60.00	70.00	\N
66	8	Lên luống &amp; Bón lót hữu cơ	Đất nhiều mùn, tơi xốp. Lên luống cao 20cm, bón lót phân trùn quế 1.5kg/m2 + lân vi sinh. Cào phẳng.. Minh chứng: Ảnh luống phẳng mịn, bón phân đều	0	1	SOIL_PREP	22.00	35.00	65.00	75.00	\N
67	8	Gieo hạt theo hàng	Ngâm hạt nước ấm 4 giờ. Rạch hàng cách nhau 20cm, gieo hạt cách 10cm, phủ lớp đất mỏng 1cm. Tưới đẫm.. Minh chứng: Ảnh luống sau gieo được phủ ẩm	1	1	PLANTING	25.00	35.00	75.00	85.00	\N
68	8	Kiểm tra mầm &amp; Tỉa dặm	Hạt mọc mầm 2 lá, tỉa giữ khoảng cách 12-15cm. Tưới nước giữ ẩm ngày 2 lần.. Minh chứng: Ảnh cây con mồng tơi mập xanh	6	1	CARE	25.00	35.00	70.00	85.00	\N
69	8	Bón thúc đợt 1 (Đạm cá)	Tưới thúc đạm cá lên men hoặc bánh dầu ngâm ủ vi sinh loãng giúp bẹ lá dày, ngọn vươn nhanh.. Minh chứng: Ảnh tưới phân hữu cơ quanh gốc	12	1	FERTILIZATION	25.00	35.00	70.00	85.00	\N
70	8	Bón thúc đợt 2 &amp; Xới xáo	Xới nhẹ rãnh luống, bón bổ sung phân trùn quế rải mặt + dịch chuối Humic. Nhặt sạch cỏ dại.. Minh chứng: Ảnh lá mồng tơi to tròn, xanh bóng	18	1	FERTILIZATION	25.00	35.00	70.00	85.00	\N
71	8	Kiểm tra sâu khoang &amp; Cách ly	Vạch lá bắt sâu khoang thủ công. Phun vi khuẩn BT nếu mật độ cao. Bắt đầu ngừng phân bón thuốc trừ sâu.. Minh chứng: Ảnh kiểm tra tán lá lành lặn	24	1	PEST_CONTROL	22.00	35.00	65.00	80.00	\N
72	8	Thu hoạch đọt &amp; Nghiệm thu	Cắt đọt non dài 15-20cm chừa lại 2 nách lá sát gốc để tiếp tục sinh nhánh lứa 2. Cân ký giao khách.. Minh chứng: Ảnh đọt mồng tơi trên cân &amp; sọt rau	30	1	HARVEST	22.00	32.00	60.00	75.00	\N
73	9	Lên luống cao &amp; Bón lót sâu	Lên luống cao 30cm rãnh sâu chống úng. Bón lót phân chuồng hoai 2kg/m2 + vôi bột khử nấm + lân + Trichoderma.. Minh chứng: Ảnh luống cao rãnh sâu thoát nước	0	1	SOIL_PREP	22.00	32.00	60.00	70.00	\N
74	9	Cấy cây con giống vỉ ươm	Cấy cây con 20 ngày tuổi (4-5 lá thật) theo khoảng cách 45x50cm. Tưới đẫm nước định vị gốc.. Minh chứng: Ảnh hàng ớt cấy ngay ngắn	1	1	PLANTING	22.00	32.00	65.00	75.00	\N
75	9	Bén rễ &amp; Tưới kích rễ đợt 1	Tưới phân kích rễ Humic + đạm cá loãng. Xới nhẹ đất mặt luống giúp rễ ăn sâu.. Minh chứng: Ảnh đọt non nhú lá xanh đậm	12	1	FERTILIZATION	22.00	32.00	65.00	75.00	\N
76	9	Tỉa cành chạc V &amp; Cắm cọc	Vặt sạch toàn bộ chồi nách và lá phía dưới chạc chữ V đầu tiên. Cắm cọc tre buộc thân chống đổ ngã.. Minh chứng: Ảnh thân ớt thông thoáng dưới chạc V	25	1	PRUNING	22.00	32.00	60.00	70.00	\N
77	9	Bón thúc đợt 2 &amp; Phun vi lượng	Bón NPK hữu cơ 20-20-15. Phun Bo vi lượng sinh học chống rụng hoa tăng tỷ lệ đậu trái.. Minh chứng: Ảnh hoa ớt trắng nở đều trên chạc	40	1	FERTILIZATION	22.00	30.00	60.00	70.00	\N
78	9	Phòng trừ bọ trĩ &amp; Thán thư	Phun tinh dầu Neem + Nano Bạc Đồng phòng bọ trĩ làm xoăn đọt và bệnh thán thư nổ trái.. Minh chứng: Ảnh chùm quả ớt non chỉ thiên	55	1	PEST_CONTROL	22.00	30.00	60.00	70.00	\N
79	9	Thúc chín quả &amp; Ngừng thuốc	Ngừng toàn bộ thuốc BVTV. Tưới kali hữu cơ (dịch chuối lên men) giúp quả chuyển màu đỏ tươi, tăng độ cay.. Minh chứng: Ảnh quả ớt chuyển màu đỏ rực	70	1	SAFETY_INTERVAL	22.00	32.00	60.00	70.00	\N
80	9	Thu hoạch quả đỏ đợt 1	Hái từng quả chín đỏ đều kèm cuống. Cân điện tử, chụp ảnh nghiệm thu sản lượng.. Minh chứng: Ảnh rổ ớt đỏ tươi trên cân điện tử	80	1	HARVEST	20.00	30.00	55.00	65.00	\N
81	9	Thu hoạch đợt 2 &amp; Dưỡng cây	Thu hoạch đợt 2, bón bổ sung phân trùn quế gốc để duy trì cây ra hoa lứa tiếp theo.. Minh chứng: Ảnh gốc ớt sau khi bón dưỡng lứa 2	88	1	HARVEST	22.00	32.00	60.00	70.00	\N
82	10	Làm đất mịn &amp; Bón lót	Đất cày xới kỹ, tán nhỏ tơi mịn. Bón lót phân trùn quế hoai 1.2kg/m2 + vôi bột khử khuẩn. San phẳng mặt luống.. Minh chứng: Ảnh mặt luống phẳng mịn	0	1	SOIL_PREP	22.00	35.00	65.00	75.00	\N
83	10	Gieo vãi hạt trộn cát	Hạt dền rất nhỏ, trộn đều với cát mịn hoặc tro bếp theo tỷ lệ 1:5 rồi rắc đều trên mặt luống. Phủ rơm mục mỏng, tưới đẫm.. Minh chứng: Ảnh luống sau gieo phủ rơm tưới ẩm	1	1	PLANTING	25.00	35.00	75.00	85.00	\N
84	10	Kiểm tra mầm &amp; Tưới sương	Hạt nảy mầm sau 2-3 ngày. Tưới phun sương nhẹ nhàng ngày 2 lần, tránh vòi xịt mạnh làm dập mầm.. Minh chứng: Ảnh thảm mầm đỏ tía nhú đều	4	1	IRRIGATION	25.00	35.00	70.00	80.00	\N
85	10	Tỉa thưa &amp; Bón thúc đợt 1	Tỉa thưa bớt chỗ quá dày giữ khoảng cách 5-7cm/cây. Tưới thúc đạm cá hữu cơ loãng giúp vươn ngọn.. Minh chứng: Ảnh hàng rau dền sau tỉa thoáng	10	1	FERTILIZATION	25.00	35.00	70.00	80.00	\N
86	10	Bón thúc đợt 2 &amp; Nhặt cỏ	Tưới bổ sung dịch trùn quế. Nhặt sạch cỏ dại cạnh tranh dinh dưỡng. Đảm bảo độ ẩm đất 65-80%.. Minh chứng: Ảnh lá rau dền đỏ tía mọc rộ	16	1	FERTILIZATION	25.00	35.00	65.00	80.00	\N
87	10	Kiểm tra sâu &amp; Cách ly tuyệt đối	Kiểm tra sâu xanh ăn lá (bắt tay hoặc phun BT nếu mật độ cao). Ngừng tuyệt đối phân bón thuốc BVTV.. Minh chứng: Ảnh thảm rau dền đỏ mơn mởn	21	1	SAFETY_INTERVAL	22.00	32.00	60.00	75.00	\N
88	10	Thu hoạch &amp; Nghiệm thu	Nhổ cả cây rửa sạch đất rễ (hoặc cắt ngang thân chừa 3cm để tái sinh). Cân ký và chụp ảnh minh chứng.. Minh chứng: Ảnh bó rau dền đỏ trên cân điện tử	26	1	HARVEST	20.00	30.00	60.00	70.00	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, role_id, email, password_hash, full_name, phone_number, address, status, created_at, updated_at) FROM stdin;
13	1	quockhanh@gmail.com	$2a$10$sjxR7Cwpr5Z5Syeb91mpheBU1e.0rQgowepURnlyeayuzttH2Wbkq	Khánh	0909090827	Hồ Chí Minh	ACTIVE	2026-10-12 14:56:27.474705+07	2026-10-14 01:31:17.867836+07
1	1	customer@farmely.vn	$2a$10$sjxR7Cwpr5Z5Syeb91mpheBU1e.0rQgowepURnlyeayuzttH2Wbkq	Lô Thái Quyền	0901234567	Tòa nhà Landmark 81, P.22, Q.Bình Thạnh, TP.HCM	ACTIVE	2026-10-12 14:44:59.082006+07	2026-10-14 01:31:17.867836+07
2	1	duyanh@farmely.vn	$2a$10$sjxR7Cwpr5Z5Syeb91mpheBU1e.0rQgowepURnlyeayuzttH2Wbkq	Đào Duy Anh	0912345678	Số 45 Lê Duẩn, P.Bến Nghé, Quận 1, TP.HCM	ACTIVE	2026-10-12 14:44:59.082006+07	2026-10-14 01:31:17.867836+07
3	1	tanguyen@farmely.vn	$2a$10$sjxR7Cwpr5Z5Syeb91mpheBU1e.0rQgowepURnlyeayuzttH2Wbkq	Tạ Nguyễn Khôi Nguyên	0988776655	Biệt thự Thảo Điền, TP.Thủ Đức, TP.HCM	ACTIVE	2026-10-12 14:44:59.082006+07	2026-10-14 01:31:17.867836+07
4	1	vhoang@farmely.vn	$2a$10$sjxR7Cwpr5Z5Syeb91mpheBU1e.0rQgowepURnlyeayuzttH2Wbkq	Nguyễn Văn Hoàng	0977123456	Khu Đô thị Phú Mỹ Hưng, Quận 7, TP.HCM	ACTIVE	2026-10-12 14:44:59.082006+07	2026-10-14 01:31:17.867836+07
5	2	expert@farmely.vn	$2a$10$sjxR7Cwpr5Z5Syeb91mpheBU1e.0rQgowepURnlyeayuzttH2Wbkq	ThS. Nguyễn Hoàng Nam	0903888999	Viện Khoa học Nông nghiệp Miền Nam, TP.HCM	ACTIVE	2026-10-12 14:44:59.082006+07	2026-10-14 01:31:17.867836+07
6	2	thao.tran@farmely.vn	$2a$10$sjxR7Cwpr5Z5Syeb91mpheBU1e.0rQgowepURnlyeayuzttH2Wbkq	ThS. Trần Phương Thảo	0903777888	Trung tâm Công nghệ Sinh học Nông nghiệp Đà Lạt	ACTIVE	2026-10-12 14:44:59.082006+07	2026-10-14 01:31:17.867836+07
7	2	duc.le@farmely.vn	$2a$10$sjxR7Cwpr5Z5Syeb91mpheBU1e.0rQgowepURnlyeayuzttH2Wbkq	TS. Lê Hoàng Đức	0903666555	Đại học Nông Lâm TP.HCM	ACTIVE	2026-10-12 14:44:59.082006+07	2026-10-14 01:31:17.867836+07
8	3	worker@farmely.vn	$2a$10$sjxR7Cwpr5Z5Syeb91mpheBU1e.0rQgowepURnlyeayuzttH2Wbkq	Trần Văn Lực	0933111222	Ấp 3, Xã Nhuận Đức, Huyện Củ Chi, TP.HCM	ACTIVE	2026-10-12 14:44:59.082006+07	2026-10-14 01:31:17.867836+07
9	3	dat.nguyen@farmely.vn	$2a$10$sjxR7Cwpr5Z5Syeb91mpheBU1e.0rQgowepURnlyeayuzttH2Wbkq	Nguyễn Văn Đạt	0933222333	Xã Thái Mỹ, Huyện Củ Chi, TP.HCM	ACTIVE	2026-10-12 14:44:59.082006+07	2026-10-14 01:31:17.867836+07
10	3	hai.hoang@farmely.vn	$2a$10$sjxR7Cwpr5Z5Syeb91mpheBU1e.0rQgowepURnlyeayuzttH2Wbkq	Hoàng Thanh Hải	0933444555	Thôn 4, Xã Tà Nung, TP.Đà Lạt, Lâm Đồng	ACTIVE	2026-10-12 14:44:59.082006+07	2026-10-14 01:31:17.867836+07
11	4	admin@farmely.vn	$2a$10$sjxR7Cwpr5Z5Syeb91mpheBU1e.0rQgowepURnlyeayuzttH2Wbkq	Ban Quản Trị Farmely	0909000111	Trụ sở Farmely Tech Hub, Quận 1, TP.HCM	ACTIVE	2026-10-12 14:44:59.082006+07	2026-10-14 01:31:17.867836+07
\.


--
-- Data for Name: varieties; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.varieties (variety_id, crop_id, variety_name, expected_duration, buffer_time, created_at) FROM stdin;
1	1	Rau muống lá tre F1	30	4	2026-10-12 14:44:59.092577+07
2	2	Cải ngọt bông F1	35	4	2026-10-12 14:44:59.092577+07
3	3	Xà lách Romaine VietGAP	45	4	2026-10-12 14:44:59.092577+07
4	4	Cà chua bi đỏ F1	80	7	2026-10-12 14:44:59.092577+07
5	5	Dưa leo baby F1	55	5	2026-10-12 14:44:59.092577+07
6	6	Đậu cô ve lùn / leo F1	55	5	2026-10-12 14:44:59.092577+07
7	7	Mướp hương cao sản F1	65	7	2026-10-12 14:44:59.092577+07
8	8	Mồng tơi lá to F1	35	4	2026-10-12 14:44:59.092577+07
9	9	Ớt chỉ thiên F1	85	7	2026-10-12 14:44:59.092577+07
10	10	Rau dền đỏ F1	30	4	2026-10-12 14:44:59.092577+07
\.


--
-- Name: audit_logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_log_id_seq', 4, true);


--
-- Name: care_tasks_task_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.care_tasks_task_id_seq', 4, true);


--
-- Name: contract_cancellations_cancellation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contract_cancellations_cancellation_id_seq', 1, true);


--
-- Name: contracts_contract_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contracts_contract_id_seq', 3, true);


--
-- Name: conversations_conversation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.conversations_conversation_id_seq', 3, true);


--
-- Name: crops_crop_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.crops_crop_id_seq', 10, true);


--
-- Name: farm_diaries_diary_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.farm_diaries_diary_id_seq', 2, true);


--
-- Name: harvest_results_harvest_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.harvest_results_harvest_id_seq', 1, true);


--
-- Name: issue_reports_issue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.issue_reports_issue_id_seq', 2, true);


--
-- Name: knowledge_documents_document_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.knowledge_documents_document_id_seq', 5, true);


--
-- Name: lands_land_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lands_land_id_seq', 3, true);


--
-- Name: messages_message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_message_id_seq', 1, false);


--
-- Name: notifications_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_notification_id_seq', 5, true);


--
-- Name: payment_transactions_transaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_transactions_transaction_id_seq', 7, true);


--
-- Name: plots_plot_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.plots_plot_id_seq', 22, true);


--
-- Name: process_templates_template_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.process_templates_template_id_seq', 10, true);


--
-- Name: rentals_rental_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rentals_rental_id_seq', 3, true);


--
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 4, true);


--
-- Name: sensor_readings_reading_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sensor_readings_reading_id_seq', 284, true);


--
-- Name: service_requests_request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.service_requests_request_id_seq', 5, true);


--
-- Name: services_service_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.services_service_id_seq', 15, true);


--
-- Name: site_visits_visit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.site_visits_visit_id_seq', 3, true);


--
-- Name: template_steps_step_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.template_steps_step_id_seq', 88, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 15, true);


--
-- Name: varieties_variety_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.varieties_variety_id_seq', 10, true);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (log_id);


--
-- Name: care_tasks care_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.care_tasks
    ADD CONSTRAINT care_tasks_pkey PRIMARY KEY (task_id);


--
-- Name: contract_cancellations contract_cancellations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_cancellations
    ADD CONSTRAINT contract_cancellations_pkey PRIMARY KEY (cancellation_id);


--
-- Name: contracts contracts_contract_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_contract_number_key UNIQUE (contract_number);


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (contract_id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (conversation_id);


--
-- Name: crops crops_crop_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crops
    ADD CONSTRAINT crops_crop_name_key UNIQUE (crop_name);


--
-- Name: crops crops_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crops
    ADD CONSTRAINT crops_pkey PRIMARY KEY (crop_id);


--
-- Name: farm_diaries farm_diaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.farm_diaries
    ADD CONSTRAINT farm_diaries_pkey PRIMARY KEY (diary_id);


--
-- Name: harvest_results harvest_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.harvest_results
    ADD CONSTRAINT harvest_results_pkey PRIMARY KEY (harvest_id);


--
-- Name: issue_reports issue_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issue_reports
    ADD CONSTRAINT issue_reports_pkey PRIMARY KEY (issue_id);


--
-- Name: knowledge_documents knowledge_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_documents
    ADD CONSTRAINT knowledge_documents_pkey PRIMARY KEY (document_id);


--
-- Name: lands lands_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lands
    ADD CONSTRAINT lands_pkey PRIMARY KEY (land_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (message_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (transaction_id);


--
-- Name: plot_variety_compatibility plot_variety_compatibility_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plot_variety_compatibility
    ADD CONSTRAINT plot_variety_compatibility_pkey PRIMARY KEY (plot_id, variety_id);


--
-- Name: plots plots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plots
    ADD CONSTRAINT plots_pkey PRIMARY KEY (plot_id);


--
-- Name: plots plots_plot_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plots
    ADD CONSTRAINT plots_plot_code_key UNIQUE (plot_code);


--
-- Name: process_templates process_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_templates
    ADD CONSTRAINT process_templates_pkey PRIMARY KEY (template_id);


--
-- Name: rentals rentals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_pkey PRIMARY KEY (rental_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- Name: sensor_readings sensor_readings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensor_readings
    ADD CONSTRAINT sensor_readings_pkey PRIMARY KEY (reading_id);


--
-- Name: service_requests service_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_pkey PRIMARY KEY (request_id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (service_id);


--
-- Name: services services_service_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_service_code_key UNIQUE (service_code);


--
-- Name: site_visits site_visits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_visits
    ADD CONSTRAINT site_visits_pkey PRIMARY KEY (visit_id);


--
-- Name: template_steps template_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_steps
    ADD CONSTRAINT template_steps_pkey PRIMARY KEY (step_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: varieties varieties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.varieties
    ADD CONSTRAINT varieties_pkey PRIMARY KEY (variety_id);


--
-- Name: idx_al_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_al_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_al_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_al_entity ON public.audit_logs USING btree (entity_name, entity_id);


--
-- Name: idx_al_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_al_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_cancel_contract_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cancel_contract_id ON public.contract_cancellations USING btree (contract_id);


--
-- Name: idx_cancel_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cancel_status ON public.contract_cancellations USING btree (status);


--
-- Name: idx_contracts_renter_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_renter_id ON public.contracts USING btree (renter_id);


--
-- Name: idx_contracts_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contracts_status ON public.contracts USING btree (status);


--
-- Name: idx_conv_p1; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conv_p1 ON public.conversations USING btree (participant_one);


--
-- Name: idx_conv_p2; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conv_p2 ON public.conversations USING btree (participant_two) WHERE (participant_two IS NOT NULL);


--
-- Name: idx_conv_rental_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conv_rental_id ON public.conversations USING btree (rental_id) WHERE (rental_id IS NOT NULL);


--
-- Name: idx_ct_assigned_to; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ct_assigned_to ON public.care_tasks USING btree (task_assigned_to);


--
-- Name: idx_ct_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ct_due_date ON public.care_tasks USING btree (due_date);


--
-- Name: idx_ct_rental_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ct_rental_id ON public.care_tasks USING btree (rental_id);


--
-- Name: idx_ct_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ct_status ON public.care_tasks USING btree (status);


--
-- Name: idx_fd_rental_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fd_rental_id ON public.farm_diaries USING btree (rental_id);


--
-- Name: idx_fd_task_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fd_task_id ON public.farm_diaries USING btree (task_id) WHERE (task_id IS NOT NULL);


--
-- Name: idx_hr_rental_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hr_rental_id ON public.harvest_results USING btree (rental_id);


--
-- Name: idx_ir_rental_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ir_rental_id ON public.issue_reports USING btree (rental_id);


--
-- Name: idx_ir_reported_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ir_reported_by ON public.issue_reports USING btree (reported_by);


--
-- Name: idx_ir_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ir_status ON public.issue_reports USING btree (status);


--
-- Name: idx_kd_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_kd_created_by ON public.knowledge_documents USING btree (kd_created_by);


--
-- Name: idx_msg_conversation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_msg_conversation_id ON public.messages USING btree (conversation_id);


--
-- Name: idx_msg_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_msg_created_at ON public.messages USING btree (created_at DESC);


--
-- Name: idx_msg_sender_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_msg_sender_id ON public.messages USING btree (sender_id) WHERE (sender_id IS NOT NULL);


--
-- Name: idx_notif_unread; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_unread ON public.notifications USING btree (is_read) WHERE (is_read = false);


--
-- Name: idx_notif_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_plots_is_published; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plots_is_published ON public.plots USING btree (is_published);


--
-- Name: idx_plots_land_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plots_land_id ON public.plots USING btree (land_id);


--
-- Name: idx_plots_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_plots_status ON public.plots USING btree (status);


--
-- Name: idx_pt_variety_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pt_variety_id ON public.process_templates USING btree (variety_id);


--
-- Name: idx_ptx_contract_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ptx_contract_id ON public.payment_transactions USING btree (contract_id);


--
-- Name: idx_ptx_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ptx_status ON public.payment_transactions USING btree (status);


--
-- Name: idx_ptx_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ptx_type ON public.payment_transactions USING btree (type);


--
-- Name: idx_rentals_contract_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rentals_contract_id ON public.rentals USING btree (contract_id);


--
-- Name: idx_rentals_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rentals_dates ON public.rentals USING btree (start_date, end_date);


--
-- Name: idx_rentals_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rentals_parent_id ON public.rentals USING btree (parent_rental_id) WHERE (parent_rental_id IS NOT NULL);


--
-- Name: idx_rentals_plot_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rentals_plot_id ON public.rentals USING btree (plot_id);


--
-- Name: idx_rentals_service_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rentals_service_id ON public.rentals USING btree (service_id);


--
-- Name: idx_rentals_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rentals_status ON public.rentals USING btree (status);


--
-- Name: idx_rentals_variety_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rentals_variety_id ON public.rentals USING btree (variety_id);


--
-- Name: idx_sensor_plot_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sensor_plot_id ON public.sensor_readings USING btree (plot_id);


--
-- Name: idx_sensor_recorded_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sensor_recorded_at ON public.sensor_readings USING btree (recorded_at DESC);


--
-- Name: idx_site_visits_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_site_visits_date ON public.site_visits USING btree (visit_date);


--
-- Name: idx_site_visits_plot_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_site_visits_plot_id ON public.site_visits USING btree (plot_id);


--
-- Name: idx_site_visits_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_site_visits_status ON public.site_visits USING btree (status);


--
-- Name: idx_sreq_rental_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sreq_rental_id ON public.service_requests USING btree (rental_id);


--
-- Name: idx_sreq_service_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sreq_service_id ON public.service_requests USING btree (service_id);


--
-- Name: idx_sreq_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sreq_status ON public.service_requests USING btree (status);


--
-- Name: idx_ts_template_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ts_template_id ON public.template_steps USING btree (template_id);


--
-- Name: idx_users_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role_id ON public.users USING btree (role_id);


--
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- Name: idx_varieties_crop_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_varieties_crop_id ON public.varieties USING btree (crop_id);


--
-- Name: care_tasks trg_care_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_care_tasks_updated_at BEFORE UPDATE ON public.care_tasks FOR EACH ROW EXECUTE FUNCTION public.trg_set_updated_at();


--
-- Name: contracts trg_contracts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.trg_set_updated_at();


--
-- Name: lands trg_lands_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_lands_updated_at BEFORE UPDATE ON public.lands FOR EACH ROW EXECUTE FUNCTION public.trg_set_updated_at();


--
-- Name: plots trg_plots_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_plots_updated_at BEFORE UPDATE ON public.plots FOR EACH ROW EXECUTE FUNCTION public.trg_set_updated_at();


--
-- Name: rentals trg_rentals_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_rentals_updated_at BEFORE UPDATE ON public.rentals FOR EACH ROW EXECUTE FUNCTION public.trg_set_updated_at();


--
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.trg_set_updated_at();


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: care_tasks care_tasks_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.care_tasks
    ADD CONSTRAINT care_tasks_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(rental_id);


--
-- Name: care_tasks care_tasks_service_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.care_tasks
    ADD CONSTRAINT care_tasks_service_request_id_fkey FOREIGN KEY (service_request_id) REFERENCES public.service_requests(request_id);


--
-- Name: care_tasks care_tasks_step_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.care_tasks
    ADD CONSTRAINT care_tasks_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.template_steps(step_id);


--
-- Name: care_tasks care_tasks_task_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.care_tasks
    ADD CONSTRAINT care_tasks_task_assigned_to_fkey FOREIGN KEY (task_assigned_to) REFERENCES public.users(user_id);


--
-- Name: contract_cancellations contract_cancellations_cancelled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_cancellations
    ADD CONSTRAINT contract_cancellations_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES public.users(user_id);


--
-- Name: contract_cancellations contract_cancellations_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contract_cancellations
    ADD CONSTRAINT contract_cancellations_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(contract_id);


--
-- Name: contracts contracts_renter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contracts
    ADD CONSTRAINT contracts_renter_id_fkey FOREIGN KEY (renter_id) REFERENCES public.users(user_id);


--
-- Name: conversations conversations_participant_one_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_participant_one_fkey FOREIGN KEY (participant_one) REFERENCES public.users(user_id);


--
-- Name: conversations conversations_participant_two_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_participant_two_fkey FOREIGN KEY (participant_two) REFERENCES public.users(user_id);


--
-- Name: conversations conversations_plot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_plot_id_fkey FOREIGN KEY (plot_id) REFERENCES public.plots(plot_id);


--
-- Name: conversations conversations_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(rental_id);


--
-- Name: farm_diaries farm_diaries_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.farm_diaries
    ADD CONSTRAINT farm_diaries_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(rental_id);


--
-- Name: farm_diaries farm_diaries_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.farm_diaries
    ADD CONSTRAINT farm_diaries_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.care_tasks(task_id);


--
-- Name: harvest_results harvest_results_entered_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.harvest_results
    ADD CONSTRAINT harvest_results_entered_by_fkey FOREIGN KEY (entered_by) REFERENCES public.users(user_id);


--
-- Name: harvest_results harvest_results_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.harvest_results
    ADD CONSTRAINT harvest_results_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(rental_id);


--
-- Name: issue_reports issue_reports_handled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issue_reports
    ADD CONSTRAINT issue_reports_handled_by_fkey FOREIGN KEY (handled_by) REFERENCES public.users(user_id);


--
-- Name: issue_reports issue_reports_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issue_reports
    ADD CONSTRAINT issue_reports_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(rental_id);


--
-- Name: issue_reports issue_reports_reported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.issue_reports
    ADD CONSTRAINT issue_reports_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.users(user_id);


--
-- Name: knowledge_documents knowledge_documents_kd_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knowledge_documents
    ADD CONSTRAINT knowledge_documents_kd_created_by_fkey FOREIGN KEY (kd_created_by) REFERENCES public.users(user_id);


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(conversation_id);


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(user_id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: payment_transactions payment_transactions_cancellation_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_cancellation_request_id_fkey FOREIGN KEY (cancellation_request_id) REFERENCES public.contract_cancellations(cancellation_id);


--
-- Name: payment_transactions payment_transactions_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(contract_id);


--
-- Name: payment_transactions payment_transactions_service_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_service_request_id_fkey FOREIGN KEY (service_request_id) REFERENCES public.service_requests(request_id);


--
-- Name: plot_variety_compatibility plot_variety_compatibility_plot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plot_variety_compatibility
    ADD CONSTRAINT plot_variety_compatibility_plot_id_fkey FOREIGN KEY (plot_id) REFERENCES public.plots(plot_id);


--
-- Name: plot_variety_compatibility plot_variety_compatibility_variety_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plot_variety_compatibility
    ADD CONSTRAINT plot_variety_compatibility_variety_id_fkey FOREIGN KEY (variety_id) REFERENCES public.varieties(variety_id);


--
-- Name: plots plots_land_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.plots
    ADD CONSTRAINT plots_land_id_fkey FOREIGN KEY (land_id) REFERENCES public.lands(land_id);


--
-- Name: process_templates process_templates_pt_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_templates
    ADD CONSTRAINT process_templates_pt_created_by_fkey FOREIGN KEY (pt_created_by) REFERENCES public.users(user_id);


--
-- Name: process_templates process_templates_variety_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_templates
    ADD CONSTRAINT process_templates_variety_id_fkey FOREIGN KEY (variety_id) REFERENCES public.varieties(variety_id);


--
-- Name: rentals rentals_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(contract_id);


--
-- Name: rentals rentals_parent_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_parent_rental_id_fkey FOREIGN KEY (parent_rental_id) REFERENCES public.rentals(rental_id);


--
-- Name: rentals rentals_plot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_plot_id_fkey FOREIGN KEY (plot_id) REFERENCES public.plots(plot_id);


--
-- Name: rentals rentals_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(service_id);


--
-- Name: rentals rentals_variety_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_variety_id_fkey FOREIGN KEY (variety_id) REFERENCES public.varieties(variety_id);


--
-- Name: sensor_readings sensor_readings_plot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensor_readings
    ADD CONSTRAINT sensor_readings_plot_id_fkey FOREIGN KEY (plot_id) REFERENCES public.plots(plot_id);


--
-- Name: service_requests service_requests_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(rental_id);


--
-- Name: service_requests service_requests_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(service_id);


--
-- Name: site_visits site_visits_plot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.site_visits
    ADD CONSTRAINT site_visits_plot_id_fkey FOREIGN KEY (plot_id) REFERENCES public.plots(plot_id);


--
-- Name: template_steps template_steps_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_steps
    ADD CONSTRAINT template_steps_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.process_templates(template_id) ON DELETE CASCADE;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id);


--
-- Name: varieties varieties_crop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.varieties
    ADD CONSTRAINT varieties_crop_id_fkey FOREIGN KEY (crop_id) REFERENCES public.crops(crop_id);


--
-- PostgreSQL database dump complete
--

\unrestrict 3PU8MefwnpGe1Fd2DrjTQASoHMh0Dd2t4v5e3JamsPik6kqJ4OZZiz8g7y8H388

