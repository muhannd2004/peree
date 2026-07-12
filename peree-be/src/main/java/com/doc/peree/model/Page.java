package com.doc.peree.model;

import jakarta.persistence.*;

import java.util.List;

@Entity
public class Page {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String mainHeader;
    private List<String> secondaryHeaders;
    private int pageNumber;

    @Column(columnDefinition = "TEXT")
    private String publishedContent;

    @Column(columnDefinition = "TEXT")
    private String draftContent;

    @ManyToOne
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;
}
