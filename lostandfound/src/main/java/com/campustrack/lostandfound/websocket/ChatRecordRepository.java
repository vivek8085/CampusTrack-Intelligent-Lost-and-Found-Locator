package com.campustrack.lostandfound.websocket;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatRecordRepository extends JpaRepository<ChatRecord, Long> {
    @Query("select c from ChatRecord c where (c.fromEmail = :a and c.toEmail = :b) or (c.fromEmail = :b and c.toEmail = :a) order by c.createdAt")
    List<ChatRecord> findConversation(@Param("a") String a, @Param("b") String b);

    List<ChatRecord> findByToEmailAndDeliveredFalseOrderByCreatedAt(String toEmail);
}
