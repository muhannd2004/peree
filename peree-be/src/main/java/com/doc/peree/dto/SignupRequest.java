package com.doc.peree.dto;

import lombok.Data;

@Data
public class SignupRequest {
    private String name;
    private String userName;
    private String email;
    private String password;

}
