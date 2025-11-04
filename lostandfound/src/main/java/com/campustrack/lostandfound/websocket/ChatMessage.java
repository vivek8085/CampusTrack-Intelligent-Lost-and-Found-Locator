package com.campustrack.lostandfound.websocket;

public class ChatMessage {
    private String from;
    private String to;
    private String text;
    private Long id;
    private String createdAt;
    private String type; // message | typing | read
    private boolean delivered;

    public ChatMessage() {}

    public ChatMessage(String from, String to, String text) {
        this.from = from;
        this.to = to;
        this.text = text;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public boolean isDelivered() { return delivered; }
    public void setDelivered(boolean delivered) { this.delivered = delivered; }

    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }

    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
}
