package com.parakh.backend.controller;

import com.parakh.backend.model.User;
import com.parakh.backend.repository.UserRepository;
import com.parakh.backend.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:5174" })
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;
    @Autowired
    private UserRepository userRepository;

    // ─── PHASE 3: Student Intelligence Report ─────────────────────────────────

    @GetMapping("/api/student/{id}/intelligence-report")
    public ResponseEntity<Map<String, Object>> getStudentIntelligenceReport(
            @PathVariable Long id, Authentication authentication) {
        // Students can only see their own report; teachers/admins can see any
        User requester = userRepository.findByEmail(authentication.getName()).orElseThrow();
        if ("STUDENT".equals(requester.getRole()) && !requester.getId().equals(id)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(analyticsService.getStudentIntelligenceReport(id));
    }

    @GetMapping("/api/student/my/intelligence-report")
    public ResponseEntity<Map<String, Object>> getMyIntelligenceReport(Authentication authentication) {
        User student = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(analyticsService.getStudentIntelligenceReport(student.getId()));
    }

    // ─── PHASE 3: Teacher Class Intelligence Summary ───────────────────────────

    @GetMapping("/api/teacher/class/{id}/intelligence-summary")
    public ResponseEntity<Map<String, Object>> getClassIntelligenceSummary(
            @PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(analyticsService.getClassIntelligenceSummary(id));
    }

    // ─── PHASE 6: Admin Educational Intelligence ───────────────────────────────

    @GetMapping("/api/admin/intelligence/institution-performance")
    public ResponseEntity<Map<String, Object>> getInstitutionPerformance() {
        return ResponseEntity.ok(analyticsService.getInstitutionPerformanceComparison());
    }

    @GetMapping("/api/admin/intelligence/competency-gap")
    public ResponseEntity<Map<String, Object>> getCompetencyGap() {
        return ResponseEntity.ok(analyticsService.getCompetencyGapAnalysis());
    }

    @GetMapping("/api/admin/intelligence/performance-trend")
    public ResponseEntity<Map<String, Object>> getPerformanceTrend() {
        return ResponseEntity.ok(analyticsService.getPerformanceTrendLine());
    }
}
