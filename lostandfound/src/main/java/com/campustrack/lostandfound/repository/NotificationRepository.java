package com.campustrack.lostandfound.repository;

import com.campustrack.lostandfound.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByLostItemIdOrderByCreatedAtDesc(Long lostItemId);
    List<Notification> findAllByOrderByCreatedAtDesc();
    List<Notification> findByLostReporterEmailOrderByCreatedAtDesc(String email);
}
