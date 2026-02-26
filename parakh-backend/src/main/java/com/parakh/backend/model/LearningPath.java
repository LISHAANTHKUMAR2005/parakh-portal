package com.parakh.backend.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class LearningPath {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long studentId;
    private String weakestTopic;
    private String riskCategory;
    @Column(length = 2000)
    private String overallStrategy;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String structuredPlanJson;

    private int totalWeeks;
    private LocalDate generatedDate;

    public LearningPath() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getWeakestTopic() {
        return weakestTopic;
    }

    public void setWeakestTopic(String weakestTopic) {
        this.weakestTopic = weakestTopic;
    }

    public String getRiskCategory() {
        return riskCategory;
    }

    public void setRiskCategory(String riskCategory) {
        this.riskCategory = riskCategory;
    }

    public String getOverallStrategy() {
        return overallStrategy;
    }

    public void setOverallStrategy(String overallStrategy) {
        this.overallStrategy = overallStrategy;
    }

    public String getStructuredPlanJson() {
        return structuredPlanJson;
    }

    public void setStructuredPlanJson(String structuredPlanJson) {
        this.structuredPlanJson = structuredPlanJson;
    }

    public int getTotalWeeks() {
        return totalWeeks;
    }

    public void setTotalWeeks(int totalWeeks) {
        this.totalWeeks = totalWeeks;
    }

    public LocalDate getGeneratedDate() {
        return generatedDate;
    }

    public void setGeneratedDate(LocalDate generatedDate) {
        this.generatedDate = generatedDate;
    }
}
