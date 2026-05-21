"""Create the initial Django admin user from environment variables."""

import os
from typing import Any

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    """Ensure a superuser exists for the admin site."""

    help = "Create an initial superuser from DJANGO_SUPERUSER_* env vars."

    def handle(self, *args: Any, **options: Any) -> None:
        username = os.getenv("DJANGO_SUPERUSER_USERNAME")
        email = os.getenv("DJANGO_SUPERUSER_EMAIL", "")
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD")

        if not username or not password:
            self.stdout.write(
                self.style.WARNING(
                    "Skipping admin creation. Set DJANGO_SUPERUSER_USERNAME "
                    "and DJANGO_SUPERUSER_PASSWORD.",
                ),
            )
            return

        user_model = get_user_model()
        user, created = user_model.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_staff": True,
                "is_superuser": True,
            },
        )

        if created:
            user.set_password(password)
            user.save(update_fields=["password"])
            self.stdout.write(
                self.style.SUCCESS(f"Created admin user '{username}'."),
            )
            return

        fields_to_update = []
        if email and user.email != email:
            user.email = email
            fields_to_update.append("email")
        if not user.is_staff:
            user.is_staff = True
            fields_to_update.append("is_staff")
        if not user.is_superuser:
            user.is_superuser = True
            fields_to_update.append("is_superuser")

        if fields_to_update:
            user.save(update_fields=fields_to_update)

        self.stdout.write(
            self.style.SUCCESS(f"Admin user '{username}' already exists."),
        )
