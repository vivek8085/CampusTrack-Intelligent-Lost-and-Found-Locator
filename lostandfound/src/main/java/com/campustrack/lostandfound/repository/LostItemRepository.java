package com.campustrack.lostandfound.repository;

import com.campustrack.lostandfound.model.LostItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LostItemRepository extends JpaRepository<LostItem, Long> {
	// find lost items reported by a given email (may be empty)
	List<LostItem> findByReporterEmail(String email);
}
