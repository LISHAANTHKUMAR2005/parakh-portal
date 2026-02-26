package com.parakh.backend.controller;

import com.parakh.backend.model.User;
import com.parakh.backend.repository.UserRepository;
import com.parakh.backend.service.AIService;
import com.parakh.backend.service.AnalyticsService;
import com.parakh.backend.service.RateLimitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class AIController {

    @Autowired
    private AIService aiservice;
    @Autowired
    private AnalyticsService analyticsService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RateLimitService rateLimitService;

    private ResponseEntity<?> getRateLimitedResponse(Authentication auth) {
        if (!rateLimitService.tryConsume(auth.getName())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "AI Rate limit exceeded. Please try again in a minute."));
        }
        return null;
    }

    @PostMapping("/ai/explain-question")
    public ResponseEntity<?> explainQuestion(@RequestBody Map<String, String> request, Authentication auth) {
        ResponseEntity<?> limited = getRateLimitedResponse(auth);
        if (limited != null)
            return limited;

        String q = request.get("question");
        String a = request.get("answer");
        return ResponseEntity.ok(Map.of("explanation", aiservice.generateExplanation(q, a)));
    }

    @GetMapping("/student/my/ai-summary")
    public ResponseEntity<?> getMyAiSummary(Authentication auth) {
        ResponseEntity<?> limited = getRateLimitedResponse(auth);
        if (limited != null)
            return limited;

        User student = userRepository.findByEmail(auth.getName()).orElseThrow();
        Map<String, Object> report = analyticsService.getStudentIntelligenceReport(student.getId());
        return ResponseEntity.ok(Map.of("summary", aiservice.generateProgressSummary(report)));
    }

    @PostMapping("/teacher/ai-generate-question")
    public ResponseEntity<?> generateQuestion(@RequestBody Map<String, String> request, Authentication auth) {
        ResponseEntity<?> limited = getRateLimitedResponse(auth);
        if (limited != null)
            return limited;

        String topic = request.get("topic");
        String diff = request.get("difficulty");
        String bloom = request.get("bloomLevel");
        return ResponseEntity.ok(Map.of("question", aiservice.generateQuestion(topic, diff, bloom)));
    }

    @PostMapping("/ai/enhance-remediation")
    public ResponseEntity<?> enhanceRemediation(@RequestBody Map<String, Object> request, Authentication auth) {
        ResponseEntity<?> limited = getRateLimitedResponse(auth);
        if (limited != null)
            return limited;

        return ResponseEntity.ok(Map.of("enhancedPlan", aiservice.enhanceRemediationPlan(request)));
    }
}
