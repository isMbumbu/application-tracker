"""URL routes for the application tracker project."""

from django.contrib import admin
from django.urls import path

from applications.api import api

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
]
