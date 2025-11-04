package com.campustrack.lostandfound.websocket;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.Comparator;
import java.util.ArrayList;

@Service
public class ChatService {

    private final ChatRecordRepository repository;
    private final UserBlockRepository blockRepository;

    public ChatService(ChatRecordRepository repository, UserBlockRepository blockRepository) {
        this.repository = repository;
        this.blockRepository = blockRepository;
    }

    public ChatRecord save(String from, String to, String text) {
        ChatRecord r = new ChatRecord(from, to, text, LocalDateTime.now());
        r.setDelivered(false);
        return repository.save(r);
    }

    public List<ChatRecord> conversationBetween(String a, String b) {
        return repository.findConversation(a.toLowerCase(), b.toLowerCase());
    }

    public List<ChatRecord> undeliveredFor(String to) {
        return repository.findByToEmailAndDeliveredFalseOrderByCreatedAt(to.toLowerCase());
    }

    public void markDelivered(ChatRecord r) {
        r.setDelivered(true);
        repository.save(r);
    }

    public void markDeliveredById(Long id) {
        if (id == null) return;
        repository.findById(id).ifPresent(r -> {
            r.setDelivered(true);
            repository.save(r);
        });
    }

    // Build a conversation summary list for the given user. We query recent records and aggregate per partner.
    public List<ChatConversation> listConversations(String me) {
        String lme = me.toLowerCase();
        List<ChatRecord> all = repository.findAll();
        // keep only records where me is either from or to
    List<ChatRecord> involved = all.stream().filter(r -> lme.equals(r.getFromEmail()) || lme.equals(r.getToEmail())).toList();

        // Map partner -> latest record (by createdAt)
        Map<String, ChatRecord> latest = new LinkedHashMap<>();
        involved.stream()
                .sorted(Comparator.comparing(ChatRecord::getCreatedAt).reversed())
                .forEach(r -> {
                    String partner = lme.equals(r.getFromEmail()) ? r.getToEmail() : r.getFromEmail();
                    partner = partner.toLowerCase();
                    if (!latest.containsKey(partner)) latest.put(partner, r);
                });

        // build unread counts per partner
        Map<String, Long> unread = new LinkedHashMap<>();
        involved.stream()
                .filter(r -> !r.isDelivered() && lme.equals(r.getToEmail()))
                .forEach(r -> unread.put(r.getFromEmail(), unread.getOrDefault(r.getFromEmail(), 0L) + 1));

        List<ChatConversation> out = new ArrayList<>();
        for (Map.Entry<String, ChatRecord> e : latest.entrySet()) {
            String partner = e.getKey();
            ChatRecord r = e.getValue();
            long ucount = unread.getOrDefault(partner, 0L);
            // lastOutgoingUndelivered is true when the most recent message was FROM me and it's not delivered
            boolean lastOutgoingUndelivered = lme.equals(r.getFromEmail()) && !r.isDelivered();
            out.add(new ChatConversation(partner, r.getText(), r.getCreatedAt(), ucount, lastOutgoingUndelivered));
        }
        return out;
    }

    // mark all undelivered messages TO me from partner as delivered
    public void markDeliveredForConversation(String me, String partner) {
        if (me == null || partner == null) return;
        List<ChatRecord> undelivered = repository.findByToEmailAndDeliveredFalseOrderByCreatedAt(me.toLowerCase());
        undelivered.stream().filter(r -> partner.toLowerCase().equals(r.getFromEmail())).forEach(r -> {
            r.setDelivered(true);
            repository.save(r);
        });
    }

    // Persist a block and remove all chat records between the two users
    public UserBlock blockUser(String blocker, String blocked, String reason) {
        if (blocker == null || blocked == null) return null;
        String bLower = blocker.toLowerCase();
        String dLower = blocked.toLowerCase();
        UserBlock ub = new UserBlock(bLower, dLower, reason);
        UserBlock saved = blockRepository.save(ub);
        // delete conversation records both directions
        List<ChatRecord> conv = repository.findConversation(bLower, dLower);
        if (conv != null && !conv.isEmpty()) repository.deleteAll(conv);
        return saved;
    }

    public boolean isBlockedBetween(String a, String b) {
        if (a == null || b == null) return false;
        String la = a.toLowerCase();
        String lb = b.toLowerCase();
        // check either direction (blocker -> blocked or reverse)
        return blockRepository.existsByBlockerEmailAndBlockedEmail(la, lb) || blockRepository.existsByBlockerEmailAndBlockedEmail(lb, la);
    }
}
