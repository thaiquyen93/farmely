package com.smartagrirent.communication.repository;

import com.smartagrirent.communication.constant.ConversationType;
import com.smartagrirent.communication.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Integer> {

    @Query("SELECT c FROM Conversation c WHERE c.participantOne = :userId OR c.participantTwo = :userId ORDER BY c.createdAt DESC")
    List<Conversation> findAllByUserId(@Param("userId") Integer userId);

    List<Conversation> findByRentalId(Integer rentalId);

    @Query("SELECT c FROM Conversation c WHERE " +
           "(c.participantOne = :p1 AND c.participantTwo = :p2 AND c.type = :type) OR " +
           "(c.participantOne = :p2 AND c.participantTwo = :p1 AND c.type = :type)")
    Optional<Conversation> findDirectConversation(
            @Param("p1") Integer p1,
            @Param("p2") Integer p2,
            @Param("type") ConversationType type
    );

    Optional<Conversation> findByParticipantOneAndType(Integer participantOne, ConversationType type);
}
