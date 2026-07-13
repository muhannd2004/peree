package com.doc.peree.repository;

import com.doc.peree.model.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, Long> {
    List<Chapter> findByDocumentIdOrderByOrderIndexAsc(Long documentId);
    int countByDocumentId(Long documentId);
}
