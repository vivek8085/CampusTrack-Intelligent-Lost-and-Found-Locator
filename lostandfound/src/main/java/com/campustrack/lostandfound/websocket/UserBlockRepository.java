package com.campustrack.lostandfound.websocket;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {
    boolean existsByBlockerEmailAndBlockedEmail(String blockerEmail, String blockedEmail);
}
