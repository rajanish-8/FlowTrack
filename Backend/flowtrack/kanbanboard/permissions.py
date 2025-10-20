# permissions.py
from rest_framework.permissions import BasePermission
from .models import ProjectMember, Task

class isSuperAdmin(BasePermission):
    """Allow access if user is authenticated and flagged as super-admin."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, "is_super_admin", False))

class isProjectManager(BasePermission):
    """
    Object-level permission: True if request.user is manager of the project.
    `obj` can be a Project OR a Task (in which case we check task.project).
    """
    def has_object_permission(self, request, view, obj):
        project = obj.project if isinstance(obj, Task) else obj
        return ProjectMember.objects.filter(user=request.user, project=project, role="manager").exists()

class isProjectMember(BasePermission):
    """
    Object-level permission: True if request.user is the assignee of the Task.
    Only meaningful for Task objects.
    """
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Task):
            return obj.assigned_to is not None and obj.assigned_to.user_id == request.user.id
        return False
