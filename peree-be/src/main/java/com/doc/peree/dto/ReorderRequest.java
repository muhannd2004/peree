package com.doc.peree.dto;

import lombok.Data;
import java.util.List;

@Data
public class ReorderRequest {
    // List of chapter IDs in the desired order
    private List<Long> chapterIds;
}
