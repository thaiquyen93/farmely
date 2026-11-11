package com.smartagrirent.communication.controller;

import com.smartagrirent.communication.entity.SupportTicket;
import com.smartagrirent.communication.entity.SupportEvent;
import com.smartagrirent.communication.entity.SupportAttachment;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import jakarta.persistence.TypedQuery;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.Date;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SupportTicketControllerTest {
    private static final String SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private String token(int id, String role) {
        return "Bearer " + Jwts.builder().subject("test@farmely.vn").claim("userId", id).claim("role", role)
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(SECRET))).compact();
    }
    @Test void customerCannotReadAnotherCustomerTicket() {
        EntityManager em = mock(EntityManager.class);
        SupportTicket t = new SupportTicket(); t.id = 4L; t.customerId = 2;
        when(em.find(SupportTicket.class, 4L)).thenReturn(t);
        SupportTicketController controller = new SupportTicketController(em, mock(JdbcTemplate.class), SECRET);
        assertThrows(RuntimeException.class, () -> controller.detail(token(1, "CUSTOMER"), 4L));
    }
    @Test void statusRequiresAdminAndSequentialTransition() {
        EntityManager em = mock(EntityManager.class);
        SupportTicket t = new SupportTicket(); t.id = 4L; t.customerId = 1;
        when(em.find(SupportTicket.class, 4L)).thenReturn(t);
        SupportTicketController controller = new SupportTicketController(em, mock(JdbcTemplate.class), SECRET);
        assertThrows(RuntimeException.class, () -> controller.status(token(1, "CUSTOMER"), 4L, new SupportTicketController.StatusRequest("IN_PROGRESS")));
        assertThrows(RuntimeException.class, () -> controller.status(token(11, "ADMIN"), 4L, new SupportTicketController.StatusRequest("CLOSED")));
        assertEquals("NEW", t.status);
        assertEquals("RESPONDED", controller.status(token(11, "ADMIN"), 4L, new SupportTicketController.StatusRequest("RESPONDED")).status());
        verify(em).persist(argThat(value -> value instanceof com.smartagrirent.communication.entity.SupportEvent));
    }
    @Test void adminReplyRecordsReplyAndStatusStep() {
        EntityManager em = mock(EntityManager.class);
        SupportTicket t = new SupportTicket(); t.id = 7L; t.customerId = 1;
        when(em.find(SupportTicket.class, 7L)).thenReturn(t);
        SupportTicketController controller = new SupportTicketController(em, mock(JdbcTemplate.class), SECRET);
        controller.reply(token(11, "ADMIN"), 7L, new SupportTicketController.ReplyRequest("Đã kiểm tra"));
        assertEquals("RESPONDED", t.status);
        verify(em, times(2)).persist(argThat(value -> value instanceof com.smartagrirent.communication.entity.SupportEvent));
        assertThrows(RuntimeException.class, () -> controller.reply("Bearer invalid", 7L, new SupportTicketController.ReplyRequest("X")));
    }
    @Test void customerReplyReopensRespondedTicketAndRecordsHistory() {
        EntityManager em = mock(EntityManager.class);
        SupportTicket t = new SupportTicket(); t.id = 9L; t.customerId = 1; t.status = "RESPONDED";
        when(em.find(SupportTicket.class, 9L)).thenReturn(t);
        SupportTicketController controller = new SupportTicketController(em, mock(JdbcTemplate.class), SECRET);
        controller.reply(token(1, "CUSTOMER"), 9L, new SupportTicketController.ReplyRequest("Xin kiểm tra thêm"));
        assertEquals("NEW", t.status);
        verify(em, times(2)).persist(argThat(value -> value instanceof com.smartagrirent.communication.entity.SupportEvent));
    }
    @Test void legacyInProgressTicketCanMoveToResponded() {
        EntityManager em = mock(EntityManager.class);
        SupportTicket t = new SupportTicket(); t.id = 10L; t.customerId = 1; t.status = "IN_PROGRESS";
        when(em.find(SupportTicket.class, 10L)).thenReturn(t);
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.queryForList(anyString(), any(Object[].class))).thenReturn(java.util.List.of());
        SupportTicketController controller = new SupportTicketController(em, jdbc, SECRET);
        assertEquals("RESPONDED", controller.status(token(11, "ADMIN"), 10L, new SupportTicketController.StatusRequest("RESPONDED")).status());
        assertEquals("RESPONDED", t.status);
    }
    @Test void createGeneratesTitleFromCategoryWithoutRelatedFields() {
        EntityManager em = mock(EntityManager.class);
        SupportTicketController controller = new SupportTicketController(em, mock(JdbcTemplate.class), SECRET);
        SupportTicket created = controller.create(token(1, "CUSTOMER"),
                new SupportTicketController.CreateRequest("RENTAL", null, "Cần kiểm tra thanh toán", null, null, null));
        assertEquals("Hỗ trợ về thuê đất, hợp đồng & thanh toán", created.title);
        assertEquals("NEW", created.status);
        verify(em, times(2)).persist(any());
    }
    @Test void listMapsLegacyStatusAndSortsNewestFirst() {
        EntityManager em = mock(EntityManager.class);
        Query query = mock(Query.class);
        SupportTicket old = new SupportTicket(); old.id = 12L; old.customerId = 1; old.status = "IN_PROGRESS";
        when(em.createNativeQuery(anyString(), eq(SupportTicket.class))).thenReturn(query);
        when(query.getResultList()).thenReturn(java.util.List.of(old));
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.queryForList(anyString(), any(Object[].class))).thenReturn(java.util.List.of());
        SupportTicketController controller = new SupportTicketController(em, jdbc, SECRET);
        var result = controller.list(token(11, "ADMIN"), null, null, "NEW");
        assertEquals("NEW", result.get(0).status());
        verify(em).createNativeQuery(argThat(sql -> sql.contains("t.status in ('NEW','IN_PROGRESS')")
                && sql.contains("order by t.created_at desc, t.id desc")), eq(SupportTicket.class));
    }
    @Test void listUsesUserIdToResolveDemoAndRegisteredCustomerNames() {
        EntityManager em = mock(EntityManager.class);
        Query query = mock(Query.class);
        SupportTicket demo = new SupportTicket(); demo.id = 4L; demo.customerId = 1;
        SupportTicket registered = new SupportTicket(); registered.id = 50L; registered.customerId = 42;
        when(em.createNativeQuery(anyString(), eq(SupportTicket.class))).thenReturn(query);
        when(query.getResultList()).thenReturn(java.util.List.of(registered, demo));
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.queryForList(anyString(), any(Object[].class))).thenReturn(java.util.List.of(
                java.util.Map.of("id", 1, "name", "Lô Thái Quyền", "email", "customer@farmely.vn"),
                java.util.Map.of("id", 42, "name", "Khách đăng ký", "email", "registered@example.vn")));
        var result = new SupportTicketController(em, jdbc, SECRET).list(token(11, "ADMIN"), null, null, null);
        assertEquals("Khách đăng ký", result.get(0).customerName());
        assertEquals(42, result.get(0).customerId());
        assertEquals("Lô Thái Quyền", result.get(1).customerName());
        assertEquals(1, result.get(1).customerId());
    }
    @Test void detailReturnsNameFromTicketOwnerWithoutReassigningTicket() {
        EntityManager em = mock(EntityManager.class);
        SupportTicket ticket = new SupportTicket(); ticket.id = 50L; ticket.customerId = 42;
        when(em.find(SupportTicket.class, 50L)).thenReturn(ticket);
        TypedQuery<SupportEvent> events = mock(TypedQuery.class);
        TypedQuery<SupportAttachment> attachments = mock(TypedQuery.class);
        when(em.createQuery(anyString(), eq(SupportEvent.class))).thenReturn(events);
        when(em.createQuery(anyString(), eq(SupportAttachment.class))).thenReturn(attachments);
        when(events.setParameter(eq("id"), eq(50L))).thenReturn(events);
        when(attachments.setParameter(eq("id"), eq(50L))).thenReturn(attachments);
        when(events.getResultList()).thenReturn(java.util.List.of());
        when(attachments.getResultList()).thenReturn(java.util.List.of());
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.queryForList(anyString(), any(Object[].class))).thenReturn(java.util.List.of(
                java.util.Map.of("id", 42, "name", "Khách đăng ký", "email", "registered@example.vn")));
        var detail = new SupportTicketController(em, jdbc, SECRET).detail(token(42, "CUSTOMER"), 50L);
        var result = (SupportTicketController.TicketView) detail.get("ticket");
        assertEquals("Khách đăng ký", result.customerName());
        assertEquals("registered@example.vn", result.customerEmail());
        assertEquals(42, result.customerId());
        assertEquals(42, ticket.customerId);
    }
}
