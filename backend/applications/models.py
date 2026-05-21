"""Models for the application workflow tracker."""

from typing import Any
from uuid import uuid4

from django.db import models
from django.utils import timezone


def generate_tracking_number() -> str:
    """Return a readable unique candidate tracking number."""
    today = timezone.now().strftime("%Y%m%d")
    suffix = uuid4().hex[:6].upper()
    return f"APP-{today}-{suffix}"


class ApplicationType(models.TextChoices):
    """Supported application types."""

    RECORDATION = "Recordation", "Recordation"
    RENEWAL = "Renewal", "Renewal"
    CHANGE_OF_OWNERSHIP = "Change of Ownership", "Change of Ownership"
    CHANGE_OF_NAME = "Change of Name", "Change of Name"
    DISCONTINUATION = "Discontinuation", "Discontinuation"


class ApplicationStatus(models.TextChoices):
    """Workflow states for an application."""

    DRAFT = "Draft", "Draft"
    SUBMITTED = "Submitted", "Submitted"
    UNDER_REVIEW = "Under Review", "Under Review"
    NEED_MORE_INFORMATION = (
        "Need More Information",
        "Need More Information",
    )
    APPROVED = "Approved", "Approved"
    REJECTED = "Rejected", "Rejected"


class Application(models.Model):
    """A submitted company application moving through review."""

    tracking_number = models.CharField(
        max_length=32,
        unique=True,
        editable=False,
    )
    applicant_name = models.CharField(max_length=150)
    applicant_email = models.EmailField()
    company_name = models.CharField(max_length=150)
    application_type = models.CharField(
        max_length=32,
        choices=ApplicationType.choices,
    )
    description = models.TextField()
    status = models.CharField(
        max_length=32,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.DRAFT,
    )
    reviewer_comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(blank=True, null=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["tracking_number"]),
        ]

    def __str__(self) -> str:
        return f"{self.tracking_number} - {self.company_name}"

    @property
    def can_be_edited(self) -> bool:
        """Return whether applicant-facing fields can be changed."""
        return self.status in {
            ApplicationStatus.DRAFT,
            ApplicationStatus.NEED_MORE_INFORMATION,
        }

    @property
    def can_be_submitted(self) -> bool:
        """Return whether the application can enter submitted review."""
        return self.status in {
            ApplicationStatus.DRAFT,
            ApplicationStatus.NEED_MORE_INFORMATION,
        }

    def save(self, *args: Any, **kwargs: Any) -> None:
        """Assign a tracking number when the application is first saved."""
        if not self.tracking_number:
            tracking_number = generate_tracking_number()
            while Application.objects.filter(
                tracking_number=tracking_number,
            ).exists():
                tracking_number = generate_tracking_number()
            self.tracking_number = tracking_number

        super().save(*args, **kwargs)
