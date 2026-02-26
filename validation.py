import requests
import json
import time

BASE_URL = "http://localhost:8081/api"
ADMIN_EMAIL = "admin@parakh.gov.in"
ADMIN_PASS = "admin123"

def log(msg):
    print(f"[*] {msg}")

def error_log(msg, res=None):
    print(f"[!] ERROR: {msg}")
    if res is not None:
        print(f"    Status: {res.status_code}")
        print(f"    Body: {res.text[:500]}")

def test_full_lifecycle():
    # ── 1. Admin Login ──────────────────────────────────────────────
    log("Admin: Logging in...")
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    if res.status_code != 200:
        error_log("Admin login failed", res)
        return
    admin_token = res.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    log("Admin: Authenticated.")

    # ── 2. Register Teacher ──────────────────────────────────────────
    log("Teacher: Registering...")
    teacher_email = f"teacher_{int(time.time())}@test.com"
    res = requests.post(f"{BASE_URL}/auth/register", json={
        "email": teacher_email,
        "password": "password123",
        "name": "Test Teacher",
        "role": "TEACHER",
        "institution": "Test Inst"
    })
    if res.status_code not in [200, 201]:
        error_log("Teacher registration failed", res)
        return
    
    # Approve Teacher
    log("Admin: Approving Teacher...")
    users_res = requests.get(f"{BASE_URL}/admin/users", headers=admin_headers)
    if users_res.status_code != 200:
        error_log("Get users failed", users_res)
        return
    
    try:
        teacher_id = next(u["id"] for u in users_res.json() if u["email"] == teacher_email)
    except Exception as e:
        error_log(f"Teacher not found in list: {e}", users_res)
        return
        
    res = requests.put(f"{BASE_URL}/admin/users/{teacher_id}/approve", headers=admin_headers)
    if res.status_code != 200:
        error_log("Teacher approval failed", res)
        return

    # Teacher Login
    log("Teacher: Logging in...")
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": teacher_email, "password": "password123"})
    if res.status_code != 200:
        error_log("Teacher login failed", res)
        return
    teacher_token = res.json()["token"]
    teacher_headers = {"Authorization": f"Bearer {teacher_token}", "Content-Type": "application/json"}
    log("Teacher: Authenticated.")

    # ── 3. Teacher: Create Question & Class ──────────────────────────
    log("Teacher: Creating Sample Question...")
    q_res = requests.post(f"{BASE_URL}/teacher/questions", headers=teacher_headers, json={
        "content": "What is the capital of India?",
        "optionA": "Mumbai", "optionB": "Delhi", "optionC": "Kolkata", "optionD": "Chennai",
        "correctOption": "B", "difficulty": "Medium", "subject": "Geography", "topic": "General"
    })
    if q_res.status_code not in [200, 201]:
        error_log("Question creation failed", q_res)
        return
    question_id = q_res.json()["id"]

    log("Teacher: Creating Class...")
    c_res = requests.post(f"{BASE_URL}/teacher/classes", headers=teacher_headers, json={
        "name": "Class 10-A", "subject": "Geography", "description": "National Geography Class"
    })
    if c_res.status_code not in [200, 201]:
        error_log("Class creation failed", c_res)
        return
    class_id = c_res.json()["id"]

    # ── 4. Register & Enroll Student ────────────────────────────────
    log("Student: Registering...")
    student_email = f"student_{int(time.time())}@test.com"
    res = requests.post(f"{BASE_URL}/auth/register", json={
        "email": student_email,
        "password": "password123",
        "name": "Test Student",
        "role": "STUDENT",
        "institution": "Test Inst"
    })
    if res.status_code not in [200, 201]:
        error_log("Student registration failed", res)
        return

    # Approve Student
    log("Admin: Approving Student...")
    users_res = requests.get(f"{BASE_URL}/admin/users", headers=admin_headers)
    try:
        student_id = next(u["id"] for u in users_res.json() if u["email"] == student_email)
    except Exception as e:
        error_log(f"Student not found in list: {e}", users_res)
        return
    requests.put(f"{BASE_URL}/admin/users/{student_id}/approve", headers=admin_headers)

    # Student Login
    log("Student: Logging in...")
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": student_email, "password": "password123"})
    if res.status_code != 200:
        error_log("Student login failed", res)
        return
    student_token = res.json()["token"]
    student_headers = {"Authorization": f"Bearer {student_token}", "Content-Type": "application/json"}
    log("Student: Authenticated.")

    # Enroll Student in Class
    log("Teacher: Enrolling Student...")
    requests.post(f"{BASE_URL}/teacher/classes/{class_id}/add-students", headers=teacher_headers, json={"email": student_email})

    # ── 5. Teacher: Create Assessment ───────────────────────────────
    log("Teacher: Creating Assessment...")
    a_res = requests.post(f"{BASE_URL}/teacher/assessments", headers=teacher_headers, json={
        "title": "National Geography Quiz",
        "classroomId": class_id,
        "type": "TOPIC",
        "durationMinutes": 30,
        "subject": "Geography",
        "topic": "General",
        "difficulty": "Easy",
        "questionCount": 1
    })
    if a_res.status_code not in [200, 201]:
        error_log("Assessment creation failed", a_res)
        return
    assessment_id = a_res.json()["id"]

    # ── 6. Student: Take Exam ────────────────────────────────────────
    log("Student: Starting Exam...")
    start_res = requests.post(f"{BASE_URL}/exam/start", headers=student_headers, json={"assessmentId": assessment_id})
    if start_res.status_code != 200:
        error_log("Failed to start exam", start_res)
        return
    exam_state = start_res.json()
    exam_id = exam_state["examId"]
    q_data = exam_state.get("nextQuestion")
    if not q_data:
        error_log("Failed to start exam: No question provided in initial state", start_res)
        return
    q_id = q_data["id"]
    log(f"Exam Started (ID: {exam_id}). First Question: {q_id}")

    # Report Violation (Tab Switch)
    log("Student: Reporting Tab Switch Violation...")
    # Update endpoint to match IntegrityController
    requests.post(f"{BASE_URL}/exam/report-integrity-event", headers=student_headers, json={
        "examId": exam_id, "eventType": "TAB_SWITCH"
    })

    # Submit Answer
    log("Student: Submitting Answer...")
    sub_res = requests.post(f"{BASE_URL}/exam/submit", headers=student_headers, json={
        "examId": exam_id, "questionId": q_id, "selectedOption": "B", "timeTakenSeconds": 10
    })
    if sub_res.status_code != 200:
        error_log("Answer submission failed", sub_res)
        return
    
    # Extract next question if available
    next_state = sub_res.json()
    if not next_state.get("examCompleted") and next_state.get("nextQuestion"):
        log(f"Next Question received: {next_state['nextQuestion']['id']}")
    log("Answer Submitted.")

    # Finish Exam
    log("Student: Finishing Exam...")
    finish_res = requests.post(f"{BASE_URL}/exam/finish", headers=student_headers, json={"examId": exam_id})
    if finish_res.status_code != 200:
        error_log("Finish exam failed", finish_res)
        return
    log(f"Exam Completed. Final State: {finish_res.json()['status']}")

    # ── 7. Verify Data ──────────────────────────────────────────────
    log("Verification: Checking Student Intelligence Report...")
    intel_res = requests.get(f"{BASE_URL}/student/my/intelligence-report", headers=student_headers)
    if intel_res.status_code != 200:
        error_log("Failed to fetch intelligence report", intel_res)
        return
    intel = intel_res.json()
    
    card = intel.get('latestProgressCard', {})
    risk = intel.get('predictive', {}).get('riskCategory', 'N/A')
    score = card.get('academicScore', 0)
    
    log(f"Intelligence Report: Risk={risk}, Score={score}%")

    if score == 100:
        log("✅ SUCCESS: Full Lifecycle Validated.")
    else:
        error_log(f"Result verification failed. Expected 100%, got {score}%")

if __name__ == "__main__":
    test_full_lifecycle()
