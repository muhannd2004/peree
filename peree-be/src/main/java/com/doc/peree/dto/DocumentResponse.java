package com.doc.peree.dto;

import com.doc.peree.model.DocumentType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class DocumentResponse {
    private Long id;
    private String title;
    private String slug;
    private DocumentType type;
    private boolean published;
    private String ownerUserName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ChapterResponse> chapters;
}
