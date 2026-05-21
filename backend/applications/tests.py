"""Workflow API tests."""

import json
import os
from io import StringIO
from typing import Any
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import Client, TestCase


class ApplicationWorkflowApiTests(TestCase):
    """Verify the assignment workflow rules through the public API."""

    def setUp(self) -> None:
        self.client = Client()
        self.payload = {
            "applicant_name": "Jane Applicant",
            "applicant_email": "jane@example.com",
            "company_name": "Acme Holdings",
            "application_type": "Recordation",
            "description": "Initial application draft.",
        }

    def post_json(self, path: str, payload: dict[str, Any]) -> Any:
        """Post JSON through Django's test client."""
        return self.client.post(
            path,
            data=json.dumps(payload),
            content_type="application/json",
        )

    def put_json(self, path: str, payload: dict[str, Any]) -> Any:
        """Put JSON through Django's test client."""
        return self.client.put(
            path,
            data=json.dumps(payload),
            content_type="application/json",
        )

    def create_draft(self) -> dict[str, Any]:
        """Create a draft and return its response payload."""
        response = self.post_json("/api/applications/", self.payload)

        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["status"], "Draft")
        self.assertTrue(data["tracking_number"].startswith("APP-"))
        return data

    def test_can_create_list_and_view_application(self) -> None:
        """Applications can be created, listed, and viewed."""
        created = self.create_draft()

        list_response = self.client.get("/api/applications/")
        detail_response = self.client.get(
            f"/api/applications/{created['id']}/",
        )

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(list_response.json()[0]["id"], created["id"])
        self.assertEqual(detail_response.json()["id"], created["id"])

    def test_workflow_allows_valid_transitions(self) -> None:
        """A draft can move through the full review workflow."""
        draft = self.create_draft()
        application_url = f"/api/applications/{draft['id']}/"

        updated_payload = {
            **self.payload,
            "company_name": "Acme Holdings Limited",
        }
        update_response = self.put_json(application_url, updated_payload)
        submit_response = self.post_json(f"{application_url}submit/", {})
        review_response = self.post_json(f"{application_url}start-review/", {})

        decision_response = self.post_json(
            f"{application_url}decision/",
            {
                "status": "Need More Information",
                "reviewer_comment": "Please attach the board resolution.",
            },
        )
        edit_response = self.put_json(application_url, self.payload)
        resubmit_response = self.post_json(f"{application_url}submit/", {})

        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(submit_response.json()["status"], "Submitted")
        self.assertIsNotNone(submit_response.json()["submitted_at"])
        self.assertEqual(review_response.json()["status"], "Under Review")
        self.assertEqual(
            decision_response.json()["status"],
            "Need More Information",
        )
        self.assertEqual(edit_response.status_code, 200)
        self.assertEqual(resubmit_response.json()["status"], "Submitted")

    def test_rejects_invalid_transitions_and_missing_comments(self) -> None:
        """The API blocks edits and decisions in the wrong state."""
        draft = self.create_draft()
        application_url = f"/api/applications/{draft['id']}/"

        early_review_response = self.post_json(
            f"{application_url}start-review/",
            {},
        )
        submit_response = self.post_json(f"{application_url}submit/", {})
        edit_submitted_response = self.put_json(application_url, self.payload)
        review_response = self.post_json(f"{application_url}start-review/", {})
        missing_comment_response = self.post_json(
            f"{application_url}decision/",
            {
                "status": "Rejected",
                "reviewer_comment": "",
            },
        )
        approve_response = self.post_json(
            f"{application_url}decision/",
            {
                "status": "Approved",
                "reviewer_comment": "",
            },
        )
        edit_approved_response = self.put_json(application_url, self.payload)
        submit_approved_response = self.post_json(
            f"{application_url}submit/",
            {},
        )

        self.assertEqual(early_review_response.status_code, 400)
        self.assertEqual(submit_response.status_code, 200)
        self.assertEqual(edit_submitted_response.status_code, 400)
        self.assertEqual(review_response.status_code, 200)
        self.assertEqual(missing_comment_response.status_code, 400)
        self.assertEqual(approve_response.json()["status"], "Approved")
        self.assertEqual(edit_approved_response.status_code, 400)
        self.assertEqual(submit_approved_response.status_code, 400)


class AdminBootstrapCommandTests(TestCase):
    """Verify the env-driven admin bootstrap command."""

    def test_creates_superuser_from_environment(self) -> None:
        """The command creates a usable Django admin user."""
        env = {
            "DJANGO_SUPERUSER_USERNAME": "reviewer",
            "DJANGO_SUPERUSER_EMAIL": "reviewer@example.com",
            "DJANGO_SUPERUSER_PASSWORD": "reviewer-pass-123",
        }

        with patch.dict(os.environ, env):
            call_command("ensure_admin_user", stdout=StringIO())

        user_model = get_user_model()
        user = user_model.objects.get(username="reviewer")

        self.assertEqual(user.email, "reviewer@example.com")
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.check_password("reviewer-pass-123"))

    def test_skips_creation_without_required_environment(self) -> None:
        """The command does nothing when required credentials are absent."""
        env = {
            "DJANGO_SUPERUSER_USERNAME": "",
            "DJANGO_SUPERUSER_PASSWORD": "",
        }

        with patch.dict(os.environ, env):
            call_command("ensure_admin_user", stdout=StringIO())

        user_model = get_user_model()
        self.assertEqual(user_model.objects.count(), 0)
