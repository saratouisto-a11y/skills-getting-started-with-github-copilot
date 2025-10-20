from fastapi.testclient import TestClient
import pytest

from src import app as app_module

client = TestClient(app_module.app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # ensure a known activity exists
    assert "Chess Club" in data


def test_signup_and_unregister():
    activity = "Chess Club"
    test_email = "test_student@example.com"

    # ensure not already signed up
    resp = client.get(f"/activities")
    assert resp.status_code == 200
    data = resp.json()
    participants = data[activity]["participants"]
    if test_email in participants:
        # remove if pre-existing
        client.delete(f"/activities/{activity}/participants?email={test_email}")

    # sign up
    resp = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert resp.status_code == 200
    res = resp.json()
    assert "Signed up" in res["message"]

    # verify participant present
    resp = client.get("/activities")
    data = resp.json()
    assert test_email in data[activity]["participants"]

    # unregister
    resp = client.delete(f"/activities/{activity}/participants?email={test_email}")
    assert resp.status_code == 200
    res = resp.json()
    assert "Unregistered" in res["message"]

    # verify participant removed
    resp = client.get("/activities")
    data = resp.json()
    assert test_email not in data[activity]["participants"]
