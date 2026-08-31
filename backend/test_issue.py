import requests
import sys

# Try to register first just in case
reg_data = {
    "username": "testuser",
    "password": "password123",
    "email": "test@test.com",
    "full_name": "Test User"
}
requests.post("http://localhost:8000/api/auth/register", json=reg_data)

login_data = {"username": "testuser", "password": "password123"}
res = requests.post("http://localhost:8000/api/auth/login", data=login_data)
if "access_token" not in res.json():
    print("Login failed:", res.text)
    sys.exit(1)

token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

res = requests.get("http://localhost:8000/api/projects/", headers=headers)
projects = res.json()
if not projects:
    res = requests.post("http://localhost:8000/api/projects/", headers=headers, json={"name": "Test", "key": "TST", "board_type": "kanban"})
    project_id = res.json()["id"]
else:
    project_id = projects[0]["id"]

issue_data = {
    "title": "My test issue",
    "type": "task",
    "priority": "medium",
    "status": "todo",
    "project_id": project_id,
    "labels": []
}
res = requests.post(f"http://localhost:8000/api/projects/{project_id}/issues", headers=headers, json=issue_data)
print(res.status_code, res.text)
