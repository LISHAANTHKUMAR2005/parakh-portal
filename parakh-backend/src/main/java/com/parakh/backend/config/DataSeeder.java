package com.parakh.backend.config;

import com.parakh.backend.model.Question;
import com.parakh.backend.model.User;
import com.parakh.backend.repository.QuestionRepository;
import com.parakh.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.ArrayList;
import java.util.List;

/**
 * DataSeeder — Seeds realistic questions across:
 * - 2 Subjects: Science, Mathematics
 * - 5 Topics per subject (10 total)
 * - 3 Difficulty levels: Easy / Medium / Hard
 * - 3 Bloom levels: Remember / Understand / Apply
 * - 5 questions per (topic × difficulty × bloom) combination
 * Total: 2 subjects × 5 topics × 3 diff × 3 bloom × ~1-2 Qs = ~90 questions per
 * subject
 *
 * Competency codes follow PARAKH national schema: SUBJ-TOPIC-DIFF-BLOOM
 */
@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository,
            QuestionRepository questionRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // ── Seed Admin User ────────────────────────────────────────────────
            if (userRepository.count() == 0) {
                User admin = new User("admin@parakh.gov.in",
                        passwordEncoder.encode("admin123"),
                        "System Administrator", "ADMIN",
                        "PARAKH National Assessment Centre");
                admin.setStatus("APPROVED");
                userRepository.save(admin);
                System.out.println("✅ PARAKH Admin seeded → admin@parakh.gov.in / admin123");
            }

            // ── Seed Questions ─────────────────────────────────────────────────
            if (questionRepository.count() == 0) {
                List<Question> all = new ArrayList<>();
                all.addAll(buildScienceQuestions());
                all.addAll(buildMathQuestions());
                questionRepository.saveAll(all);
                System.out.printf("✅ %d questions seeded across Science & Mathematics%n", all.size());
            }
        };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SCIENCE — 5 Topics × 3 Diff × 3 Bloom
    // Topics: Photosynthesis | Gravitation | Cell Biology | Electricity | Evolution
    // ═══════════════════════════════════════════════════════════════════════════

    private List<Question> buildScienceQuestions() {
        List<Question> qs = new ArrayList<>();

        // ── PHOTOSYNTHESIS ─────────────────────────────────────────────────────
        // Easy / Remember
        qs.add(q("Which gas is produced as a by-product of photosynthesis?",
                "Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen",
                "A", "Science", "Photosynthesis", "Easy", "Remember", "SCI-PHO-E-REM"));
        qs.add(q("Which organelle is responsible for photosynthesis in plant cells?",
                "Mitochondria", "Nucleus", "Chloroplast", "Ribosome",
                "C", "Science", "Photosynthesis", "Easy", "Remember", "SCI-PHO-E-REM"));
        // Easy / Understand
        qs.add(q("Why do plants appear green under white light?",
                "They absorb green light", "They reflect green light", "They emit green light",
                "They store green light",
                "B", "Science", "Photosynthesis", "Easy", "Understand", "SCI-PHO-E-UND"));
        // Medium / Understand
        qs.add(q("What is the role of chlorophyll in photosynthesis?",
                "It absorbs CO2", "It absorbs light energy and transfers it to reaction centres", "It stores glucose",
                "It splits water molecules",
                "B", "Science", "Photosynthesis", "Medium", "Understand", "SCI-PHO-M-UND"));
        qs.add(q("Which of the following are the raw materials for photosynthesis?",
                "Glucose and Oxygen", "CO2 and Water", "Starch and Sunlight", "Nitrogen and CO2",
                "B", "Science", "Photosynthesis", "Medium", "Understand", "SCI-PHO-M-UND"));
        // Medium / Apply
        qs.add(q("A plant is kept in a dark room for 48 hours. What will happen to its starch reserves?",
                "Increase significantly", "Remain the same", "Decrease as no photosynthesis occurs",
                "Convert to protein",
                "C", "Science", "Photosynthesis", "Medium", "Apply", "SCI-PHO-M-APP"));
        // Hard / Apply
        qs.add(q(
                "If the CO2 concentration in the atmosphere doubles, which phase of photosynthesis is MOST directly affected?",
                "Light-dependent reactions", "Calvin Cycle (Light-independent)", "Electron transport chain",
                "Photorespiration",
                "B", "Science", "Photosynthesis", "Hard", "Apply", "SCI-PHO-H-APP"));
        qs.add(q(
                "A variegated leaf (partly green, partly white) is tested for starch. Which part tests positive for starch?",
                "The white part only", "The entire leaf equally", "The green part only", "Neither part",
                "C", "Science", "Photosynthesis", "Hard", "Apply", "SCI-PHO-H-APP"));

        // ── GRAVITATION ───────────────────────────────────────────────────────
        // Easy / Remember
        qs.add(q("What is the value of acceleration due to gravity on Earth's surface?",
                "8.9 m/s²", "9.8 m/s²", "11.2 m/s²", "6.7 m/s²",
                "B", "Science", "Gravitation", "Easy", "Remember", "SCI-GRA-E-REM"));
        qs.add(q("Who formulated the Universal Law of Gravitation?",
                "Galileo Galilei", "Albert Einstein", "Isaac Newton", "Johannes Kepler",
                "C", "Science", "Gravitation", "Easy", "Remember", "SCI-GRA-E-REM"));
        // Easy / Understand
        qs.add(q("Why does the Moon not fall into the Earth despite gravitational pull?",
                "The Moon has no mass", "Its orbital velocity creates a centripetal balance",
                "Earth's gravity is too weak", "The Moon is too far away",
                "B", "Science", "Gravitation", "Easy", "Understand", "SCI-GRA-E-UND"));
        // Medium / Understand
        qs.add(q("How does gravitational force change if the distance between two masses is doubled?",
                "Doubles", "Halves", "Becomes 4 times smaller", "Remains the same",
                "C", "Science", "Gravitation", "Medium", "Understand", "SCI-GRA-M-UND"));
        // Medium / Apply
        qs.add(q("A ball is thrown vertically upward with velocity v. What is its velocity at the highest point?",
                "v", "v/2", "0", "2v",
                "C", "Science", "Gravitation", "Medium", "Apply", "SCI-GRA-M-APP"));
        qs.add(q("An object weighs 60 N on Earth. What is its approximate weight on the Moon (g_moon = g/6)?",
                "60 N", "30 N", "10 N", "120 N",
                "C", "Science", "Gravitation", "Medium", "Apply", "SCI-GRA-M-APP"));
        // Hard / Apply
        qs.add(q("A satellite orbits Earth at height h. If h doubles, how does the orbital period change? (T ∝ r^3/2)",
                "Increases by factor 2", "Increases by factor 2√2", "Decreases by factor 2", "Remains unchanged",
                "B", "Science", "Gravitation", "Hard", "Apply", "SCI-GRA-H-APP"));
        qs.add(q(
                "The escape velocity from Earth is ~11.2 km/s. If Earth's radius doubled but mass stayed same, escape velocity would be?",
                "5.6 km/s", "11.2 km/s", "22.4 km/s", "7.9 km/s",
                "D", "Science", "Gravitation", "Hard", "Apply", "SCI-GRA-H-APP"));

        // ── CELL BIOLOGY ─────────────────────────────────────────────────────
        // Easy / Remember
        qs.add(q("Which is the powerhouse of the cell?",
                "Nucleus", "Ribosome", "Mitochondria", "Vacuole",
                "C", "Science", "Cell Biology", "Easy", "Remember", "SCI-CEL-E-REM"));
        qs.add(q("Which cell organelle is known as the 'suicide bag' of the cell?",
                "Lysosome", "Golgi apparatus", "Endoplasmic reticulum", "Centriole",
                "A", "Science", "Cell Biology", "Easy", "Remember", "SCI-CEL-E-REM"));
        // Easy / Understand
        qs.add(q("Why do animal cells burst when placed in hypotonic solution, but plant cells do not?",
                "Animal cells have more water", "Plant cells have a rigid cell wall",
                "Animal cells have more mitochondria", "Plant cells have smaller vacuoles",
                "B", "Science", "Cell Biology", "Easy", "Understand", "SCI-CEL-E-UND"));
        // Medium / Understand
        qs.add(q("What is the function of the Golgi apparatus?",
                "Produces energy via ATP", "Modifies, packages, and dispatches proteins", "Synthesises DNA",
                "Controls cell division",
                "B", "Science", "Cell Biology", "Medium", "Understand", "SCI-CEL-M-UND"));
        // Medium / Apply
        qs.add(q("A cell placed in a concentrated salt solution shrinks. This phenomenon is called?",
                "Diffusion", "Osmosis causing plasmolysis", "Active transport", "Imbibition",
                "B", "Science", "Cell Biology", "Medium", "Apply", "SCI-CEL-M-APP"));
        qs.add(q("If the mitochondria of a cell are destroyed, which metabolic process will be MOST affected?",
                "Protein synthesis", "DNA replication", "Aerobic respiration", "Photosynthesis",
                "C", "Science", "Cell Biology", "Medium", "Apply", "SCI-CEL-M-APP"));
        // Hard / Apply
        qs.add(q("A cell's ER is destroyed. Which of these will be MOST disrupted?",
                "Intracellular digestion", "Protein folding and lipid synthesis", "DNA transcription",
                "Cell wall formation",
                "B", "Science", "Cell Biology", "Hard", "Apply", "SCI-CEL-H-APP"));
        qs.add(q(
                "Which structural difference allows prokaryotic cells to be directly targeted by antibiotics without harming human cells?",
                "Prokaryotes lack mitochondria", "Prokaryotes have 70S ribosomes; human cells have 80S",
                "Prokaryotes have no DNA", "Prokaryotes are smaller",
                "B", "Science", "Cell Biology", "Hard", "Apply", "SCI-CEL-H-APP"));

        // ── ELECTRICITY ──────────────────────────────────────────────────────
        // Easy / Remember
        qs.add(q("What is the SI unit of electric current?",
                "Volt", "Ohm", "Ampere", "Watt",
                "C", "Science", "Electricity", "Easy", "Remember", "SCI-ELE-E-REM"));
        qs.add(q("What is Ohm's Law?",
                "P = IV", "V = IR", "E = mc²", "F = ma",
                "B", "Science", "Electricity", "Easy", "Remember", "SCI-ELE-E-REM"));
        // Easy / Understand
        qs.add(q("Why is copper used in electrical wiring?",
                "It is cheap", "It is a good conductor with low resistance", "It has high density",
                "It is non-flammable",
                "B", "Science", "Electricity", "Easy", "Understand", "SCI-ELE-E-UND"));
        // Medium / Understand
        qs.add(q("Two resistors R1 and R2 are connected in parallel. The equivalent resistance is?",
                "(R1 + R2)", "R1 × R2 / (R1 + R2)", "R1 - R2", "(R1 + R2) / 2",
                "B", "Science", "Electricity", "Medium", "Understand", "SCI-ELE-M-UND"));
        // Medium / Apply
        qs.add(q("A 60W bulb is used for 5 hours. What is the electrical energy consumed in kWh?",
                "0.3 kWh", "0.6 kWh", "300 kWh", "60 kWh",
                "A", "Science", "Electricity", "Medium", "Apply", "SCI-ELE-M-APP"));
        qs.add(q("Three bulbs of 40W, 60W, and 100W are connected in series. Which one will glow brightest?",
                "100W bulb", "60W bulb", "40W bulb (highest resistance)", "All equally bright",
                "C", "Science", "Electricity", "Medium", "Apply", "SCI-ELE-M-APP"));
        // Hard / Apply
        qs.add(q("A 12V battery drives a circuit with two 6Ω resistors in parallel. What is the total current drawn?",
                "1 A", "2 A", "4 A", "6 A",
                "C", "Science", "Electricity", "Hard", "Apply", "SCI-ELE-H-APP"));
        qs.add(q("An electric heater draws 4 A from a 230 V supply. Its resistance and power are?",
                "R=57.5Ω, P=920W", "R=920Ω, P=57.5W", "R=57.5Ω, P=57.5W", "R=57.5Ω, P=1150W",
                "A", "Science", "Electricity", "Hard", "Apply", "SCI-ELE-H-APP"));

        // ── EVOLUTION ─────────────────────────────────────────────────────────
        // Easy / Remember
        qs.add(q("Who proposed the theory of natural selection?",
                "Gregor Mendel", "Charles Darwin", "Jean-Baptiste Lamarck", "Louis Pasteur",
                "B", "Science", "Evolution", "Easy", "Remember", "SCI-EVO-E-REM"));
        qs.add(q("What do we call features inherited from a common ancestor called?",
                "Analogous organs", "Homologous organs", "Vestigial organs", "Rudimentary organs",
                "B", "Science", "Evolution", "Easy", "Remember", "SCI-EVO-E-REM"));
        // Easy / Understand
        qs.add(q("Why are fossils important evidence for evolution?",
                "They show that organisms were always the same",
                "They provide a record of past life and transitions between species", "They disprove natural selection",
                "They show that DNA has not changed",
                "B", "Science", "Evolution", "Easy", "Understand", "SCI-EVO-E-UND"));
        // Medium / Understand
        qs.add(q("The wings of a bat and the arm of a human are examples of which type of organs?",
                "Analogous organs", "Vestigial organs", "Homologous organs", "Rudimentary organs",
                "C", "Science", "Evolution", "Medium", "Understand", "SCI-EVO-M-UND"));
        // Medium / Apply
        qs.add(q(
                "In a population of beetles, green ones survive better in a grassy environment. Over generations, the population becomes predominantly green. This is an example of?",
                "Artificial selection", "Genetic drift", "Natural selection", "Mutation alone",
                "C", "Science", "Evolution", "Medium", "Apply", "SCI-EVO-M-APP"));
        qs.add(q(
                "If a species colonises two isolated islands with different food sources, over many generations what is likely to occur?",
                "Both populations remain identical", "Both become extinct",
                "Both diverge into distinct species via natural selection", "Gene flow keeps them identical",
                "C", "Science", "Evolution", "Medium", "Apply", "SCI-EVO-M-APP"));
        // Hard / Apply
        qs.add(q(
                "A population has 36% individuals showing a recessive trait (aa). Using Hardy-Weinberg, what is the frequency of the dominant allele A?",
                "0.4", "0.6", "0.36", "0.64",
                "B", "Science", "Evolution", "Hard", "Apply", "SCI-EVO-H-APP"));
        qs.add(q(
                "Which evolutionary mechanism is MOST responsible for rapid trait change in very small isolated populations?",
                "Natural selection", "Genetic drift", "Sexual selection", "Mutation pressure",
                "B", "Science", "Evolution", "Hard", "Apply", "SCI-EVO-H-APP"));

        return qs;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MATHEMATICS — 5 Topics × 3 Diff × 3 Bloom
    // Topics: Algebra | Geometry | Statistics | Trigonometry | Number Theory
    // ═══════════════════════════════════════════════════════════════════════════

    private List<Question> buildMathQuestions() {
        List<Question> qs = new ArrayList<>();

        // ── ALGEBRA ──────────────────────────────────────────────────────────
        // Easy / Remember
        qs.add(q("What is the value of x in the equation 2x + 6 = 14?",
                "3", "4", "7", "8",
                "B", "Mathematics", "Algebra", "Easy", "Remember", "MAT-ALG-E-REM"));
        qs.add(q("Which of the following is the quadratic formula?",
                "x = -b ± √(b²-4ac) / 2a", "x = b ± √(b²+4ac) / 2a", "x = -b / 2a", "x = √(b²-4ac)",
                "A", "Mathematics", "Algebra", "Easy", "Remember", "MAT-ALG-E-REM"));
        // Easy / Understand
        qs.add(q("What is the degree of the polynomial 3x³ + 2x² - x + 7?",
                "7", "3", "2", "4",
                "B", "Mathematics", "Algebra", "Easy", "Understand", "MAT-ALG-E-UND"));
        // Medium / Understand
        qs.add(q("If α and β are roots of x² - 5x + 6 = 0, what is α + β?",
                "6", "-5", "5", "-6",
                "C", "Mathematics", "Algebra", "Medium", "Understand", "MAT-ALG-M-UND"));
        // Medium / Apply
        qs.add(q("Solve for x: |2x - 3| = 7",
                "x = 5 or x = -2", "x = 5 or x = 2", "x = -5 or x = 2", "x = 5 only",
                "A", "Mathematics", "Algebra", "Medium", "Apply", "MAT-ALG-M-APP"));
        qs.add(q("The sum of a number and its reciprocal is 2.5. What is the number?",
                "2", "2 or 0.5", "1.5", "0.5",
                "B", "Mathematics", "Algebra", "Medium", "Apply", "MAT-ALG-M-APP"));
        // Hard / Apply
        qs.add(q("For the system 3x + 2y = 12, 5x - 3y = 1, find x + y.",
                "3", "4", "5", "6",
                "C", "Mathematics", "Algebra", "Hard", "Apply", "MAT-ALG-H-APP"));
        qs.add(q("If f(x) = x² + px + q has roots 2 and -3 and f(1) = k, find k.",
                "-6", "-4", "-2", "0",
                "B", "Mathematics", "Algebra", "Hard", "Apply", "MAT-ALG-H-APP"));

        // ── GEOMETRY ─────────────────────────────────────────────────────────
        // Easy / Remember
        qs.add(q("What is the sum of interior angles of a triangle?",
                "90°", "180°", "270°", "360°",
                "B", "Mathematics", "Geometry", "Easy", "Remember", "MAT-GEO-E-REM"));
        qs.add(q("What is the formula for the area of a circle with radius r?",
                "2πr", "πr²", "πd", "4πr²",
                "B", "Mathematics", "Geometry", "Easy", "Remember", "MAT-GEO-E-REM"));
        // Easy / Understand
        qs.add(q("Two parallel lines are cut by a transversal. Alternate interior angles are?",
                "Supplementary", "Complementary", "Equal", "Unrelated",
                "C", "Mathematics", "Geometry", "Easy", "Understand", "MAT-GEO-E-UND"));
        // Medium / Understand
        qs.add(q("In a right-angled triangle with legs 3 cm and 4 cm, what is the hypotenuse?",
                "6 cm", "7 cm", "5 cm", "25 cm",
                "C", "Mathematics", "Geometry", "Medium", "Understand", "MAT-GEO-M-UND"));
        // Medium / Apply
        qs.add(q("A rectangle has perimeter 54 cm and length 15 cm. What is its area?",
                "180 cm²", "270 cm²", "144 cm²", "225 cm²",
                "A", "Mathematics", "Geometry", "Medium", "Apply", "MAT-GEO-M-APP"));
        qs.add(q("A cone has radius 7 cm and height 24 cm. What is its slant height?",
                "25 cm", "31 cm", "17 cm", "20 cm",
                "A", "Mathematics", "Geometry", "Medium", "Apply", "MAT-GEO-M-APP"));
        // Hard / Apply
        qs.add(q("The diagonals of a rhombus are 10 cm and 24 cm. What is its perimeter?",
                "52 cm", "60 cm", "68 cm", "48 cm",
                "A", "Mathematics", "Geometry", "Hard", "Apply", "MAT-GEO-H-APP"));
        qs.add(q(
                "A sphere and a cylinder have equal radii r and the cylinder's height = 2r. Ratio of their volumes is?",
                "2:3", "4:3", "3:4", "2:1",
                "A", "Mathematics", "Geometry", "Hard", "Apply", "MAT-GEO-H-APP"));

        // ── STATISTICS ────────────────────────────────────────────────────────
        // Easy / Remember
        qs.add(q("What is the median of {3, 5, 7, 9, 11}?",
                "5", "7", "9", "11",
                "B", "Mathematics", "Statistics", "Easy", "Remember", "MAT-STA-E-REM"));
        qs.add(q("What is the mode of {2, 3, 3, 5, 7, 7, 7}?",
                "3", "5", "7", "2",
                "C", "Mathematics", "Statistics", "Easy", "Remember", "MAT-STA-E-REM"));
        // Easy / Understand
        qs.add(q("If a dataset has mean 50 and median 50, it is most likely?",
                "Skewed right", "Skewed left", "Symmetrically distributed", "Bimodal",
                "C", "Mathematics", "Statistics", "Easy", "Understand", "MAT-STA-E-UND"));
        // Medium / Understand
        qs.add(q(
                "The mean of 5 numbers is 12. If one number is removed, the mean becomes 10. What was the removed number?",
                "18", "20", "22", "16",
                "B", "Mathematics", "Statistics", "Medium", "Understand", "MAT-STA-M-UND"));
        // Medium / Apply
        qs.add(q("Class intervals 10-20, 20-30, 30-40 have frequencies 4, 8, 6. What is the modal class?",
                "10-20", "20-30", "30-40", "All equal",
                "B", "Mathematics", "Statistics", "Medium", "Apply", "MAT-STA-M-APP"));
        qs.add(q("A die is rolled twice. What is the probability that the sum equals 7?",
                "1/6", "7/36", "5/36", "6/36",
                "A", "Mathematics", "Statistics", "Medium", "Apply", "MAT-STA-M-APP"));
        // Hard / Apply
        qs.add(q(
                "If in a normal distribution, mean = 100 and SD = 15, what % of data lies between 70 and 130 (use 68-95-99.7 rule)?",
                "68%", "95%", "99.7%", "50%",
                "B", "Mathematics", "Statistics", "Hard", "Apply", "MAT-STA-H-APP"));
        qs.add(q("A bag has 4 red and 6 blue balls. Two balls are drawn without replacement. Probability both are red?",
                "2/15", "4/10", "1/6", "2/9",
                "A", "Mathematics", "Statistics", "Hard", "Apply", "MAT-STA-H-APP"));

        // ── TRIGONOMETRY ──────────────────────────────────────────────────────
        // Easy / Remember
        qs.add(q("What is the value of sin(30°)?",
                "√3/2", "1/2", "1/√2", "1",
                "B", "Mathematics", "Trigonometry", "Easy", "Remember", "MAT-TRI-E-REM"));
        qs.add(q("Which trigonometric identity states sin²θ + cos²θ = ?",
                "0", "2", "1", "sin 2θ",
                "C", "Mathematics", "Trigonometry", "Easy", "Remember", "MAT-TRI-E-REM"));
        // Easy / Understand
        qs.add(q("In a right triangle, if sinθ = 3/5, what is cosθ?",
                "4/5", "3/4", "5/3", "5/4",
                "A", "Mathematics", "Trigonometry", "Easy", "Understand", "MAT-TRI-E-UND"));
        // Medium / Understand
        qs.add(q("What is tan(45°) + cos(60°)?",
                "1", "1.5", "0.5", "2",
                "B", "Mathematics", "Trigonometry", "Medium", "Understand", "MAT-TRI-M-UND"));
        // Medium / Apply
        qs.add(q("A tower casts a shadow of 40m when the angle of elevation of the sun is 30°. Height of the tower?",
                "40/√3 m", "40√3 m", "40 m", "20√3 m",
                "A", "Mathematics", "Trigonometry", "Medium", "Apply", "MAT-TRI-M-APP"));
        qs.add(q("If sin(A-B) = 0 and cos(A+B) = 0, find A and B.",
                "A=45°, B=45°", "A=0°, B=90°", "A=60°, B=30°", "A=90°, B=0°",
                "A", "Mathematics", "Trigonometry", "Medium", "Apply", "MAT-TRI-M-APP"));
        // Hard / Apply
        qs.add(q("Prove: (tan θ + sin θ) / (tan θ – sin θ) = (sec θ + 1) / (sec θ – 1). The LHS equals?",
                "(1 + cos θ) / (1 - cos θ)", "(sec θ + 1) / (sec θ - 1)", "Both A and B are equal",
                "Cannot be simplified",
                "C", "Mathematics", "Trigonometry", "Hard", "Apply", "MAT-TRI-H-APP"));
        qs.add(q(
                "From the top of a 75m high cliff, the angles of depression of two ships are 30° and 45°. Distance between ships?",
                "75(√3 - 1) m", "75(√3 + 1) m", "75√3 m", "75 m",
                "A", "Mathematics", "Trigonometry", "Hard", "Apply", "MAT-TRI-H-APP"));

        // ── NUMBER THEORY ─────────────────────────────────────────────────────
        // Easy / Remember
        qs.add(q("What is the HCF of 12 and 18?",
                "3", "6", "9", "12",
                "B", "Mathematics", "Number Theory", "Easy", "Remember", "MAT-NUM-E-REM"));
        qs.add(q("Which of the following is a prime number?",
                "1", "15", "17", "21",
                "C", "Mathematics", "Number Theory", "Easy", "Remember", "MAT-NUM-E-REM"));
        // Easy / Understand
        qs.add(q("If LCM(a, b) = 60 and HCF(a, b) = 4, what is a × b?",
                "15", "64", "240", "120",
                "C", "Mathematics", "Number Theory", "Easy", "Understand", "MAT-NUM-E-UND"));
        // Medium / Understand
        qs.add(q("What is the sum of the first 50 natural numbers?",
                "1225", "1275", "2550", "2500",
                "B", "Mathematics", "Number Theory", "Medium", "Understand", "MAT-NUM-M-UND"));
        // Medium / Apply
        qs.add(q("Find the largest 3-digit number divisible by both 8 and 12.",
                "984", "996", "972", "960",
                "A", "Mathematics", "Number Theory", "Medium", "Apply", "MAT-NUM-M-APP"));
        qs.add(q(
                "Euclid's division algorithm states that for any two positive integers a and b, there exist unique integers q and r such that?",
                "a = b × q + r, 0 ≤ r < b", "a = b + q × r", "a × b = q + r", "a = q × b - r",
                "A", "Mathematics", "Number Theory", "Medium", "Apply", "MAT-NUM-M-APP"));
        // Hard / Apply
        qs.add(q("Prove that √5 is irrational. The key assumption in the contradiction proof is?",
                "√5 = p/q where p and q have common factor 5", "√5 is rational and p,q are co-prime integers",
                "p² is divisible by 5, so p is divisible by 5", "Both B and C together lead to contradiction",
                "D", "Mathematics", "Number Theory", "Hard", "Apply", "MAT-NUM-H-APP"));
        qs.add(q("What is the remainder when 7^100 is divided by 48 (using Euler's theorem)?",
                "1", "7", "7^4", "0",
                "A", "Mathematics", "Number Theory", "Hard", "Apply", "MAT-NUM-H-APP"));

        return qs;
    }

    // ── Helper factory ─────────────────────────────────────────────────────────
    private Question q(String content, String a, String b, String c, String d,
            String correct, String subject, String topic,
            String difficulty, String bloom, String competency) {
        Question q = new Question();
        q.setContent(content);
        q.setOptionA(a);
        q.setOptionB(b);
        q.setOptionC(c);
        q.setOptionD(d);
        q.setCorrectOption(correct);
        q.setSubject(subject);
        q.setTopic(topic);
        q.setDifficulty(difficulty);
        q.setBloomLevel(bloom);
        q.setCompetencyCode(competency);
        q.setLearningOutcomeTag(bloom + " level: " + topic);
        q.setUsageCount(0);
        return q;
    }
}
