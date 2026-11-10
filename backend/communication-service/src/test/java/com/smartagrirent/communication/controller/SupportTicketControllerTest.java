package com.smartagrirent.communication.controller;

import com.smartagrirent.communication.entity.SupportTicket;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.persistence.EntityManager;
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
        assertEquals("IN_PROGRESS", controller.status(token(11, "ADMIN"), 4L, new SupportTicketController.StatusRequest("IN_PROGRESS")).status);
        verify(em).persist(argThat(value -> value instanceof com.smartagrirent.communication.entity.SupportEvent));
    }
    @Test void adminReplyRecordsReplyAndBothStatusSteps() {
        EntityManager em = mock(EntityManager.class);
        SupportTicket t = new SupportTicket(); t.id = 7L; t.customerId = 1;
        when(em.find(SupportTicket.class, 7L)).thenReturn(t);
        SupportTicketController controller = new SupportTicketController(em, mock(JdbcTemplate.class), SECRET);
        controller.reply(token(11, "ADMIN"), 7L, new SupportTicketController.ReplyRequest("Đã kiểm tra"));
        assertEquals("RESPONDED", t.status);
        verify(em, times(3)).persist(argThat(value -> value instanceof com.smartagrirent.communication.entity.SupportEvent));
        assertThrows(RuntimeException.class, () -> controller.reply("Bearer invalid", 7L, new SupportTicketController.ReplyRequest("X")));
    }
    @Test void customerReplyReopensRespondedTicketAndRecordsHistory() {
        EntityManager em = mock(EntityManager.class);
        SupportTicket t = new SupportTicket(); t.id = 9L; t.customerId = 1; t.status = "RESPONDED";
        when(em.find(SupportTicket.class, 9L)).thenReturn(t);
        SupportTicketController controller = new SupportTicketController(em, mock(JdbcTemplate.class), SECRET);
        controller.reply(token(1, "CUSTOMER"), 9L, new SupportTicketController.ReplyRequest("Xin kiểm tra thêm"));
        assertEquals("IN_PROGRESS", t.status);
        verify(em, times(2)).persist(argThat(value -> value instanceof com.smartagrirent.communication.entity.SupportEvent));
    }
}
