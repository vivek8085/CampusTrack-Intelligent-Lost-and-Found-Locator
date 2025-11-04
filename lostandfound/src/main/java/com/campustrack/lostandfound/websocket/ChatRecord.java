package com.campustrack.lostandfound.websocket;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_records")
public class ChatRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fromEmail;

    @Column(nullable = false)
    private String toEmail;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private boolean delivered = false;

    public ChatRecord() {}

    public ChatRecord(String fromEmail, String toEmail, String text, LocalDateTime createdAt) {
        this.fromEmail = fromEmail;
        this.toEmail = toEmail;
        this.text = text;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFromEmail() { return fromEmail; }
    public void setFromEmail(String fromEmail) { this.fromEmail = fromEmail; }

    public String getToEmail() { return toEmail; }
    public void setToEmail(String toEmail) { this.toEmail = toEmail; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isDelivered() { return delivered; }
    public void setDelivered(boolean delivered) { this.delivered = delivered; }
}
