from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from kanbanboard.models import Account, Organization, OrganizationMembership, Project, ProjectMember


class Command(BaseCommand):
    help = "Assign existing legacy projects to an organization owned by a specific user."

    def add_arguments(self, parser):
        parser.add_argument("--owner-email", required=True)
        parser.add_argument("--organization", default="Legacy Workspace")
        parser.add_argument("--description", default="Migrated workspace for existing FlowTrack projects.")

    def handle(self, *args, **options):
        owner_email = options["owner_email"]
        organization_name = options["organization"]

        try:
            owner = Account.objects.get(email__iexact=owner_email)
        except Account.DoesNotExist as exc:
            raise CommandError(f"No user found with email {owner_email}") from exc

        if OrganizationMembership.objects.filter(user=owner).exclude(role=OrganizationMembership.ROLE_OWNER).exists():
            raise CommandError("Selected owner already belongs to another organization as a non-owner.")

        with transaction.atomic():
            organization, _ = Organization.objects.get_or_create(
                name=organization_name,
                defaults={"description": options["description"]},
            )

            OrganizationMembership.objects.get_or_create(
                organization=organization,
                user=owner,
                defaults={"role": OrganizationMembership.ROLE_OWNER},
            )

            legacy_projects = Project.objects.filter(organization__isnull=True)
            legacy_project_ids = list(legacy_projects.values_list("id", flat=True))
            updated_projects = legacy_projects.update(organization=organization)

            created_memberships = 0
            project_members = ProjectMember.objects.filter(project_id__in=legacy_project_ids).select_related("user")
            for project_member in project_members:
                if project_member.user_id == owner.id:
                    continue
                if OrganizationMembership.objects.filter(user=project_member.user).exists():
                    continue
                _, created = OrganizationMembership.objects.get_or_create(
                    organization=organization,
                    user=project_member.user,
                    defaults={"role": project_member.role},
                )
                if created:
                    created_memberships += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Organization '{organization.name}' is owned by {owner.email}. "
                f"Assigned {updated_projects} legacy project(s) and created "
                f"{created_memberships} organization membership(s)."
            )
        )
