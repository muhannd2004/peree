package com.doc.peree.service;

import com.doc.peree.dto.LoginRequest;
import com.doc.peree.dto.SignupRequest;
import com.doc.peree.model.User;
import com.doc.peree.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public void registerUser(SignupRequest request){
         if(userRepository.existsByUserName(request.getUserName())){
             throw new IllegalArgumentException("Email is already in use");
         }
         if(userRepository.existsByEmail(request.getEmail())){
             throw new IllegalArgumentException("Username is already taken");
         }

         User user = new User();
         user.setName(request.getName());
         user.setUserName(request.getUserName());
         user.setEmail(request.getEmail());

         String encodedPassword = passwordEncoder.encode(request.getPassword());
         user.setPassword(encodedPassword);

         user.setRole("ROLE_USER");
         userRepository.save(user);
    }

    public String login(LoginRequest request) {
        if(request.getEmail() == null && request.getUserName() == null){
            throw new IllegalArgumentException("username and email are not provided");
        }

        User user;
        if(request.getUserName() != null){
            user = userRepository.getUserByUserName(request.getUserName())
                    .orElseThrow(() ->
                            new IllegalArgumentException("there is no user with username: " + request.getUserName())
                    );
        }else {
            user = userRepository.getUserByEmail(request.getEmail())
                    .orElseThrow(() ->
                            new IllegalArgumentException("there is no user with email: " + request.getEmail())
                    );
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())){
            throw new IllegalArgumentException("Password is incorrect");
        }

        return jwtService.generateToken(user);
    }
}
