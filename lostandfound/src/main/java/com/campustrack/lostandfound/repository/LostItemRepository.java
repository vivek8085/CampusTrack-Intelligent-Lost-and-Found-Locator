package com.campustrack.lostandfound.repository;

import com.campustrack.lostandfound.model.LostItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LostItemRepository extends JpaRepository<LostItem, Long> {}
