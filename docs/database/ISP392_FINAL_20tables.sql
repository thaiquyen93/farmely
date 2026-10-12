-- ============================================================
--  SMART AGRIRENT PLATFORM -- PostgreSQL DDL
--  Generated from: ERD_database_english.drawio
--  Tables    : 28
--  Subsystems: 5
--  Notation  : Crow's Foot (ERmandOne / ERzeroToMany)
--  Target DB : PostgreSQL 14+
-- ============================================================

SET client_encoding = 'UTF8';

-- ============================================================
-- 0. DROP (safe teardown for dev / CI)
-- ============================================================

DROP TABLE IF EXISTS
    audit_logs, notifications, messages, conversations,
    issue_reports, harvest_results, farm_diaries, care_tasks,
    payment_transactions, service_requests,
    contract_cancellations, rentals, contracts,
    template_steps, process_templates, services,
    knowledge_documents, plot_variety_compatibility,
    varieties, crops, sensor_readings, site_visits,
    plots, lands, users, roles
CASCADE;

DROP TYPE IF EXISTS
    user_status_enum, visit_slot_enum, visit_status_enum,
    plot_status_enum, service_type_enum, active_status_enum,
    rental_status_enum, cancel_status_enum, request_status_enum,
    task_status_enum, payment_status_enum, transaction_type_enum,
    delivery_type_enum, issue_status_enum,
    conversation_type_enum, conversation_status_enum,
    contract_status_enum
CASCADE;

-- ============================================================
-- 1. ENUMS
-- ============================================================

CREATE TYPE user_status_enum         AS ENUM ('ACTIVE','INACTIVE','BLOCKED');
CREATE TYPE visit_slot_enum          AS ENUM ('MORNING','AFTERNOON');
CREATE TYPE visit_status_enum        AS ENUM ('PENDING','CONFIRMED','COMPLETED','CANCELLED');
CREATE TYPE plot_status_enum         AS ENUM ('AVAIL','RENT','MAINT');
CREATE TYPE service_type_enum        AS ENUM ('A_LA_CARTE','FULL');
CREATE TYPE active_status_enum       AS ENUM ('ACTIVE','INACTIVE');
CREATE TYPE contract_status_enum     AS ENUM ('PENDING_PAYMENT','ACTIVE','COMPLETED','CANCELLED');
CREATE TYPE rental_status_enum       AS ENUM ('PENDING','CONFIRMED','ACTIVE','DONE','CANCELLED');
CREATE TYPE cancel_status_enum       AS ENUM ('PENDING','APPROVED','DONE');
CREATE TYPE request_status_enum      AS ENUM ('PENDING','ASSIGNED','DONE');
CREATE TYPE task_status_enum         AS ENUM ('PENDING','IN_PROG','DONE');
CREATE TYPE payment_status_enum      AS ENUM ('PENDING','SUCCESS','FAILED');
CREATE TYPE transaction_type_enum    AS ENUM ('PAYMENT','REFUND');
CREATE TYPE delivery_type_enum       AS ENUM ('PICKUP','DELIVERY');
CREATE TYPE issue_status_enum        AS ENUM ('OPEN','RESOLVED');
CREATE TYPE conversation_type_enum   AS ENUM ('AI','CUST_EXP','STAFF_EXP');
CREATE TYPE conversation_status_enum AS ENUM ('OPEN','CLOSED');

-- ============================================================
-- SUBSYSTEM 1 -- ACCOUNT & AUTHORIZATION (RBAC)
-- ============================================================

CREATE TABLE roles (
    role_id   SERIAL      PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);
COMMENT ON TABLE  roles          IS 'Authorization roles: CUSTOMER, EXPERT, FIELD_WORKER, ADMIN';
COMMENT ON COLUMN roles.role_name IS 'Role code, e.g. CUSTOMER / EXPERT / FIELD_WORKER / ADMIN';


CREATE TABLE users (
    user_id       SERIAL           PRIMARY KEY,
    role_id       INT              NOT NULL REFERENCES roles(role_id),
    email         VARCHAR(150)     NOT NULL UNIQUE,
    password_hash VARCHAR(255)     NOT NULL,
    full_name     VARCHAR(150)     NOT NULL,
    phone_number  VARCHAR(20),
    address       TEXT,
    status        user_status_enum NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  users               IS 'Platform user accounts with role-based access';
COMMENT ON COLUMN users.password_hash  IS 'BCrypt-hashed password';
COMMENT ON COLUMN users.status         IS 'ACTIVE | INACTIVE | BLOCKED';

-- ============================================================
-- SUBSYSTEM 2 -- LAND, BIOLOGY & PROCESS (MASTER DATA)
-- ============================================================

CREATE TABLE lands (
    land_id    SERIAL       PRIMARY KEY,
    land_name  VARCHAR(150) NOT NULL,
    address    TEXT         NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE lands IS 'Farm zones containing multiple rental plots';


CREATE TABLE plots (
    plot_id          SERIAL           PRIMARY KEY,
    land_id          INT              NOT NULL REFERENCES lands(land_id),
    plot_code        VARCHAR(50)      NOT NULL UNIQUE,
    area             DECIMAL(10,2)    NOT NULL,
    image_url        TEXT,
    price_per_period DECIMAL(15,2)    NOT NULL,
    status           plot_status_enum NOT NULL DEFAULT 'AVAIL',
    is_published     BOOLEAN          NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  plots              IS 'Individual rental plots -- the core land unit';
COMMENT ON COLUMN plots.status       IS 'AVAIL = available | RENT = rented | MAINT = maintenance';
COMMENT ON COLUMN plots.is_published IS 'FALSE = hidden; TRUE = publicly listed on marketplace';


CREATE TABLE site_visits (
    visit_id      SERIAL            PRIMARY KEY,
    plot_id       INT               NOT NULL REFERENCES plots(plot_id),
    visitor_name  VARCHAR(150)      NOT NULL,
    visitor_phone VARCHAR(20)       NOT NULL,
    visit_date    DATE              NOT NULL,
    visit_slot    visit_slot_enum   NOT NULL,
    status        visit_status_enum NOT NULL DEFAULT 'PENDING',
    created_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  site_visits            IS 'Pre-rental on-site visit appointments';
COMMENT ON COLUMN site_visits.visit_slot  IS 'MORNING = 08:00-11:00 | AFTERNOON = 14:00-17:00';


CREATE TABLE sensor_readings (
    reading_id    BIGSERIAL     PRIMARY KEY,
    plot_id       INT           NOT NULL REFERENCES plots(plot_id),
    temperature   DECIMAL(5,2),
    air_humidity  DECIMAL(5,2),
    soil_humidity DECIMAL(5,2),
    recorded_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE sensor_readings IS 'IoT sensor data per plot -- simulated every 3 hours';


CREATE TABLE crops (
    crop_id    SERIAL       PRIMARY KEY,
    crop_name  VARCHAR(150) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE crops IS 'Master crop species catalogue (e.g. Tomato, Lettuce, Cabbage)';


CREATE TABLE varieties (
    variety_id        SERIAL       PRIMARY KEY,
    crop_id           INT          NOT NULL REFERENCES crops(crop_id),
    variety_name      VARCHAR(150) NOT NULL,
    expected_duration INT          NOT NULL,
    buffer_time       INT          NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  varieties                   IS 'Specific cultivar with growth-cycle metadata';
COMMENT ON COLUMN varieties.expected_duration  IS 'Growing cycle in days';
COMMENT ON COLUMN varieties.buffer_time        IS 'Post-harvest buffer before plot is re-listed (days)';


CREATE TABLE plot_variety_compatibility (
    plot_id    INT NOT NULL REFERENCES plots(plot_id),
    variety_id INT NOT NULL REFERENCES varieties(variety_id),
    PRIMARY KEY (plot_id, variety_id)
);
COMMENT ON TABLE plot_variety_compatibility IS 'N:M bridge -- which varieties suit which plots';


CREATE TABLE knowledge_documents (
    document_id   SERIAL       PRIMARY KEY,
    kd_created_by INT          NOT NULL REFERENCES users(user_id),
    title         VARCHAR(255) NOT NULL,
    content       TEXT,
    file_url      TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE knowledge_documents IS 'Agricultural knowledge base authored by experts';


CREATE TABLE services (
    service_id   SERIAL             PRIMARY KEY,
    service_name VARCHAR(150)       NOT NULL,
    service_type service_type_enum  NOT NULL,
    price        DECIMAL(15,2)      NOT NULL,
    unit         VARCHAR(50),
    description  TEXT,
    status       active_status_enum NOT NULL DEFAULT 'ACTIVE'
);
COMMENT ON TABLE  services             IS 'Service catalogue: a-la-carte add-ons or full managed packages';
COMMENT ON COLUMN services.service_type IS 'A_LA_CARTE = one-off | FULL = full managed package';


CREATE TABLE process_templates (
    template_id   SERIAL       PRIMARY KEY,
    variety_id    INT          NOT NULL REFERENCES varieties(variety_id),
    pt_created_by INT          NOT NULL REFERENCES users(user_id),
    version       VARCHAR(20)  NOT NULL DEFAULT '1.0',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE process_templates IS 'Standard cultivation process template per variety, authored by experts';


CREATE TABLE template_steps (
    step_id       SERIAL        PRIMARY KEY,
    template_id   INT           NOT NULL REFERENCES process_templates(template_id) ON DELETE CASCADE,
    step_name     VARCHAR(150)  NOT NULL,
    description   TEXT,
    day_offset    INT           NOT NULL,
    duration_days INT           NOT NULL DEFAULT 1,
    task_type     VARCHAR(50),
    min_temp      DECIMAL(5,2),
    max_temp      DECIMAL(5,2),
    min_humidity  DECIMAL(5,2),
    max_humidity  DECIMAL(5,2)
);
COMMENT ON TABLE  template_steps            IS 'Ordered steps within a cultivation process template';
COMMENT ON COLUMN template_steps.day_offset  IS 'Days from rental start_date when this step begins';

-- ============================================================
-- SUBSYSTEM 3 -- RENTAL CONTRACT, SERVICES & PAYMENT
-- ============================================================

CREATE TABLE contracts (
    contract_id            SERIAL               PRIMARY KEY,
    renter_id              INT                  NOT NULL REFERENCES users(user_id),
    contract_number        VARCHAR(50)          NOT NULL UNIQUE,
    total_amount           DECIMAL(15,2)        NOT NULL,
    status                 contract_status_enum NOT NULL DEFAULT 'PENDING_PAYMENT',
    reservation_expires_at TIMESTAMPTZ,
    contract_document_url  TEXT,
    created_at             TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE contracts IS 'Master agreement grouping multiple plot rentals';

CREATE TABLE rentals (
    rental_id              SERIAL             PRIMARY KEY,
    contract_id            INT                NOT NULL REFERENCES contracts(contract_id),
    service_id             INT                REFERENCES services(service_id),
    plot_id                INT                NOT NULL REFERENCES plots(plot_id),
    variety_id             INT                NOT NULL REFERENCES varieties(variety_id),
    parent_rental_id       INT                REFERENCES rentals(rental_id),
    start_date             DATE               NOT NULL,
    end_date               DATE               NOT NULL,
    total_price            DECIMAL(15,2)      NOT NULL,
    status                 rental_status_enum NOT NULL DEFAULT 'PENDING',
    created_at             TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_rentals_dates CHECK (end_date > start_date)
);
COMMENT ON TABLE  rentals                        IS 'Individual plot rental details within a contract';
COMMENT ON COLUMN rentals.service_id              IS 'NULL = Self-growing mode; set = Full managed service';
COMMENT ON COLUMN rentals.parent_rental_id        IS 'Self-referencing FK for contract renewals';

CREATE TABLE contract_cancellations (
    cancellation_id SERIAL             PRIMARY KEY,
    contract_id     INT                NOT NULL REFERENCES contracts(contract_id),
    cancelled_by    INT                NOT NULL REFERENCES users(user_id),
    reason          TEXT,
    status          cancel_status_enum NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    processed_at    TIMESTAMPTZ
);
COMMENT ON TABLE contract_cancellations IS 'Cancellation requests with refund-policy lifecycle for the entire contract';

CREATE TABLE service_requests (
    request_id     SERIAL              PRIMARY KEY,
    rental_id      INT                 NOT NULL REFERENCES rentals(rental_id),
    service_id     INT                 NOT NULL REFERENCES services(service_id),
    scheduled_date DATE,
    status         request_status_enum NOT NULL DEFAULT 'PENDING',
    created_at     TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE service_requests IS 'Ad-hoc service requests raised during an active rental';

CREATE TABLE payment_transactions (
    transaction_id          SERIAL                PRIMARY KEY,
    contract_id             INT                   REFERENCES contracts(contract_id),
    service_request_id      INT                   REFERENCES service_requests(request_id),
    cancellation_request_id INT                   REFERENCES contract_cancellations(cancellation_id),
    type                    transaction_type_enum NOT NULL,
    amount                  DECIMAL(15,2)         NOT NULL,
    payment_method          VARCHAR(50),
    gateway_ref             VARCHAR(100),
    status                  payment_status_enum   NOT NULL DEFAULT 'PENDING',
    created_at              TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  payment_transactions                     IS 'Financial ledger: all money-in and money-out events';
COMMENT ON COLUMN payment_transactions.type                IS 'PAYMENT = incoming | REFUND = outgoing refund';
COMMENT ON COLUMN payment_transactions.cancellation_request_id IS 'Populated only for REFUND transactions';

-- ============================================================
-- SUBSYSTEM 4 -- CULTIVATION PLAN & FIELD OPERATIONS
-- ============================================================

CREATE TABLE care_tasks (
    task_id            SERIAL           PRIMARY KEY,
    rental_id          INT              NOT NULL REFERENCES rentals(rental_id),
    step_id            INT              REFERENCES template_steps(step_id),
    service_request_id INT              REFERENCES service_requests(request_id),
    task_assigned_to   INT              REFERENCES users(user_id),
    due_date           DATE,
    status             task_status_enum NOT NULL DEFAULT 'PENDING',
    evidence_image_url TEXT,
    notes              TEXT,
    created_at         TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  care_tasks                    IS 'Ground-level field tasks assigned to workers';
COMMENT ON COLUMN care_tasks.step_id             IS 'Set when auto-generated from a process template step';
COMMENT ON COLUMN care_tasks.service_request_id  IS 'Set when triggered by a customer service request';
COMMENT ON COLUMN care_tasks.evidence_image_url  IS 'Photo proof of completion uploaded by worker';


CREATE TABLE farm_diaries (
    diary_id   SERIAL      PRIMARY KEY,
    rental_id  INT         NOT NULL REFERENCES rentals(rental_id),
    task_id    INT         REFERENCES care_tasks(task_id),
    content    TEXT,
    image_url  TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  farm_diaries        IS 'Chronological cultivation journal visible to customers';
COMMENT ON COLUMN farm_diaries.task_id IS 'Auto-populated when synced from a completed care task';

-- ============================================================
-- SUBSYSTEM 5 -- HARVEST, REPORTS & SYSTEM INTERACTION
-- ============================================================

CREATE TABLE harvest_results (
    harvest_id         SERIAL             PRIMARY KEY,
    rental_id          INT                NOT NULL REFERENCES rentals(rental_id),
    entered_by         INT                NOT NULL REFERENCES users(user_id),
    harvest_date       DATE               NOT NULL,
    yield_amount       DECIMAL(10,2),
    evidence_image_url TEXT,
    delivery_type      delivery_type_enum NOT NULL,
    customer_confirmed BOOLEAN            NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  harvest_results              IS 'End-of-season harvest record and handover confirmation';
COMMENT ON COLUMN harvest_results.delivery_type IS 'PICKUP = customer collects | DELIVERY = farm delivers';


CREATE TABLE issue_reports (
    issue_id         SERIAL            PRIMARY KEY,
    rental_id        INT               NOT NULL REFERENCES rentals(rental_id),
    reported_by      INT               NOT NULL REFERENCES users(user_id),
    handled_by       INT               REFERENCES users(user_id),
    issue_type       VARCHAR(100),
    description      TEXT,
    image_url        TEXT,
    status           issue_status_enum NOT NULL DEFAULT 'OPEN',
    resolution_notes TEXT,
    resolved_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE issue_reports IS 'Field incident and pest/disease reports for expert review';


CREATE TABLE conversations (
    conversation_id SERIAL                   PRIMARY KEY,
    participant_one INT                      NOT NULL REFERENCES users(user_id),
    participant_two INT                      REFERENCES users(user_id),
    rental_id       INT                      REFERENCES rentals(rental_id),
    plot_id         INT                      REFERENCES plots(plot_id),
    type            conversation_type_enum   NOT NULL,
    status          conversation_status_enum NOT NULL DEFAULT 'OPEN',
    created_at      TIMESTAMPTZ              NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  conversations      IS '1-to-1 or AI-assisted chat sessions';
COMMENT ON COLUMN conversations.type  IS 'AI = AI chatbot | CUST_EXP = Customer-Expert | STAFF_EXP = Worker-Expert';


CREATE TABLE messages (
    message_id      BIGSERIAL   PRIMARY KEY,
    conversation_id INT         NOT NULL REFERENCES conversations(conversation_id),
    sender_id       INT         REFERENCES users(user_id),
    content         TEXT        NOT NULL,
    attachment_url  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  messages           IS 'Individual messages within a conversation thread';
COMMENT ON COLUMN messages.sender_id  IS 'NULL = message generated by AI assistant';


CREATE TABLE notifications (
    notification_id BIGSERIAL    PRIMARY KEY,
    user_id         INT          NOT NULL REFERENCES users(user_id),
    title           VARCHAR(255) NOT NULL,
    content         TEXT,
    is_read         BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE notifications IS 'In-app push notifications for all system events';


CREATE TABLE audit_logs (
    log_id      BIGSERIAL    PRIMARY KEY,
    user_id     INT          REFERENCES users(user_id),
    action      VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100),
    entity_id   VARCHAR(100),
    details     JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  audit_logs         IS 'Security audit trail for all sensitive operations';
COMMENT ON COLUMN audit_logs.details  IS 'JSONB payload: before/after diff or extra context';

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_users_role_id       ON users(role_id);
CREATE INDEX idx_users_status        ON users(status);

CREATE INDEX idx_plots_land_id       ON plots(land_id);
CREATE INDEX idx_plots_status        ON plots(status);
CREATE INDEX idx_plots_is_published  ON plots(is_published);

CREATE INDEX idx_site_visits_plot_id ON site_visits(plot_id);
CREATE INDEX idx_site_visits_status  ON site_visits(status);
CREATE INDEX idx_site_visits_date    ON site_visits(visit_date);

CREATE INDEX idx_sensor_plot_id      ON sensor_readings(plot_id);
CREATE INDEX idx_sensor_recorded_at  ON sensor_readings(recorded_at DESC);

CREATE INDEX idx_varieties_crop_id   ON varieties(crop_id);

CREATE INDEX idx_kd_created_by       ON knowledge_documents(kd_created_by);

CREATE INDEX idx_pt_variety_id       ON process_templates(variety_id);
CREATE INDEX idx_ts_template_id      ON template_steps(template_id);

CREATE INDEX idx_contracts_renter_id ON contracts(renter_id);
CREATE INDEX idx_contracts_status    ON contracts(status);

CREATE INDEX idx_rentals_contract_id ON rentals(contract_id);
CREATE INDEX idx_rentals_plot_id     ON rentals(plot_id);
CREATE INDEX idx_rentals_variety_id  ON rentals(variety_id);
CREATE INDEX idx_rentals_service_id  ON rentals(service_id);
CREATE INDEX idx_rentals_status      ON rentals(status);
CREATE INDEX idx_rentals_dates       ON rentals(start_date, end_date);
CREATE INDEX idx_rentals_parent_id   ON rentals(parent_rental_id) WHERE parent_rental_id IS NOT NULL;

CREATE INDEX idx_cancel_contract_id  ON contract_cancellations(contract_id);
CREATE INDEX idx_cancel_status       ON contract_cancellations(status);

CREATE INDEX idx_sreq_rental_id      ON service_requests(rental_id);
CREATE INDEX idx_sreq_service_id     ON service_requests(service_id);
CREATE INDEX idx_sreq_status         ON service_requests(status);

CREATE INDEX idx_ptx_contract_id     ON payment_transactions(contract_id);
CREATE INDEX idx_ptx_status          ON payment_transactions(status);
CREATE INDEX idx_ptx_type            ON payment_transactions(type);

CREATE INDEX idx_ct_rental_id        ON care_tasks(rental_id);
CREATE INDEX idx_ct_assigned_to      ON care_tasks(task_assigned_to);
CREATE INDEX idx_ct_status           ON care_tasks(status);
CREATE INDEX idx_ct_due_date         ON care_tasks(due_date);

CREATE INDEX idx_fd_rental_id        ON farm_diaries(rental_id);
CREATE INDEX idx_fd_task_id          ON farm_diaries(task_id) WHERE task_id IS NOT NULL;

CREATE INDEX idx_hr_rental_id        ON harvest_results(rental_id);

CREATE INDEX idx_ir_rental_id        ON issue_reports(rental_id);
CREATE INDEX idx_ir_status           ON issue_reports(status);
CREATE INDEX idx_ir_reported_by      ON issue_reports(reported_by);

CREATE INDEX idx_conv_p1             ON conversations(participant_one);
CREATE INDEX idx_conv_p2             ON conversations(participant_two) WHERE participant_two IS NOT NULL;
CREATE INDEX idx_conv_rental_id      ON conversations(rental_id) WHERE rental_id IS NOT NULL;

CREATE INDEX idx_msg_conversation_id ON messages(conversation_id);
CREATE INDEX idx_msg_sender_id       ON messages(sender_id) WHERE sender_id IS NOT NULL;
CREATE INDEX idx_msg_created_at      ON messages(created_at DESC);

CREATE INDEX idx_notif_user_id       ON notifications(user_id);
CREATE INDEX idx_notif_unread        ON notifications(is_read) WHERE is_read = FALSE;

CREATE INDEX idx_al_user_id          ON audit_logs(user_id);
CREATE INDEX idx_al_entity           ON audit_logs(entity_name, entity_id);
CREATE INDEX idx_al_created_at       ON audit_logs(created_at DESC);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO roles (role_name) VALUES
    ('CUSTOMER'),
    ('EXPERT'),
    ('FIELD_WORKER'),
    ('ADMIN');

INSERT INTO services (service_name, service_type, price, unit, description, status) VALUES
    ('Full Managed Package', 'FULL',       3000000, 'per period', 'Full cultivation management by our experts',             'ACTIVE'),
    ('Irrigation Support',   'A_LA_CARTE', 150000,  'per visit',  'On-demand watering and irrigation check by field staff', 'ACTIVE'),
    ('Pest Control',         'A_LA_CARTE', 200000,  'per visit',  'Inspection and treatment for pests and diseases',        'ACTIVE'),
    ('Soil Testing',         'A_LA_CARTE', 250000,  'per test',   'Laboratory soil nutrient and pH analysis',               'ACTIVE'),
    ('Fertilization',        'A_LA_CARTE', 180000,  'per visit',  'Fertilizer application by trained field worker',         'ACTIVE');

-- ============================================================
-- TRIGGERS -- auto-maintain updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE TRIGGER trg_lands_updated_at
    BEFORE UPDATE ON lands
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE TRIGGER trg_plots_updated_at
    BEFORE UPDATE ON plots
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE TRIGGER trg_contracts_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE TRIGGER trg_rentals_updated_at
    BEFORE UPDATE ON rentals
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE TRIGGER trg_care_tasks_updated_at
    BEFORE UPDATE ON care_tasks
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- ============================================================
-- END OF SCRIPT
-- ============================================================
