package com.parakh.backend.dto;

import java.util.List;

public class LearningPathDTO {
    private String weakestTopic;
    private String riskCategory;
    private String overallStrategy;
    private List<WeekPlan> weekPlans;

    public LearningPathDTO() {
    }

    public LearningPathDTO(String weakestTopic, String riskCategory, String overallStrategy, List<WeekPlan> weekPlans) {
        this.weakestTopic = weakestTopic;
        this.riskCategory = riskCategory;
        this.overallStrategy = overallStrategy;
        this.weekPlans = weekPlans;
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

    public List<WeekPlan> getWeekPlans() {
        return weekPlans;
    }

    public void setWeekPlans(List<WeekPlan> weekPlans) {
        this.weekPlans = weekPlans;
    }

    public static class WeekPlan {
        private int weekNumber;
        private String focusObjective;
        private String difficultyMix;
        private String bloomProgression;
        private int practiceCount;
        private double estimatedHours;

        public WeekPlan() {
        }

        public WeekPlan(int weekNumber, String focusObjective, String difficultyMix, String bloomProgression,
                int practiceCount, double estimatedHours) {
            this.weekNumber = weekNumber;
            this.focusObjective = focusObjective;
            this.difficultyMix = difficultyMix;
            this.bloomProgression = bloomProgression;
            this.practiceCount = practiceCount;
            this.estimatedHours = estimatedHours;
        }

        public int getWeekNumber() {
            return weekNumber;
        }

        public void setWeekNumber(int weekNumber) {
            this.weekNumber = weekNumber;
        }

        public String getFocusObjective() {
            return focusObjective;
        }

        public void setFocusObjective(String focusObjective) {
            this.focusObjective = focusObjective;
        }

        public String getDifficultyMix() {
            return difficultyMix;
        }

        public void setDifficultyMix(String difficultyMix) {
            this.difficultyMix = difficultyMix;
        }

        public String getBloomProgression() {
            return bloomProgression;
        }

        public void setBloomProgression(String bloomProgression) {
            this.bloomProgression = bloomProgression;
        }

        public int getPracticeCount() {
            return practiceCount;
        }

        public void setPracticeCount(int practiceCount) {
            this.practiceCount = practiceCount;
        }

        public double getEstimatedHours() {
            return estimatedHours;
        }

        public void setEstimatedHours(double estimatedHours) {
            this.estimatedHours = estimatedHours;
        }
    }
}
