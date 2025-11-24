package com.campustrack.lostandfound.repository;

import com.campustrack.lostandfound.model.FoundItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FoundItemRepository extends JpaRepository<FoundItem, Long> {
    List<FoundItem> findByReporterEmail(String email);
}
