package com.doc.peree.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/hola")
public class Hello {

    @GetMapping
    public String hola(){
        return "hola";
    }
}
