
import requests
import json
import time
from concurrent.futures import ThreadPoolExecutor

BASE_URL = "http://localhost:8081/api"
ADMIN_EMAIL = "admin@parakh.gov.in"
ADMIN_PASS = "admin123"

def setup_admin():
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    return {"Authorization": f"Bearer {res.json()['token']}", "Content-Type": "application/json"}

def approve_user(admin_headers, email):
    res = requests.get(f"{BASE_URL}/admin/users", headers=admin_headers)
    users = res.json()["content"]
    target = next((u for u in users if u["email"] == email), None)
    if target:
        requests.put(f"{BASE_URL}/admin/users/{target['id']}/approve", headers=admin_headers)

def create_student(admin_headers, i, class_id):
    email = f"perf_stu_{i}@test.com"
    requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": "pass", "name": f"Stu {i}", "role": "STUDENT"})
    approve_user(admin_headers, email)
    requests.post(f"{BASE_URL}/teacher/classes/{class_id}/add-students", headers=admin_headers, json={"email": email})
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": "pass"})
    return {"Authorization": f"Bearer {res.json()['token']}", "Content-Type": "application/json"}

def run_single_submission(student_headers, assessment_id, i):
    try:
        start_res = requests.post(f"{BASE_URL}/exam/start", headers=student_headers, json={"assessmentId": assessment_id}).json()
        exam_id = start_res["examId"]
        q_id = start_res["nextQuestion"]["id"] if "nextQuestion" in start_res else 1
        
        start_time = time.time()
        res = requests.post(f"{BASE_URL}/exam/submit", headers=student_headers, json={
            "examId": exam_id,
            "questionId": q_id,
            "selectedOption": "A",
            "timeTakenSeconds": 5
        })
        latency = time.time() - start_time
        return res.status_code, latency
    except Exception as e:
        return 500, str(e)

def main():
    print("[*] Setting up Performance Test (50 Concurrent)...")
    admin_headers = setup_admin()
    ts = int(time.time())
    
    # Create Class & Questions (as admin/teacher)
    subject = f"Perf_{ts}"
    requests.post(f"{BASE_URL}/teacher/questions", headers=admin_headers, json={
        "content": "Perf Question", "optionA": "A", "optionB": "B", "optionC": "C", "optionD": "D",
        "correctOption": "A", "difficulty": "Medium", "bloomLevel": "Apply", "subject": subject, "topic": "General"
    })
    
    cls_res = requests.post(f"{BASE_URL}/teacher/classes", headers=admin_headers, json={"name": f"PC_{ts}", "subject": subject, "description": "Perf Test"})
    class_id = cls_res.json()["id"]
    
    asm_res = requests.post(f"{BASE_URL}/teacher/assessments", headers=admin_headers, json={
        "title": "Perf Asm", "classroomId": class_id, "type": "TOPIC", "durationMinutes": 30,
        "subject": subject, "topic": "General", "difficulty": "Medium", "questionCount": 5
    })
    assessment_id = asm_res.json()["id"]

    print("[*] Creating 50 students...")
    students = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        students = list(executor.map(lambda i: create_student(admin_headers, i, class_id), range(50)))
    
    print(f"[*] Starting 50 concurrent submissions on assessment {assessment_id}...")
    start_time = time.time()
    with ThreadPoolExecutor(max_workers=50) as executor:
        results = list(executor.map(lambda s: run_single_submission(s, assessment_id, 0), students))
    
    total_time = time.time() - start_time
    success = [r for r in results if r[0] == 200]
    latencies = [r[1] for r in results if isinstance(r[1], float)]
    
    print("\n>>> PERFORMANCE RESULTS")
    print(f"    Total Students: 50")
    print(f"    Successful Submissions: {len(success)}")
    print(f"    Average Latency: {sum(latencies)/len(latencies):.3f}s" if latencies else "N/A")
    print(f"    Total Throughput Time: {total_time:.2f}s")
    
    if len(success) == 50:
        print("[+] SUCCESS: System handled 50 concurrent submissions.")
    else:
        print("[!] FAILURE: Some submissions failed.")

if __name__ == "__main__":
    main()
