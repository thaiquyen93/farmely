package com.farmely.rental.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DemoTimeService {
    private final JdbcTemplate jdbcTemplate;

    public Map<String, Object> get(Integer rentalId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("""
            SELECT season_key AS "seasonKey", current_day AS "currentDay",
                   total_days AS "totalDays", updated_at AS "updatedAt"
            FROM demo_cultivation_state WHERE rental_id = ? AND is_active
            ORDER BY updated_at DESC LIMIT 1
            """, rentalId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    @Transactional
    public Map<String, Object> simulate(Integer rentalId, Map<String, Object> payload) {
        List<Map<String, Object>> rentals = jdbcTemplate.queryForList("""
            SELECT r.start_date, COALESCE(v.expected_duration, 45) AS total_days
            FROM rentals r LEFT JOIN varieties v ON v.variety_id = r.variety_id
            WHERE r.rental_id = ? FOR UPDATE OF r
            """, rentalId);
        if (rentals.isEmpty()) throw new IllegalArgumentException("Không tìm thấy lượt thuê");
        Map<String, Object> rental = rentals.get(0);
        int totalDays = ((Number) rental.get("total_days")).intValue();
        Map<String, Object> prior = get(rentalId);
        String seasonKey = String.valueOf(payload.getOrDefault("seasonKey", prior == null ? "rental-" + rentalId : prior.get("seasonKey")));
        if (!seasonKey.matches("[a-zA-Z0-9:_-]{1,100}")) throw new IllegalArgumentException("Mã vụ không hợp lệ");
        String action = String.valueOf(payload.getOrDefault("action", "START_NOW")).toUpperCase();
        int day = switch (action) {
            case "HARVEST" -> totalDays;
            case "START_NOW", "RESET" -> 1;
            case "SET_DAY" -> Integer.parseInt(String.valueOf(payload.get("day")));
            case "ADD_DAYS" -> Math.min(totalDays, (prior == null ? 1 : ((Number) prior.get("currentDay")).intValue())
                    + Integer.parseInt(String.valueOf(payload.get("days"))));
            default -> throw new IllegalArgumentException("Hành động tua ngày không hợp lệ");
        };
        if (day < 1 || day > totalDays) throw new IllegalArgumentException("Ngày demo không hợp lệ");
        jdbcTemplate.update("UPDATE demo_cultivation_state SET is_active = false WHERE rental_id = ?", rentalId);
        jdbcTemplate.update("""
            INSERT INTO demo_cultivation_state(rental_id, season_key, current_day, total_days, is_active)
            VALUES (?, ?, ?, ?, true)
            ON CONFLICT (rental_id, season_key) DO UPDATE
            SET current_day = EXCLUDED.current_day, total_days = EXCLUDED.total_days,
                is_active = true, updated_at = now()
            """, rentalId, seasonKey, day, totalDays);
        jdbcTemplate.update("""
            UPDATE care_tasks ct SET demo_completed = (
              ct.status <> 'DONE'::task_status_enum
              AND COALESCE((SELECT ts.task_type FROM template_steps ts WHERE ts.step_id = ct.step_id), '') <> 'HARVEST'
              AND (ct.step_id IS NOT NULL OR COALESCE(ct.title, '') NOT ILIKE '%thu hoạch%')
              AND COALESCE((SELECT ts.day_offset + 1 FROM template_steps ts WHERE ts.step_id = ct.step_id),
                  (ct.due_date - ?::date) + 1, 1) < ?
            ) WHERE ct.rental_id = ?
            """, rental.get("start_date"), day, rentalId);
        return Map.of("rentalId", rentalId, "seasonKey", seasonKey, "currentDay", day, "totalDays", totalDays);
    }
}
