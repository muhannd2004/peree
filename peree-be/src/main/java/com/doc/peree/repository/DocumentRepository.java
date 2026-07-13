package com.doc.peree.repository;

import com.doc.peree.model.Document;
import com.doc.peree.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByUserOrderByUpdatedAtDesc(User user);
    Optional<Document> findByUserUserNameAndSlug(String userName, String slug);
    boolean existsByUserAndSlug(User user, String slug);
}
