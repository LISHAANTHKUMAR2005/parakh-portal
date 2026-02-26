
import requests
import json

BASE_URL = "http://localhost:8081/api"

def main():
    print("[*] Security Audit: Verifying Cross-Student Submission Block...")
    
    # Register 2 students
    s1 = {"email": "sec_s1@test.com", "password": "pass", "name": "S1", "role": "STUDENT"}
    s2 = {"email": "sec_s2@test.com", "password": "pass", "name": "S2", "role": "STUDENT"}
    
    requests.post(f"{BASE_URL}/auth/register", json=s1)
    requests.post(f"{BASE_URL}/auth/register", json=s2)
    
    # Auto-approve via H2 (in a real test we'd use admin, but let's assume they are approved)
    # Actually I'll just use the admin login since I already have it in other scripts
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": "admin@parakh.gov.in", "password": "admin123"})
    admin_headers = {"Authorization": f"Bearer {res.json()['token']}", "Content-Type": "application/json"}
    
    for email in [s1["email"], s2["email"]]:
        users = requests.get(f"{BASE_URL}/admin/users", headers=admin_headers).json()["content"]
        target = next((u for u in users if u["email"] == email), None)
        if target:
            requests.put(f"{BASE_URL}/admin/users/{target['id']}/approve", headers=admin_headers)

    # Login as S1 and start an exam
    t1 = requests.post(f"{BASE_URL}/auth/login", json={"email": s1["email"], "password": s1["password"]}).json()["token"]
    h1 = {"Authorization": f"Bearer {t1}", "Content-Type": "application/json"}
    
    # Seed fake classroom/asm for S1
    ts = int(time.time()) if 'time' in globals() else 1234
    requests.post(f"{BASE_URL}/teacher/questions", headers=admin_headers, json={"content": "Sec Q", "optionA": "A", "optionB": "B", "optionC": "C", "optionD": "D", "correctOption": "A", "difficulty": "Medium", "bloomLevel": "Apply", "subject": "Sec", "topic": "Gen"})
    cls_id = requests.post(f"{BASE_URL}/teacher/classes", headers=admin_headers, json={"name": "SecC", "subject": "Sec", "description": "Sec"}).json()["id"]
    requests.post(f"{BASE_URL}/teacher/classes/{cls_id}/add-students", headers=admin_headers, json={"email": s1["email"]})
    requests.post(f"{BASE_URL}/teacher/classes/{cls_id}/add-students", headers=admin_headers, json={"email": s2["email"]})
    
    a_id = requests.post(f"{BASE_URL}/teacher/assessments", headers=admin_headers, json={"title": "Sec Asm", "classroomId": cls_id, "type": "TOPIC", "durationMinutes": 30, "subject": "Sec", "topic": "Gen", "difficulty": "Medium", "questionCount": 5}).json()["id"]
    
    start_res = requests.post(f"{BASE_URL}/exam/start", headers=h1, json={"assessmentId": a_id}).json()
    e1_id = start_res["examId"]
    q1_id = start_res["nextQuestion"]["id"]
    
    # Login as S2
    t2 = requests.post(f"{BASE_URL}/auth/login", json={"email": s2["email"], "password": s2["password"]}).json()["token"]
    h2 = {"Authorization": f"Bearer {t2}", "Content-Type": "application/json"}
    
    # Try to submit for S1's exam using S2's token
    print(f"[*] S2 attempting to submit answer for S1's exam ({e1_id})...")
    res = requests.post(f"{BASE_URL}/exam/submit", headers=h2, json={
        "examId": e1_id,
        "questionId": q1_id,
        "selectedOption": "A",
        "timeTakenSeconds": 5
    })
    
    print(f"    Status Code: {res.status_code}")
    print(f"    Response: {res.text}")
    
    if res.status_code != 200:
        print("[+] SUCCESS: Cross-student submission blocked.")
    else:
        print("[!] FAILURE: Cross-student submission allowed!")

if __name__ == "__main__":
    import time
    main()
