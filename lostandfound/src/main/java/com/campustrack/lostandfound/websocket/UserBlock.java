package com.campustrack.lostandfound.websocket;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_blocks")
public class UserBlock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String blockerEmail;
    private String blockedEmail;
    private String reason;
    private LocalDateTime createdAt;

    public UserBlock() {}

    public UserBlock(String blockerEmail, String blockedEmail, String reason) {
        this.blockerEmail = blockerEmail;
        this.blockedEmail = blockedEmail;
        this.reason = reason;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getBlockerEmail() { return blockerEmail; }
    public void setBlockerEmail(String blockerEmail) { this.blockerEmail = blockerEmail; }
    public String getBlockedEmail() { return blockedEmail; }
    public void setBlockedEmail(String blockedEmail) { this.blockedEmail = blockedEmail; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
