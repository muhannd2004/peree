package com.doc.peree.repository;

import com.doc.peree.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByUserName(String userName);
    boolean existsByEmail(String email);

    Optional<User> getUserByUserName(String userName);
    Optional<User> getUserByEmail(String email);
}
