package com.doc.peree.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String userName;
    private String email;
    private String password;
}
