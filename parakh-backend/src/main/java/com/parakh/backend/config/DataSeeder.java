package com.parakh.backend.config;

import com.parakh.backend.model.Question;
import com.parakh.backend.model.User;
import com.parakh.backend.repository.QuestionRepository;
import com.parakh.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository, QuestionRepository questionRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // Seed Users
            if (userRepository.count() == 0) {
                User student = new User("student@parakh.com", passwordEncoder.encode("password"), "Arjun Student",
                        "STUDENT", "ABC College");
                student.setStatus("APPROVED");
                userRepository.save(student);

                User teacher = new User("teacher@parakh.com", passwordEncoder.encode("password"), "Priya Teacher",
                        "TEACHER", "ABC College");
                teacher.setStatus("APPROVED");
                userRepository.save(teacher);

                User admin = new User("admin@parakh.com", passwordEncoder.encode("password"), "PR Admin", "ADMIN",
                        "Parakh HQ");
                admin.setStatus("APPROVED");
                userRepository.save(admin);

                // Add users from original UserService for backward compatibility
                User lishaanth = new User("lishaanthkumar05@gmail.com", passwordEncoder.encode("Lishaanth@2005"),
                        "Lishaanth Kumar", "ADMIN", "Legacy Inst");
                lishaanth.setStatus("APPROVED");
                userRepository.save(lishaanth);

                User rawUser = new User("user@gmail.com", passwordEncoder.encode("user@123"), "User", "STUDENT",
                        "Legacy Inst");
                rawUser.setStatus("APPROVED");
                userRepository.save(rawUser);

                System.out.println("Users seeded!");
            }

            // Seed Questions
            if (questionRepository.count() == 0) {
                seedSubjectQuestions(questionRepository, "Science");
                seedSubjectQuestions(questionRepository, "Mathematics");
                System.out.println("Questions seeded!");
            }
        };
    }

    private void seedSubjectQuestions(QuestionRepository repo, String subject) {
        // Easy Questions
        for (int i = 1; i <= 5; i++) {
            repo.save(createQuestion(subject, "Easy", "Basic Concept " + i, "A"));
        }
        // Medium Questions
        for (int i = 1; i <= 5; i++) {
            repo.save(createQuestion(subject, "Medium", "Intermediate Concept " + i, "B"));
        }
        // Hard Questions
        for (int i = 1; i <= 5; i++) {
            repo.save(createQuestion(subject, "Hard", "Advanced Concept " + i, "C"));
        }
    }

    private Question createQuestion(String subject, String difficulty, String topic, String correctOpt) {
        Question q = new Question();
        q.setContent("This is a " + difficulty + " question about " + topic + " in " + subject + ".");
        q.setOptionA("Option A Value");
        q.setOptionB("Option B Value");
        q.setOptionC("Option C Value");
        q.setOptionD("Option D Value");
        q.setCorrectOption(correctOpt);
        q.setSubject(subject);
        q.setDifficulty(difficulty);
        q.setTopic(topic);
        System.out.println("Seeding Q: " + topic);
        q.setUsageCount(0);
        return q;
    }
}
