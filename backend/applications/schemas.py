"""Django Ninja schemas for application workflow endpoints."""

from datetime import datetime
from typing import Literal, Optional

from ninja import Schema

ApplicationTypeValue = Literal[
    "Recordation",
    "Renewal",
    "Change of Ownership",
    "Change of Name",
    "Discontinuation",
]

ApplicationStatusValue = Literal[
    "Draft",
    "Submitted",
    "Under Review",
    "Need More Information",
    "Approved",
    "Rejected",
]

ReviewerDecisionValue = Literal[
    "Need More Information",
    "Approved",
    "Rejected",
]


class ApplicationPayload(Schema):
    """Input fields applicants can provide for a draft."""

    applicant_name: str
    applicant_email: str
    company_name: str
    application_type: ApplicationTypeValue
    description: str


class ReviewerDecisionPayload(Schema):
    """Input for an under-review decision."""

    status: ReviewerDecisionValue
    reviewer_comment: str = ""


class ApplicationOut(Schema):
    """API representation of an application."""

    id: int
    tracking_number: str
    applicant_name: str
    applicant_email: str
    company_name: str
    application_type: ApplicationTypeValue
    description: str
    status: ApplicationStatusValue
    reviewer_comment: str
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime]
    reviewed_at: Optional[datetime]
