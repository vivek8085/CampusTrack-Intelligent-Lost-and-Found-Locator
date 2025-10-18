package com.campustrack.lostandfound.repository;

import com.campustrack.lostandfound.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByEmail(String email);
}
