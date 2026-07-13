package com.doc.peree.dto;

import com.doc.peree.model.DocumentType;
import lombok.Data;

@Data
public class DocumentRequest {
    private String title;
    private DocumentType type;
    private boolean published;
}
