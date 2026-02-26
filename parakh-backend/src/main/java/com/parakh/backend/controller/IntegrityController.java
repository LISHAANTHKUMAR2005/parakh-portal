package com.parakh.backend.controller;

import com.parakh.backend.service.IntegrityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/exam")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class IntegrityController {

    @Autowired
    private com.parakh.backend.service.IntegrityService integrityService;

    @Autowired
    private com.parakh.backend.service.ExamService examService;

    @PostMapping("/report-integrity-event")
    public ResponseEntity<?> reportIntegrityEvent(@RequestBody Map<String, Object> payload,
            java.security.Principal principal) {
        try {
            Long examId = Long.valueOf(payload.get("examId").toString());
            String eventType = (String) payload.get("eventType");

            // Validate ownership via ExamService
            examService.getExamState(examId, principal.getName());

            boolean shouldTerminate = integrityService.reportEvent(examId, eventType);
            if (shouldTerminate) {
                examService.forceTerminate(examId, "Integrity Critical Violation: " + eventType);
                return ResponseEntity.ok(Map.of("message", "Event reported", "status", "TERMINATED"));
            }

            return ResponseEntity.ok(Map.of("message", "Event reported", "status", "IN_PROGRESS"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
