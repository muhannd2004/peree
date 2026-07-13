package com.doc.peree.controller;

import com.doc.peree.dto.*;
import com.doc.peree.service.DocumentService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class DocumentController {
    private final DocumentService documentService;

    @GetMapping("/api/documents")
    public List<DocumentResponse> listDocuments(Authentication authentication) {
        return documentService.listUserDocuments(authentication.getName());
    }

    @GetMapping("/api/documents/{id}")
    public DocumentResponse getDocument(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return documentService.getUserDocument(authentication.getName(), id);
    }

    @PostMapping("/api/documents")
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentResponse createDocument(
            Authentication authentication,
            @RequestBody DocumentRequest request
    ) {
        return documentService.createDocument(authentication.getName(), request);
    }

    @PutMapping("/api/documents/{id}")
    public DocumentResponse updateDocument(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody DocumentRequest request
    ) {
        return documentService.updateDocument(authentication.getName(), id, request);
    }

    @DeleteMapping("/api/documents/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDocument(
            Authentication authentication,
            @PathVariable Long id
    ) {
        documentService.deleteDocument(authentication.getName(), id);
    }

    @PostMapping("/api/documents/{docId}/chapters")
    @ResponseStatus(HttpStatus.CREATED)
    public ChapterResponse createChapter(
            Authentication authentication,
            @PathVariable Long docId,
            @RequestBody ChapterRequest request
    ) {
        return documentService.createChapter(authentication.getName(), docId, request);
    }

    @PutMapping("/api/documents/chapters/{chapterId}")
    public ChapterResponse updateChapter(
            Authentication authentication,
            @PathVariable Long chapterId,
            @RequestBody ChapterRequest request
    ) {
        return documentService.updateChapter(authentication.getName(), chapterId, request);
    }

    @DeleteMapping("/api/documents/chapters/{chapterId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteChapter(
            Authentication authentication,
            @PathVariable Long chapterId
    ) {
        documentService.deleteChapter(authentication.getName(), chapterId);
    }

    @PutMapping("/api/documents/{docId}/chapters/reorder")
    public List<ChapterResponse> reorderChapters(
            Authentication authentication,
            @PathVariable Long docId,
            @RequestBody ReorderRequest request
    ) {
        return documentService.reorderChapters(authentication.getName(), docId, request);
    }

    @GetMapping("/api/public/{userName}/{slug}")
    public DocumentResponse getPublicDocument(
            @PathVariable String userName,
            @PathVariable String slug
    ) {
        return documentService.getPublishedDocument(userName, slug);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(EntityNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
    }
}
