package com.parakh.backend.service;

import com.parakh.backend.model.*;
import com.parakh.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class InstitutionalAnalyticsService {

    @Autowired
    private ExamRepository examRepository;
    @Autowired
    private ProgressCardRepository progressCardRepository;
    @Autowired
    private ClassroomRepository classroomRepository;
    @Autowired
    private StudentResponseRepository studentResponseRepository;
    @Autowired
    private StudentLearningProfileRepository studentLearningProfileRepository;

    @Cacheable(value = "institutionalBenchmarks", key = "#institutionId")
    public Map<String, Object> getInstitutionalBenchmark(Long institutionId) {
        Map<String, Object> benchmark = new HashMap<>();

        benchmark.put("institutionIndex", computeInstitutionIntelligenceIndex(institutionId));
        benchmark.put("rankedClasses", rankClassesByIntelligence(institutionId));
        benchmark.put("competencyGapHeatmap", detectCompetencyGaps(institutionId));
        benchmark.put("bloomRegressionClusters", detectBloomRegressionClusters(institutionId));
        benchmark.put("riskDistributionMatrix", computeRiskDistribution(institutionId));
        benchmark.put("learningStabilityIndex", computeInstitutionalStability(institutionId));

        return benchmark;
    }

    /**
     * Compute a composite intelligence index for the institution (0-100).
     * Combination of average academic score and average competency index.
     */
    public double computeInstitutionIntelligenceIndex(Long institutionId) {
        List<ProgressCard> allCards = institutionId == null ? progressCardRepository.findAll()
                : progressCardRepository.findByInstitutionId(institutionId);
        if (allCards.isEmpty())
            return 0.0;

        double avgAcademic = allCards.stream().mapToDouble(ProgressCard::getAcademicScore).average().orElse(0);
        double avgCompetency = allCards.stream().mapToDouble(ProgressCard::getCompetencyIndex).average().orElse(0);

        return round((avgAcademic * 0.6) + (avgCompetency * 0.4));
    }

    /**
     * Rank classrooms by their average intelligence index.
     */
    public List<Map<String, Object>> rankClassesByIntelligence(Long institutionId) {
        List<Classroom> classrooms = institutionId == null ? classroomRepository.findAll()
                : classroomRepository.findByInstitutionId(institutionId);
        List<Map<String, Object>> ranked = new ArrayList<>();

        for (Classroom c : classrooms) {
            List<Exam> exams = examRepository.findByAssessmentClassroomId(c.getId()).stream()
                    .filter(e -> "COMPLETED".equals(e.getStatus())).toList();

            if (exams.isEmpty())
                continue;

            double avgScore = exams.stream().mapToInt(Exam::getScore).average().orElse(0);

            Map<String, Object> m = new HashMap<>();
            m.put("className", c.getName());
            m.put("teacherName", c.getTeacher().getName());
            m.put("avgScore", round(avgScore));
            m.put("studentCount", exams.stream().map(e -> e.getUser().getId()).distinct().count());
            ranked.add(m);
        }

        ranked.sort((a, b) -> Double.compare((Double) b.get("avgScore"), (Double) a.get("avgScore")));
        return ranked;
    }

    /**
     * Detect competency gaps at the institutional level.
     * Returns top 12 gaps.
     */
    public Map<String, Double> detectCompetencyGaps(Long institutionId) {
        List<StudentResponse> responses = institutionId == null ? studentResponseRepository.findAll()
                : studentResponseRepository.findByQuestionInstitutionId(institutionId);
        Map<String, Long> total = new HashMap<>();
        Map<String, Long> correct = new HashMap<>();

        for (StudentResponse r : responses) {
            String code = r.getQuestion().getCompetencyCode();
            if (code == null)
                continue;
            total.merge(code, 1L, Long::sum);
            if (Boolean.TRUE.equals(r.getIsCorrect()))
                correct.merge(code, 1L, Long::sum);
        }

        Map<String, Double> gaps = new HashMap<>();
        total.forEach((code, tot) -> {
            long cor = correct.getOrDefault(code, 0L);
            double gap = 100 - ((double) cor / tot * 100);
            gaps.put(code, round(gap));
        });

        return gaps.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(12)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (e1, e2) -> e1, LinkedHashMap::new));
    }

    /**
     * Clusters classes where significant bloom regression is occurring.
     * Bloom regression: more than 15% of exams regressing to 'Remember'.
     */
    public List<Map<String, Object>> detectBloomRegressionClusters(Long institutionId) {
        List<Classroom> classrooms = institutionId == null ? classroomRepository.findAll()
                : classroomRepository.findByInstitutionId(institutionId);
        List<Map<String, Object>> alerts = new ArrayList<>();

        for (Classroom c : classrooms) {
            List<Exam> exams = examRepository.findByAssessmentClassroomId(c.getId()).stream()
                    .filter(e -> "COMPLETED".equals(e.getStatus())).toList();

            if (exams.isEmpty())
                continue;

            long regressed = exams.stream().filter(e -> "Remember".equals(e.getCurrentBloomLevel())).count();
            double rate = (double) regressed / exams.size() * 100;

            if (rate > 15) {
                Map<String, Object> m = new HashMap<>();
                m.put("className", c.getName());
                m.put("regressionRate", round(rate));
                m.put("severity", rate > 30 ? "CRITICAL" : "HIGH");
                alerts.add(m);
            }
        }
        alerts.sort((a, b) -> Double.compare((Double) b.get("regressionRate"), (Double) a.get("regressionRate")));
        return alerts;
    }

    /**
     * Compute risk distribution across the institution.
     */
    public Map<String, Long> computeRiskDistribution(Long institutionId) {
        List<ProgressCard> cards = institutionId == null ? progressCardRepository.findAll()
                : progressCardRepository.findByInstitutionId(institutionId);
        // Take latest card per student
        Map<Long, String> latestRisk = new HashMap<>();
        cards.stream()
                .sorted(Comparator.comparing(ProgressCard::getGeneratedAt).reversed())
                .forEach(c -> latestRisk.putIfAbsent(c.getStudent().getId(), c.getRiskIndicator()));

        return latestRisk.values().stream()
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(r -> r, Collectors.counting()));
    }

    private double computeInstitutionalStability(Long institutionId) {
        List<StudentLearningProfile> profiles = institutionId == null ? studentLearningProfileRepository.findAll()
                : studentLearningProfileRepository.findByStudentInstitutionId(institutionId);
        if (profiles.isEmpty())
            return 100.0;
        return round(profiles.stream()
                .mapToDouble(StudentLearningProfile::getLearningStabilityIndex)
                .average().orElse(100.0));
    }

    private double round(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
