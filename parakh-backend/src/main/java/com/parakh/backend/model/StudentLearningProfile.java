package com.parakh.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_learning_profiles")
public class StudentLearningProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    private Double learningStabilityIndex; // 0-100, high = consistent
    private Double retentionScore; // 0-100, mastery retention
    private Double accelerationScore; // 0-100, rate of growth
    private String cognitiveTrend; // IMPROVING, STABLE, DECLINING
    private Double avgAcademicPerformance;
    private LocalDateTime lastUpdated;

    public StudentLearningProfile() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public Double getLearningStabilityIndex() {
        return learningStabilityIndex;
    }

    public void setLearningStabilityIndex(Double learningStabilityIndex) {
        this.learningStabilityIndex = learningStabilityIndex;
    }

    public Double getRetentionScore() {
        return retentionScore;
    }

    public void setRetentionScore(Double retentionScore) {
        this.retentionScore = retentionScore;
    }

    public Double getAccelerationScore() {
        return accelerationScore;
    }

    public void setAccelerationScore(Double accelerationScore) {
        this.accelerationScore = accelerationScore;
    }

    public String getCognitiveTrend() {
        return cognitiveTrend;
    }

    public void setCognitiveTrend(String cognitiveTrend) {
        this.cognitiveTrend = cognitiveTrend;
    }

    public Double getAvgAcademicPerformance() {
        return avgAcademicPerformance;
    }

    public void setAvgAcademicPerformance(Double avgAcademicPerformance) {
        this.avgAcademicPerformance = avgAcademicPerformance;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}
