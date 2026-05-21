"""Small middleware helpers for local development."""

from typing import Callable

from django.conf import settings
from django.http import HttpRequest, HttpResponse


class CorsMiddleware:
    """Allow the local Vite frontend to call the Django API."""

    def __init__(
        self,
        get_response: Callable[[HttpRequest], HttpResponse],
    ) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        if request.method == "OPTIONS":
            response = HttpResponse(status=204)
        else:
            response = self.get_response(request)

        origin = request.headers.get("Origin")
        allowed_origins = settings.CORS_ALLOWED_ORIGINS
        if origin and (origin in allowed_origins or "*" in allowed_origins):
            response["Access-Control-Allow-Origin"] = origin
            response["Vary"] = "Origin"

        response["Access-Control-Allow-Methods"] = (
            "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        )
        response["Access-Control-Allow-Headers"] = (
            "Content-Type, Authorization"
        )
        return response
