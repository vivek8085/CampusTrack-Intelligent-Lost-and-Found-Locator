package com.campustrack.lostandfound.service;

import com.campustrack.lostandfound.model.FoundItem;
import com.campustrack.lostandfound.model.LostItem;
import com.campustrack.lostandfound.model.Notification;
import com.campustrack.lostandfound.repository.NotificationRepository;
import com.campustrack.lostandfound.repository.FoundItemRepository;
import com.campustrack.lostandfound.repository.LostItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private LostItemRepository lostItemRepository;

    @Autowired
    private FoundItemRepository foundItemRepository;

    public Notification createConfirmationNotification(Long foundItemId, Long lostItemId) {
        Optional<FoundItem> foundOpt = foundItemRepository.findById(foundItemId);
    Optional<LostItem> lostOpt = lostItemRepository.findById(lostItemId);

        String message = "A match has been confirmed.";
        String reporterEmail = null;
    String reporterName = null;
        if (foundOpt.isPresent()) {
            FoundItem f = foundOpt.get();
            reporterEmail = f.getReporterEmail();
        // derive a friendly name from the reporter email if we don't have an explicit name
        if (reporterEmail != null && !reporterEmail.isBlank()) {
        // try to use the local-part as a simple display name
        String local = reporterEmail.split("@")[0];
        // replace dots/underscores with spaces and capitalize
        reporterName = java.util.Arrays.stream(local.split("[._-]+"))
            .filter(s -> s != null && !s.isBlank())
            .map(s -> s.substring(0, 1).toUpperCase() + (s.length() > 1 ? s.substring(1) : ""))
            .reduce((a, b) -> a + " " + b).orElse(local);
        }

        message = String.format("Your lost item '%s' was found by %s.",
            f.getItemName() != null ? f.getItemName() : "an item",
            reporterName != null ? reporterName : (reporterEmail != null ? reporterEmail : "someone"));
        }

        Notification n = new Notification();
        n.setFoundItemId(foundItemId);
        n.setLostItemId(lostItemId);
        n.setFoundReporterEmail(reporterEmail);
    n.setFoundReporterName(reporterName);
        // set lost reporter email (recipient) if available
        if (lostOpt.isPresent()) {
            LostItem l = lostOpt.get();
            if (l.getReporterEmail() != null && !l.getReporterEmail().isBlank()) {
                n.setLostReporterEmail(l.getReporterEmail().trim());
            }
        }
        n.setMessage(message);
        n.setCreatedAt(LocalDateTime.now());
        n.setDelivered(false);

        return notificationRepository.save(n);
    }
}
