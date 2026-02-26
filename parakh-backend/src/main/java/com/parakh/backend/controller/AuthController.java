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

    @Autowired
    private com.parakh.backend.service.SystemConfigService configService;

    @Autowired
    private com.parakh.backend.service.AuditService auditService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");

        // SYSTEM CONFIG CHECK: MAINTENANCE MODE (Safer block)
        String maintMode = "false";
        try {
            maintMode = configService.getConfig("MAINTENANCE_MODE")
                    .map(c -> c.getConfigValue())
                    .orElse("false");
        } catch (Exception e) {
            System.err.println("Database error during config check: " + e.getMessage());
            // Fallback to false so users can still login if config table is missing
        }

        try {
            if (email == null || password == null) {
                return ResponseEntity.status(400).body("Email and password are required.");
            }

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password));

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            // Fetch the actual User entity to check status & role for Maintenance bypass
            com.parakh.backend.model.User user = userRepository.findByEmail(email).orElseThrow();

            System.out.println(
                    "Login success: " + email + " | Role: " + user.getRole() + " | Status: " + user.getStatus());

            // Maintenance Mode: Allow ADMIN and TEACHER to bypass
            if ("true".equalsIgnoreCase(maintMode)
                    && !("ADMIN".equals(user.getRole()) || "TEACHER".equals(user.getRole()))) {
                System.out.println("Blocked by Maintenance Mode: " + email);
                return ResponseEntity.status(503)
                        .body("System is currently under maintenance. Please try again later.");
            }

            if (!"APPROVED".equals(user.getStatus())) {
                System.out.println("Blocked by status: " + user.getStatus());
                return ResponseEntity.status(403).body("Your account is pending admin approval.");
            }

            String role = user.getRole();
            String token = jwtUtil.generateToken(userDetails.getUsername(), role);

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("role", role);
            response.put("name", user.getName());
            response.put("email", email);

            // Add maintenance info to response so client knows if they are bypassing
            if ("true".equalsIgnoreCase(maintMode)) {
                response.put("maintenancebox", true);
            }

            auditService.logActionWithActor("USER_LOGIN", "AUTH", user.getId().toString(),
                    "Successful login", email, "ROLE_" + role);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
        // SYSTEM CONFIG CHECK: REGISTRATION ENABLED
        String regEnabled = configService.getConfig("REGISTRATION_ENABLED").map(c -> c.getConfigValue()).orElse("true");
        if ("false".equalsIgnoreCase(regEnabled)) {
            return ResponseEntity.status(403).body("New user registration is currently disabled by administrator.");
        }

        String email = payload.get("email");
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        String name = payload.get("name");
        String password = payload.get("password");
        String role = payload.get("role");
        String institution = payload.get("institution");
        String institutionIdStr = payload.get("institutionId");

        com.parakh.backend.model.User user = new com.parakh.backend.model.User(
                email,
                passwordEncoder.encode(password),
                name,
                role,
                institution);

        if (institutionIdStr != null && !institutionIdStr.isEmpty()) {
            user.setInstitutionId(Long.valueOf(institutionIdStr));
        }

        com.parakh.backend.model.User saved = userRepository.save(user);
        auditService.logActionWithActor("USER_REGISTER", "AUTH", saved.getId().toString(),
                "New user registered: " + email, email, "ROLE_" + role);
        return ResponseEntity.ok("User registered successfully. Returning to login.");
    }
}
