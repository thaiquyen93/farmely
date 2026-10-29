CREATE TABLE IF NOT EXISTS harvest_requests (
    request_id SERIAL PRIMARY KEY,
    rental_id INT NOT NULL REFERENCES rentals(rental_id),
    customer_id INT NOT NULL REFERENCES users(user_id),
    staff_id INT NOT NULL REFERENCES users(user_id),
    requested_date DATE NOT NULL,
    method VARCHAR(40) NOT NULL,
    delivery_address TEXT,
    phone VARCHAR(30),
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'POSTPONED', 'COMPLETED', 'CANCELLED')),
    harvest_id INT REFERENCES harvest_results(harvest_id),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (rental_id)
);
CREATE INDEX IF NOT EXISTS idx_harvest_requests_customer ON harvest_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_harvest_requests_staff_status ON harvest_requests(staff_id, status);
