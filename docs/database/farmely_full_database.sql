-- ==============================================================================
-- FARMELY PLATFORM -- TOÀN BỘ CƠ SỞ DỮ LIỆU POSTGRESQL CHUẨN (DDL + SEED DATA)
-- Hệ thống: Nền tảng Nông nghiệp Công nghệ cao & Thuê Đất Canh Tác Farmely
-- Phiên bản: 2.0 (PostgreSQL 14+)
-- Bao gồm: 28 Bảng dữ liệu, 17 Enums, Trigger tự động, Index tối ưu, Ràng buộc khóa ngoại
-- Dữ liệu mẫu: 10 Quy trình VietGAP (88 bước), 15 Dịch vụ, 5 Tài liệu PDF Pháp lý, 
--             4 Khách hàng thực tế, Cảm biến IoT, Hợp đồng, Lịch trình chăm sóc.
-- ==============================================================================

SET client_encoding = 'UTF8';

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
    description TEXT,
    boundary_geojson TEXT,
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
    description      TEXT,
    boundary_geojson TEXT,
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
    service_code VARCHAR(20)        UNIQUE,
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
    step_order    INT           NOT NULL DEFAULT 1,
    step_name     VARCHAR(150)  NOT NULL,
    description   TEXT,
    materials_needed TEXT,
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

INSERT INTO services (service_code, service_name, service_type, price, unit, description, status) VALUES
    ('S01', 'Tưới nước bổ sung',             'A_LA_CARTE', 25000,   'lần/luống',  'Tưới nước theo thông số kỹ thuật được giao hoặc đặt lẻ. Minh chứng: Độ ẩm trước/sau, ảnh tưới', 'ACTIVE'),
    ('S02', 'Làm cỏ luống & rãnh',           'A_LA_CARTE', 50000,   'luống/10m2', 'Làm sạch cỏ dại trong phạm vi được giao theo yêu cầu hoặc định kỳ. Minh chứng: Ảnh trước-sau', 'ACTIVE'),
    ('S03', 'Xới đất, làm tơi bề mặt',        'A_LA_CARTE', 40000,   'luống',      'Xới và làm tơi lớp đất mặt khi hiện trường phù hợp. Minh chứng: Ảnh đất tơi xốp', 'ACTIVE'),
    ('S04', 'Bón phân theo giai đoạn',       'A_LA_CARTE', 60000,   'lần/luống',  'Bón loại phân hữu cơ và liều lượng đã được duyệt. Minh chứng: Ảnh bao bì phân & mặt luống', 'ACTIVE'),
    ('S05', 'Phủ gốc / phủ luống',           'A_LA_CARTE', 70000,   'luống',      'Phủ vật liệu (rơm rạ, màng phủ) giữ ẩm hạn chế cỏ. Minh chứng: Ảnh phủ luống', 'ACTIVE'),
    ('S06', 'Gieo hạt / trồng cây giống',    'A_LA_CARTE', 80000,   'luống',      'Gieo hạt hoặc cấy cây giống theo mật độ quy định đầu vụ. Minh chứng: Ảnh mật độ cấy', 'ACTIVE'),
    ('S07', 'Trồng dặm bổ sung',             'A_LA_CARTE', 20000,   'lần/10 cây', 'Thay thế cây chết hoặc không đạt chuẩn sau kiểm tra tỷ lệ sống. Minh chứng: Ảnh cây bén rễ', 'ACTIVE'),
    ('S08', 'Tỉa cây / tỉa lá / định chồi',  'A_LA_CARTE', 45000,   'lần/luống',  'Tỉa nhánh gốc, chồi nách hoặc lá già sát gốc. Minh chứng: Ảnh luống sau khi tỉa', 'ACTIVE'),
    ('S09', 'Làm giàn / buộc đỡ cây',        'A_LA_CARTE', 120000,  'giàn/luống', 'Lắp cọc giàn chữ A hoặc buộc đỡ thân chống gãy đổ. Minh chứng: Ảnh giàn hoàn thiện', 'ACTIVE'),
    ('S10', 'Xử lý sâu bệnh đã duyệt',       'A_LA_CARTE', 90000,   'lần phun',   'Phun chế phẩm sinh học (BT, Neem, nấm xanh) sau phê duyệt. Minh chứng: Ảnh phun & cách ly', 'ACTIVE'),
    ('S11', 'Vệ sinh khu canh tác',          'A_LA_CARTE', 50000,   'lần/plot',   'Thu gom rác, tàn dư lá cành sau tỉa trong phạm vi plot. Minh chứng: Ảnh sạch sẽ', 'ACTIVE'),
    ('S12', 'Thu hoạch và cân sản lượng',    'A_LA_CARTE', 80000,   'lần/vụ',     'Thu hái đúng độ tuổi và cân đo sản lượng thực tế. Minh chứng: Ảnh cân sản phẩm', 'ACTIVE'),
    ('S13', 'Phân loại / đóng gói',          'A_LA_CARTE', 35000,   'kg',         'Sơ chế, phân loại rau an toàn và đóng túi bảo quản. Minh chứng: Ảnh sản phẩm đóng gói', 'ACTIVE'),
    ('S14', 'Gói ủy thác chăm sóc tạm thời', 'FULL',       350000,  'gói/tuần',   'Chăm sóc ngắn hạn trong thời hạn gói (7 ngày). Minh chứng: Ảnh bằng chứng từng task', 'ACTIVE'),
    ('S15', 'Gói chăm sóc toàn vụ',          'FULL',       1800000, 'vụ/luống',   'Trọn gói Assisted-growing theo Process Template từ làm đất đến thu hoạch', 'ACTIVE');

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

-- ==============================================================================
-- PHẦN DỮ LIỆU MẪU TOÀN DIỆN (FULL SEED DATA)
-- ==============================================================================

-- ==============================================================================
-- FARMELY PLATFORM - FULL SAMPLE DATA INSERTION SCRIPT
-- Tương thích: PostgreSQL 14+ / smart_agrirent_postgresql_v2.sql
-- Nguồn dữ liệu: Quy_Trinh_Canh_Tac_10_Loai_Rau_An_Toan.docx, QUY TRÌNH SERVICES.md, RP392 (NEW).md
-- ==============================================================================

SET client_encoding = 'UTF8';

-- 1. BẢNG ROLES
INSERT INTO roles (role_id, role_name) VALUES
(1, 'CUSTOMER'),
(2, 'EXPERT'),
(3, 'FIELD_WORKER'),
(4, 'ADMIN')
ON CONFLICT (role_id) DO NOTHING;

-- 2. BẢNG USERS (Chuẩn hóa tài khoản hệ thống)
INSERT INTO users (user_id, role_id, email, password_hash, full_name, phone_number, address, status) VALUES
-- Khách hàng (Customers)
(1, 1, 'customer@farmely.vn', '$2a$10$wT4L8sC4eH0HlMfZ1Wd1eOpNfJ7L7Vd6kXFm5M5G2pE2qR1tV2sXu', 'Lô Thái Quyền', '0901234567', 'Tòa nhà Landmark 81, P.22, Q.Bình Thạnh, TP.HCM', 'ACTIVE'),
(2, 1, 'duyanh@farmely.vn', '$2a$10$wT4L8sC4eH0HlMfZ1Wd1eOpNfJ7L7Vd6kXFm5M5G2pE2qR1tV2sXu', 'Đào Duy Anh', '0912345678', 'Số 45 Lê Duẩn, P.Bến Nghé, Quận 1, TP.HCM', 'ACTIVE'),
(3, 1, 'tanguyen@farmely.vn', '$2a$10$wT4L8sC4eH0HlMfZ1Wd1eOpNfJ7L7Vd6kXFm5M5G2pE2qR1tV2sXu', 'Tạ Nguyễn Khôi Nguyên', '0988776655', 'Biệt thự Thảo Điền, TP.Thủ Đức, TP.HCM', 'ACTIVE'),
(4, 1, 'vhoang@farmely.vn', '$2a$10$wT4L8sC4eH0HlMfZ1Wd1eOpNfJ7L7Vd6kXFm5M5G2pE2qR1tV2sXu', 'Nguyễn Văn Hoàng', '0977123456', 'Khu Đô thị Phú Mỹ Hưng, Quận 7, TP.HCM', 'ACTIVE'),

-- Chuyên gia Nông nghiệp (Experts)
(5, 2, 'expert@farmely.vn', '$2a$10$wT4L8sC4eH0HlMfZ1Wd1eOpNfJ7L7Vd6kXFm5M5G2pE2qR1tV2sXu', 'ThS. Nguyễn Hoàng Nam', '0903888999', 'Viện Khoa học Nông nghiệp Miền Nam, TP.HCM', 'ACTIVE'),
(6, 2, 'thao.tran@farmely.vn', '$2a$10$wT4L8sC4eH0HlMfZ1Wd1eOpNfJ7L7Vd6kXFm5M5G2pE2qR1tV2sXu', 'ThS. Trần Phương Thảo', '0903777888', 'Trung tâm Công nghệ Sinh học Nông nghiệp Đà Lạt', 'ACTIVE'),
(7, 2, 'duc.le@farmely.vn', '$2a$10$wT4L8sC4eH0HlMfZ1Wd1eOpNfJ7L7Vd6kXFm5M5G2pE2qR1tV2sXu', 'TS. Lê Hoàng Đức', '0903666555', 'Đại học Nông Lâm TP.HCM', 'ACTIVE'),

-- Chuyên viên Lao động (Field Workers)
(8, 3, 'worker@farmely.vn', '$2a$10$wT4L8sC4eH0HlMfZ1Wd1eOpNfJ7L7Vd6kXFm5M5G2pE2qR1tV2sXu', 'Trần Văn Lực', '0933111222', 'Ấp 3, Xã Nhuận Đức, Huyện Củ Chi, TP.HCM', 'ACTIVE'),
(9, 3, 'dat.nguyen@farmely.vn', '$2a$10$wT4L8sC4eH0HlMfZ1Wd1eOpNfJ7L7Vd6kXFm5M5G2pE2qR1tV2sXu', 'Nguyễn Văn Đạt', '0933222333', 'Xã Thái Mỹ, Huyện Củ Chi, TP.HCM', 'ACTIVE'),
(10, 3, 'hai.hoang@farmely.vn', '$2a$10$wT4L8sC4eH0HlMfZ1Wd1eOpNfJ7L7Vd6kXFm5M5G2pE2qR1tV2sXu', 'Hoàng Thanh Hải', '0933444555', 'Thôn 4, Xã Tà Nung, TP.Đà Lạt, Lâm Đồng', 'ACTIVE'),

-- Quản trị viên (Admin)
(11, 4, 'admin@farmely.vn', '$2a$10$wT4L8sC4eH0HlMfZ1Wd1eOpNfJ7L7Vd6kXFm5M5G2pE2qR1tV2sXu', 'Ban Quản Trị Farmely', '0909000111', 'Trụ sở Farmely Tech Hub, Quận 1, TP.HCM', 'ACTIVE')
ON CONFLICT (user_id) DO NOTHING;

-- 3. BẢNG LANDS (Trang trại Farmely)
INSERT INTO lands (land_id, land_name, address, description, boundary_geojson) VALUES
(1, 'Trang trại Happy Valley Củ Chi', 'Đường Nhuận Đức, Xã Nhuận Đức, Huyện Củ Chi, TP. Hồ Chí Minh', 'Khu nông nghiệp công nghệ cao kiểu mẫu tại Củ Chi, đất phù sa bồi lắng.', '{"type":"Polygon","coordinates":[[[106.342,10.686],[106.352,10.686],[106.352,10.696],[106.342,10.696],[106.342,10.686]]]}'),
(2, 'Trang trại Cao nguyên Mộc Châu', 'Tiểu khu Mía Đường, Thị trấn Nông trường Mộc Châu, Sơn La', 'Khu vực khí hậu ôn đới cao nguyên, thích hợp rau xứ lạnh và dâu tây.', NULL),
(3, 'Trang trại Thung lũng Sinh thái Đà Lạt', 'Xã Tà Nung, TP. Đà Lạt, Tỉnh Lâm Đồng', 'Nông trại sinh thái thung lũng sương mù, canh tác hữu cơ VietGAP.', NULL)
ON CONFLICT (land_id) DO NOTHING;

-- 4. BẢNG PLOTS (Thửa đất cho thuê - 16 Thửa phân lô thực tế với ranh giới GPS GeoJSON)
INSERT INTO plots (plot_id, land_id, plot_code, area, image_url, price_per_period, status, is_published, boundary_geojson) VALUES
(1, 1, 'P-01', 150.00, 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80', 1200000.00, 'RENT', TRUE, '{"type":"Polygon","coordinates":[[[106.34757,10.68962],[106.34889,10.69072],[106.350585,10.688805],[106.34925,10.687699],[106.34757,10.68962]]]}'),
(2, 1, 'P-02', 180.00, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', 1450000.00, 'RENT', TRUE, '{"type":"Polygon","coordinates":[[[106.34898,10.69078],[106.3503,10.69188],[106.35201,10.689972],[106.350675,10.688865],[106.34898,10.69078]]]}'),
(3, 1, 'P-03', 200.00, 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=800&q=80', 1700000.00, 'RENT', TRUE, '{"type":"Polygon","coordinates":[[[106.35039,10.69194],[106.35171,10.69304],[106.353435,10.691138],[106.3521,10.690032],[106.35039,10.69194]]]}'),
(4, 1, 'P-04', 160.00, 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80', 1300000.00, 'AVAIL', TRUE, '{"type":"Polygon","coordinates":[[[106.34616,10.68846],[106.34748,10.68956],[106.349175,10.687645],[106.34784,10.686539],[106.34616,10.68846]]]}'),
(5, 1, 'P-05', 175.00, 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80', 1350000.00, 'AVAIL', TRUE, '{"type":"Polygon","coordinates":[[[106.34757,10.68962],[106.34889,10.69072],[106.350585,10.688805],[106.34925,10.687699],[106.34757,10.68962]]]}'),
(6, 1, 'P-06', 190.00, 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=800&q=80', 1500000.00, 'MAINT', TRUE, '{"type":"Polygon","coordinates":[[[106.34898,10.69078],[106.3503,10.69188],[106.35201,10.689972],[106.350675,10.688865],[106.34898,10.69078]]]}'),
(13, 1, 'P-07', 155.00, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', 1250000.00, 'RENT', TRUE, '{"type":"Polygon","coordinates":[[[106.34856,10.689744],[106.34988,10.690844],[106.351575,10.688929],[106.35024,10.687823],[106.34856,10.689744]]]}'),
(14, 1, 'P-08', 165.00, 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=800&q=80', 1300000.00, 'AVAIL', TRUE, '{"type":"Polygon","coordinates":[[[106.35002,10.690961],[106.351341,10.692061],[106.353051,10.690153],[106.351716,10.689046],[106.35002,10.690961]]]}'),
(15, 1, 'P-09', 170.00, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80', 1400000.00, 'AVAIL', TRUE, '{"type":"Polygon","coordinates":[[[106.347463,10.68517],[106.348799,10.686277],[106.350463,10.684348],[106.349113,10.683234],[106.347463,10.68517]]]}'),
(16, 1, 'P-10', 175.00, 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80', 1450000.00, 'AVAIL', TRUE, '{"type":"Polygon","coordinates":[[[106.348963,10.68627],[106.350299,10.687377],[106.351963,10.685448],[106.350613,10.684334],[106.348963,10.68627]]]}'),
(17, 1, 'P-11', 180.00, 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80', 1500000.00, 'AVAIL', TRUE, '{"type":"Polygon","coordinates":[[[106.350463,10.68737],[106.351799,10.688477],[106.353463,10.686548],[106.352113,10.685434],[106.350463,10.68737]]]}'),
(18, 1, 'P-12', 160.00, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', 1350000.00, 'AVAIL', TRUE, '{"type":"Polygon","coordinates":[[[106.351963,10.68847],[106.353299,10.689577],[106.354963,10.687648],[106.353613,10.686534],[106.351963,10.68847]]]}'),
(19, 1, 'P-13', 165.00, 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80', 1350000.00, 'RENT', TRUE, '{"type":"Polygon","coordinates":[[[106.349288,10.683029],[106.350639,10.684143],[106.352303,10.682213],[106.350938,10.681093],[106.349288,10.683029]]]}'),
(20, 1, 'P-14', 175.00, 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=800&q=80', 1550000.00, 'AVAIL', TRUE, '{"type":"Polygon","coordinates":[[[106.350783,10.684261],[106.352134,10.685375],[106.353813,10.683453],[106.352448,10.682332],[106.350783,10.684261]]]}'),
(21, 1, 'P-15', 180.00, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', 1650000.00, 'AVAIL', TRUE, '{"type":"Polygon","coordinates":[[[106.352278,10.685493],[106.353629,10.686607],[106.355323,10.684692],[106.353958,10.683572],[106.352278,10.685493]]]}'),
(22, 1, 'P-16', 150.00, 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=800&q=80', 1200000.00, 'RENT', TRUE, '{"type":"Polygon","coordinates":[[[106.353773,10.686725],[106.355124,10.687839],[106.356834,10.685931],[106.355468,10.684811],[106.353773,10.686725]]]}')
ON CONFLICT (plot_id) DO NOTHING;

-- 5. BẢNG CROPS & VARIETIES (10 LOẠI RAU AN TOÀN VIETGAP CHUẨN)
-- Nguồn: Quy_Trinh_Canh_Tac_10_Loai_Rau_An_Toan.docx
INSERT INTO crops (crop_id, crop_name) VALUES
(1, 'Rau muống cạn'),
(2, 'Cải ngọt / Cải bẹ'),
(3, 'Xà lách xoăn'),
(4, 'Cà chua bi (Cherry)'),
(5, 'Dưa leo baby'),
(6, 'Đậu cô ve'),
(7, 'Mướp hương'),
(8, 'Rau mồng tơi'),
(9, 'Ớt cay / Ớt chỉ thiên'),
(10, 'Rau dền (đỏ/cơm)')
ON CONFLICT (crop_id) DO NOTHING;

INSERT INTO varieties (variety_id, crop_id, variety_name, expected_duration, buffer_time) VALUES
(1, 1, 'Rau muống lá tre F1', 30, 4),      -- 25-30 ngày, nghỉ đất 4 ngày
(2, 2, 'Cải ngọt bông F1', 35, 4),        -- 30-35 ngày, nghỉ đất 4 ngày
(3, 3, 'Xà lách Romaine VietGAP', 45, 4), -- 40-45 ngày, nghỉ đất 4 ngày
(4, 4, 'Cà chua bi đỏ F1', 80, 7),        -- 75-85 ngày, nghỉ đất 7 ngày
(5, 5, 'Dưa leo baby F1', 55, 5),         -- 50-60 ngày, nghỉ đất 5 ngày
(6, 6, 'Đậu cô ve lùn / leo F1', 55, 5),  -- 50-55 ngày, nghỉ đất 5 ngày
(7, 7, 'Mướp hương cao sản F1', 65, 7),   -- 60-70 ngày, nghỉ đất 7 ngày
(8, 8, 'Mồng tơi lá to F1', 35, 4),       -- 30-35 ngày, nghỉ đất 4 ngày
(9, 9, 'Ớt chỉ thiên F1', 85, 7),         -- 75-90 ngày, nghỉ đất 7 ngày
(10, 10, 'Rau dền đỏ F1', 30, 4)          -- 25-30 ngày, nghỉ đất 4 ngày
ON CONFLICT (variety_id) DO NOTHING;

-- 6. BẢNG PLOT_VARIETY_COMPATIBILITY (MA TRẬN TƯƠNG THÍCH ĐẤT & CÂY)
INSERT INTO plot_variety_compatibility (plot_id, variety_id) VALUES
-- Thửa P-01 (Đất phù sa bồi lắng)
(1, 1), (1, 2), (1, 3), (1, 4), (1, 8), (1, 10),
-- Thửa P-02 (Luống đất tơi xốp, che lưới lan)
(2, 1), (2, 2), (2, 3), (2, 6), (2, 8), (2, 10),
-- Thửa P-03 (Nhà màng có giàn leo chuyên dụng)
(3, 4), (3, 5), (3, 6), (3, 7),
-- Thửa P-04 (Đất thịt pha, thoát nước nhanh, nhiều nắng)
(4, 3), (4, 4), (4, 6), (4, 9),
-- Thửa P-05 (Thửa lớn 70m2, đa tầng sinh thái)
(5, 1), (5, 5), (5, 7), (5, 8), (5, 9),
-- Thửa P-06 (Luân canh, cải tạo đất bằng rau ngắn ngày)
(6, 1), (6, 2), (6, 8), (6, 10),
-- Thửa P-07 (Đất phù sa tơi xốp)
(13, 1), (13, 2), (13, 3), (13, 10),
-- Thửa P-08 (Thổ nhưỡng chuẩn rau ăn lá)
(14, 2), (14, 3), (14, 8), (14, 10),
-- Thửa P-09 (Khu giàn leo công nghệ cao)
(15, 4), (15, 5), (15, 6), (15, 7),
-- Thửa P-10 (Rau gia vị và ớt chỉ thiên)
(16, 3), (16, 4), (16, 9),
-- Thửa P-11 (Đất màu mỡ, nhiều nắng)
(17, 1), (17, 3), (17, 5), (17, 8),
-- Thửa P-12 (Nhà lưới thông minh)
(18, 2), (18, 3), (18, 6), (18, 10),
-- Thửa P-13 (Đất giàu mùn vi sinh)
(19, 1), (19, 4), (19, 7), (19, 9),
-- Thửa P-14 (Rau ăn quả và dưa leo)
(20, 4), (20, 5), (20, 6), (20, 7),
-- Thửa P-15 (Đa tầng VietGAP)
(21, 1), (21, 2), (21, 3), (21, 5), (21, 8),
-- Thửa P-16 (Khu ươm và luân canh)
(22, 2), (22, 3), (22, 8), (22, 10)
ON CONFLICT (plot_id, variety_id) DO NOTHING;

-- 7. BẢNG SERVICES (S01 ĐẾN S15)
INSERT INTO services (service_id, service_code, service_name, service_type, price, unit, description, status) VALUES
(1, 'S01', 'Tưới nước bổ sung', 'A_LA_CARTE', 25000.00, 'lần/luống', 'Tưới nước theo thông số kỹ thuật được giao hoặc đặt lẻ.', 'ACTIVE'),
(2, 'S02', 'Làm cỏ luống & rãnh', 'A_LA_CARTE', 50000.00, 'luống/10m2', 'Làm sạch cỏ dại trong phạm vi được giao theo yêu cầu hoặc định kỳ.', 'ACTIVE'),
(3, 'S03', 'Xới đất, làm tơi bề mặt', 'A_LA_CARTE', 40000.00, 'luống', 'Xới và làm tơi lớp đất mặt giúp rễ hô hấp.', 'ACTIVE'),
(4, 'S04', 'Bón phân theo giai đoạn', 'A_LA_CARTE', 60000.00, 'lần/luống', 'Bón loại phân hữu cơ và liều lượng đã được duyệt.', 'ACTIVE'),
(5, 'S05', 'Phủ gốc / phủ luống', 'A_LA_CARTE', 70000.00, 'luống', 'Phủ rơm rạ, màng phủ giữ ẩm hạn chế cỏ.', 'ACTIVE'),
(6, 'S06', 'Gieo hạt / trồng cây giống', 'A_LA_CARTE', 80000.00, 'luống', 'Gieo hạt hoặc trồng cây giống theo mật độ quy định đầu vụ.', 'ACTIVE'),
(7, 'S07', 'Trồng dặm bổ sung', 'A_LA_CARTE', 20000.00, 'lần/10 cây', 'Thay thế cây chết sau kiểm tra tỷ lệ sống.', 'ACTIVE'),
(8, 'S08', 'Tỉa cây / tỉa lá / định chồi', 'A_LA_CARTE', 45000.00, 'lần/luống', 'Tỉa chồi nách dưa leo, cành sát gốc cà chua.', 'ACTIVE'),
(9, 'S09', 'Làm giàn / buộc đỡ cây', 'A_LA_CARTE', 120000.00, 'giàn/luống', 'Lắp cọc giàn chữ A hoặc giăng lưới chống gãy đổ.', 'ACTIVE'),
(10, 'S10', 'Xử lý sâu bệnh đã duyệt', 'A_LA_CARTE', 90000.00, 'lần phun', 'Phun chế phẩm sinh học sau chẩn đoán/phê duyệt.', 'ACTIVE'),
(11, 'S11', 'Vệ sinh khu canh tác', 'A_LA_CARTE', 50000.00, 'lần/plot', 'Thu gom rác, tàn dư lá sau tỉa.', 'ACTIVE'),
(12, 'S12', 'Thu hoạch và cân sản lượng', 'A_LA_CARTE', 80000.00, 'lần/vụ', 'Thu hái đúng độ tuổi và cân đo sản lượng thực tế.', 'ACTIVE'),
(13, 'S13', 'Phân loại / đóng gói', 'A_LA_CARTE', 35000.00, 'kg', 'Sơ chế, phân loại an toàn và đóng túi bảo quản.', 'ACTIVE'),
(14, 'S14', 'Gói ủy thác chăm sóc tạm thời (7 ngày)', 'FULL', 350000.00, 'gói/tuần', 'Chăm sóc ngắn hạn khi khách vắng nhà (tưới, tỉa, bắt sâu).', 'ACTIVE'),
(15, 'S15', 'Gói chăm sóc toàn vụ (Assisted-Growing)', 'FULL', 1800000.00, 'vụ/luống', 'Trọn gói đi kèm hợp đồng Assisted-growing theo Process Template.', 'ACTIVE')
ON CONFLICT (service_id) DO NOTHING;

-- 8. PROCESS TEMPLATES & STEPS (10 LOẠI RAU VIETGAP)
-- ==============================================================================
-- 10 PROCESS TEMPLATES (CHUẨN HÓA THEO QUY TRÌNH 10 LOẠI RAU AN TOÀN VIETGAP)
-- ==============================================================================
INSERT INTO process_templates (template_id, variety_id, pt_created_by, version) VALUES
(1, 1, 5, 'v1.5 (Chuẩn VietGAP)'),
(2, 2, 5, 'v1.6 (Chuẩn VietGAP)'),
(3, 3, 5, 'v1.8 (Chuẩn VietGAP)'),
(4, 4, 5, 'v2.3 (Chuẩn VietGAP)'),
(5, 5, 5, 'v2.0 (Chuẩn VietGAP)'),
(6, 6, 5, 'v1.5 (Chuẩn VietGAP)'),
(7, 7, 5, 'v1.7 (Chuẩn VietGAP)'),
(8, 8, 5, 'v1.4 (Chuẩn VietGAP)'),
(9, 9, 5, 'v2.1 (Chuẩn VietGAP)'),
(10, 10, 5, 'v1.3 (Chuẩn VietGAP)')
ON CONFLICT (template_id) DO NOTHING;

-- ==============================================================================
-- TOÀN BỘ CÁC BƯỚC CHI TIẾT (TEMPLATE STEPS) CHO 10 LOÀI RAU
-- ==============================================================================
INSERT INTO template_steps (step_id, template_id, step_name, description, day_offset, duration_days, task_type, min_temp, max_temp, min_humidity, max_humidity) VALUES
(1, 1, 'Làm đất &amp; Bón lót', 'Xới đất tơi xốp sâu 15cm, đánh luống cao 20cm. Bón lót phân trùn quế 1.5kg/m2 + vôi bột khử chua + nấm đối kháng Trichoderma. San phẳng mặt luống.. Minh chứng: Ảnh mặt luống phẳng &amp; bao bì phân lót', 0, 1, 'SOIL_PREP', 20.0, 35.0, 60.0, 85.0),
(2, 1, 'Gieo hạt &amp; Tưới đẫm', 'Ngâm hạt nước ấm (2 sôi 3 lạnh) 3 giờ, ủ nứt nanh. Gieo theo rạch cách nhau 15cm, hạt cách 3cm. Phủ lớp rơm rạ mục mỏng và tưới đẫm nước.. Minh chứng: Ảnh rạch gieo hạt &amp; luống sau tưới', 0, 1, 'PLANTING', 25.0, 35.0, 75.0, 90.0),
(3, 1, 'Tưới giữ ẩm &amp; Kiểm tra mầm', 'Tưới phun sương mịn ngày 2 lần (7h sáng và 16h chiều). Kiểm tra tỷ lệ nảy mầm, duy trì độ ẩm đất trên 70%.. Minh chứng: Ảnh mầm nhú xanh đều trên hàng', 3, 1, 'IRRIGATION', 22.0, 35.0, 70.0, 85.0),
(4, 1, 'Tỉa dặm &amp; Định mật độ', 'Cây đạt 2 lá mầm, nhổ bỏ cây còi cọc, tỉa khoảng cách cây trên hàng 4-5cm. Nhổ sạch cỏ dại phát sinh.. Minh chứng: Ảnh mật độ cây sau khi tỉa dặm', 7, 1, 'CARE', 22.0, 35.0, 70.0, 80.0),
(5, 1, 'Bón thúc đợt 1 (Đạm cá hữu cơ)', 'Hòa đạm cá ủ men vi sinh (hoặc bánh dầu hoai mục) tỷ lệ 1:200 tưới đều gốc. Xới nhẹ váng đất bề mặt giúp rễ hô hấp tốt.. Minh chứng: Ảnh thùng phân hòa loãng &amp; tưới luống', 10, 1, 'FERTILIZATION', 22.0, 35.0, 70.0, 80.0),
(6, 1, 'Kiểm tra sâu hại &amp; Phun BT', 'Kiểm tra mặt dưới lá tìm sâu tơ, sâu xanh. Phun phòng trừ bằng vi khuẩn Bacillus thuringiensis (BT - Delfin WG 15g/16L) vào chiều mát.. Minh chứng: Ảnh bình phun &amp; nhãn thuốc BT', 15, 1, 'PEST_CONTROL', 20.0, 32.0, 65.0, 80.0),
(7, 1, 'Bón thúc đợt 2 (Dịch chuối Humic)', 'Tưới bổ sung dịch chuối lên men giàu kali + Acid Humic giúp thân mập, bẹ lá dày, ngọn vươn nhanh.. Minh chứng: Ảnh rễ cây mọc khỏe &amp; ngọn xanh bóng', 18, 1, 'FERTILIZATION', 22.0, 35.0, 70.0, 85.0),
(8, 1, 'Cách ly an toàn &amp; Chỉ tưới nước', 'Kiểm tra sâu bệnh lần cuối, tuyệt đối ngừng toàn bộ phân bón và thuốc BVTV. Chỉ duy trì tưới nước sạch đủ ẩm.. Minh chứng: Ảnh luống rau đồng đều trước thu hoạch', 23, 1, 'SAFETY_INTERVAL', 22.0, 35.0, 70.0, 80.0),
(9, 1, 'Thu hoạch &amp; Nghiệm thu sản lượng', 'Cắt ngọn sát gốc chừa lại 3cm nách lá để tái sinh (hoặc nhổ tỉa cả gốc). Cân điện tử, đóng sọt giao khách/lưu kho.. Minh chứng: Ảnh cân điện tử hiển thị số kg &amp; sọt rau', 26, 1, 'HARVEST', 20.0, 32.0, 60.0, 75.0),
(10, 2, 'Lên luống &amp; Bón lót', 'Lên luống cao 20cm rãnh rộng 30cm thoát nước. Bón lót phân trùn quế 1.2kg/m2 + vôi bột khử khuẩn + lân vi sinh. Cào phẳng.. Minh chứng: Ảnh luống cao ráo và phân bón lót', 0, 1, 'SOIL_PREP', 20.0, 32.0, 60.0, 75.0),
(11, 2, 'Cấy cây con giống F1', 'Cấy cây con 10-12 ngày tuổi (3 lá thật) theo khoảng cách 15x15cm. Ấn nhẹ gốc, tưới đẫm nước bằng vòi sen mịn.. Minh chứng: Ảnh hàng cây sau cấy thẳng hàng', 1, 1, 'PLANTING', 22.0, 32.0, 70.0, 85.0),
(12, 2, 'Tưới hồi xanh &amp; Kích rễ', 'Tưới phân bón lá kích rễ hữu cơ sinh học (Roots 2 hoặc Acid Humic loãng). Bù cây héo chết nếu có.. Minh chứng: Ảnh đọt non nhú lá mới', 5, 1, 'FERTILIZATION', 22.0, 32.0, 65.0, 75.0),
(13, 2, 'Bón thúc đợt 1 &amp; Xới xáo', 'Tưới đạm hữu cơ vi sinh (phân đạm cá hoặc bánh dầu hoai). Xới nhẹ phá váng đất mặt, nhặt sạch cỏ dại.. Minh chứng: Ảnh gốc cải xanh và đất tơi xốp', 10, 1, 'FERTILIZATION', 20.0, 32.0, 65.0, 75.0),
(14, 2, 'Phòng trừ bọ nhảy sọc cong', 'Kiểm tra mật độ bọ nhảy. Phun thảo mộc Matrine (Wotac 5EC) hoặc nấm ký sinh Metarhizium (nấm xanh) lúc sáng sớm lúc bọ chưa bay.. Minh chứng: Ảnh thao tác phun kỹ mặt lá và đất', 15, 1, 'PEST_CONTROL', 20.0, 30.0, 60.0, 75.0),
(15, 2, 'Bón thúc đợt 2 &amp; Nuôi bẹ lá', 'Tưới bổ sung dịch đạm Amino Acid + dịch rong biển giúp bẹ cải nở tròn, giòn dẻo, ngọt vị.. Minh chứng: Ảnh bẹ lá cải nở to đều', 20, 1, 'FERTILIZATION', 22.0, 32.0, 65.0, 75.0),
(16, 2, 'Cách ly tuyệt đối &amp; Phòng thối nhũn', 'Ngừng toàn bộ phân bón. Nếu có vết đốm lá vi khuẩn phun nhẹ Kasugamycin (Kasumin 2SL), duy trì cách ly 5 ngày trước thu.. Minh chứng: Ảnh luống cải tươi tốt không sâu bệnh', 26, 1, 'SAFETY_INTERVAL', 20.0, 32.0, 60.0, 70.0),
(17, 2, 'Thu hoạch &amp; Nghiệm thu', 'Cắt sát gốc khi bẹ cải đẫy sức trước khi trổ hoa. Loại bỏ lá già sát đất, cân trọng lượng, chụp ảnh lưu kết quả thu hoạch.. Minh chứng: Ảnh cân ký sản lượng &amp; sọt cải thành phẩm', 32, 1, 'HARVEST', 20.0, 30.0, 60.0, 75.0),
(18, 3, 'Xử lý đất giá thể &amp; Lên luống', 'Đất phối trộn nhiều xơ dừa hoai, phân trùn quế, nấm Trichoderma. Lên luống cao 20cm đảm bảo thoát nước tối đa.. Minh chứng: Ảnh luống đất tơi mịn, xốp', 0, 1, 'SOIL_PREP', 18.0, 28.0, 60.0, 70.0),
(19, 3, 'Cấy cây giống từ vỉ ươm', 'Cấy cây con 12 ngày tuổi mật độ 20x20cm. Tưới phun sương nhẹ nhàng, che lưới đen giảm bức xạ nắng 2 ngày đầu.. Minh chứng: Ảnh luống cấy phủ lưới che mát', 1, 1, 'PLANTING', 18.0, 26.0, 65.0, 75.0),
(20, 3, 'Bén rễ &amp; Dỡ lưới che', 'Dỡ lưới che để cây đón nắng. Duy trì tưới phun sương 2 lần/ngày (8h sáng và 15h chiều). Nhặt lá chân úa.. Minh chứng: Ảnh cây đứng thẳng bén rễ xanh', 6, 1, 'CARE', 18.0, 28.0, 60.0, 70.0),
(21, 3, 'Bón thúc đợt 1 &amp; Bả ốc sên', 'Tưới dịch trùn quế loãng kích thích xòe tán. Rải bả mồi sinh học Ferric Phosphate (Snail Kill) quanh mép luống trừ ốc sên.. Minh chứng: Ảnh bả ốc rải quanh mép &amp; gốc rau', 12, 1, 'FERTILIZATION', 18.0, 28.0, 60.0, 70.0),
(22, 3, 'Kiểm tra rệp &amp; Phun dầu khoáng', 'Vạch kẽ lá kiểm tra rệp muội. Phun dầu khoáng sinh học SK Enspray 99EC nồng độ 0.3% phủ đều 2 mặt lá.. Minh chứng: Ảnh kiểm tra kẽ lá xà lách sạch sâu', 20, 1, 'PEST_CONTROL', 18.0, 26.0, 55.0, 70.0),
(23, 3, 'Bón thúc đợt 2 &amp; Phun Canxi-Bo', 'Phun Canxi-Bo hữu cơ ngừa hiện tượng cháy bìa lá (Tip-burn). Tưới gốc bổ sung dịch bánh dầu hoai mục.. Minh chứng: Ảnh tán xà lách xoăn cuộn dày', 28, 1, 'FERTILIZATION', 18.0, 28.0, 60.0, 70.0),
(24, 3, 'Cách ly phân thuốc &amp; Tưới gốc', 'Ngừng toàn bộ phân bón lá và thuốc. Chỉ tưới nước sạch trực tiếp vào gốc, tránh đọng nước trên bẹ lá sinh nấm.. Minh chứng: Ảnh bụi xà lách nở tròn đều', 36, 1, 'SAFETY_INTERVAL', 18.0, 26.0, 55.0, 65.0),
(25, 3, 'Thu hoạch &amp; Đóng gói', 'Dùng dao cắt ngang gốc sáng sớm khi sương vừa tan. Xếp khay xốp bọc màng thực phẩm, cân ký nghiệm thu.. Minh chứng: Ảnh cân điện tử &amp; cây xà lách tươi giòn', 42, 1, 'HARVEST', 16.0, 25.0, 50.0, 65.0),
(26, 4, 'Làm đất sâu &amp; Bón lót đáy', 'Đào hố sâu 25cm bón lót phân chuồng hoai 2kg/gốc + vôi bột khử chua + lân super + Trichoderma ngừa héo rũ gốc.. Minh chứng: Ảnh hố bón lót &amp; rãnh luống sâu', 0, 1, 'SOIL_PREP', 20.0, 30.0, 60.0, 75.0),
(27, 4, 'Cấy cây con &amp; Định vị', 'Cấy cây con 4 lá thật mật độ 50x70cm. Cắm que tre nhỏ định vị thân mềm tránh gió lay đổ ngã. Tưới đẫm nước.. Minh chứng: Ảnh hàng cây con cắm que định vị', 1, 1, 'PLANTING', 20.0, 28.0, 65.0, 75.0),
(28, 4, 'Bén rễ &amp; Tưới kích rễ đợt 1', 'Tưới phân kích rễ Humic + đạm cá loãng. Kiểm tra độ ẩm đất duy trì 65-75%.. Minh chứng: Ảnh rễ phát triển đọt non vươn cao', 10, 1, 'FERTILIZATION', 20.0, 30.0, 65.0, 75.0),
(29, 4, 'Cắm cọc giàn &amp; Buộc dây treo', 'Cắm cọc tre cao 1.8m hoặc buộc dây treo trần nhà lưới. Quấn thân cà chua theo dây. Vặt bỏ các lá già sát đất.. Minh chứng: Ảnh giàn cọc &amp; thân cây quấn dây', 18, 1, 'PRUNING', 20.0, 30.0, 60.0, 70.0),
(30, 4, 'Tỉa chồi nách &amp; Bón thúc thân', 'Vặt sạch toàn bộ chồi phụ ở nách lá, chỉ giữ 1 thân chính duy nhất. Bón thúc NPK hữu cơ 20-20-15 quanh tán cây.. Minh chứng: Ảnh nách lá sau khi vặt sạch chồi', 28, 1, 'PRUNING', 20.0, 30.0, 60.0, 75.0),
(31, 4, 'Bón đón hoa &amp; Phòng bọ trĩ', 'Phun vi lượng Bo chống rụng hoa. Phun phòng bọ trĩ bằng tinh dầu Neem phối hợp Abamectin sinh học.. Minh chứng: Ảnh chùm nụ hoa đầu tiên xuất hiện', 40, 1, 'FERTILIZATION', 20.0, 28.0, 60.0, 70.0),
(32, 4, 'Hỗ trợ thụ phấn &amp; Phun Canxi-Bo', 'Rung nhẹ dây giàn lúc 8:30 sáng giúp phấn hoa bung đều. Phun Canxi-Bo sữa sinh học ngăn thối đít quả.. Minh chứng: Ảnh chùm quả non xanh đậu đều', 48, 1, 'CARE', 20.0, 28.0, 60.0, 70.0),
(33, 4, 'Tỉa lá già &amp; Bón thúc quả lớn', 'Cắt tỉa lá già vàng bên dưới chùm quả thứ nhất. Bón thúc Kali hữu cơ (dịch chuối ủ vi sinh) giúp quả bóng mọng.. Minh chứng: Ảnh các chùm quả lớn đẫy sức', 58, 1, 'PRUNING', 20.0, 30.0, 65.0, 75.0),
(34, 4, 'Ngừng thuốc BVTV &amp; Thúc ngọt', 'Ngừng toàn bộ thuốc BVTV. Tưới thúc kali lần cuối giúp quả chuyển màu đỏ tươi và tăng độ ngọt (Brix).. Minh chứng: Ảnh quả bắt đầu chuyển màu vàng cam', 68, 1, 'SAFETY_INTERVAL', 20.0, 30.0, 60.0, 70.0),
(35, 4, 'Thu hoạch đợt 1 (Quả chín đỏ)', 'Dùng kéo cắt từng chùm hoặc quả đơn đạt độ chín 85%. Cân điện tử, chụp ảnh hiện trường lưu Harvest Result.. Minh chứng: Ảnh chùm quả chín đỏ rực &amp; cân ký', 75, 1, 'HARVEST', 20.0, 28.0, 55.0, 65.0),
(36, 4, 'Thu hoạch vét &amp; Thu dọn tàn dư', 'Thu toàn bộ quả còn lại, cắt dây hạ giàn, thu gom gốc rễ chuyển sang chế độ Maintenance nghỉ đất.. Minh chứng: Ảnh Plot dọn sạch tàn dư chuẩn bị ải', 82, 1, 'HARVEST', 20.0, 30.0, 55.0, 65.0),
(37, 5, 'Làm đất xốp &amp; Bón lót rãnh', 'Đánh luống cao 25cm, rạch rãnh bón lót phân trùn quế 2kg/m2 + lân nung chảy + nấm đối kháng Trichoderma. Lấp đất màu.. Minh chứng: Ảnh luống cao rãnh rạch phân lót', 0, 1, 'SOIL_PREP', 22.0, 32.0, 65.0, 75.0),
(38, 5, 'Cấy cây con bầu ươm', 'Cấy cây con 8 ngày tuổi mật độ 40x50cm. Tưới đẫm nước xung quanh bầu rễ.. Minh chứng: Ảnh bầu cây con thẳng hàng trên luống', 1, 1, 'PLANTING', 22.0, 32.0, 70.0, 80.0),
(39, 5, 'Bén rễ &amp; Bón kích ngọn đọt', 'Cây bén rễ nhanh, tưới thúc đạm cá hữu cơ loãng kích thích phát triển rễ phụ và ngọn leo.. Minh chứng: Ảnh ngọn non vươn tua cuốn', 7, 1, 'FERTILIZATION', 22.0, 32.0, 70.0, 80.0),
(40, 5, 'Cắm giàn chữ A &amp; Căng lưới', 'Cắm cọc tre chữ A cao 2m, giăng lưới cước mắt 15cm. Cố định ngọn leo vào mắt lưới đầu tiên.. Minh chứng: Ảnh giàn lưới chữ A hoàn thiện', 14, 1, 'PRUNING', 22.0, 32.0, 65.0, 75.0),
(41, 5, 'Vặt nhánh gốc &amp; Bấm hoa sớm', 'Vặt sạch toàn bộ nhánh phụ và hoa từ nách lá 1 đến 5 để cây dồn sức nuôi thân leo lên đỉnh giàn.. Minh chứng: Ảnh thân chính sạch nhánh dưới gốc', 20, 1, 'PRUNING', 22.0, 32.0, 65.0, 75.0),
(42, 5, 'Bón thúc nuôi quả &amp; Phòng nấm', 'Bón thúc NPK 16-16-16 hữu cơ. Phun phòng nấm phấn trắng bằng Bacillus amyloliquefaciens (Serenade ASO).. Minh chứng: Ảnh hoa cái nở rộ trên các nách lá', 28, 1, 'FERTILIZATION', 22.0, 30.0, 65.0, 75.0),
(43, 5, 'Tưới đủ ẩm &amp; Bổ sung Kali', 'Dưa leo nuôi quả rất cần nước, tưới 2 lần/ngày không để khô hạn làm đắng trái. Bổ sung dịch chuối ủ men.. Minh chứng: Ảnh chùm quả non suôn thẳng', 35, 1, 'IRRIGATION', 22.0, 32.0, 70.0, 80.0),
(44, 5, 'Ngừng thuốc BVTV &amp; Cách ly', 'Ngừng hoàn toàn mọi loại thuốc BVTV, đảm bảo an toàn tuyệt đối khi thu hoạch.. Minh chứng: Ảnh quả dưa leo xanh mướt', 42, 1, 'SAFETY_INTERVAL', 22.0, 30.0, 65.0, 75.0),
(45, 5, 'Thu hoạch rộ lứa đầu', 'Thu hoạch quả dài 10-12cm khi vỏ còn lớp phấn trắng mịn. Cắt bằng kéo, thu cách ngày 1 lần.. Minh chứng: Ảnh sọt dưa leo baby &amp; cân ký', 46, 1, 'HARVEST', 20.0, 30.0, 60.0, 70.0),
(46, 5, 'Thu hoạch vét &amp; Vệ sinh giàn', 'Thu hết lứa quả cuối, cắt gốc dây dưa, tháo gỡ lưới thu gom tàn dư chuẩn bị phơi ải đất.. Minh chứng: Ảnh dọn sạch giàn lưới sau thu hoạch', 56, 1, 'HARVEST', 22.0, 32.0, 60.0, 70.0),
(47, 6, 'Làm đất &amp; Bón lót luống', 'Lên luống cao 25cm thoát nước tốt. Bón lót phân chuồng hoai mục + lân super + vôi bột khử khuẩn. Rạch hàng.. Minh chứng: Ảnh luống cao ráo bón lót phân hoai', 0, 1, 'SOIL_PREP', 20.0, 30.0, 60.0, 70.0),
(48, 6, 'Gieo hạt hốc', 'Gieo 2 hạt/hốc cách nhau 30cm, sâu 2cm. Phủ tro trấu mỏng giữ ẩm, tưới nhẹ bằng ô doa.. Minh chứng: Ảnh hốc gieo hạt phủ tro trấu', 1, 1, 'PLANTING', 20.0, 30.0, 65.0, 75.0),
(49, 6, 'Tỉa định cây &amp; Xới nhẹ', 'Hạt mọc mầm đều, tỉa giữ lại 1 cây khỏe nhất/hốc. Dùng cào nhỏ xới nhẹ váng đất quanh gốc.. Minh chứng: Ảnh mầm đậu xanh khỏe 1 cây/hốc', 5, 1, 'CARE', 20.0, 30.0, 65.0, 75.0),
(50, 6, 'Bón thúc đợt 1 &amp; Vun nhẹ gốc', 'Tưới thúc đạm cá hữu cơ loãng. Vun một lớp đất mỏng vào cổ rễ giúp cây đứng vững.. Minh chứng: Ảnh gốc đậu được vun đất màu', 14, 1, 'FERTILIZATION', 20.0, 30.0, 65.0, 75.0),
(51, 6, 'Cắm giàn leo chữ A', 'Cắm giàn tre chữ A cao 1.8m, buộc nẹp ngang. Hướng dẫn ngọn đậu bám vào thân cọc.. Minh chứng: Ảnh giàn cọc tre thẳng tắp', 20, 1, 'PRUNING', 20.0, 30.0, 60.0, 70.0),
(52, 6, 'Bón thúc đón hoa &amp; Phun Bo', 'Bón NPK hữu cơ cân đối. Phun phân bón lá Bo sinh học chống rụng hoa tăng tỷ lệ đậu quả.. Minh chứng: Ảnh chùm hoa đậu trắng tím nở rộ', 30, 1, 'FERTILIZATION', 20.0, 28.0, 60.0, 70.0),
(53, 6, 'Phòng dòi đục thân &amp; Sâu quả', 'Phun chế phẩm vi khuẩn BT hoặc Emamectin benzoate (Tasieu 1.9EC) phòng sâu đục quả. Bắt đầu thời kỳ cách ly.. Minh chứng: Ảnh phun thuốc sinh học đều giàn', 38, 1, 'PEST_CONTROL', 20.0, 28.0, 60.0, 70.0),
(54, 6, 'Thu hoạch lứa đầu', 'Thu hoạch quả bánh tẻ màu xanh tươi, hạt chưa gồ to. Hái nhẹ tay tránh rách cành hoa.. Minh chứng: Ảnh rổ đậu cô ve tươi giòn', 45, 1, 'HARVEST', 20.0, 28.0, 55.0, 65.0),
(55, 6, 'Thu hoạch lứa 2 &amp; Dọn tàn dư', 'Thu hết các quả còn lại, cắt bỏ dây đậu gom vào khu ủ rác hữu cơ.. Minh chứng: Ảnh cân ký sản lượng cuối vụ', 52, 1, 'HARVEST', 20.0, 30.0, 55.0, 65.0),
(56, 7, 'Đào hố &amp; Bón lót đáy', 'Đào hố 40x40cm, sâu 30cm. Bón lót 3kg phân chuồng ủ hoai + 100g lân + vôi khử trùng + nấm Trichoderma. Lấp đất ủ 2 ngày.. Minh chứng: Ảnh hố phân lót đáy tơi xốp', 0, 1, 'SOIL_PREP', 22.0, 35.0, 65.0, 75.0),
(57, 7, 'Cấy cây con bầu ươm', 'Ngâm ủ hạt gieo bầu 7 ngày trước. Cấy cây con 2 lá thật vào hố, khoảng cách hốc 1m. Tưới đẫm nước.. Minh chứng: Ảnh cây con mướp trong hố đất', 1, 1, 'PLANTING', 25.0, 35.0, 70.0, 85.0),
(58, 7, 'Bén rễ &amp; Bón thúc kích ngọn', 'Cây bén rễ nhú tua cuốn, tưới dịch trùn quế loãng kích thích thân dây vươn dài khỏe.. Minh chứng: Ảnh ngọn mướp mập mạp xanh tốt', 10, 1, 'FERTILIZATION', 25.0, 35.0, 70.0, 80.0),
(59, 7, 'Bắt giàn mái bằng / Giàn lưới', 'Làm giàn mái bằng hoặc giàn lưới cao 2m. Cắm cọc dắt ngọn mướp bò lên mặt giàn.. Minh chứng: Ảnh ngọn mướp leo chạm mặt giàn', 18, 1, 'PRUNING', 25.0, 35.0, 65.0, 75.0),
(60, 7, 'Bấm ngọn chính kích nhánh cái', 'Khi ngọn chính bò lên giàn được 1m, bấm ngọn sinh trưởng để kích thích bung nhiều nhánh cấp 1 mang hoa cái.. Minh chứng: Ảnh vết bấm ngọn &amp; các chồi nhánh', 28, 1, 'PRUNING', 25.0, 35.0, 65.0, 75.0),
(61, 7, 'Treo bẫy ruồi vàng &amp; Bón hoa', 'Treo bẫy dẫn dụ Pheromone (Vizubon-D) ngoài rìa giàn trừ ruồi đục quả. Bón NPK hữu cơ nuôi hoa.. Minh chứng: Ảnh bẫy ruồi vàng treo đầu giàn', 38, 1, 'PEST_CONTROL', 25.0, 32.0, 65.0, 75.0),
(62, 7, 'Nuôi quả lớn &amp; Tưới đủ nước', 'Mướp nuôi quả cần rất nhiều nước, tưới giữ ẩm 70-80%. Bổ sung dịch chuối trứng giàu Kali.. Minh chứng: Ảnh quả mướp non treo lủng lẳng', 48, 1, 'IRRIGATION', 25.0, 35.0, 70.0, 80.0),
(63, 7, 'Cách ly tuyệt đối &amp; Tỉa lá già', 'Ngừng toàn bộ thuốc BVTV. Cắt bỏ bớt các lá già vàng phía dưới giúp giàn thông thoáng đón gió.. Minh chứng: Ảnh giàn mướp thông thoáng, sai quả', 56, 1, 'SAFETY_INTERVAL', 25.0, 35.0, 65.0, 75.0),
(64, 7, 'Thu hoạch đợt 1 (Quả thẳng thơm)', 'Cắt quả khi đạt độ dài 25-30cm, vỏ mềm thơm ngát. Cân ký và chụp ảnh nghiệm thu.. Minh chứng: Ảnh quả mướp hương trên cân điện tử', 60, 1, 'HARVEST', 22.0, 32.0, 60.0, 70.0),
(65, 7, 'Thu hoạch đợt 2 &amp; Vệ sinh giàn', 'Thu các lứa quả còn lại, cắt gốc dọn dây tàn dư để chuẩn bị chu kỳ nghỉ đất.. Minh chứng: Ảnh dọn sạch giàn chuẩn bị cày ải', 68, 1, 'HARVEST', 25.0, 35.0, 60.0, 70.0),
(66, 8, 'Lên luống &amp; Bón lót hữu cơ', 'Đất nhiều mùn, tơi xốp. Lên luống cao 20cm, bón lót phân trùn quế 1.5kg/m2 + lân vi sinh. Cào phẳng.. Minh chứng: Ảnh luống phẳng mịn, bón phân đều', 0, 1, 'SOIL_PREP', 22.0, 35.0, 65.0, 75.0),
(67, 8, 'Gieo hạt theo hàng', 'Ngâm hạt nước ấm 4 giờ. Rạch hàng cách nhau 20cm, gieo hạt cách 10cm, phủ lớp đất mỏng 1cm. Tưới đẫm.. Minh chứng: Ảnh luống sau gieo được phủ ẩm', 1, 1, 'PLANTING', 25.0, 35.0, 75.0, 85.0),
(68, 8, 'Kiểm tra mầm &amp; Tỉa dặm', 'Hạt mọc mầm 2 lá, tỉa giữ khoảng cách 12-15cm. Tưới nước giữ ẩm ngày 2 lần.. Minh chứng: Ảnh cây con mồng tơi mập xanh', 6, 1, 'CARE', 25.0, 35.0, 70.0, 85.0),
(69, 8, 'Bón thúc đợt 1 (Đạm cá)', 'Tưới thúc đạm cá lên men hoặc bánh dầu ngâm ủ vi sinh loãng giúp bẹ lá dày, ngọn vươn nhanh.. Minh chứng: Ảnh tưới phân hữu cơ quanh gốc', 12, 1, 'FERTILIZATION', 25.0, 35.0, 70.0, 85.0),
(70, 8, 'Bón thúc đợt 2 &amp; Xới xáo', 'Xới nhẹ rãnh luống, bón bổ sung phân trùn quế rải mặt + dịch chuối Humic. Nhặt sạch cỏ dại.. Minh chứng: Ảnh lá mồng tơi to tròn, xanh bóng', 18, 1, 'FERTILIZATION', 25.0, 35.0, 70.0, 85.0),
(71, 8, 'Kiểm tra sâu khoang &amp; Cách ly', 'Vạch lá bắt sâu khoang thủ công. Phun vi khuẩn BT nếu mật độ cao. Bắt đầu ngừng phân bón thuốc trừ sâu.. Minh chứng: Ảnh kiểm tra tán lá lành lặn', 24, 1, 'PEST_CONTROL', 22.0, 35.0, 65.0, 80.0),
(72, 8, 'Thu hoạch đọt &amp; Nghiệm thu', 'Cắt đọt non dài 15-20cm chừa lại 2 nách lá sát gốc để tiếp tục sinh nhánh lứa 2. Cân ký giao khách.. Minh chứng: Ảnh đọt mồng tơi trên cân &amp; sọt rau', 30, 1, 'HARVEST', 22.0, 32.0, 60.0, 75.0),
(73, 9, 'Lên luống cao &amp; Bón lót sâu', 'Lên luống cao 30cm rãnh sâu chống úng. Bón lót phân chuồng hoai 2kg/m2 + vôi bột khử nấm + lân + Trichoderma.. Minh chứng: Ảnh luống cao rãnh sâu thoát nước', 0, 1, 'SOIL_PREP', 22.0, 32.0, 60.0, 70.0),
(74, 9, 'Cấy cây con giống vỉ ươm', 'Cấy cây con 20 ngày tuổi (4-5 lá thật) theo khoảng cách 45x50cm. Tưới đẫm nước định vị gốc.. Minh chứng: Ảnh hàng ớt cấy ngay ngắn', 1, 1, 'PLANTING', 22.0, 32.0, 65.0, 75.0),
(75, 9, 'Bén rễ &amp; Tưới kích rễ đợt 1', 'Tưới phân kích rễ Humic + đạm cá loãng. Xới nhẹ đất mặt luống giúp rễ ăn sâu.. Minh chứng: Ảnh đọt non nhú lá xanh đậm', 12, 1, 'FERTILIZATION', 22.0, 32.0, 65.0, 75.0),
(76, 9, 'Tỉa cành chạc V &amp; Cắm cọc', 'Vặt sạch toàn bộ chồi nách và lá phía dưới chạc chữ V đầu tiên. Cắm cọc tre buộc thân chống đổ ngã.. Minh chứng: Ảnh thân ớt thông thoáng dưới chạc V', 25, 1, 'PRUNING', 22.0, 32.0, 60.0, 70.0),
(77, 9, 'Bón thúc đợt 2 &amp; Phun vi lượng', 'Bón NPK hữu cơ 20-20-15. Phun Bo vi lượng sinh học chống rụng hoa tăng tỷ lệ đậu trái.. Minh chứng: Ảnh hoa ớt trắng nở đều trên chạc', 40, 1, 'FERTILIZATION', 22.0, 30.0, 60.0, 70.0),
(78, 9, 'Phòng trừ bọ trĩ &amp; Thán thư', 'Phun tinh dầu Neem + Nano Bạc Đồng phòng bọ trĩ làm xoăn đọt và bệnh thán thư nổ trái.. Minh chứng: Ảnh chùm quả ớt non chỉ thiên', 55, 1, 'PEST_CONTROL', 22.0, 30.0, 60.0, 70.0),
(79, 9, 'Thúc chín quả &amp; Ngừng thuốc', 'Ngừng toàn bộ thuốc BVTV. Tưới kali hữu cơ (dịch chuối lên men) giúp quả chuyển màu đỏ tươi, tăng độ cay.. Minh chứng: Ảnh quả ớt chuyển màu đỏ rực', 70, 1, 'SAFETY_INTERVAL', 22.0, 32.0, 60.0, 70.0),
(80, 9, 'Thu hoạch quả đỏ đợt 1', 'Hái từng quả chín đỏ đều kèm cuống. Cân điện tử, chụp ảnh nghiệm thu sản lượng.. Minh chứng: Ảnh rổ ớt đỏ tươi trên cân điện tử', 80, 1, 'HARVEST', 20.0, 30.0, 55.0, 65.0),
(81, 9, 'Thu hoạch đợt 2 &amp; Dưỡng cây', 'Thu hoạch đợt 2, bón bổ sung phân trùn quế gốc để duy trì cây ra hoa lứa tiếp theo.. Minh chứng: Ảnh gốc ớt sau khi bón dưỡng lứa 2', 88, 1, 'HARVEST', 22.0, 32.0, 60.0, 70.0),
(82, 10, 'Làm đất mịn &amp; Bón lót', 'Đất cày xới kỹ, tán nhỏ tơi mịn. Bón lót phân trùn quế hoai 1.2kg/m2 + vôi bột khử khuẩn. San phẳng mặt luống.. Minh chứng: Ảnh mặt luống phẳng mịn', 0, 1, 'SOIL_PREP', 22.0, 35.0, 65.0, 75.0),
(83, 10, 'Gieo vãi hạt trộn cát', 'Hạt dền rất nhỏ, trộn đều với cát mịn hoặc tro bếp theo tỷ lệ 1:5 rồi rắc đều trên mặt luống. Phủ rơm mục mỏng, tưới đẫm.. Minh chứng: Ảnh luống sau gieo phủ rơm tưới ẩm', 1, 1, 'PLANTING', 25.0, 35.0, 75.0, 85.0),
(84, 10, 'Kiểm tra mầm &amp; Tưới sương', 'Hạt nảy mầm sau 2-3 ngày. Tưới phun sương nhẹ nhàng ngày 2 lần, tránh vòi xịt mạnh làm dập mầm.. Minh chứng: Ảnh thảm mầm đỏ tía nhú đều', 4, 1, 'IRRIGATION', 25.0, 35.0, 70.0, 80.0),
(85, 10, 'Tỉa thưa &amp; Bón thúc đợt 1', 'Tỉa thưa bớt chỗ quá dày giữ khoảng cách 5-7cm/cây. Tưới thúc đạm cá hữu cơ loãng giúp vươn ngọn.. Minh chứng: Ảnh hàng rau dền sau tỉa thoáng', 10, 1, 'FERTILIZATION', 25.0, 35.0, 70.0, 80.0),
(86, 10, 'Bón thúc đợt 2 &amp; Nhặt cỏ', 'Tưới bổ sung dịch trùn quế. Nhặt sạch cỏ dại cạnh tranh dinh dưỡng. Đảm bảo độ ẩm đất 65-80%.. Minh chứng: Ảnh lá rau dền đỏ tía mọc rộ', 16, 1, 'FERTILIZATION', 25.0, 35.0, 65.0, 80.0),
(87, 10, 'Kiểm tra sâu &amp; Cách ly tuyệt đối', 'Kiểm tra sâu xanh ăn lá (bắt tay hoặc phun BT nếu mật độ cao). Ngừng tuyệt đối phân bón thuốc BVTV.. Minh chứng: Ảnh thảm rau dền đỏ mơn mởn', 21, 1, 'SAFETY_INTERVAL', 22.0, 32.0, 60.0, 75.0),
(88, 10, 'Thu hoạch &amp; Nghiệm thu', 'Nhổ cả cây rửa sạch đất rễ (hoặc cắt ngang thân chừa 3cm để tái sinh). Cân ký và chụp ảnh minh chứng.. Minh chứng: Ảnh bó rau dền đỏ trên cân điện tử', 26, 1, 'HARVEST', 20.0, 30.0, 60.0, 70.0)
ON CONFLICT (step_id) DO NOTHING;

-- Keep the explicit display order expected by knowledge-service while preserving
-- the richer day-based schedule from the imported cultivation dataset.
WITH ordered_steps AS (
    SELECT step_id,
           ROW_NUMBER() OVER (PARTITION BY template_id ORDER BY day_offset, step_id) AS display_order
    FROM template_steps
)
UPDATE template_steps target
SET step_order = ordered_steps.display_order
FROM ordered_steps
WHERE target.step_id = ordered_steps.step_id;

UPDATE template_steps
SET step_name = REPLACE(step_name, '&amp;', '&'),
    description = REPLACE(REPLACE(description, '&amp;', '&'), '.. ', '. ')
WHERE step_name LIKE '%&amp;%' OR description LIKE '%&amp;%' OR description LIKE '%.. %';

-- 9. CONTRACTS & RENTALS (Khách hàng & Hợp đồng thực tế)
INSERT INTO contracts (contract_id, renter_id, contract_number, total_amount, status, created_at) VALUES
(1, 1, 'HD-2026-FARM-001', 3000000.00, 'ACTIVE', NOW() - INTERVAL '30 days'),
(2, 2, 'HD-2026-FARM-002', 2850000.00, 'ACTIVE', NOW() - INTERVAL '25 days'),
(3, 3, 'HD-2026-FARM-003', 1400000.00, 'ACTIVE', NOW() - INTERVAL '10 days')
ON CONFLICT (contract_id) DO NOTHING;

INSERT INTO rentals (rental_id, contract_id, service_id, plot_id, variety_id, start_date, end_date, total_price, status) VALUES
-- Rental 1: Lô Thái Quyền (ID 1) - P-01 - Cà chua bi đỏ F1 (variety_id = 4) - Gói toàn vụ S15
(1, 1, 15, 1, 4, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '50 days', 3000000.00, 'ACTIVE'),
-- Rental 2: Đào Duy Anh (ID 2) - P-02 - Xà lách Romaine VietGAP (variety_id = 3) - Gói toàn vụ S15
(2, 2, 15, 2, 3, CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE + INTERVAL '20 days', 2850000.00, 'ACTIVE'),
-- Rental 3: Tạ Nguyễn Khôi Nguyên (ID 3) - P-03 - Dưa leo baby F1 (variety_id = 5) - Tự chăm sóc (Self-growing)
(3, 3, NULL, 3, 5, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '45 days', 1400000.00, 'ACTIVE')
ON CONFLICT (rental_id) DO NOTHING;

-- 10. PAYMENT TRANSACTIONS
INSERT INTO payment_transactions (transaction_id, contract_id, service_request_id, type, amount, payment_method, gateway_ref, status, created_at) VALUES
(1, 1, NULL, 'PAYMENT', 3000000.00, 'VIETQR', 'VQR-MBB-20261001-09823', 'SUCCESS', NOW() - INTERVAL '30 days'),
(2, 2, NULL, 'PAYMENT', 2850000.00, 'VIETQR', 'VQR-ICB-20261005-11029', 'SUCCESS', NOW() - INTERVAL '25 days'),
(3, 3, NULL, 'PAYMENT', 1400000.00, 'VIETQR', 'VQR-VCB-20261010-88412', 'SUCCESS', NOW() - INTERVAL '10 days')
ON CONFLICT (transaction_id) DO NOTHING;

-- 11. CARE TASKS & DIARIES
INSERT INTO care_tasks (task_id, rental_id, step_id, service_request_id, task_assigned_to, due_date, status, evidence_image_url, notes) VALUES
(1, 1, 2, NULL, 8, CURRENT_DATE - INTERVAL '15 days', 'DONE', 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80', 'Đã xuống giống 25 cây cà chua con khỏe mạnh, tưới đẫm vi sinh Trichoderma.'),
(2, 1, 3, NULL, 8, CURRENT_DATE - INTERVAL '5 days', 'DONE', 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80', 'Đã lắp giàn cọc chữ A, buộc dây cố định thân chính, bấm tỉa chồi nách sát gốc.'),
(3, 1, 4, NULL, 8, CURRENT_DATE, 'IN_PROG', NULL, 'Đang tiến hành pha dịch đạm cá vi sinh bón gốc đợt 2.'),
(4, 2, 8, NULL, 9, CURRENT_DATE - INTERVAL '18 days', 'DONE', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80', 'Cấy cây xà lách con tỷ lệ sống 98%.')
ON CONFLICT (task_id) DO NOTHING;

INSERT INTO farm_diaries (diary_id, rental_id, task_id, content, image_url, created_at) VALUES
(1, 1, 1, 'Hôm nay bác Lực đã hoàn thành cấy cây con giống F1 ra luống P-01. Cây bén rễ xanh tươi.', 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80', NOW() - INTERVAL '15 days'),
(2, 1, 2, 'Cây cà chua bi phát triển vượt bậc, đã hoàn thành lên giàn chữ A và bấm tỉa lá chân thông thoáng.', 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80', NOW() - INTERVAL '5 days')
ON CONFLICT (diary_id) DO NOTHING;

-- 12. SENSOR READINGS (TELEMETRY)
INSERT INTO sensor_readings (reading_id, plot_id, temperature, air_humidity, soil_humidity, recorded_at) VALUES
(1, 1, 24.5, 82.0, 68.0, NOW() - INTERVAL '15 hours'),
(2, 1, 27.2, 75.0, 65.5, NOW() - INTERVAL '12 hours'),
(3, 1, 31.8, 62.0, 61.0, NOW() - INTERVAL '9 hours'),
(4, 1, 33.5, 55.0, 58.2, NOW() - INTERVAL '6 hours'),
(5, 1, 30.0, 68.0, 63.4, NOW() - INTERVAL '3 hours'),
(6, 1, 26.8, 76.5, 66.8, NOW())
ON CONFLICT (reading_id) DO NOTHING;

-- 13. CONVERSATIONS & MESSAGES
INSERT INTO conversations (conversation_id, participant_one, participant_two, rental_id, plot_id, type, status) VALUES
(1, 1, 5, 1, 1, 'CUST_EXP', 'OPEN'),
(2, 2, 6, 2, 2, 'CUST_EXP', 'OPEN'),
(3, 8, 5, 3, 3, 'STAFF_EXP', 'OPEN')
ON CONFLICT (conversation_id) DO NOTHING;

INSERT INTO messages (message_id, conversation_id, sender_id, content, created_at) VALUES
(1, 1, 1, 'Chào chuyên gia Nam, cà chua bi của tôi ở thửa P-01 độ ẩm 68% đã đạt chuẩn chưa ạ?', NOW() - INTERVAL '2 hours'),
(2, 1, 5, 'Chào anh Quyền! Độ ẩm 68% là hoàn hảo cho giai đoạn cây chuẩn bị bung hoa nhé.', NOW() - INTERVAL '1 hour 45 minutes'),
(3, 1, 1, 'Cảm ơn Thạc sĩ rất nhiều!', NOW() - INTERVAL '1 hour 30 minutes')
ON CONFLICT (message_id) DO NOTHING;

-- THƯ VIỆN TRI THỨC NÔNG NGHIỆP & AI RAG
INSERT INTO knowledge_documents (document_id, kd_created_by, title, content, file_url, created_at) VALUES
(1, 5, 'Sách Hướng Dẫn Đào Tạo Sản Xuất Rau An Toàn Theo VietGAP', 
 'Tài liệu hướng dẫn chuẩn quốc gia 200 trang gồm 12 module: Đánh giá vùng đất, giá thể, nguồn nước, phân bón hữu cơ, bảo vệ thực vật sinh học, cách ly PHI và truy xuất nguồn gốc.', 
 '/docs/rau_an_toan_vietgap_huyen.pdf', NOW() - INTERVAL '30 days'),

(2, 5, 'Quy Trình Sử Dụng Nguyên Liệu Hữu Cơ, Phân Bón Hữu Cơ Phối Hợp Phân Vô Cơ Cho Sản Xuất Rau An Toàn (TBKT 01-104: 2021/BVTV)', 
 'Tiến bộ kỹ thuật ban hành bởi Cục BVTV - Bộ NN&PTNT hướng dẫn định mức N-P-K quy đổi, ủ hoai phân chuồng thay thế 50% vô cơ và phác đồ dinh dưỡng cho từng nhóm rau.', 
 '/docs/210219_pl_qt_tbkt_rau_an_toanpdf.pdf', NOW() - INTERVAL '25 days'),

(3, 5, 'Quyết Định 288/QĐ-BVTV-KH Công Nhận Tiến Bộ Kỹ Thuật Sản Xuất Rau Hữu Cơ Tiêu Chuẩn Quốc Gia', 
 'Quyết định pháp lý công nhận quy trình kỹ thuật sản xuất rau hữu cơ, kiểm soát vùng đệm cách ly môi trường, cấm hóa chất độc hại và kim loại nặng.', 
 '/docs/21.03,01_QD288 TBKT rau huu cơ.pdf', NOW() - INTERVAL '22 days'),

(4, 6, 'Quy Trình Quản Lý Dịch Hại Tổng Hợp (IPM) Trên Cây Trồng Nông Nghiệp', 
 'Quy trình kỹ thuật IPM cập nhật ban hành 2025 quy định cơ chế bẫy dính vàng, bẫy pheromone, bảo vệ sinh thái thiên địch và ngưỡng phòng trừ sinh học an toàn.', 
 '/docs/quy_trinh_ipm_na_712025pdf.pdf', NOW() - INTERVAL '18 days'),

(5, 6, 'Quy Trình Quản Lý Tổng Hợp Sâu Bệnh Hại & Nấm Đối Kháng Sinh Học (TBKT 01-114: 2021/BVTV)', 
 'Quy trình phòng trừ nấm bệnh thối rễ, xì mủ, héo xanh bằng nấm đối kháng Trichoderma sinh học và chế phẩm sinh học thân thiện môi trường.', 
 '/docs/211225__quy_trinh_qlsb_sau_riengrevised_3pdf.pdf', NOW() - INTERVAL '15 days')
ON CONFLICT (document_id) DO NOTHING;

-- ============================================================
-- PHÂN HỆ MỞ RỘNG: SITE VISITS, SERVICE REQUESTS, HARVEST, ISSUES, NOTIFICATIONS & AUDIT LOGS
-- ============================================================

-- Bảng site_visits (Đăng ký thăm quan thực địa)
INSERT INTO site_visits (visit_id, plot_id, visitor_name, visitor_phone, visit_date, visit_slot, status, created_at) VALUES
(1, 1, 'Lô Thái Quyền', '0901234567', CURRENT_DATE - INTERVAL '5 days', 'MORNING', 'COMPLETED', NOW() - INTERVAL '7 days'),
(2, 2, 'Đào Duy Anh', '0912345678', CURRENT_DATE + INTERVAL '2 days', 'MORNING', 'CONFIRMED', NOW() - INTERVAL '2 days'),
(3, 3, 'Tạ Nguyễn Khôi Nguyên', '0988776655', CURRENT_DATE + INTERVAL '3 days', 'AFTERNOON', 'PENDING', NOW() - INTERVAL '1 day')
ON CONFLICT (visit_id) DO NOTHING;

-- Bảng contract_cancellations (Yêu cầu hủy hợp đồng & hoàn tiền)
INSERT INTO contract_cancellations (cancellation_id, contract_id, cancelled_by, reason, status, created_at, processed_at) VALUES
(1, 3, 4, 'Khách hàng bận công tác dài ngày tại nước ngoài, không thể tiếp tục nhận rau thu hoạch.', 'APPROVED', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day')
ON CONFLICT (cancellation_id) DO NOTHING;

-- Bảng service_requests (Yêu cầu dịch vụ phát sinh lẻ trong vụ)
INSERT INTO service_requests (request_id, rental_id, service_id, scheduled_date, status, created_at) VALUES
(1, 1, 1, CURRENT_DATE + INTERVAL '1 day', 'ASSIGNED', NOW() - INTERVAL '6 hours'),
(2, 1, 4, CURRENT_DATE - INTERVAL '3 days', 'DONE', NOW() - INTERVAL '4 days'),
(3, 2, 2, CURRENT_DATE + INTERVAL '2 days', 'PENDING', NOW() - INTERVAL '2 hours')
ON CONFLICT (request_id) DO NOTHING;

-- Bảng harvest_results (Kết quả nghiệm thu thu hoạch cuối vụ)
INSERT INTO harvest_results (harvest_id, rental_id, entered_by, harvest_date, yield_amount, evidence_image_url, delivery_type, customer_confirmed, created_at) VALUES
(1, 3, 7, CURRENT_DATE - INTERVAL '2 days', 32.50, '/images/harvest/rau-muong-p03.jpg', 'DELIVERY', TRUE, NOW() - INTERVAL '2 days')
ON CONFLICT (harvest_id) DO NOTHING;

-- Bảng issue_reports (Báo cáo sự cố sâu bệnh / điều kiện canh tác)
INSERT INTO issue_reports (issue_id, rental_id, reported_by, handled_by, issue_type, description, image_url, status, resolution_notes, resolved_at, created_at) VALUES
(1, 1, 1, 5, 'SÂU BỆNH - RẦY MỀM', 
 'Phát hiện rầy mềm xuất hiện ở mặt dưới một số lá tầng gốc của cây cà chua bi P-01.', 
 '/images/issues/ray-mem-p01.jpg', 'RESOLVED', 
 'Đã phân công công nhân phun chế phẩm thảo mộc Gừng Ớt Tỏi theo tài liệu DOC-01, rầy mềm đã bị khống chế hoàn toàn.', 
 NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 days'),

(2, 2, 2, 6, 'ẨM ĐỘ - CẢNH BÁO TƯỚI', 
 'Cảm biến IoT báo độ ẩm đất thửa P-02 giảm xuống 52%, thấp hơn ngưỡng khuyến nghị 65%.', 
 '/images/issues/do-am-p02.jpg', 'OPEN', 
 NULL, NULL, NOW() - INTERVAL '4 hours')
ON CONFLICT (issue_id) DO NOTHING;

-- Bảng notifications (Thông báo trong ứng dụng)
INSERT INTO notifications (notification_id, user_id, title, content, is_read, created_at) VALUES
(1, 1, 'Hợp đồng FML-2026-001 đã kích hoạt', 'Thửa đất P-01 của bạn đã bắt đầu chu kỳ canh tác cà chua bi Cherry VietGAP.', FALSE, NOW() - INTERVAL '12 days'),
(2, 1, 'Nhật ký đồng ruộng vừa cập nhật', 'Kỹ thuật viên Lê Văn Bảy vừa hoàn thành và đăng tải ảnh tưới phân hữu cơ.', TRUE, NOW() - INTERVAL '2 days'),
(3, 2, 'Cảnh báo cảm biến độ ẩm thửa P-02', 'Độ ẩm đất thửa P-02 hiện tại là 52%. Kỹ sư Đặng Thị Thu Thảo đang xử lý.', FALSE, NOW() - INTERVAL '4 hours'),
(4, 7, 'Nhiệm vụ mới được giao', 'Bạn có nhiệm vụ tưới nước bổ sung cho thửa P-01 vào sáng mai.', FALSE, NOW() - INTERVAL '6 hours'),
(5, 4, 'Yêu cầu hủy hợp đồng được phê duyệt', 'Yêu cầu hủy hợp đồng FML-2026-003 đã được duyệt theo chính sách hoàn tiền Farmely.', TRUE, NOW() - INTERVAL '1 day')
ON CONFLICT (notification_id) DO NOTHING;

-- Bảng audit_logs (Nhật ký kiểm toán bảo mật & vận hành)
INSERT INTO audit_logs (log_id, user_id, action, entity_name, entity_id, details, ip_address, created_at) VALUES
(1, 1, 'AUTH_LOGIN', 'users', '1', '{"method": "PASSWORD", "platform": "WEB"}'::jsonb, '113.161.45.12'::inet, NOW() - INTERVAL '2 hours'),
(2, 1, 'CONTRACT_CONFIRM', 'contracts', '1', '{"contract_number": "FML-2026-001", "amount": 4200000}'::jsonb, '113.161.45.12'::inet, NOW() - INTERVAL '12 days'),
(3, 7, 'TASK_FINISH', 'care_tasks', '1', '{"step_name": "Làm đất & bón lót", "plot": "P-01"}'::jsonb, '14.241.12.88'::inet, NOW() - INTERVAL '10 days'),
(4, 4, 'CANCEL_REQUEST', 'contracts', '3', '{"reason": "Đi công tác nước ngoài"}'::jsonb, '115.79.20.105'::inet, NOW() - INTERVAL '3 days')
ON CONFLICT (log_id) DO NOTHING;

-- ĐỒNG BỘ SEQUENCE TRÁNH XUNG ĐỘT
SELECT setval(pg_get_serial_sequence('roles', 'role_id'), (SELECT COALESCE(MAX(role_id), 1) FROM roles));
SELECT setval(pg_get_serial_sequence('users', 'user_id'), (SELECT COALESCE(MAX(user_id), 1) FROM users));
SELECT setval(pg_get_serial_sequence('lands', 'land_id'), (SELECT COALESCE(MAX(land_id), 1) FROM lands));
SELECT setval(pg_get_serial_sequence('plots', 'plot_id'), (SELECT COALESCE(MAX(plot_id), 1) FROM plots));
SELECT setval(pg_get_serial_sequence('crops', 'crop_id'), (SELECT COALESCE(MAX(crop_id), 1) FROM crops));
SELECT setval(pg_get_serial_sequence('varieties', 'variety_id'), (SELECT COALESCE(MAX(variety_id), 1) FROM varieties));
SELECT setval(pg_get_serial_sequence('services', 'service_id'), (SELECT COALESCE(MAX(service_id), 1) FROM services));
SELECT setval(pg_get_serial_sequence('process_templates', 'template_id'), (SELECT COALESCE(MAX(template_id), 1) FROM process_templates));
SELECT setval(pg_get_serial_sequence('template_steps', 'step_id'), (SELECT COALESCE(MAX(step_id), 1) FROM template_steps));
SELECT setval(pg_get_serial_sequence('contracts', 'contract_id'), (SELECT COALESCE(MAX(contract_id), 1) FROM contracts));
SELECT setval(pg_get_serial_sequence('rentals', 'rental_id'), (SELECT COALESCE(MAX(rental_id), 1) FROM rentals));
SELECT setval(pg_get_serial_sequence('payment_transactions', 'transaction_id'), (SELECT COALESCE(MAX(transaction_id), 1) FROM payment_transactions));
SELECT setval(pg_get_serial_sequence('care_tasks', 'task_id'), (SELECT COALESCE(MAX(task_id), 1) FROM care_tasks));
SELECT setval(pg_get_serial_sequence('farm_diaries', 'diary_id'), (SELECT COALESCE(MAX(diary_id), 1) FROM farm_diaries));
SELECT setval(pg_get_serial_sequence('conversations', 'conversation_id'), (SELECT COALESCE(MAX(conversation_id), 1) FROM conversations));
SELECT setval(pg_get_serial_sequence('knowledge_documents', 'document_id'), (SELECT COALESCE(MAX(document_id), 1) FROM knowledge_documents));
SELECT setval(pg_get_serial_sequence('site_visits', 'visit_id'), (SELECT COALESCE(MAX(visit_id), 1) FROM site_visits));
SELECT setval(pg_get_serial_sequence('contract_cancellations', 'cancellation_id'), (SELECT COALESCE(MAX(cancellation_id), 1) FROM contract_cancellations));
SELECT setval(pg_get_serial_sequence('service_requests', 'request_id'), (SELECT COALESCE(MAX(request_id), 1) FROM service_requests));
SELECT setval(pg_get_serial_sequence('harvest_results', 'harvest_id'), (SELECT COALESCE(MAX(harvest_id), 1) FROM harvest_results));
SELECT setval(pg_get_serial_sequence('issue_reports', 'issue_id'), (SELECT COALESCE(MAX(issue_id), 1) FROM issue_reports));
SELECT setval(pg_get_serial_sequence('notifications', 'notification_id'), (SELECT COALESCE(MAX(notification_id), 1) FROM notifications));
SELECT setval(pg_get_serial_sequence('audit_logs', 'log_id'), (SELECT COALESCE(MAX(log_id), 1) FROM audit_logs));

-- ==============================================================================
-- HOÀN TẤT THIẾT LẬP CƠ SỞ DỮ LIỆU FARMELY!
-- ==============================================================================
