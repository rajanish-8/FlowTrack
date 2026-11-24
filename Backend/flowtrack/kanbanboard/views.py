from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_POST
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from django.db import IntegrityError
from django.contrib.auth import authenticate
from . import serializers
from rest_framework.authtoken.models import Token
from .models import Account, OrganizationMembership, Project, Task, ProjectMember, TaskComment, ActivityLog, TaskAttachment, Client, TimeEntry, Notification
from .permissions import *

def _is_super_admin(request, view):
    return isSuperAdmin().has_permission(request, view)

def _is_manager_of_project(request, view, project):
    return isProjectManager().has_object_permission(request, view, project)

def _is_member_assigned_to_task(request, view, task):
    return isProjectMember().has_object_permission(request, view, task)


# Create your views here.
class SignupView(APIView):
    permission_classes = [AllowAny]
    
    def post(self,request):
        serializer = serializers.SignupSerializer(data=request.data)

        if serializer.is_valid():
            try:
                validated_data = serializer.validated_data
                account = serializer.save()

                return Response(
                    {
                        "message": "User created",
                        "id": account.id,
                        "username": account.username,
                    }
                    , status= status.HTTP_201_CREATED
                )
            except IntegrityError as e:
                if 'email' in str(e):
                    return Response(
                        {"email": ["Email is already in use."]}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                else:
                    return Response(
                        {"error": ["An error occurred while creating the account."]}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        usermail = request.data.get("email")
        password = request.data.get("password")
        user = authenticate(username = usermail, password = password)

        if user:
            token,_ = Token.objects.get_or_create(user=user)
            return Response({"token":token.key}, status=status.HTTP_200_OK)
        
        return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

class OrganizationView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        membership = get_user_membership(request.user)
        if not membership:
            return Response({
                "onboarding_required": True,
                "organization": None,
                "role": None,
            }, status=status.HTTP_200_OK)

        return Response({
            "onboarding_required": False,
            "organization": serializers.OrganizationSerializer(membership.organization).data,
            "role": membership.role,
        }, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = serializers.CreateOrganizationSerializer(
            data=request.data,
            context={"request": request},
        )
        if serializer.is_valid():
            organization = serializer.save()
            return Response({
                "organization": serializers.OrganizationSerializer(organization).data,
                "role": OrganizationMembership.ROLE_OWNER,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OrganizationMembersView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        membership = get_user_membership(request.user)
        if not membership:
            return Response({"error": "Organization membership required"}, status=status.HTTP_403_FORBIDDEN)
        if membership.role not in [OrganizationMembership.ROLE_OWNER, OrganizationMembership.ROLE_MANAGER]:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        members = OrganizationMembership.objects.filter(
            organization=membership.organization
        ).select_related("user")
        return Response(serializers.OrganizationMembershipSerializer(members, many=True).data)

    def post(self, request):
        membership = get_user_membership(request.user)
        if not membership or membership.role != OrganizationMembership.ROLE_OWNER:
            return Response({"error": "Only organization owners can add members"}, status=status.HTTP_403_FORBIDDEN)

        serializer = serializers.AddOrganizationMemberSerializer(
            data=request.data,
            context={"organization": membership.organization},
        )
        if serializer.is_valid():
            new_membership = serializer.save()
            return Response(
                serializers.OrganizationMembershipSerializer(new_membership).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OrganizationMemberDetailView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        membership = get_user_membership(request.user)
        if not membership or membership.role != OrganizationMembership.ROLE_OWNER:
            return Response({"error": "Only organization owners can change member roles"}, status=status.HTTP_403_FORBIDDEN)

        target = get_object_or_404(OrganizationMembership, pk=pk, organization=membership.organization)
        if target.role == OrganizationMembership.ROLE_OWNER:
            return Response({"error": "Owner role cannot be changed here"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = serializers.UpdateOrganizationMemberSerializer(data=request.data)
        if serializer.is_valid():
            target.role = serializer.validated_data["role"]
            target.save()
            return Response(serializers.OrganizationMembershipSerializer(target).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        membership = get_user_membership(request.user)
        if not membership or membership.role != OrganizationMembership.ROLE_OWNER:
            return Response({"error": "Only organization owners can remove members"}, status=status.HTTP_403_FORBIDDEN)

        target = get_object_or_404(OrganizationMembership, pk=pk, organization=membership.organization)
        if target.role == OrganizationMembership.ROLE_OWNER:
            return Response({"error": "Cannot remove an organization owner without ownership transfer"}, status=status.HTTP_400_BAD_REQUEST)

        ProjectMember.objects.filter(user=target.user, project__organization=membership.organization).delete()
        target.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

class KanbanBoardView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # DRF automatically handles authentication and sets request.user
        user = request.user 
        account_serializer = serializers.AccountMiniSerializer(user)
        membership = get_user_membership(user)

        if not membership:
            return Response(
                {
                    "user_details" : account_serializer.data,
                    "projects": [],
                    "onboarding_required": True,
                }
            )
        
        # Check if specific project is requested
        project_id = request.query_params.get('project_id')
        
        if project_id:
            try:
                # Super admins can access any project, others only their assigned projects
                if membership.role == OrganizationMembership.ROLE_OWNER:
                    project = Project.objects.get(id=project_id, organization=membership.organization)
                else:
                    project = user.projects.get(id=project_id, organization=membership.organization)
                projects = [project]
            except Project.DoesNotExist:
                return Response(
                    {"error": "Project not found or access denied"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Super admins see all projects, others only their assigned projects
            if membership.role == OrganizationMembership.ROLE_OWNER:
                projects = Project.objects.filter(organization=membership.organization)
            else:
                projects = user.projects.filter(organization=membership.organization)
        
        project_serializer = serializers.ProjectSerializerForBoard(projects, many=True)

        return Response(
            {
                "user_details" : account_serializer.data,
                "projects": project_serializer.data,
                "onboarding_required": False,
            }
        )

class UserRoleView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        membership = get_user_membership(user)

        if not membership:
            return Response({
                "user_roles": [],
                "highest_role": "none",
                "organization": None,
                "onboarding_required": True,
                "is_platform_admin": bool(user.is_staff or user.is_superuser),
            })
        
        user_roles = ProjectMember.objects.filter(
            user=user,
            project__organization=membership.organization,
        ).select_related('project')
        role_serializer = serializers.UserRoleSerializer(user_roles, many=True)

        return Response({
            "user_roles": role_serializer.data,
            "highest_role": membership.role,
            "organization": serializers.OrganizationSerializer(membership.organization).data,
            "onboarding_required": False,
            "is_platform_admin": bool(user.is_staff or user.is_superuser),
        })


class UsersView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        membership = get_user_membership(request.user)
        if not membership or membership.role not in [OrganizationMembership.ROLE_OWNER, OrganizationMembership.ROLE_MANAGER]:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        
        users = Account.objects.filter(
            organization_memberships__organization=membership.organization
        ).values('id', 'username', 'email', 'profile_picture')
        return Response(list(users))



class ProjectAPIView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]  # base auth; object checks done manually

    def get_object(self, pk):
        try:
            return Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return None

    def get(self, request, pk=None):
        user = request.user
        membership = get_user_membership(user)
        if not membership:
            return Response({"error": "Organization membership required"}, status=status.HTTP_403_FORBIDDEN)

        if pk:
            project = self.get_object(pk)
            if not project or project.organization_id != membership.organization_id:
                return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

            # allow if organization owner or member of project
            if is_organization_owner(user) or ProjectMember.objects.filter(user=user, project=project).exists():
                project = Project.objects.prefetch_related('projectmember_set__user').get(pk=pk)
                serializer = serializers.ProjectDetailSerializer(project)
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        if is_organization_owner(user):
            projects = Project.objects.prefetch_related('projectmember_set__user').filter(organization=membership.organization)
        else:
            projects = user.projects.prefetch_related('projectmember_set__user').filter(organization=membership.organization)
        serializer = serializers.ProjectDetailSerializer(projects, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        membership = get_user_membership(request.user)
        if not membership:
            return Response({"error": "Organization membership required"}, status=status.HTTP_403_FORBIDDEN)
        if membership.role != OrganizationMembership.ROLE_OWNER:
            return Response({"error": "Only organization owners can create projects"}, status=status.HTTP_403_FORBIDDEN)

        serializer = serializers.CreateProjectSerializer(
            data=request.data,
            context={"organization": membership.organization, "owner": request.user},
        )
        if serializer.is_valid():
            project = serializer.save()
            return Response({"id": project.id, "name": project.name}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        membership = get_user_membership(request.user)
        if not membership:
            return Response({"error": "Organization membership required"}, status=status.HTTP_403_FORBIDDEN)

        project = self.get_object(pk)
        if not project or project.organization_id != membership.organization_id:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        if not user_can_manage_project(request.user, project):
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        serializer = serializers.CreateProjectSerializer(
            instance=project,
            data=request.data,
            partial=True,
            context={
                "organization": membership.organization,
                "owner": request.user if membership.role == OrganizationMembership.ROLE_OWNER else None,
            },
        )
        if serializer.is_valid():
            project = serializer.save()
            return Response({"id": project.id, "name": project.name}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        membership = get_user_membership(request.user)
        if not membership:
            return Response({"error": "Organization membership required"}, status=status.HTTP_403_FORBIDDEN)

        project = self.get_object(pk)
        if not project or project.organization_id != membership.organization_id:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        if membership.role != OrganizationMembership.ROLE_OWNER:
            return Response({"error": "Only organization owners can delete projects"}, status=status.HTTP_403_FORBIDDEN)

        project.delete()
        return Response({"message": "Project deleted successfully"}, status=status.HTTP_204_NO_CONTENT)


# TaskAPIView with integrated permissions
class TaskAPIView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        user = request.user
        membership = get_user_membership(user)
        if not membership:
            return Response({"error": "Organization membership required"}, status=status.HTTP_403_FORBIDDEN)

        if pk:
            task = get_object_or_404(Task, pk=pk)
            if task.project.organization_id != membership.organization_id:
                return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)
            if task_visible_to_user(user, task):
                serializer = serializers.TaskSerializerForBoard(task)
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        if is_organization_owner(user):
            tasks = Task.objects.filter(project__organization=membership.organization)
        else:
            manager_project_ids = ProjectMember.objects.filter(user=user, role="manager", project__organization=membership.organization).values_list("project_id", flat=True)
            tasks_for_managed_projects = Task.objects.filter(project_id__in=manager_project_ids)
            assigned_pm_ids = ProjectMember.objects.filter(user=user, project__organization=membership.organization).values_list("id", flat=True)
            tasks_assigned_to_user = Task.objects.filter(assigned_to_id__in=assigned_pm_ids)
            tasks = (tasks_for_managed_projects | tasks_assigned_to_user).distinct()

        # Search support
        search_query = request.query_params.get('search', '').strip()
        if search_query:
            from django.db.models import Q
            tasks = tasks.filter(
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(status__icontains=search_query) |
                Q(priority__icontains=search_query)
            )

        # Pagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        page = paginator.paginate_queryset(tasks, request)
        if page is not None:
            serializer = serializers.TaskSerializerForBoard(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = serializers.TaskSerializerForBoard(tasks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        membership = get_user_membership(user)
        if not membership:
            return Response({"error": "Organization membership required"}, status=status.HTTP_403_FORBIDDEN)
        project_id = request.data.get("project")
        if not project_id:
            return Response({"error": "project field is required"}, status=status.HTTP_400_BAD_REQUEST)

        project = get_object_or_404(Project, pk=project_id)
        if project.organization_id != membership.organization_id:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        if not user_can_manage_project(user, project):
            return Response({"error": "Only organization owners or project managers can create tasks"}, status=status.HTTP_403_FORBIDDEN)

        # ensure assigned_to belongs to the given project (helpful validation)
        assigned_to_id = request.data.get("assigned_to")
        if assigned_to_id:
            try:
                pm = ProjectMember.objects.get(pk=assigned_to_id)
            except ProjectMember.DoesNotExist:
                return Response({"assigned_to": ["ProjectMember not found"]}, status=status.HTTP_400_BAD_REQUEST)
            if pm.project_id != project.id:
                return Response({"assigned_to": ["Assigned ProjectMember does not belong to given project"]}, status=status.HTTP_400_BAD_REQUEST)

        serializer = serializers.CreateTaskForBoard(data=request.data)
        if serializer.is_valid():
            task = serializer.save()
            ActivityLog.objects.create(
                project=task.project,
                user=request.user,
                action="task_created",
                details=f"Created task '{task.title}'"
            )
            return Response({"id": task.id, "title": task.title, "status": task.status, "checklist": task.checklist}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        user = request.user
        membership = get_user_membership(user)
        if not membership or task.project.organization_id != membership.organization_id:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

        # Check permissions: organization owner, project manager, or assigned member
        is_owner = is_organization_owner(user)
        is_manager = _is_manager_of_project(request, self, task.project)
        is_assigned_member = task.assigned_to.user == user

        if not (is_owner or is_manager or is_assigned_member):
            return Response({"error": "Permission denied. You can only update tasks assigned to you."}, status=status.HTTP_403_FORBIDDEN)

        # Allow status, priority, checklist, tags, resolution, blocker updates for assigned members
        if is_assigned_member and not (is_owner or is_manager):
            allowed_fields = ['status', 'priority', 'checklist', 'estimated_hours', 'recurrence', 'resolution', 'blocked_reason', 'tags']
            update_data = {k: v for k, v in request.data.items() if k in allowed_fields}
            if not update_data:
                return Response({"error": "No valid fields provided for update."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            update_data = request.data

        old_status = task.status
        serializer = serializers.CreateTaskForBoard(instance=task, data=update_data, partial=True)
        if serializer.is_valid():
            updated_task = serializer.save()
            if old_status != updated_task.status:
                ActivityLog.objects.create(
                    project=updated_task.project,
                    user=request.user,
                    action="task_moved",
                    details=f"Moved '{updated_task.title}' to {updated_task.status.title()}"
                )
                # Recurrence handling
                if updated_task.status.lower() == "done" and updated_task.recurrence and updated_task.recurrence != "none":
                    import datetime
                    today = datetime.date.today()
                    if updated_task.recurrence == "daily":
                        next_due = today + datetime.timedelta(days=1)
                    elif updated_task.recurrence == "weekdays":
                        days = 1 if today.weekday() < 4 else (7 - today.weekday())
                        next_due = today + datetime.timedelta(days=days)
                    elif updated_task.recurrence == "weekly":
                        next_due = today + datetime.timedelta(weeks=1)
                    elif updated_task.recurrence == "monthly":
                        next_due = today + datetime.timedelta(days=30)
                    else:
                        next_due = None
                    if next_due:
                        # Auto-create next recurring cycle
                        Task.objects.create(
                            title=updated_task.title,
                            description=updated_task.description,
                            due_date=next_due,
                            priority=updated_task.priority,
                            project=updated_task.project,
                            assigned_to=updated_task.assigned_to,
                            status="to do",
                            recurrence=updated_task.recurrence,
                            estimated_hours=updated_task.estimated_hours,
                            tags=updated_task.tags,
                            checklist=[{"id": idx, "text": item.get("text", ""), "completed": False} for idx, item in enumerate(updated_task.checklist)] if isinstance(updated_task.checklist, list) else []
                        )
                        ActivityLog.objects.create(
                            project=updated_task.project,
                            user=request.user,
                            action="recurrence_scheduled",
                            details=f"Scheduled next recurring cycle for '{updated_task.title}' on {next_due}"
                        )
            elif 'checklist' in update_data:
                ActivityLog.objects.create(
                    project=updated_task.project,
                    user=request.user,
                    action="checklist_updated",
                    details=f"Updated checklist for '{updated_task.title}'"
                )
            return Response(serializers.TaskSerializerForBoard(updated_task).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        membership = get_user_membership(request.user)
        if not membership or task.project.organization_id != membership.organization_id:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

        if not user_can_manage_project(request.user, task.project):
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        proj = task.project
        title = task.title
        task.delete()
        ActivityLog.objects.create(
            project=proj,
            user=request.user,
            action="task_deleted",
            details=f"Deleted task '{title}'"
        )
        return Response({"message": "Task deleted successfully"}, status=status.HTTP_204_NO_CONTENT)


class TaskCommentView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        membership = get_user_membership(request.user)
        if not membership or task.project.organization_id != membership.organization_id:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)
        comments = task.comments.select_related('user').all()
        serializer = serializers.TaskCommentSerializer(comments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        membership = get_user_membership(request.user)
        if not membership or task.project.organization_id != membership.organization_id:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)
        content = request.data.get("content", "").strip()
        if not content:
            return Response({"error": "Comment content cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)
        comment = TaskComment.objects.create(
            task=task,
            user=request.user,
            content=content
        )
        ActivityLog.objects.create(
            project=task.project,
            user=request.user,
            action="comment_added",
            details=f"Commented on '{task.title}'"
        )
        return Response(serializers.TaskCommentSerializer(comment).data, status=status.HTTP_201_CREATED)


class ProjectActivityLogView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        project = get_object_or_404(Project, pk=pk)
        membership = get_user_membership(request.user)
        if not membership or project.organization_id != membership.organization_id:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
        logs = project.activities.select_related('user').all()[:40]
        serializer = serializers.ActivityLogSerializer(logs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TaskAttachmentView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        membership = get_user_membership(request.user)
        if not membership or task.project.organization_id != membership.organization_id:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)
        attachments = task.attachments.select_related('user').all()
        serializer = serializers.TaskAttachmentSerializer(attachments, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        membership = get_user_membership(request.user)
        if not membership or task.project.organization_id != membership.organization_id:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        
        attachment = TaskAttachment.objects.create(
            task=task,
            user=request.user,
            file=file_obj,
            filename=file_obj.name,
            file_size=file_obj.size
        )
        ActivityLog.objects.create(
            project=task.project,
            user=request.user,
            action="attachment_added",
            details=f"Attached '{file_obj.name}' to '{task.title}'"
        )
        serializer = serializers.TaskAttachmentSerializer(attachment, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AttachmentDetailView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        attachment = get_object_or_404(TaskAttachment, pk=pk)
        membership = get_user_membership(request.user)
        if not membership or attachment.task.project.organization_id != membership.organization_id:
            return Response({"error": "Attachment not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # User must be owner/manager or the uploader
        if membership.role not in [OrganizationMembership.ROLE_OWNER, OrganizationMembership.ROLE_MANAGER] and attachment.user != request.user:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        
        filename = attachment.filename
        task_title = attachment.task.title
        project = attachment.task.project
        try:
            if attachment.file:
                attachment.file.delete(save=False)
        except Exception:
            pass
        attachment.delete()

        ActivityLog.objects.create(
            project=project,
            user=request.user,
            action="attachment_removed",
            details=f"Removed '{filename}' from '{task_title}'"
        )
        return Response({"message": "Attachment deleted successfully"}, status=status.HTTP_200_OK)


# ==========================================================
# CLIENT / CRM API VIEWS (inspired by DjangoCRM & Coleman)
# ==========================================================

class ClientListCreateView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        membership = get_user_membership(request.user)
        if not membership:
            return Response({"error": "Organization membership required"}, status=status.HTTP_403_FORBIDDEN)
        clients = Client.objects.filter(organization=membership.organization)
        # Search support
        search_query = request.query_params.get('search', '').strip()
        if search_query:
            from django.db.models import Q
            clients = clients.filter(
                Q(name__icontains=search_query) |
                Q(contact_name__icontains=search_query) |
                Q(email__icontains=search_query)
            )
        serializer = serializers.ClientSerializer(clients, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        membership = get_user_membership(request.user)
        if not membership or membership.role not in [OrganizationMembership.ROLE_OWNER, OrganizationMembership.ROLE_MANAGER]:
            return Response({"error": "Only owners or managers can add clients"}, status=status.HTTP_403_FORBIDDEN)
        
        name = request.data.get("name", "").strip()
        if not name:
            return Response({"error": "Client/Company name is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        client = Client.objects.create(
            organization=membership.organization,
            name=name,
            contact_name=request.data.get("contact_name", "").strip(),
            email=request.data.get("email", "").strip(),
            phone=request.data.get("phone", "").strip(),
            website=request.data.get("website", "").strip(),
            notes=request.data.get("notes", "").strip(),
        )
        return Response(serializers.ClientSerializer(client).data, status=status.HTTP_201_CREATED)


class ClientDetailView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        membership = get_user_membership(request.user)
        if not membership:
            return Response({"error": "Organization membership required"}, status=status.HTTP_403_FORBIDDEN)
        client = get_object_or_404(Client, pk=pk, organization=membership.organization)
        return Response(serializers.ClientSerializer(client).data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        membership = get_user_membership(request.user)
        if not membership or membership.role not in [OrganizationMembership.ROLE_OWNER, OrganizationMembership.ROLE_MANAGER]:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        client = get_object_or_404(Client, pk=pk, organization=membership.organization)
        serializer = serializers.ClientSerializer(instance=client, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response(serializers.ClientSerializer(updated).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        membership = get_user_membership(request.user)
        if not membership or membership.role not in [OrganizationMembership.ROLE_OWNER, OrganizationMembership.ROLE_MANAGER]:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        client = get_object_or_404(Client, pk=pk, organization=membership.organization)
        client.delete()
        return Response({"message": "Client deleted successfully"}, status=status.HTTP_200_OK)


# ==========================================================
# TIME TRACKING & EFFORT LOGGING (inspired by TaskCoach & Coleman)
# ==========================================================

class TaskTimeEntryView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        membership = get_user_membership(request.user)
        if not membership or task.project.organization_id != membership.organization_id:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)
        entries = task.time_entries.select_related('user').all()
        serializer = serializers.TimeEntrySerializer(entries, many=True)
        total_minutes = sum(e.duration_minutes for e in entries)
        return Response({
            "entries": serializer.data,
            "total_minutes": total_minutes,
            "total_hours": round(total_minutes / 60, 2),
            "estimated_hours": float(task.estimated_hours or 0.0)
        }, status=status.HTTP_200_OK)

    def post(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        membership = get_user_membership(request.user)
        if not membership or task.project.organization_id != membership.organization_id:
            return Response({"error": "Task not found"}, status=status.HTTP_404_NOT_FOUND)
        
        duration = int(request.data.get("duration_minutes", 0))
        if duration <= 0:
            return Response({"error": "Duration must be greater than 0 minutes"}, status=status.HTTP_400_BAD_REQUEST)
        
        entry = TimeEntry.objects.create(
            task=task,
            user=request.user,
            duration_minutes=duration,
            notes=request.data.get("notes", "").strip(),
            billable=bool(request.data.get("billable", True)),
        )
        ActivityLog.objects.create(
            project=task.project,
            user=request.user,
            action="time_logged",
            details=f"Logged {duration}m on '{task.title}'"
        )
        return Response(serializers.TimeEntrySerializer(entry).data, status=status.HTTP_201_CREATED)


class TimeEntryDetailView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        entry = get_object_or_404(TimeEntry, pk=pk)
        membership = get_user_membership(request.user)
        if not membership or entry.task.project.organization_id != membership.organization_id:
            return Response({"error": "Time entry not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if membership.role not in [OrganizationMembership.ROLE_OWNER, OrganizationMembership.ROLE_MANAGER] and entry.user != request.user:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        
        entry.delete()
        return Response({"message": "Time entry removed"}, status=status.HTTP_200_OK)


