package com.parakh.backend.controller;

import com.parakh.backend.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private com.parakh.backend.repository.UserRepository userRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password));

            UserDetails userDetails = (UserDetails) authentication.getPrincipal(); // This might cast the User object

            // Fetch the actual User entity to check status
            com.parakh.backend.model.User user = userRepository.findByEmail(email).orElseThrow();

            if (!"APPROVED".equals(user.getStatus())) {
                return ResponseEntity.status(403).body("Account not approved. Status: " + user.getStatus());
            }

            String role = user.getRole(); // Use role from DB entity

            String token = jwtUtil.generateToken(userDetails.getUsername(), role);

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("role", role);
            response.put("name", user.getName());
            response.put("email", email);
            response.put("status", user.getStatus());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        String name = payload.get("name");
        String password = payload.get("password");
        String role = payload.get("role");
        String institution = payload.get("institution");

        com.parakh.backend.model.User user = new com.parakh.backend.model.User(
                email,
                passwordEncoder.encode(password),
                name,
                role,
                institution);
        // Status is PENDING by default in constructor/field

        userRepository.save(user);

        return ResponseEntity.ok("User registered successfully. Returning to login.");
    }
}
