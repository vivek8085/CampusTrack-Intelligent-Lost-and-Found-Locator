package com.campustrack.lostandfound.websocket;

import java.time.LocalDateTime;

public class ChatConversation {
    private String partnerEmail;
    private String lastText;
    private LocalDateTime lastAt;
    private long unreadCount;
    // true when the most recent message in this conversation was sent by the current user
    // and has not yet been delivered to the partner
    private boolean lastOutgoingUndelivered;

    public ChatConversation() {}

    public ChatConversation(String partnerEmail, String lastText, LocalDateTime lastAt, long unreadCount) {
        this.partnerEmail = partnerEmail;
        this.lastText = lastText;
        this.lastAt = lastAt;
        this.unreadCount = unreadCount;
        this.lastOutgoingUndelivered = false;
    }

    public ChatConversation(String partnerEmail, String lastText, LocalDateTime lastAt, long unreadCount, boolean lastOutgoingUndelivered) {
        this.partnerEmail = partnerEmail;
        this.lastText = lastText;
        this.lastAt = lastAt;
        this.unreadCount = unreadCount;
        this.lastOutgoingUndelivered = lastOutgoingUndelivered;
    }

    public String getPartnerEmail() { return partnerEmail; }
    public void setPartnerEmail(String partnerEmail) { this.partnerEmail = partnerEmail; }

    public String getLastText() { return lastText; }
    public void setLastText(String lastText) { this.lastText = lastText; }

    public LocalDateTime getLastAt() { return lastAt; }
    public void setLastAt(LocalDateTime lastAt) { this.lastAt = lastAt; }

    public long getUnreadCount() { return unreadCount; }
    public void setUnreadCount(long unreadCount) { this.unreadCount = unreadCount; }

    public boolean isLastOutgoingUndelivered() { return lastOutgoingUndelivered; }
    public void setLastOutgoingUndelivered(boolean lastOutgoingUndelivered) { this.lastOutgoingUndelivered = lastOutgoingUndelivered; }
}
