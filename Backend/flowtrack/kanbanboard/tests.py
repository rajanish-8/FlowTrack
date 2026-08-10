from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework.test import APITestCase

from .models import Account, Organization, OrganizationMembership


class OrganizationOnboardingTests(APITestCase):
    def create_user(self, email="user@example.com", password="Pass12345!"):
        return Account.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name="Test",
        )

    def test_organization_creation_makes_owner_without_platform_admin(self):
        user = self.create_user("owner@example.com")
        self.client.force_authenticate(user=user)

        response = self.client.post("/organization/", {
            "name": "Acme Studio",
            "description": "Creative operations",
        }, format="json")

        self.assertEqual(response.status_code, 201)
        membership = OrganizationMembership.objects.get(user=user)
        self.assertEqual(membership.role, OrganizationMembership.ROLE_OWNER)
        user.refresh_from_db()
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_duplicate_organization_creation_is_blocked(self):
        user = self.create_user("owner@example.com")
        org = Organization.objects.create(name="Existing")
        OrganizationMembership.objects.create(
            organization=org,
            user=user,
            role=OrganizationMembership.ROLE_OWNER,
        )
        self.client.force_authenticate(user=user)

        response = self.client.post("/organization/", {"name": "Second Org"}, format="json")

        self.assertEqual(response.status_code, 400)

    def test_user_without_membership_gets_onboarding_required(self):
        user = self.create_user("pending@example.com")
        self.client.force_authenticate(user=user)

        response = self.client.get("/user-role/")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["onboarding_required"])
        self.assertEqual(response.data["highest_role"], "none")


class OrganizationMemberManagementTests(APITestCase):
    def setUp(self):
        self.owner = Account.objects.create_user(
            username="owner@example.com",
            email="owner@example.com",
            password="Pass12345!",
        )
        self.manager = Account.objects.create_user(
            username="manager@example.com",
            email="manager@example.com",
            password="Pass12345!",
        )
        self.member = Account.objects.create_user(
            username="member@example.com",
            email="member@example.com",
            password="Pass12345!",
        )
        self.organization = Organization.objects.create(name="Acme")
        self.owner_membership = OrganizationMembership.objects.create(
            organization=self.organization,
            user=self.owner,
            role=OrganizationMembership.ROLE_OWNER,
        )

    def test_owner_adds_manager_by_existing_email(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.post("/organization/members/", {
            "email": self.manager.email,
            "role": "manager",
        }, format="json")

        self.assertEqual(response.status_code, 201)
        membership = OrganizationMembership.objects.get(user=self.manager)
        self.assertEqual(membership.organization, self.organization)
        self.assertEqual(membership.role, OrganizationMembership.ROLE_MANAGER)

    def test_member_cannot_add_organization_members(self):
        OrganizationMembership.objects.create(
            organization=self.organization,
            user=self.member,
            role=OrganizationMembership.ROLE_MEMBER,
        )
        self.client.force_authenticate(user=self.member)

        response = self.client.post("/organization/members/", {
            "email": self.manager.email,
            "role": "manager",
        }, format="json")

        self.assertEqual(response.status_code, 403)

    def test_owner_cannot_demote_only_owner(self):
        self.owner_membership.role = OrganizationMembership.ROLE_MEMBER

        with self.assertRaises(ValidationError):
            self.owner_membership.save()

    def test_owner_cannot_remove_owner_membership_via_api(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.delete(f"/organization/members/{self.owner_membership.id}/")

        self.assertEqual(response.status_code, 400)
