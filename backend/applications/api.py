"""API endpoints for the mini application workflow tracker."""

from typing import List

from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import NinjaAPI
from ninja.errors import HttpError

from .models import Application, ApplicationStatus
from .schemas import (
    ApplicationOut,
    ApplicationPayload,
    ReviewerDecisionPayload,
)

api = NinjaAPI(title="Mini Application Workflow Tracker API")


def apply_application_payload(
    application: Application,
    payload: ApplicationPayload,
) -> Application:
    """Copy applicant-editable payload fields onto an application."""
    for field, value in payload.dict().items():
        setattr(application, field, value)
    return application


def reject_transition(message: str) -> None:
    """Raise a consistent workflow validation error."""
    raise HttpError(400, message)


@api.post("/applications/", response={201: ApplicationOut})
def create_application(
    request: HttpRequest,
    payload: ApplicationPayload,
) -> tuple[int, Application]:
    """Create a draft application."""
    application = Application.objects.create(**payload.dict())
    return 201, application


@api.get("/applications/", response=List[ApplicationOut])
def list_applications(request: HttpRequest) -> List[Application]:
    """List applications with the newest records first."""
    return list(Application.objects.all())


@api.get("/applications/{application_id}/", response=ApplicationOut)
def get_application(
    request: HttpRequest,
    application_id: int,
) -> Application:
    """Return one application by database identifier."""
    return get_object_or_404(Application, id=application_id)


@api.put("/applications/{application_id}/", response=ApplicationOut)
def update_application(
    request: HttpRequest,
    application_id: int,
    payload: ApplicationPayload,
) -> Application:
    """Update applicant fields when the workflow allows editing."""
    application = get_object_or_404(Application, id=application_id)
    if not application.can_be_edited:
        reject_transition(
            "Only Draft or Need More Information applications can be edited.",
        )

    apply_application_payload(application, payload)
    application.save()
    return application


@api.post("/applications/{application_id}/submit/", response=ApplicationOut)
def submit_application(
    request: HttpRequest,
    application_id: int,
) -> Application:
    """Submit or resubmit an editable application for review."""
    application = get_object_or_404(Application, id=application_id)
    if not application.can_be_submitted:
        reject_transition(
            "Only Draft or Need More Information applications can be submitted.",
        )

    application.status = ApplicationStatus.SUBMITTED
    application.submitted_at = timezone.now()
    application.reviewed_at = None
    application.reviewer_comment = ""
    application.save(
        update_fields=[
            "status",
            "submitted_at",
            "reviewed_at",
            "reviewer_comment",
            "updated_at",
        ],
    )
    return application


@api.post(
    "/applications/{application_id}/start-review/",
    response=ApplicationOut,
)
def start_review(
    request: HttpRequest,
    application_id: int,
) -> Application:
    """Move a submitted application into review."""
    application = get_object_or_404(Application, id=application_id)
    if application.status != ApplicationStatus.SUBMITTED:
        reject_transition("Only Submitted applications can start review.")

    application.status = ApplicationStatus.UNDER_REVIEW
    application.reviewed_at = None
    application.save(update_fields=["status", "reviewed_at", "updated_at"])
    return application


@api.post("/applications/{application_id}/decision/", response=ApplicationOut)
def record_reviewer_decision(
    request: HttpRequest,
    application_id: int,
    payload: ReviewerDecisionPayload,
) -> Application:
    """Record an approval, rejection, or request for more information."""
    application = get_object_or_404(Application, id=application_id)
    if application.status != ApplicationStatus.UNDER_REVIEW:
        reject_transition(
            "Only Under Review applications can receive reviewer decisions.",
        )

    reviewer_comment = payload.reviewer_comment.strip()
    comment_required_statuses = {
        ApplicationStatus.NEED_MORE_INFORMATION,
        ApplicationStatus.REJECTED,
    }
    if payload.status in comment_required_statuses and not reviewer_comment:
        reject_transition(
            "Reviewer comment is required for Need More Information or "
            "Rejected decisions.",
        )

    application.status = payload.status
    application.reviewer_comment = reviewer_comment
    application.reviewed_at = timezone.now()
    application.save(
        update_fields=[
            "status",
            "reviewer_comment",
            "reviewed_at",
            "updated_at",
        ],
    )
    return application
