package com.campustrack.lostandfound.repository;

import com.campustrack.lostandfound.model.FoundItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FoundItemRepository extends JpaRepository<FoundItem, Long> {
}
