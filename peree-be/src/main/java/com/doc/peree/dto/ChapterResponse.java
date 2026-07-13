package com.doc.peree.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ChapterResponse {
    private Long id;
    private String title;
    private String content;
    private int orderIndex;
    private boolean published;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
