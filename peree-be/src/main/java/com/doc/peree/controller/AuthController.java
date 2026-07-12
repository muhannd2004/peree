package com.doc.peree.controller;

import com.doc.peree.dto.AuthResponse;
import com.doc.peree.dto.LoginRequest;
import com.doc.peree.dto.SignupRequest;
import com.doc.peree.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<Map<String, String>> registerUser(SignupRequest request){
        try {
            authService.registerUser(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "User registered successfully"));
        }catch (IllegalArgumentException e){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(LoginRequest request){
        try {
            String token = authService.login(request);
            return ResponseEntity.ok(new AuthResponse(token, ""));
        }catch (IllegalArgumentException e){
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new AuthResponse("", e.getMessage()));
        }
    }
}
