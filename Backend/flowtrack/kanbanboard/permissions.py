# permissions.py
from rest_framework.permissions import BasePermission
from .models import OrganizationMembership, ProjectMember, Task

def get_user_membership(user):
    if not user or not user.is_authenticated:
        return None
    return OrganizationMembership.objects.select_related("organization").filter(user=user).first()

def user_role(user):
    membership = get_user_membership(user)
    return membership.role if membership else None

def user_organization(user):
    membership = get_user_membership(user)
    return membership.organization if membership else None

def is_organization_owner(user):
    return user_role(user) == OrganizationMembership.ROLE_OWNER

def is_organization_manager(user):
    return user_role(user) == OrganizationMembership.ROLE_MANAGER

def is_organization_member(user):
    return user_role(user) in {
        OrganizationMembership.ROLE_OWNER,
        OrganizationMembership.ROLE_MANAGER,
        OrganizationMembership.ROLE_MEMBER,
    }

def same_organization(user, organization):
    user_org = user_organization(user)
    return bool(user_org and organization and user_org.id == organization.id)

def user_can_manage_organization(user):
    return is_organization_owner(user)

def user_can_manage_project(user, project):
    if is_organization_owner(user) and same_organization(user, project.organization):
        return True
    return ProjectMember.objects.filter(user=user, project=project, role="manager").exists()

def project_visible_to_user(user, project):
    if not same_organization(user, project.organization):
        return False
    if is_organization_owner(user):
        return True
    return ProjectMember.objects.filter(user=user, project=project).exists()

def task_visible_to_user(user, task):
    if not project_visible_to_user(user, task.project):
        return False
    if is_organization_owner(user) or ProjectMember.objects.filter(user=user, project=task.project, role="manager").exists():
        return True
    return task.assigned_to is not None and task.assigned_to.user_id == user.id

class isSuperAdmin(BasePermission):
    """Legacy compatibility: organization owner replaces the old app-level admin role."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and is_organization_owner(request.user))

class IsOrganizationOwner(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and is_organization_owner(request.user))

class IsOrganizationMember(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and is_organization_member(request.user))

class isProjectManager(BasePermission):
    """
    Object-level permission: True if request.user is manager of the project.
    `obj` can be a Project OR a Task (in which case we check task.project).
    """
    def has_object_permission(self, request, view, obj):
        project = obj.project if isinstance(obj, Task) else obj
        return user_can_manage_project(request.user, project)

class isProjectMember(BasePermission):
    """
    Object-level permission: True if request.user is the assignee of the Task.
    Only meaningful for Task objects.
    """
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Task):
            return obj.assigned_to is not None and obj.assigned_to.user_id == request.user.id
        return False
