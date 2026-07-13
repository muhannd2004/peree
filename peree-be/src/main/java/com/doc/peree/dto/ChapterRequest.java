package com.doc.peree.dto;

import lombok.Data;

@Data
public class ChapterRequest {
    private String title;
    private String content;
    private boolean published;
}
