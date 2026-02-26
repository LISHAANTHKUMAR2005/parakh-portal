package com.parakh.backend.service;

import com.parakh.backend.model.*;
import com.parakh.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ExamRepository examRepository;
    @Autowired
    private StudentResponseRepository studentResponseRepository;
    @Autowired
    private ProgressCardRepository progressCardRepository;
    @Autowired
    private ClassroomRepository classroomRepository;
    @Autowired
    private QuestionRepository questionRepository;
    @Autowired
    private RemedialEngineService remedialEngineService;
    @Autowired
    private StudentLearningProfileRepository studentLearningProfileRepository;

    // ─── PHASE 3 + 7: Student Intelligence Report ────────────────────────────

    @Cacheable(value = "studentReports", key = "#studentId")
    public Map<String, Object> getStudentIntelligenceReport(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<Exam> exams = examRepository.findByUserId(studentId).stream()
                .filter(e -> "COMPLETED".equals(e.getStatus()) || "TERMINATED".equals(e.getStatus()))
                .toList();

        List<ProgressCard> cards = progressCardRepository.findByStudentIdOrderByGeneratedAtDesc(studentId);

        Map<String, Double> topicMastery = computeTopicMastery(exams);
        Map<String, Double> bloomDistribution = computeBloomDistribution(exams);
        Map<String, Double> difficultySuccessRate = computeDifficultySuccessRate(studentId);

        List<Map<String, Object>> growthTrend = new ArrayList<>(cards.stream()
                .limit(10)
                .map(c -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("date", c.getGeneratedAt().toLocalDate().toString());
                    m.put("academicScore", c.getAcademicScore());
                    m.put("competencyIndex", c.getCompetencyIndex());
                    m.put("growthScore", c.getGrowthScore());
                    return m;
                })
                .collect(Collectors.toList()));
        Collections.reverse(growthTrend);

        // ── Latest Progress Card fields ────────────────────────────────────
        Map<String, Object> latestCard = new HashMap<>();
        if (!cards.isEmpty()) {
            ProgressCard c = cards.get(0);
            latestCard.put("academicScore", c.getAcademicScore());
            latestCard.put("competencyIndex", c.getCompetencyIndex());
            latestCard.put("growthScore", c.getGrowthScore());
            latestCard.put("confidenceScore", c.getConfidenceScore());
            latestCard.put("riskScore", c.getRiskScore());
            latestCard.put("learningConsistency", c.getLearningConsistency());
            latestCard.put("riskIndicator", c.getRiskIndicator());
            latestCard.put("aiExplanation", c.getAiExplanation());
            if (c.getExam() != null) {
                latestCard.put("difficultyHistory", c.getExam().getDifficultyHistory());
                latestCard.put("bloomHistory", c.getExam().getBloomHistory());
                latestCard.put("topicHistory", c.getExam().getTopicHistory());
                latestCard.put("integrityEvents", c.getExam().getIntegrityEvents());
            }
        }

        // ── PHASE 7: Predictive Intelligence Layer ─────────────────────────
        Map<String, Object> predictive = computePredictiveLayer(studentId, exams, cards, topicMastery,
                difficultySuccessRate);

        Map<String, Object> report = new HashMap<>();
        report.put("studentName", student.getName());
        report.put("totalExamsTaken", exams.size());
        report.put("topicMasteryIndex", topicMastery);
        report.put("bloomLevelDistribution", bloomDistribution);
        report.put("difficultySuccessRate", difficultySuccessRate);
        report.put("growthTrend", growthTrend);
        report.put("latestProgressCard", latestCard);
        report.put("predictive", predictive);

        // --- Phase 11: Longitudinal Intelligence ---
        StudentLearningProfile profile = computeLongitudinalMetrics(studentId);
        Map<String, Object> longitudinal = new HashMap<>();
        if (profile != null) {
            longitudinal.put("stabilityIndex", profile.getLearningStabilityIndex());
            longitudinal.put("retentionScore", profile.getRetentionScore());
            longitudinal.put("accelerationScore", profile.getAccelerationScore());
            longitudinal.put("trend", profile.getCognitiveTrend());
            longitudinal.put("lastUpdated", profile.getLastUpdated());
        }
        report.put("longitudinalProfile", longitudinal);

        return report;
    }

    // ─── PHASE 7: Predictive Intelligence Layer ───────────────────────────────

    /**
     * Computes 5 predictive signals from raw exam sessions and progress history:
     *
     * 1. riskCategory — LOW / MEDIUM / HIGH (4-signal rule-based)
     * 2. riskBreakdown — individual signal scores for transparency
     * 3. growthIndex — early-session vs late-session difficulty comparison
     * 4. confidenceScore — fastCorrect ratio + hard-difficulty stability + bloom
     * advancement
     * 5. consistencyIndex — variance in per-exam academic score
     * 6. weakestTopicPrediction — lowest mastery topic with remediation advice
     */
    private Map<String, Object> computePredictiveLayer(Long studentId,
            List<Exam> exams,
            List<ProgressCard> cards,
            Map<String, Double> topicMastery,
            Map<String, Double> diffSuccessRate) {
        Map<String, Object> result = new HashMap<>();

        // ── 1 & 2: Risk Category with 4 sub-signals ─────────────────────
        Map<String, Object> riskBreakdown = computeRiskBreakdown(studentId, exams, topicMastery);
        double riskScore = (double) riskBreakdown.get("compositeRiskScore");
        String riskCategory = riskScore >= 60 ? "HIGH" : riskScore >= 35 ? "MEDIUM" : "LOW";
        result.put("riskCategory", riskCategory);
        result.put("riskScore", round(riskScore));
        result.put("riskBreakdown", riskBreakdown);

        // ── 3: Growth Index (early vs late difficulty) ────────────────────
        double growthIndex = computeGrowthIndex(exams);
        String growthDirection = growthIndex > 5 ? "UP" : growthIndex < -5 ? "DOWN" : "STABLE";
        result.put("growthIndex", round(growthIndex));
        result.put("growthDirection", growthDirection);

        // ── 4: Enhanced Confidence Score ──────────────────────────────────
        double confidenceScore = computeEnhancedConfidenceScore(studentId, exams);
        result.put("confidenceScore", round(confidenceScore));

        // ── 5: Consistency Index (score variance) ─────────────────────────
        double consistencyIndex = computeConsistencyIndex(cards);
        result.put("consistencyIndex", round(consistencyIndex));

        // ── 6: Weakest Topic Prediction ───────────────────────────────────
        Map<String, Object> weakTopic = computeWeakestTopicPrediction(topicMastery, diffSuccessRate);
        result.put("weakestTopicPrediction", weakTopic);

        return result;
    }

    /**
     * Risk signals:
     * A. topicMasteryRisk — any topic < 50% mastery
     * B. slowWrongRisk — ratio of (slow AND wrong) answers
     * C. bloomRegressionRisk— percentage of exams where bloom level dropped
     * D. diffRegressionRisk — percentage of exams ending on Easy difficulty
     */
    private Map<String, Object> computeRiskBreakdown(Long studentId, List<Exam> exams,
            Map<String, Double> topicMastery) {
        Map<String, Object> breakdown = new HashMap<>();

        // Signal A: Topic mastery risk (0-100)
        long weakTopics = topicMastery.values().stream().filter(v -> v < 50).count();
        double topicRisk = topicMastery.isEmpty() ? 0
                : Math.min(100, (double) weakTopics / topicMastery.size() * 100);
        breakdown.put("topicMasteryRisk", round(topicRisk));

        // Signal B: Slow-wrong frequency across all responses
        List<StudentResponse> allResponses = exams.stream()
                .flatMap(e -> studentResponseRepository.findByExamId(e.getId()).stream())
                .collect(Collectors.toList());
        long slowWrong = allResponses.stream()
                .filter(r -> !Boolean.TRUE.equals(r.getIsCorrect())
                        && r.getTimeTakenSeconds() != null
                        && r.getTimeTakenSeconds() > 60L)
                .count();
        double slowWrongRisk = allResponses.isEmpty() ? 0
                : Math.min(100, (double) slowWrong / allResponses.size() * 200); // amplify for sensitivity
        breakdown.put("slowWrongRisk", round(slowWrongRisk));

        // Signal C: Bloom regression (exams where final bloom < initial level)
        // Proxy: exams that ended at "Remember" (lowest level)
        long bloomRegressed = exams.stream()
                .filter(e -> "Remember".equals(e.getCurrentBloomLevel()))
                .count();
        double bloomRisk = exams.isEmpty() ? 0
                : Math.min(100, (double) bloomRegressed / exams.size() * 100);
        breakdown.put("bloomRegressionRisk", round(bloomRisk));

        // Signal D: Difficulty regression (ended on Easy)
        long diffRegressed = exams.stream()
                .filter(e -> "Easy".equals(e.getCurrentDifficulty()))
                .count();
        double diffRisk = exams.isEmpty() ? 0
                : Math.min(100, (double) diffRegressed / exams.size() * 100);
        breakdown.put("difficultyRegressionRisk", round(diffRisk));

        // Composite: weighted average (A=35%, B=30%, C=20%, D=15%)
        double composite = topicRisk * 0.35 + slowWrongRisk * 0.30
                + bloomRisk * 0.20 + diffRisk * 0.15;
        breakdown.put("compositeRiskScore", round(composite));

        return breakdown;
    }

    /**
     * Growth Index: compares average difficulty of first-half vs second-half
     * questions.
     * Easy=1, Medium=2, Hard=3. Positive = progressed upward.
     * Returns score on a -100 to +100 scale.
     */
    private double computeGrowthIndex(List<Exam> exams) {
        if (exams.isEmpty())
            return 0;

        Map<String, Integer> diffScore = Map.of("Easy", 1, "Medium", 2, "Hard", 3);
        List<Double> examProgressions = new ArrayList<>();

        for (Exam exam : exams) {
            List<StudentResponse> responses = studentResponseRepository.findByExamId(exam.getId());
            if (responses.size() < 4)
                continue;

            int half = responses.size() / 2;
            double earlyAvg = responses.subList(0, half).stream()
                    .mapToInt(r -> diffScore.getOrDefault(r.getQuestion().getDifficulty(), 2))
                    .average().orElse(2);
            double lateAvg = responses.subList(half, responses.size()).stream()
                    .mapToInt(r -> diffScore.getOrDefault(r.getQuestion().getDifficulty(), 2))
                    .average().orElse(2);
            examProgressions.add(lateAvg - earlyAvg);
        }

        if (examProgressions.isEmpty())
            return 0;
        double avgProgression = examProgressions.stream().mapToDouble(d -> d).average().orElse(0);
        // Map [-2, +2] difference range → [-100, +100]
        return Math.max(-100, Math.min(100, avgProgression * 50));
    }

    /**
     * Confidence Score — weighted combination:
     * 40% fast+correct ratio
     * 40% hard-difficulty stability (accuracy on hard Qs)
     * 20% bloom advancement count (exams ending above Remember)
     */
    private double computeEnhancedConfidenceScore(Long studentId, List<Exam> exams) {
        if (exams.isEmpty())
            return 50.0;

        List<StudentResponse> all = exams.stream()
                .flatMap(e -> studentResponseRepository.findByExamId(e.getId()).stream())
                .collect(Collectors.toList());

        // 40%: Fast+correct ratio
        long fastCorrect = all.stream()
                .filter(r -> Boolean.TRUE.equals(r.getIsCorrect())
                        && r.getTimeTakenSeconds() != null && r.getTimeTakenSeconds() <= 30L)
                .count();
        double fastCorrectRatio = all.isEmpty() ? 0 : (double) fastCorrect / all.size() * 100;

        // 40%: Hard difficulty stability
        long hardTotal = all.stream()
                .filter(r -> "Hard".equals(r.getQuestion().getDifficulty())).count();
        long hardCorrect = all.stream()
                .filter(r -> "Hard".equals(r.getQuestion().getDifficulty())
                        && Boolean.TRUE.equals(r.getIsCorrect()))
                .count();
        double hardStability = hardTotal > 0 ? (double) hardCorrect / hardTotal * 100 : 50.0;

        // 20%: Bloom advancement (exams NOT stuck on Remember)
        long bloomAdvanced = exams.stream()
                .filter(e -> !"Remember".equals(e.getCurrentBloomLevel())).count();
        double bloomAdvancement = exams.isEmpty() ? 50
                : (double) bloomAdvanced / exams.size() * 100;

        return fastCorrectRatio * 0.40 + hardStability * 0.40 + bloomAdvancement * 0.20;
    }

    /**
     * Consistency Index: 100 minus coefficient of variation of academic scores.
     * High = consistent learner. Low = erratic performance.
     */
    private double computeConsistencyIndex(List<ProgressCard> cards) {
        if (cards.size() < 2)
            return 50.0;

        List<Double> scores = cards.stream()
                .map(ProgressCard::getAcademicScore)
                .collect(Collectors.toList());
        double mean = scores.stream().mapToDouble(d -> d).average().orElse(0);
        if (mean == 0)
            return 0;

        double variance = scores.stream()
                .mapToDouble(s -> (s - mean) * (s - mean))
                .average().orElse(0);
        double stdDev = Math.sqrt(variance);
        double cv = (stdDev / mean) * 100; // coefficient of variation %
        return Math.max(0, Math.min(100, 100 - cv));
    }

    /**
     * Weakest Topic Prediction: finds the single lowest-mastery topic and returns
     * the topic name, its mastery %, and a rule-based remediation recommendation.
     */
    private Map<String, Object> computeWeakestTopicPrediction(Map<String, Double> topicMastery,
            Map<String, Double> diffSuccessRate) {
        Map<String, Object> result = new HashMap<>();

        if (topicMastery.isEmpty()) {
            result.put("topic", "N/A");
            result.put("mastery", 0);
            result.put("advice", "Complete more exams with topic-tagged questions to receive predictions.");
            return result;
        }

        Map.Entry<String, Double> weakest = topicMastery.entrySet().stream()
                .min(Map.Entry.comparingByValue())
                .orElse(null);

        if (weakest == null) {
            result.put("topic", "N/A");
            return result;
        }

        String topic = weakest.getKey();
        double mastery = weakest.getValue();

        // Generate advice based on mastery level and difficulty success rates
        double easyRate = diffSuccessRate.getOrDefault("Easy", 0.0);
        String advice;
        if (mastery < 25) {
            advice = String.format(
                    "Critical gap in '%s' (%s%% mastery). Recommend starting with foundational Easy-level questions and revisiting core concepts before attempting Medium difficulty.",
                    topic, (int) mastery);
        } else if (mastery < 50) {
            advice = String.format(
                    "Significant weakness in '%s' (%s%% mastery). Focused practice recommended: 3-5 sessions on %s concepts with %s-difficulty questions.",
                    topic, (int) mastery, topic, easyRate > 70 ? "Medium" : "Easy");
        } else if (mastery < 70) {
            advice = String.format(
                    "'%s' is developing but below proficiency (%s%% mastery). Practice application-level (Bloom: Apply) questions targeting this topic.",
                    topic, (int) mastery);
        } else {
            advice = String.format(
                    "'%s' is near proficiency (%s%% mastery). Challenge with higher-order thinking (Bloom: Analyze) to achieve mastery.",
                    topic, (int) mastery);
        }

        result.put("topic", topic);
        result.put("mastery", mastery);
        result.put("advice", advice);
        return result;
    }

    // ─── PHASE 3: Class Intelligence Summary ─────────────────────────────────

    @Cacheable(value = "classSummaries", key = "#classId")
    public Map<String, Object> getClassIntelligenceSummary(Long classId) {
        Classroom classroom = classroomRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        List<Exam> exams = examRepository.findByAssessmentClassroomId(classId).stream()
                .filter(e -> "COMPLETED".equals(e.getStatus()) || "TERMINATED".equals(e.getStatus()))
                .toList();

        Map<String, Double> topicHeatmap = computeTopicMastery(exams);
        Map<String, Double> bloomDistribution = computeBloomDistribution(exams);

        String weakestTopic = topicHeatmap.entrySet().stream()
                .min(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey).orElse("N/A");

        Map<String, Integer> diffCorrect = new HashMap<>();
        Map<String, Integer> diffTotal = new HashMap<>();
        for (Exam exam : exams) {
            for (StudentResponse r : studentResponseRepository.findByExamId(exam.getId())) {
                String diff = r.getQuestion().getDifficulty();
                diffTotal.merge(diff, 1, Integer::sum);
                if (Boolean.TRUE.equals(r.getIsCorrect()))
                    diffCorrect.merge(diff, 1, Integer::sum);
            }
        }
        Map<String, Double> overallDiff = new LinkedHashMap<>();
        for (String diff : List.of("Easy", "Medium", "Hard")) {
            int tot = diffTotal.getOrDefault(diff, 0);
            overallDiff.put(diff, tot > 0 ? round((double) diffCorrect.getOrDefault(diff, 0) / tot * 100) : 0.0);
        }

        List<Map<String, Object>> classTrend = buildClassGrowthTrend(exams);

        Set<Long> studentIds = exams.stream().map(e -> e.getUser().getId()).collect(Collectors.toSet());
        List<Map<String, Object>> riskStudents = buildRiskStudentList(studentIds);

        // ── PHASE 7: Confidence Ranking across students ─────────────────
        List<Map<String, Object>> confidenceRanking = buildConfidenceRanking(studentIds);

        List<Map<String, Object>> studentResults = exams.stream().map(e -> {
            Map<String, Object> m = new HashMap<>();
            m.put("studentName", e.getUser().getName());
            m.put("studentId", e.getUser().getId());
            m.put("score", e.getScore());
            m.put("total", e.getAssessment().getQuestionCount());
            m.put("date", e.getEndTime());
            progressCardRepository.findByExamId(e.getId()).ifPresent(card -> {
                m.put("riskIndicator", card.getRiskIndicator());
                m.put("competencyIndex", card.getCompetencyIndex());
                m.put("confidenceScore", card.getConfidenceScore());
            });
            return m;
        }).collect(Collectors.toList());

        double avgScore = exams.stream().filter(e -> e.getScore() != null)
                .mapToInt(Exam::getScore).average().orElse(0.0);

        // Weakest topic summary with advice
        Map<String, Object> weakestTopicSummary = new HashMap<>();
        weakestTopicSummary.put("topic", weakestTopic);
        weakestTopicSummary.put("mastery", topicHeatmap.getOrDefault(weakestTopic, 0.0));
        weakestTopicSummary.put("studentsStruggling",
                studentResults.stream()
                        .filter(r -> r.get("riskIndicator") != null
                                && !"LOW".equals(r.get("riskIndicator")))
                        .count());

        Map<String, Object> summary = new HashMap<>();
        summary.put("className", classroom.getName());
        summary.put("totalAttempts", exams.size());
        summary.put("averageScore", round(avgScore));
        summary.put("topicHeatmap", topicHeatmap);
        summary.put("weakestTopic", weakestTopic);
        summary.put("weakestTopicSummary", weakestTopicSummary);
        summary.put("bloomLevelDistribution", bloomDistribution);
        summary.put("difficultySuccessRate", overallDiff);
        summary.put("classGrowthTrend", classTrend);
        summary.put("riskStudents", riskStudents);
        summary.put("confidenceRanking", confidenceRanking);
        summary.put("studentResults", studentResults);

        // ── PHASE 5: Intervention plan ────────────────────────────────────
        try {
            Map<String, Object> intervention = remedialEngineService.computeClassInterventionPlan(classId, riskStudents,
                    topicHeatmap);
            summary.putAll(intervention);
        } catch (Exception ignored) {
            /* non-critical — skip if no data */ }

        return summary;
    }

    // ─── PHASE 6: Admin Educational Intelligence ──────────────────────────────

    @Cacheable(value = "adminAnalytics", key = "'institutionStats'")
    public Map<String, Object> getInstitutionPerformanceComparison() {
        List<User> students = userRepository.findAll().stream()
                .filter(u -> "STUDENT".equals(u.getRole())).toList();

        Map<String, List<Double>> institutionScores = new HashMap<>();
        for (User s : students) {
            List<ProgressCard> cards = progressCardRepository.findByStudentId(s.getId());
            if (cards.isEmpty())
                continue;
            String inst = s.getInstitution() != null ? s.getInstitution() : "Unknown";
            double avg = cards.stream().mapToDouble(ProgressCard::getAcademicScore).average().orElse(0);
            institutionScores.computeIfAbsent(inst, k -> new ArrayList<>()).add(avg);
        }

        Map<String, Double> institutionAvg = new HashMap<>();
        for (Map.Entry<String, List<Double>> e : institutionScores.entrySet()) {
            institutionAvg.put(e.getKey(), round(
                    e.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0)));
        }
        return Map.of("institutionPerformance", institutionAvg);
    }

    @Cacheable(value = "adminAnalytics", key = "'competencyStats'")
    public Map<String, Object> getCompetencyGapAnalysis() {
        List<Question> allQuestions = questionRepository.findAll();
        Map<String, Long> competencyQuestionCount = allQuestions.stream()
                .filter(q -> q.getCompetencyCode() != null)
                .collect(Collectors.groupingBy(Question::getCompetencyCode, Collectors.counting()));

        List<StudentResponse> allResponses = studentResponseRepository.findAll();
        Map<String, Long> competencyCorrect = new HashMap<>();
        Map<String, Long> competencyTotal = new HashMap<>();
        for (StudentResponse r : allResponses) {
            String code = r.getQuestion().getCompetencyCode();
            if (code == null)
                continue;
            competencyTotal.merge(code, 1L, Long::sum);
            if (Boolean.TRUE.equals(r.getIsCorrect()))
                competencyCorrect.merge(code, 1L, Long::sum);
        }

        Map<String, Double> competencyGap = new HashMap<>();
        for (String code : competencyTotal.keySet()) {
            long tot = competencyTotal.get(code);
            long cor = competencyCorrect.getOrDefault(code, 0L);
            competencyGap.put(code, round(100 - (tot > 0 ? (double) cor / tot * 100 : 0)));
        }
        return Map.of("competencyGap", competencyGap, "competencyQuestionCount", competencyQuestionCount);
    }

    @Cacheable(value = "adminAnalytics", key = "'trendStats'")
    public Map<String, Object> getPerformanceTrendLine() {
        List<Exam> allExams = examRepository.findAll().stream()
                .filter(e -> "COMPLETED".equals(e.getStatus()) && e.getEndTime() != null)
                .sorted(Comparator.comparing(Exam::getEndTime))
                .toList();

        Map<String, List<Integer>> dateScores = new LinkedHashMap<>();
        for (Exam exam : allExams) {
            String date = exam.getEndTime().toLocalDate().toString();
            dateScores.computeIfAbsent(date, k -> new ArrayList<>()).add(exam.getScore());
        }

        List<Map<String, Object>> trend = dateScores.entrySet().stream().map(e -> {
            double avg = e.getValue().stream().mapToInt(Integer::intValue).average().orElse(0);
            Map<String, Object> m = new HashMap<>();
            m.put("date", e.getKey());
            m.put("avgScore", round(avg));
            m.put("count", e.getValue().size());
            return m;
        }).collect(Collectors.toList());

        return Map.of("performanceTrend", trend);
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    private Map<String, Double> computeTopicMastery(List<Exam> exams) {
        Map<String, Integer> correct = new HashMap<>();
        Map<String, Integer> total = new HashMap<>();
        for (Exam exam : exams) {
            for (Map.Entry<String, Integer> e : exam.getTopicTotal().entrySet()) {
                total.merge(e.getKey(), e.getValue(), Integer::sum);
                correct.merge(e.getKey(), exam.getTopicCorrect().getOrDefault(e.getKey(), 0), Integer::sum);
            }
        }
        Map<String, Double> mastery = new HashMap<>();
        for (String topic : total.keySet()) {
            mastery.put(topic, round(total.get(topic) > 0
                    ? (double) correct.getOrDefault(topic, 0) / total.get(topic) * 100
                    : 0));
        }
        return mastery;
    }

    private Map<String, Double> computeBloomDistribution(List<Exam> exams) {
        Map<String, Integer> correct = new HashMap<>();
        Map<String, Integer> total = new HashMap<>();
        for (Exam exam : exams) {
            for (Map.Entry<String, Integer> e : exam.getBloomTotal().entrySet()) {
                total.merge(e.getKey(), e.getValue(), Integer::sum);
                correct.merge(e.getKey(), exam.getBloomCorrect().getOrDefault(e.getKey(), 0), Integer::sum);
            }
        }
        Map<String, Double> dist = new LinkedHashMap<>();
        for (String bloom : List.of("Remember", "Understand", "Apply", "Analyze")) {
            int tot = total.getOrDefault(bloom, 0);
            dist.put(bloom, tot > 0 ? round((double) correct.getOrDefault(bloom, 0) / tot * 100) : 0.0);
        }
        return dist;
    }

    private Map<String, Double> computeDifficultySuccessRate(Long studentId) {
        List<Exam> exams = examRepository.findByUserId(studentId);
        Map<String, Integer> correct = new HashMap<>();
        Map<String, Integer> total = new HashMap<>();
        for (Exam exam : exams) {
            for (StudentResponse r : studentResponseRepository.findByExamId(exam.getId())) {
                String diff = r.getQuestion().getDifficulty();
                total.merge(diff, 1, Integer::sum);
                if (Boolean.TRUE.equals(r.getIsCorrect()))
                    correct.merge(diff, 1, Integer::sum);
            }
        }
        Map<String, Double> rates = new LinkedHashMap<>();
        for (String diff : List.of("Easy", "Medium", "Hard")) {
            int tot = total.getOrDefault(diff, 0);
            rates.put(diff, tot > 0 ? round((double) correct.getOrDefault(diff, 0) / tot * 100) : 0.0);
        }
        return rates;
    }

    private List<Map<String, Object>> buildClassGrowthTrend(List<Exam> exams) {
        Map<String, List<Integer>> dateScores = new LinkedHashMap<>();
        exams.stream()
                .filter(e -> e.getEndTime() != null)
                .sorted(Comparator.comparing(Exam::getEndTime))
                .forEach(e -> {
                    String date = e.getEndTime().toLocalDate().toString();
                    dateScores.computeIfAbsent(date, k -> new ArrayList<>()).add(e.getScore());
                });
        return dateScores.entrySet().stream().map(e -> {
            double avg = e.getValue().stream().mapToInt(Integer::intValue).average().orElse(0);
            Map<String, Object> m = new HashMap<>();
            m.put("date", e.getKey());
            m.put("avgScore", round(avg));
            return m;
        }).collect(Collectors.toList());
    }

    private List<Map<String, Object>> buildRiskStudentList(Set<Long> studentIds) {
        List<Map<String, Object>> riskList = new ArrayList<>();
        for (Long id : studentIds) {
            List<ProgressCard> cards = progressCardRepository.findByStudentIdOrderByGeneratedAtDesc(id);
            if (cards.isEmpty())
                continue;
            ProgressCard latest = cards.get(0);
            if ("HIGH".equals(latest.getRiskIndicator()) || "MEDIUM".equals(latest.getRiskIndicator())) {
                Map<String, Object> m = new HashMap<>();
                m.put("studentId", id);
                m.put("studentName", latest.getStudent().getName());
                m.put("riskIndicator", latest.getRiskIndicator());
                m.put("riskScore", latest.getRiskScore());
                m.put("academicScore", latest.getAcademicScore());
                m.put("confidenceScore", latest.getConfidenceScore());
                riskList.add(m);
            }
        }
        riskList.sort((a, b) -> Double.compare((Double) b.get("riskScore"), (Double) a.get("riskScore")));
        return riskList;
    }

    /**
     * Builds a confidence ranking across all students in a class.
     * Sorted descending by confidenceScore from their latest progress card.
     */
    private List<Map<String, Object>> buildConfidenceRanking(Set<Long> studentIds) {
        List<Map<String, Object>> ranking = new ArrayList<>();
        for (Long id : studentIds) {
            List<ProgressCard> cards = progressCardRepository.findByStudentIdOrderByGeneratedAtDesc(id);
            if (cards.isEmpty())
                continue;
            ProgressCard latest = cards.get(0);
            Map<String, Object> m = new HashMap<>();
            m.put("studentName", latest.getStudent().getName());
            m.put("confidenceScore", latest.getConfidenceScore());
            m.put("academicScore", latest.getAcademicScore());
            m.put("riskIndicator", latest.getRiskIndicator());
            ranking.add(m);
        }
        ranking.sort((a, b) -> Double.compare(
                (Double) b.get("confidenceScore"), (Double) a.get("confidenceScore")));
        return ranking;
    }

    // ─── PHASE 11: Longitudinal Intelligence Engine ──────────────────────────

    public StudentLearningProfile computeLongitudinalMetrics(Long studentId) {
        User student = userRepository.findById(studentId).orElse(null);
        if (student == null)
            return null;

        List<Exam> lastExams = examRepository.findByUserId(studentId).stream()
                .filter(e -> "COMPLETED".equals(e.getStatus()))
                .sorted(Comparator.comparing(Exam::getEndTime).reversed())
                .limit(5)
                .collect(Collectors.toList());

        if (lastExams.size() < 2)
            return null;

        Collections.reverse(lastExams); // Oldest to newest

        StudentLearningProfile profile = studentLearningProfileRepository.findByStudentId(studentId)
                .orElse(new StudentLearningProfile());
        profile.setStudent(student);

        // 1. Learning Stability Index (Inverse of variance)
        List<Integer> scores = lastExams.stream().map(Exam::getScore).collect(Collectors.toList());
        double mean = scores.stream().mapToDouble(Integer::doubleValue).average().orElse(0);
        double variance = scores.stream()
                .mapToDouble(s -> Math.pow(s - mean, 2))
                .average().orElse(0);
        double stdDev = Math.sqrt(variance);
        profile.setLearningStabilityIndex(Math.max(0, round(100 - (stdDev * 5))));

        // 2. Retention Score (Mastery consistency)
        // Check if topics mastered in earlier exams are still handled well in later
        // ones
        double retention = computeRetention(lastExams);
        profile.setRetentionScore(round(retention));

        // 3. Acceleration Score (Rate of improvement)
        double firstAvg = lastExams.get(0).getScore();
        double lastAvg = lastExams.get(lastExams.size() - 1).getScore();
        double acceleration = ((lastAvg - firstAvg) / 100.0) * 100;
        profile.setAccelerationScore(Math.min(100, Math.max(0, 50 + acceleration)));

        // 4. Cognitive Trend
        String trend = "STABLE";
        if (lastAvg > firstAvg + 10)
            trend = "IMPROVING";
        else if (lastAvg < firstAvg - 10)
            trend = "DECLINING";
        profile.setCognitiveTrend(trend);

        profile.setAvgAcademicPerformance(round(mean));
        profile.setLastUpdated(LocalDateTime.now());

        return studentLearningProfileRepository.save(profile);
    }

    private double computeRetention(List<Exam> exams) {
        if (exams.size() < 2)
            return 100.0;

        // Simple logic: If score drops significantly between consecutive exams,
        // retention is lower
        double totalRetention = 0;
        for (int i = 1; i < exams.size(); i++) {
            double prev = exams.get(i - 1).getScore();
            double curr = exams.get(i).getScore();
            if (curr >= prev)
                totalRetention += 100;
            else
                totalRetention += Math.max(0, 100 - (prev - curr) * 2);
        }
        return totalRetention / (exams.size() - 1);
    }

    private double round(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
