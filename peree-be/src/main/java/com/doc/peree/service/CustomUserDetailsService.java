package com.doc.peree.service;

import com.doc.peree.model.User;
import com.doc.peree.model.UserPrinciple;
import com.doc.peree.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(@NonNull String id) throws UsernameNotFoundException {
        User user = userRepository.findById(Long.parseLong(id))
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));
        return new UserPrinciple(user);
    }
}
