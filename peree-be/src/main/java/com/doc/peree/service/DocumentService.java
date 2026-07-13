package com.doc.peree.service;

import com.doc.peree.dto.*;
import com.doc.peree.model.Chapter;
import com.doc.peree.model.Document;
import com.doc.peree.model.DocumentType;
import com.doc.peree.model.User;
import com.doc.peree.repository.ChapterRepository;
import com.doc.peree.repository.DocumentRepository;
import com.doc.peree.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DocumentService {
    private final DocumentRepository documentRepository;
    private final ChapterRepository chapterRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<DocumentResponse> listUserDocuments(String userName) {
        User user = requireUser(userName);
        return documentRepository.findByUserOrderByUpdatedAtDesc(user)
                .stream()
                .map(this::toResponseWithAllChapters)
                .toList();
    }

    @Transactional(readOnly = true)
    public DocumentResponse getUserDocument(String userName, Long documentId) {
        Document document = requireOwnedDocument(userName, documentId);
        return toResponseWithAllChapters(document);
    }

    @Transactional
    public DocumentResponse createDocument(String userName, DocumentRequest request) {
        User user = requireUser(userName);
        String title = requireText(request.getTitle(), "Document title is required");
        Document document = new Document();
        document.setTitle(title);
        document.setType(request.getType() == null ? DocumentType.DOCUMENT : request.getType());
        document.setPublished(request.isPublished());
        document.setSlug(buildUniqueSlug(user, title));
        document.setUser(user);
        return toResponseWithAllChapters(documentRepository.save(document));
    }

    @Transactional
    public DocumentResponse updateDocument(String userName, Long documentId, DocumentRequest request) {
        Document document = requireOwnedDocument(userName, documentId);
        String title = requireText(request.getTitle(), "Document title is required");
        document.setTitle(title);
        document.setType(request.getType() == null ? DocumentType.DOCUMENT : request.getType());
        document.setPublished(request.isPublished());
        document.setSlug(buildUniqueSlug(document.getUser(), title, document.getId()));
        return toResponseWithAllChapters(documentRepository.save(document));
    }

    @Transactional
    public void deleteDocument(String userName, Long documentId) {
        Document document = requireOwnedDocument(userName, documentId);
        documentRepository.delete(document);
    }

    @Transactional
    public ChapterResponse createChapter(String userName, Long documentId, ChapterRequest request) {
        Document document = requireOwnedDocument(userName, documentId);
        Chapter chapter = new Chapter();
        chapter.setTitle(requireText(request.getTitle(), "Chapter title is required"));
        chapter.setContent(request.getContent() == null ? "" : request.getContent());
        chapter.setPublished(request.isPublished());
        chapter.setOrderIndex(chapterRepository.countByDocumentId(documentId));
        chapter.setDocument(document);
        return toChapterResponse(chapterRepository.save(chapter));
    }

    @Transactional
    public ChapterResponse updateChapter(String userName, Long chapterId, ChapterRequest request) {
        Chapter chapter = requireOwnedChapter(userName, chapterId);
        chapter.setTitle(requireText(request.getTitle(), "Chapter title is required"));
        chapter.setContent(request.getContent() == null ? "" : request.getContent());
        chapter.setPublished(request.isPublished());
        return toChapterResponse(chapterRepository.save(chapter));
    }

    @Transactional
    public void deleteChapter(String userName, Long chapterId) {
        Chapter chapter = requireOwnedChapter(userName, chapterId);
        Long documentId = chapter.getDocument().getId();
        chapterRepository.delete(chapter);
        normalizeOrder(documentId);
    }

    @Transactional
    public List<ChapterResponse> reorderChapters(String userName, Long documentId, ReorderRequest request) {
        Document document = requireOwnedDocument(userName, documentId);
        List<Chapter> chapters = chapterRepository.findByDocumentIdOrderByOrderIndexAsc(document.getId());
        if (request.getChapterIds() == null || request.getChapterIds().size() != chapters.size()) {
            throw new IllegalArgumentException("Chapter reorder list does not match document chapters");
        }

        List<Long> existingIdsSorted = chapters.stream().map(Chapter::getId).sorted().toList();
        List<Long> requestedIdsSorted = request.getChapterIds().stream().sorted().toList();
        if (!existingIdsSorted.equals(requestedIdsSorted)) {
            throw new IllegalArgumentException("Chapter reorder list does not match document chapters");
        }

        Map<Long, Chapter> chapterById = new HashMap<>();
        for (Chapter chapter : chapters) {
            chapterById.put(chapter.getId(), chapter);
        }

        List<Chapter> reordered = new ArrayList<>();
        for (int i = 0; i < request.getChapterIds().size(); i++) {
            Long chapterId = request.getChapterIds().get(i);
            Chapter chapter = chapterById.get(chapterId);
            if (chapter == null) {
                throw new IllegalArgumentException("Chapter reorder list contains unknown chapter");
            }
            chapter.setOrderIndex(i);
            reordered.add(chapter);
        }
        chapterRepository.saveAll(reordered);
        return reordered.stream().map(this::toChapterResponse).toList();
    }

    @Transactional(readOnly = true)
    public DocumentResponse getPublishedDocument(String userName, String slug) {
        Document document = documentRepository.findByUserUserNameAndSlug(userName, slug)
                .orElseThrow(() -> new EntityNotFoundException("Document not found"));
        if (!document.isPublished()) {
            throw new EntityNotFoundException("Document not found");
        }
        return toResponseWithPublishedChapters(document);
    }

    private User requireUser(String userName) {
        return userRepository.getUserByUserName(userName)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
    }

    private Document requireOwnedDocument(String userName, Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found"));
        if (!document.getUser().getUserName().equals(userName)) {
            throw new EntityNotFoundException("Document not found");
        }
        return document;
    }

    private Chapter requireOwnedChapter(String userName, Long chapterId) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new EntityNotFoundException("Chapter not found"));
        if (!chapter.getDocument().getUser().getUserName().equals(userName)) {
            throw new EntityNotFoundException("Chapter not found");
        }
        return chapter;
    }

    private String buildUniqueSlug(User user, String title) {
        return buildUniqueSlug(user, title, null);
    }

    private String buildUniqueSlug(User user, String title, Long ignoreDocumentId) {
        String base = toSlug(title);
        String candidate = base;
        int suffix = 2;
        while (true) {
            boolean inUse = documentRepository.findByUserUserNameAndSlug(user.getUserName(), candidate)
                    .filter(document -> ignoreDocumentId == null || !document.getId().equals(ignoreDocumentId))
                    .isPresent();
            if (!inUse) {
                return candidate;
            }
            candidate = base + "-" + suffix++;
        }
    }

    private String toSlug(String input) {
        if (input == null || input.isBlank()) {
            return "untitled";
        }
        String normalized = input.toLowerCase(Locale.ROOT).trim()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
        return normalized.isBlank() ? "untitled" : normalized;
    }

    private void normalizeOrder(Long documentId) {
        List<Chapter> chapters = chapterRepository.findByDocumentIdOrderByOrderIndexAsc(documentId);
        for (int i = 0; i < chapters.size(); i++) {
            chapters.get(i).setOrderIndex(i);
        }
        chapterRepository.saveAll(chapters);
    }

    private DocumentResponse toResponseWithAllChapters(Document document) {
        List<ChapterResponse> chapters = chapterRepository.findByDocumentIdOrderByOrderIndexAsc(document.getId())
                .stream()
                .map(this::toChapterResponse)
                .toList();
        return toDocumentResponse(document, chapters);
    }

    private DocumentResponse toResponseWithPublishedChapters(Document document) {
        List<ChapterResponse> chapters = chapterRepository.findByDocumentIdOrderByOrderIndexAsc(document.getId())
                .stream()
                .filter(Chapter::isPublished)
                .map(this::toChapterResponse)
                .toList();
        return toDocumentResponse(document, chapters);
    }

    private DocumentResponse toDocumentResponse(Document document, List<ChapterResponse> chapters) {
        return DocumentResponse.builder()
                .id(document.getId())
                .title(document.getTitle())
                .slug(document.getSlug())
                .type(document.getType())
                .published(document.isPublished())
                .ownerUserName(document.getUser().getUserName())
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .chapters(chapters)
                .build();
    }

    private ChapterResponse toChapterResponse(Chapter chapter) {
        return ChapterResponse.builder()
                .id(chapter.getId())
                .title(chapter.getTitle())
                .content(chapter.getContent())
                .orderIndex(chapter.getOrderIndex())
                .published(chapter.isPublished())
                .createdAt(chapter.getCreatedAt())
                .updatedAt(chapter.getUpdatedAt())
                .build();
    }

    private String requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }
}
