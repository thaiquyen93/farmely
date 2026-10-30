-- Run once on an existing database to enable the same three-role demo as the seed.
-- P-01 belongs to customer@farmely.vn; expert@farmely.vn and worker@farmely.vn
-- are the quick-login expert and staff accounts. Re-running is safe and does
-- not replace a later assignment made by admin.
UPDATE rentals
SET expert_id = 5, staff_id = 8, updated_at = NOW()
WHERE rental_id = 1 AND contract_id = 1 AND plot_id = 1
  AND status = 'ACTIVE' AND expert_id IS NULL AND staff_id IS NULL;
