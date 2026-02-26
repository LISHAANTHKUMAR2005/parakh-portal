package com.parakh.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.parakh.backend.dto.LearningPathDTO;
import com.parakh.backend.model.LearningPath;
import com.parakh.backend.repository.LearningPathRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
public class LearningPathService {

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private AIService aiService;

    @Autowired
    private LearningPathRepository learningPathRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Cacheable(value = "learningPaths", key = "#studentId")
    @SuppressWarnings("unchecked")
    public LearningPathDTO generateLearningPath(Long studentId) {
        // 1. Fetch Intelligence Report
        Map<String, Object> report = analyticsService.getStudentIntelligenceReport(studentId);
        Map<String, Object> predictive = (Map<String, Object>) report.get("predictive");

        // 2. Determine Weakest Topic
        Map<String, Object> weakTopicMeta = (Map<String, Object>) predictive.get("weakestTopicPrediction");
        String weakestTopic = (String) weakTopicMeta.getOrDefault("topic", "General Fundamentals");

        // 3. Strategy Determination Logic
        double riskScore = Double.parseDouble(predictive.getOrDefault("riskScore", "0.0").toString());
        double growthIndex = Double.parseDouble(predictive.getOrDefault("growthIndex", "0.0").toString());
        String riskCategory = (String) predictive.getOrDefault("riskCategory", "LOW");

        String strategy;
        if (riskScore > 60) {
            strategy = "Intensive Reinforcement Strategy: Focused on stabilizing foundational gaps and rapid intervention.";
        } else if (growthIndex < 0) {
            strategy = "Stability & Confidence Recovery Plan: Designed to rebuild momentum and address recent performance dips.";
        } else {
            strategy = "Progressive Skill Advancement Plan: Aimed at mastering higher-order thinking and advanced concepts.";
        }

        // 4. Build 4-Week Structured Plan
        List<LearningPathDTO.WeekPlan> weekPlans = buildWeekPlans(riskCategory, weakestTopic);

        LearningPathDTO dto = new LearningPathDTO();
        dto.setWeakestTopic(weakestTopic);
        dto.setRiskCategory(riskCategory);
        dto.setOverallStrategy(strategy);
        dto.setWeekPlans(weekPlans);

        // 5. AI Enhancement
        dto.setOverallStrategy(aiService.generateLearningPathNarrative(dto));

        // 6. Save/Cache in DB
        saveToDb(studentId, dto);

        return dto;
    }

    private List<LearningPathDTO.WeekPlan> buildWeekPlans(String riskCategory, String topic) {
        List<LearningPathDTO.WeekPlan> plans = new ArrayList<>();

        int multiplier = riskCategory.equals("HIGH") ? 20 : riskCategory.equals("MEDIUM") ? 15 : 10;
        double hourBase = riskCategory.equals("HIGH") ? 8.0 : riskCategory.equals("MEDIUM") ? 6.0 : 4.0;

        // Week 1
        plans.add(new LearningPathDTO.WeekPlan(1,
                "Concept Foundation in " + topic,
                "80% Easy, 20% Medium",
                "Remember → Understand",
                multiplier, hourBase));

        // Week 2
        plans.add(new LearningPathDTO.WeekPlan(2,
                "Application Practice on " + topic,
                "40% Easy, 50% Medium, 10% Hard",
                "Understand → Apply",
                (int) (multiplier * 1.2), hourBase + 2));

        // Week 3
        plans.add(new LearningPathDTO.WeekPlan(3,
                "Mixed Reinforcement & Analysis",
                "20% Easy, 60% Medium, 20% Hard",
                "Apply → Analyze",
                (int) (multiplier * 1.1), hourBase + 1));

        // Week 4
        plans.add(new LearningPathDTO.WeekPlan(4,
                "Simulation & Performance Evaluation",
                "10% Easy, 50% Medium, 40% Hard",
                "Analyze → Evaluate",
                (int) (multiplier * 0.8), hourBase + 3));

        return plans;
    }

    private void saveToDb(Long studentId, LearningPathDTO dto) {
        try {
            LearningPath entity = new LearningPath();
            entity.setStudentId(studentId);
            entity.setWeakestTopic(dto.getWeakestTopic());
            entity.setRiskCategory(dto.getRiskCategory());
            entity.setOverallStrategy(dto.getOverallStrategy());
            entity.setStructuredPlanJson(objectMapper.writeValueAsString(dto.getWeekPlans()));
            entity.setTotalWeeks(4);
            entity.setGeneratedDate(LocalDate.now());
            learningPathRepository.save(entity);
        } catch (JsonProcessingException e) {
            // Log error
        }
    }
}
