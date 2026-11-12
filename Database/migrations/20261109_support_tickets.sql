-- CSKH: additive tables; existing business data is unchanged.
CREATE TABLE IF NOT EXISTS support_tickets (
    id BIGSERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    category VARCHAR(40) NOT NULL CHECK (category IN ('ACCOUNT','RENTAL','CULTIVATION','SERVICE','FEEDBACK')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','IN_PROGRESS','RESPONDED','CLOSED')),
    plot_id INTEGER,
    contract_id INTEGER,
    payment_id INTEGER,
    assignee_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer ON support_tickets(customer_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_filters ON support_tickets(category, status, updated_at DESC);
CREATE TABLE IF NOT EXISTS support_events (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    actor_id INTEGER NOT NULL,
    actor_role VARCHAR(20) NOT NULL,
    type VARCHAR(20) NOT NULL,
    body TEXT,
    from_status VARCHAR(30),
    to_status VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_events_ticket ON support_events(ticket_id, created_at);
CREATE TABLE IF NOT EXISTS support_attachments (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    uploader_id INTEGER NOT NULL,
    file_name VARCHAR(150) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hibernate ddl-auto may have created these tables before this migration ran.
-- Ensure existing installations receive the same cascade constraints.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_support_events_ticket') THEN
        ALTER TABLE support_events ADD CONSTRAINT fk_support_events_ticket
            FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_support_attachments_ticket') THEN
        ALTER TABLE support_attachments ADD CONSTRAINT fk_support_attachments_ticket
            FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE;
    END IF;
END $$;
