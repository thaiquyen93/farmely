package com.smartagrirent.communication.controller;

import com.smartagrirent.communication.entity.*;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/support-tickets")
public class SupportTicketController {
    private static final Set<String> CATEGORIES = Set.of("ACCOUNT", "RENTAL", "CULTIVATION", "SERVICE", "FEEDBACK");
    private static final List<String> STATUSES = List.of("NEW", "IN_PROGRESS", "RESPONDED", "CLOSED");
    private final EntityManager em;
    private final JdbcTemplate jdbc;
    private final String secret;

    public SupportTicketController(EntityManager em, JdbcTemplate jdbc, @Value("${jwt.secret}") String secret) {
        this.em = em; this.jdbc = jdbc; this.secret = secret;
    }

    private record Actor(int id, String role) {}
    private Actor actor(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) throw new AccessDenied();
        try {
            byte[] key;
            try { key = Decoders.BASE64.decode(secret); } catch (Exception ex) { key = secret.getBytes(StandardCharsets.UTF_8); }
            Claims claims = Jwts.parser().verifyWith(Keys.hmacShaKeyFor(key)).build()
                    .parseSignedClaims(authorization.substring(7)).getPayload();
            int id = ((Number) claims.get("userId")).intValue();
            String role = String.valueOf(claims.get("role")).toUpperCase(Locale.ROOT);
            if (!role.equals("CUSTOMER") && !role.equals("ADMIN")) throw new AccessDenied();
            return new Actor(id, role);
        } catch (Exception ex) { throw new AccessDenied(); }
    }
    private boolean admin(Actor a) { return a.role.equals("ADMIN"); }
    private SupportTicket ticket(Long id, Actor a) {
        SupportTicket t = em.find(SupportTicket.class, id);
        if (t == null) throw new Missing();
        if (!admin(a) && !t.customerId.equals(a.id)) throw new AccessDenied();
        return t;
    }
    private void requireAdmin(Actor a) { if (!admin(a)) throw new AccessDenied(); }
    private void event(SupportTicket t, Actor a, String type, String body, String from, String to) {
        SupportEvent e = new SupportEvent(); e.ticketId = t.id; e.actorId = a.id; e.actorRole = a.role;
        e.type = type; e.body = body; e.fromStatus = from; e.toStatus = to; em.persist(e);
        t.updatedAt = OffsetDateTime.now();
    }
    private Integer optionalId(Integer id) { return id != null && id > 0 ? id : null; }
    private void validateRelated(Actor a, Integer plotId, Integer contractId, Integer paymentId) {
        if (contractId != null && jdbc.queryForObject("select count(*) from contracts where contract_id=? and renter_id=?", Integer.class, contractId, a.id) == 0) throw new Bad("Hợp đồng không thuộc tài khoản này");
        if (plotId != null && jdbc.queryForObject("select count(*) from rentals r join contracts c on c.contract_id=r.contract_id where r.plot_id=? and c.renter_id=?" + (contractId == null ? "" : " and c.contract_id=" + contractId), Integer.class, plotId, a.id) == 0) throw new Bad("Thửa đất không thuộc tài khoản này");
        if (paymentId != null && jdbc.queryForObject("select count(*) from payment_transactions p join contracts c on c.contract_id=p.contract_id where p.transaction_id=? and c.renter_id=?" + (contractId == null ? "" : " and c.contract_id=" + contractId), Integer.class, paymentId, a.id) == 0) throw new Bad("Thanh toán không thuộc tài khoản này");
    }
    public record CreateRequest(String category, String title, String description, Integer plotId, Integer contractId, Integer paymentId) {}
    public record ReplyRequest(String body) {}
    public record StatusRequest(String status) {}
    public record AssignRequest(Integer assigneeId) {}

    @GetMapping("/related")
    public Map<String,Object> related(@RequestHeader(value="Authorization", required=false) String auth) {
        Actor a = actor(auth);
        if (admin(a)) return Map.of("assignees", jdbc.queryForList("select u.user_id as id, u.full_name as name from users u join roles r on r.role_id=u.role_id where r.role_name='ADMIN' order by u.full_name"));
        return Map.of(
            "contracts", jdbc.queryForList("select contract_id as id, contract_number as name from contracts where renter_id=? order by contract_id desc", a.id),
            "plots", jdbc.queryForList("select distinct r.plot_id as id, concat('Thửa #',r.plot_id) as name from rentals r join contracts c on c.contract_id=r.contract_id where c.renter_id=? order by id", a.id),
            "payments", jdbc.queryForList("select p.transaction_id as id, concat('Thanh toán #',p.transaction_id) as name from payment_transactions p join contracts c on c.contract_id=p.contract_id where c.renter_id=? order by id desc", a.id));
    }

    @GetMapping
    public List<SupportTicket> list(@RequestHeader(value="Authorization", required=false) String auth,
            @RequestParam(required=false) String q, @RequestParam(required=false) String category, @RequestParam(required=false) String status) {
        Actor a = actor(auth);
        return em.createQuery("select t from SupportTicket t where (:admin = true or t.customerId = :customer) and (:category is null or t.category = :category) and (:status is null or t.status = :status) and (:q is null or lower(t.title) like :q or lower(t.description) like :q) order by t.updatedAt desc", SupportTicket.class)
                .setParameter("admin", admin(a)).setParameter("customer", a.id).setParameter("category", category)
                .setParameter("status", status).setParameter("q", q == null || q.isBlank() ? null : "%" + q.toLowerCase(Locale.ROOT) + "%")
                .setMaxResults(200).getResultList();
    }
    @PostMapping
    @Transactional
    public SupportTicket create(@RequestHeader(value="Authorization", required=false) String auth, @RequestBody CreateRequest r) {
        Actor a = actor(auth); if (admin(a)) throw new AccessDenied();
        if (!CATEGORIES.contains(r.category()) || r.title() == null || r.title().isBlank() || r.title().length() > 200 || r.description() == null || r.description().isBlank()) throw new Bad("Chủ đề, tiêu đề và mô tả không hợp lệ");
        Integer plot = optionalId(r.plotId()), contract = optionalId(r.contractId()), payment = optionalId(r.paymentId());
        validateRelated(a, plot, contract, payment);
        SupportTicket t = new SupportTicket(); t.customerId = a.id; t.category = r.category(); t.title = r.title().trim(); t.description = r.description().trim(); t.plotId = plot; t.contractId = contract; t.paymentId = payment;
        em.persist(t); em.flush(); event(t, a, "CREATED", t.description, null, "NEW"); return t;
    }
    @GetMapping("/{id}")
    public Map<String,Object> detail(@RequestHeader(value="Authorization", required=false) String auth, @PathVariable Long id) {
        Actor a = actor(auth); SupportTicket t = ticket(id, a);
        List<SupportEvent> events = em.createQuery("select e from SupportEvent e where e.ticketId=:id order by e.createdAt, e.id", SupportEvent.class).setParameter("id", id).getResultList();
        List<SupportAttachment> files = em.createQuery("select f from SupportAttachment f where f.ticketId=:id", SupportAttachment.class).setParameter("id", id).getResultList();
        Map<String,Object> result = new HashMap<>();
        result.put("ticket", t); result.put("events", events);
        result.put("attachments", files.stream().map(f -> Map.of("id", f.id, "fileName", f.fileName, "contentType", f.contentType)).toList());
        if (t.contractId != null) result.put("contract", jdbc.queryForList("select contract_id as id, contract_number as name from contracts where contract_id=?", t.contractId));
        if (t.plotId != null) result.put("plot", jdbc.queryForList("select plot_id as id, plot_code as name from plots where plot_id=?", t.plotId));
        if (t.paymentId != null) result.put("payment", jdbc.queryForList("select transaction_id as id, status, amount from payment_transactions where transaction_id=?", t.paymentId));
        return result;
    }
    @PostMapping("/{id}/replies") @Transactional
    public void reply(@RequestHeader(value="Authorization", required=false) String auth, @PathVariable Long id, @RequestBody ReplyRequest r) {
        Actor a = actor(auth); SupportTicket t = ticket(id, a);
        if (t.status.equals("CLOSED")) throw new Bad("Yêu cầu đã đóng");
        if (r.body() == null || r.body().isBlank() || r.body().length() > 10000) throw new Bad("Nội dung phản hồi không hợp lệ");
        event(t, a, "REPLY", r.body().trim(), null, null);
        if (admin(a) && t.status.equals("NEW")) { t.status = "IN_PROGRESS"; event(t, a, "STATUS", null, "NEW", t.status); }
        if (admin(a) && !t.status.equals("RESPONDED")) { String old = t.status; t.status = "RESPONDED"; event(t, a, "STATUS", null, old, t.status); }
        if (!admin(a) && t.status.equals("RESPONDED")) { t.status = "IN_PROGRESS"; event(t, a, "STATUS", null, "RESPONDED", t.status); }
    }
    @PatchMapping("/{id}/status") @Transactional
    public SupportTicket status(@RequestHeader(value="Authorization", required=false) String auth, @PathVariable Long id, @RequestBody StatusRequest r) {
        Actor a = actor(auth); requireAdmin(a); SupportTicket t = ticket(id, a);
        int current = STATUSES.indexOf(t.status), next = STATUSES.indexOf(r.status());
        if (next < 0 || current < 0 || next != current + 1) throw new Bad("Chuyển trạng thái phải theo thứ tự Mới → Đang xử lý → Đã phản hồi → Đã đóng");
        String old = t.status; t.status = r.status(); event(t, a, "STATUS", null, old, t.status); return t;
    }
    @PatchMapping("/{id}/assignee") @Transactional
    public SupportTicket assign(@RequestHeader(value="Authorization", required=false) String auth, @PathVariable Long id, @RequestBody AssignRequest r) {
        Actor a = actor(auth); requireAdmin(a); SupportTicket t = ticket(id, a);
        if (r.assigneeId() != null && jdbc.queryForObject("select count(*) from users u join roles r on r.role_id=u.role_id where u.user_id=? and r.role_name='ADMIN'", Integer.class, r.assigneeId()) == 0) throw new Bad("Người xử lý phải là quản trị viên");
        t.assigneeId = r.assigneeId(); event(t, a, "ASSIGNED", r.assigneeId() == null ? "Bỏ phân công" : "Phân công quản trị viên #" + r.assigneeId(), null, null); return t;
    }
    @PostMapping(value="/{id}/attachments", consumes=MediaType.MULTIPART_FORM_DATA_VALUE) @Transactional
    public Map<String,Object> upload(@RequestHeader(value="Authorization", required=false) String auth, @PathVariable Long id, @RequestPart("file") MultipartFile file) throws Exception {
        Actor a = actor(auth); SupportTicket t = ticket(id, a); if (t.status.equals("CLOSED")) throw new Bad("Yêu cầu đã đóng");
        if (file.isEmpty() || file.getSize() > 5_000_000 || !Set.of("image/jpeg", "image/png", "image/webp").contains(file.getContentType())) throw new Bad("Ảnh phải là JPEG, PNG hoặc WebP và tối đa 5 MB");
        SupportAttachment f = new SupportAttachment(); f.ticketId = id; f.uploaderId = a.id; f.fileName = Optional.ofNullable(file.getOriginalFilename()).orElse("image").replaceAll("[^a-zA-Z0-9._-]", "_"); f.contentType = file.getContentType(); f.content = file.getBytes(); em.persist(f); em.flush();
        event(t, a, "ATTACHMENT", f.fileName, null, null); return Map.of("id", f.id);
    }
    @GetMapping("/{id}/attachments/{fileId}")
    public ResponseEntity<byte[]> image(@RequestHeader(value="Authorization", required=false) String auth, @PathVariable Long id, @PathVariable Long fileId) {
        ticket(id, actor(auth)); SupportAttachment f = em.find(SupportAttachment.class, fileId);
        if (f == null || !f.ticketId.equals(id)) throw new Missing();
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(f.contentType)).header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + f.fileName + "\"").body(f.content);
    }
    @ResponseStatus(HttpStatus.FORBIDDEN) private static class AccessDenied extends RuntimeException {}
    @ResponseStatus(HttpStatus.NOT_FOUND) private static class Missing extends RuntimeException {}
    @ResponseStatus(HttpStatus.BAD_REQUEST) private static class Bad extends RuntimeException { Bad(String message) { super(message); } }
    @ExceptionHandler(AccessDenied.class)
    public ResponseEntity<Map<String,String>> forbidden() { return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Không có quyền truy cập yêu cầu này")); }
    @ExceptionHandler(Missing.class)
    public ResponseEntity<Map<String,String>> notFound() { return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy yêu cầu")); }
    @ExceptionHandler(Bad.class)
    public ResponseEntity<Map<String,String>> badRequest(Bad ex) { return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage())); }
}
