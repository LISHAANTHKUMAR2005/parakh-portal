
import requests
import json
import time
import random

BASE_URL = "http://localhost:8081/api"
ADMIN_EMAIL = "admin@parakh.gov.in"
ADMIN_PASS = "admin123"

def setup_admin():
    print("[*] Admin Login...")
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    if res.status_code != 200:
        print(f"[!] Admin login failed: {res.status_code} {res.text}")
        raise Exception("Admin login failed")
    token = res.json()["token"]
    print("[+] Admin Authenticated.")
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def approve_user(admin_headers, email):
    res = requests.get(f"{BASE_URL}/admin/users", headers=admin_headers)
    if res.status_code != 200:
        print(f"[!] Failed to fetch users: {res.status_code}")
        return
    data = res.json()
    users = data["content"] if isinstance(data, dict) and "content" in data else data
    target = next((u for u in users if u["email"] == email), None)
    if target:
        requests.put(f"{BASE_URL}/admin/users/{target['id']}/approve", headers=admin_headers)
        print(f"[+] User {email} approved.")
    else:
        print(f"[!] User {email} not found in first page.")

def create_mock_questions(headers, subject, topic):
    print(f"[*] Seeding questions for {subject}...")
    questions = []
    difficulties = ["Easy", "Medium", "Hard"]
    blooms = ["Remember", "Understand", "Apply", "Analyze"]
    for d in difficulties:
        for b in blooms:
            res = requests.post(f"{BASE_URL}/teacher/questions", headers=headers, json={
                "content": f"Test Question {d} {b}",
                "optionA": "Correct", "optionB": "Wrong1", "optionC": "Wrong2", "optionD": "Wrong3",
                "correctOption": "A", "difficulty": d, "bloomLevel": b,
                "subject": subject, "topic": topic
            })
            if res.status_code in [200, 201]:
                questions.append(res.json())
    print(f"[+] {len(questions)} questions seeded.")
    return questions

def run_adaptive_test(student_headers, assessment_id, scenario_name, behavior_func):
    print(f"\n>>> TESTING SCENARIO: {scenario_name}")
    res = requests.post(f"{BASE_URL}/exam/start", headers=student_headers, json={"assessmentId": assessment_id})
    if res.status_code != 200:
        print(f"[!] Failed to start exam: {res.text}")
        return
    
    state = res.json()
    exam_id = state["examId"]
    print(f"[*] Exam ID: {exam_id}")
    
    while state and not state.get("examCompleted"):
        q = state.get("nextQuestion")
        if not q: break
        
        is_correct, time_taken = behavior_func(q)
        
        res = requests.post(f"{BASE_URL}/exam/submit", headers=student_headers, json={
            "examId": exam_id,
            "questionId": q["id"],
            "selectedOption": "A" if is_correct else "B",
            "timeTakenSeconds": time_taken
        })
        if res.status_code != 200:
            print(f"[!] Submit failed: {res.text}")
            break
        state = res.json()
        nxt = state.get("nextQuestion") if state else None
        nxt_diff = nxt.get("difficulty", "N/A") if nxt else "N/A"
        print(f"  Q: {q['id']} | diff={q['difficulty']} bloom={q['bloomLevel']} | choice={'CORRECT' if is_correct else 'WRONG'} time={time_taken}s | nextDiff={nxt_diff}")

    if state:
        print(f"  Final State: score={state.get('currentScore')} status={state.get('status')}")
    else:
        print("  Final State: Empty")

def main():
    try:
        admin_headers = setup_admin()
        ts = int(time.time())
        
        # Setup Teacher
        te = f"teach_{ts}@test.com"
        requests.post(f"{BASE_URL}/auth/register", json={"email": te, "password": "pass", "name": "Prof T", "role": "TEACHER"})
        approve_user(admin_headers, te)
        res = requests.post(f"{BASE_URL}/auth/login", json={"email": te, "password": "pass"})
        teacher_headers = {"Authorization": f"Bearer {res.json()['token']}", "Content-Type": "application/json"}
        
        subject = f"Adaptive_{ts}"
        topic = "Logic"
        create_mock_questions(teacher_headers, subject, topic)
        
        res = requests.post(f"{BASE_URL}/teacher/classes", headers=teacher_headers, json={
            "name": f"C_{ts}", "subject": subject, "description": "Adaptive Validation Class"
        })
        class_id = res.json()["id"]
        
        # Setup Student
        se = f"stu_{ts}@test.com"
        requests.post(f"{BASE_URL}/auth/register", json={"email": se, "password": "pass", "name": "Stu S", "role": "STUDENT"})
        approve_user(admin_headers, se)
        requests.post(f"{BASE_URL}/teacher/classes/{class_id}/add-students", headers=teacher_headers, json={"email": se})
        res = requests.post(f"{BASE_URL}/auth/login", json={"email": se, "password": "pass"})
        student_headers = {"Authorization": f"Bearer {res.json()['token']}", "Content-Type": "application/json"}
        
        # Create Assessment
        a_id = requests.post(f"{BASE_URL}/teacher/assessments", headers=teacher_headers, json={
            "title": "Adaptive Test", "classroomId": class_id, "type": "TOPIC", "durationMinutes": 30,
            "subject": subject, "topic": topic, "difficulty": "Medium", "questionCount": 5
        }).json()["id"]
        
        # Test Cases
        run_adaptive_test(student_headers, a_id, "Fast Correct (Should go Up)", lambda q: (True, 10))
        
        # Phase 3: Analytics Consistency
        print("\n[*] Validating Analytics Consistency...")
        intel = requests.get(f"{BASE_URL}/student/my/intelligence-report", headers=student_headers).json()
        score = intel.get('latestProgressCard', {}).get('academicScore', 0)
        print(f"    Latest Score in Analytics: {score}% (Expected 100%)")
        
        # Phase 2: Integrity & No Duplicate Session
        print("\n[*] Testing Duplicate Session Block...")
        res = requests.post(f"{BASE_URL}/exam/start", headers=student_headers, json={"assessmentId": a_id})
        print(f"    Status from Start: {res.json().get('status', 'N/A')} (Expected COMPLETED/TERMINATED)")
        
        # Test Integrity
        print("\n[*] Testing Integrity Event...")
        se2 = f"stu2_{ts}@test.com"
        requests.post(f"{BASE_URL}/auth/register", json={"email": se2, "password": "pass", "name": "Stu 2", "role": "STUDENT"})
        approve_user(admin_headers, se2)
        requests.post(f"{BASE_URL}/teacher/classes/{class_id}/add-students", headers=teacher_headers, json={"email": se2})
        res = requests.post(f"{BASE_URL}/auth/login", json={"email": se2, "password": "pass"})
        s2_headers = {"Authorization": f"Bearer {res.json()['token']}", "Content-Type": "application/json"}
        
        st_res = requests.post(f"{BASE_URL}/exam/start", headers=s2_headers, json={"assessmentId": a_id}).json()
        eid2 = st_res["examId"]
        
        # Report 3 Tab Switches
        for i in range(3):
            r = requests.post(f"{BASE_URL}/exam/report-integrity-event", headers=s2_headers, json={"examId": eid2, "eventType": "TAB_SWITCH"})
            print(f"    Reported TAB_SWITCH {i+1} for Exam {eid2}: {r.json().get('status')}")
        
        # Check integrity score and status via assessments endpoint (more reliable for individual exam)
        assessments = requests.get(f"{BASE_URL}/student/assessments", headers=s2_headers).json()
        this_asm = next((a for a in assessments if a.get("id") == a_id), {})
        status = this_asm.get('status', 'N/A')
        integrity = this_asm.get('integrityScore', 100)
        print(f"    Exam Status: {status} (Expected TERMINATED)")
        print(f"    Integrity Score: {integrity} (Expected < 100)")
        
        # Check profile for average
        profile = requests.get(f"{BASE_URL}/student/my/profile", headers=s2_headers).json()
        avg_integrity = profile.get('avgIntegrityScore', 100)
        print(f"    Average Integrity in Profile: {avg_integrity}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
