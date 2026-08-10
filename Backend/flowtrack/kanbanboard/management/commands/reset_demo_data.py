from datetime import date, timedelta

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.utils import timezone

from kanbanboard.models import Account, Organization, OrganizationMembership, Project, ProjectMember, Task


class Command(BaseCommand):
    help = "Delete local data and repopulate FlowTrack with demo organization data."

    def handle(self, *args, **options):
        call_command("flush", "--no-input", verbosity=0)

        password = "DemoPass123!"
        owner = Account.objects.create_user(
            username="owner@flowtrack.test",
            email="owner@flowtrack.test",
            password=password,
            first_name="Olivia",
            last_name="Owner",
            skills="Operations, planning, stakeholder management",
        )
        manager = Account.objects.create_user(
            username="manager@flowtrack.test",
            email="manager@flowtrack.test",
            password=password,
            first_name="Mason",
            last_name="Manager",
            skills="Delivery management, QA, sprint planning",
        )
        member = Account.objects.create_user(
            username="member@flowtrack.test",
            email="member@flowtrack.test",
            password=password,
            first_name="Mia",
            last_name="Member",
            skills="Frontend, documentation, testing",
        )
        analyst = Account.objects.create_user(
            username="analyst@flowtrack.test",
            email="analyst@flowtrack.test",
            password=password,
            first_name="Noah",
            last_name="Analyst",
            skills="Research, data cleanup, reporting",
        )
        pending = Account.objects.create_user(
            username="pending@flowtrack.test",
            email="pending@flowtrack.test",
            password=password,
            first_name="Priya",
            last_name="Pending",
            skills="Waiting for organization invite",
        )

        organization = Organization.objects.create(
            name="Loomry Studio",
            description="Demo organization for FlowTrack onboarding, assignment, and delivery workflows.",
        )

        for user, role in [
            (owner, OrganizationMembership.ROLE_OWNER),
            (manager, OrganizationMembership.ROLE_MANAGER),
            (member, OrganizationMembership.ROLE_MEMBER),
            (analyst, OrganizationMembership.ROLE_MEMBER),
        ]:
            OrganizationMembership.objects.create(organization=organization, user=user, role=role)

        now = timezone.now()

        launch = Project.objects.create(
            organization=organization,
            name="Website Launch",
            description="Ship the public marketing site and internal workflow board.",
            end_date=now + timedelta(days=21),
        )
        mobile = Project.objects.create(
            organization=organization,
            name="Mobile QA Sprint",
            description="Validate mobile states and prepare release notes.",
            end_date=now + timedelta(days=14),
        )

        launch_owner = ProjectMember.objects.create(project=launch, user=owner, role="manager")
        launch_manager = ProjectMember.objects.create(project=launch, user=manager, role="manager")
        launch_member = ProjectMember.objects.create(project=launch, user=member, role="member")
        launch_analyst = ProjectMember.objects.create(project=launch, user=analyst, role="member")

        mobile_owner = ProjectMember.objects.create(project=mobile, user=owner, role="manager")
        mobile_manager = ProjectMember.objects.create(project=mobile, user=manager, role="manager")
        mobile_member = ProjectMember.objects.create(project=mobile, user=member, role="member")

        Task.objects.bulk_create([
            Task(
                project=launch,
                assigned_to=launch_manager,
                title="Finalize project roadmap",
                description="Confirm launch milestones, owners, and review windows.",
                due_date=date.today() + timedelta(days=3),
                priority="high",
                status="to do",
            ),
            Task(
                project=launch,
                assigned_to=launch_member,
                title="Polish signup screens",
                description="Check responsive spacing, labels, and validation messages.",
                due_date=date.today() + timedelta(days=5),
                priority="medium",
                status="in progress",
            ),
            Task(
                project=launch,
                assigned_to=launch_analyst,
                title="Prepare screenshot checklist",
                description="Collect workflow screenshot notes for the README.",
                due_date=date.today() + timedelta(days=6),
                priority="low",
                status="review",
            ),
            Task(
                project=launch,
                assigned_to=launch_owner,
                title="Approve launch board",
                description="Final owner review before demo.",
                due_date=date.today() + timedelta(days=8),
                priority="high",
                status="done",
            ),
            Task(
                project=mobile,
                assigned_to=mobile_manager,
                title="Create QA task matrix",
                description="List device checks and assign test owners.",
                due_date=date.today() + timedelta(days=2),
                priority="high",
                status="to do",
            ),
            Task(
                project=mobile,
                assigned_to=mobile_member,
                title="Test mobile drag states",
                description="Verify cards remain usable on narrow screens.",
                due_date=date.today() + timedelta(days=7),
                priority="medium",
                status="in progress",
            ),
            Task(
                project=mobile,
                assigned_to=mobile_owner,
                title="Review release notes",
                description="Owner sign-off for demo notes.",
                due_date=date.today() + timedelta(days=10),
                priority="low",
                status="review",
            ),
        ])

        self.stdout.write(self.style.SUCCESS("Demo data reset complete."))
        self.stdout.write("Password for all demo users: DemoPass123!")
        self.stdout.write("Owner: owner@flowtrack.test")
        self.stdout.write("Manager: manager@flowtrack.test")
        self.stdout.write("Member: member@flowtrack.test")
        self.stdout.write("Pending invite user: pending@flowtrack.test")
