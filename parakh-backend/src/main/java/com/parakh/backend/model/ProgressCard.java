package com.parakh.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "progress_cards", indexes = {
        @Index(name = "idx_card_student", columnList = "student_id"),
        @Index(name = "idx_card_exam", columnList = "exam_id", unique = true),
        @Index(name = "idx_card_risk", columnList = "riskScore"),
        @Index(name = "idx_card_score", columnList = "academicScore"),
        @Index(name = "idx_card_inst", columnList = "institutionId")
})
public class ProgressCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false, unique = true)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    // Core academic score (raw %)
    @Column(nullable = false)
    private Double academicScore = 0.0;

    // Weighted competency index (bloom-weighted accuracy)
    @Column(nullable = false)
    private Double competencyIndex = 0.0;

    // Growth relative to student's previous exams
    @Column(nullable = false)
    private Double growthScore = 0.0;

    // Confidence = ratio of correct high-difficulty answers
    @Column(nullable = false)
    private Double confidenceScore = 0.0;

    // Risk score 0-100 (higher = more at risk)
    @Column(nullable = false)
    private Double riskScore = 0.0;

    // Learning consistency (0-100)
    @Column(nullable = false)
    private Double learningConsistency = 0.0;

    // Risk level: LOW / MEDIUM / HIGH
    @Column(nullable = false)
    private String riskIndicator = "LOW";

    // AI-generated explanation text
    @Column(nullable = true, length = 1000)
    private String aiExplanation;

    // Topic mastery snapshot (stored as JSON string)
    @Column(nullable = true, columnDefinition = "TEXT")
    private String topicMasteryJson;

    // Bloom level distribution snapshot (stored as JSON string)
    @Column(nullable = true, columnDefinition = "TEXT")
    private String bloomDistributionJson;

    @Column(nullable = true)
    private Long institutionId;

    public Long getInstitutionId() {
        return institutionId;
    }

    public void setInstitutionId(Long institutionId) {
        this.institutionId = institutionId;
    }

    @Column(nullable = false, updatable = false)
    private LocalDateTime generatedAt;

    @PrePersist
    protected void onCreate() {
        generatedAt = LocalDateTime.now();
    }

    public ProgressCard() {
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Exam getExam() {
        return exam;
    }

    public void setExam(Exam exam) {
        this.exam = exam;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public Double getAcademicScore() {
        return academicScore;
    }

    public void setAcademicScore(Double academicScore) {
        this.academicScore = academicScore;
    }

    public Double getCompetencyIndex() {
        return competencyIndex;
    }

    public void setCompetencyIndex(Double competencyIndex) {
        this.competencyIndex = competencyIndex;
    }

    public Double getGrowthScore() {
        return growthScore;
    }

    public void setGrowthScore(Double growthScore) {
        this.growthScore = growthScore;
    }

    public Double getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(Double confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public Double getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Double riskScore) {
        this.riskScore = riskScore;
    }

    public Double getLearningConsistency() {
        return learningConsistency;
    }

    public void setLearningConsistency(Double learningConsistency) {
        this.learningConsistency = learningConsistency;
    }

    public String getRiskIndicator() {
        return riskIndicator;
    }

    public void setRiskIndicator(String riskIndicator) {
        this.riskIndicator = riskIndicator;
    }

    public String getAiExplanation() {
        return aiExplanation;
    }

    public void setAiExplanation(String aiExplanation) {
        this.aiExplanation = aiExplanation;
    }

    public String getTopicMasteryJson() {
        return topicMasteryJson;
    }

    public void setTopicMasteryJson(String topicMasteryJson) {
        this.topicMasteryJson = topicMasteryJson;
    }

    public String getBloomDistributionJson() {
        return bloomDistributionJson;
    }

    public void setBloomDistributionJson(String bloomDistributionJson) {
        this.bloomDistributionJson = bloomDistributionJson;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }
}
