package com.smartagrirent.communication.repository;

import com.smartagrirent.communication.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByConversation_ConversationIdOrderByCreatedAtAsc(Integer conversationId);

    Optional<Message> findTopByConversation_ConversationIdOrderByCreatedAtDesc(Integer conversationId);

    long countByConversation_ConversationId(Integer conversationId);
}
