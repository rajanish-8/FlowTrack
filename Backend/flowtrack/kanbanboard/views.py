from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_POST
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import IntegrityError
from django.contrib.auth import authenticate
from . import serializers
from rest_framework.authtoken.models import Token
from .models import Account, Project, Task, ProjectMember
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
    

class KanbanBoardView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # DRF automatically handles authentication and sets request.user
        user = request.user 
        account_serializer = serializers.AccountMiniSerializer(user)
        
        # Check if specific project is requested
        project_id = request.query_params.get('project_id')
        
        if project_id:
            try:
                # Super admins can access any project, others only their assigned projects
                if user.is_super_admin:
                    project = Project.objects.get(id=project_id)
                else:
                    project = user.projects.get(id=project_id)
                projects = [project]
            except Project.DoesNotExist:
                return Response(
                    {"error": "Project not found or access denied"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Super admins see all projects, others only their assigned projects
            if user.is_super_admin:
                projects = Project.objects.all()
            else:
                projects = user.projects.all()
        
        project_serializer = serializers.ProjectSerializerForBoard(projects, many=True)

        return Response(
            {
                "user_details" : account_serializer.data,
                "projects": project_serializer.data
            }
        )

class UserRoleView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Super admins have access to all projects
        if user.is_super_admin:
            # Get all projects for super admin
            all_projects = Project.objects.all()
            user_roles = []
            for project in all_projects:
                user_roles.append({
                    "project_id": project.id,
                    "project_name": project.name,
                    "role": "super_admin"
                })
            
            return Response({
                "user_roles": user_roles,
                "highest_role": "super_admin",
                "is_super_admin": True
            })
        else:
            # Regular users get their project memberships
            user_roles = ProjectMember.objects.filter(user=user).select_related('project')
            role_serializer = serializers.UserRoleSerializer(user_roles, many=True)
            
            # Determine highest role
            roles = [role['role'] for role in role_serializer.data]
            highest_role = 'member'
            if 'manager' in roles:
                highest_role = 'manager'
            
            return Response({
                "user_roles": role_serializer.data,
                "highest_role": highest_role,
                "is_super_admin": False
            })


class UsersView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Only super admins can view all users
        if not request.user.is_super_admin:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        
        users = Account.objects.all().values('id', 'username', 'email', 'profile_picture')
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
        if pk:
            project = self.get_object(pk)
            if not project:
                return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

            # allow if super admin or member of project
            if _is_super_admin(request, self) or ProjectMember.objects.filter(user=user, project=project).exists():
                project = Project.objects.prefetch_related('projectmember_set__user').get(pk=pk)
                serializer = serializers.ProjectDetailSerializer(project)
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        # list
        if _is_super_admin(request, self):
            projects = Project.objects.prefetch_related('projectmember_set__user').all()
        else:
            projects = user.projects.prefetch_related('projectmember_set__user').all()
        serializer = serializers.ProjectDetailSerializer(projects, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        # Only super admin allowed to create projects (adjust if you want managers to create)
        if not _is_super_admin(request, self):
            return Response({"error": "Only super admins can create projects"}, status=status.HTTP_403_FORBIDDEN)

        serializer = serializers.CreateProjectSerializer(data=request.data)
        if serializer.is_valid():
            project = serializer.save()
            return Response({"id": project.id, "name": project.name}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        project = self.get_object(pk)
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        # allow update only to super admin OR manager of this project
        if not (_is_super_admin(request, self) or _is_manager_of_project(request, self, project)):
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        serializer = serializers.CreateProjectSerializer(instance=project, data=request.data, partial=True)
        if serializer.is_valid():
            project = serializer.save()
            return Response({"id": project.id, "name": project.name}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        project = self.get_object(pk)
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        if not (_is_super_admin(request, self) or _is_manager_of_project(request, self, project)):
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        project.delete()
        return Response({"message": "Project deleted successfully"}, status=status.HTTP_204_NO_CONTENT)


# TaskAPIView with integrated permissions
class TaskAPIView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        user = request.user

        if pk:
            task = get_object_or_404(Task, pk=pk)
            # allowed if super admin, manager of the project, or the assigned member
            if _is_super_admin(request, self) or _is_manager_of_project(request, self, task.project) or _is_member_assigned_to_task(request, self, task):
                serializer = serializers.TaskSerializerForBoard(task)
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        # list tasks according to role
        if _is_super_admin(request, self):
            tasks = Task.objects.all()
        else:
            manager_project_ids = ProjectMember.objects.filter(user=user, role="manager").values_list("project_id", flat=True)
            tasks_for_managed_projects = Task.objects.filter(project_id__in=manager_project_ids)
            assigned_pm_ids = ProjectMember.objects.filter(user=user).values_list("id", flat=True)
            tasks_assigned_to_user = Task.objects.filter(assigned_to_id__in=assigned_pm_ids)
            tasks = (tasks_for_managed_projects | tasks_assigned_to_user).distinct()

        serializer = serializers.TaskSerializerForBoard(tasks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        project_id = request.data.get("project")
        if not project_id:
            return Response({"error": "project field is required"}, status=status.HTTP_400_BAD_REQUEST)

        project = get_object_or_404(Project, pk=project_id)

        if not (_is_super_admin(request, self) or _is_manager_of_project(request, self, project)):
            return Response({"error": "Only project managers or super admin can create tasks"}, status=status.HTTP_403_FORBIDDEN)

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
            return Response({"id": task.id, "title": task.title, "status": task.status}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        user = request.user

        # Check permissions: super admin, project manager, or assigned member
        is_super_admin = _is_super_admin(request, self)
        is_manager = _is_manager_of_project(request, self, task.project)
        is_assigned_member = task.assigned_to.user == user

        if not (is_super_admin or is_manager or is_assigned_member):
            return Response({"error": "Permission denied. You can only update tasks assigned to you."}, status=status.HTTP_403_FORBIDDEN)

        # If it's just a status update and the user is an assigned member (not super admin or manager),
        # only allow status and priority updates, not other field changes
        if is_assigned_member and not (is_super_admin or is_manager):
            # Allow status and priority updates for assigned members
            allowed_fields = ['status', 'priority']
            update_data = {k: v for k, v in request.data.items() if k in allowed_fields}
            if not update_data:
                return Response({"error": "You can only update the status and priority of tasks assigned to you."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            update_data = request.data

        serializer = serializers.CreateTaskForBoard(instance=task, data=update_data, partial=True)
        if serializer.is_valid():
            updated_task = serializer.save()
            return Response({"id": updated_task.id, "title": updated_task.title, "status": updated_task.status}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        task = get_object_or_404(Task, pk=pk)

        if not (_is_super_admin(request, self) or _is_manager_of_project(request, self, task.project)):
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        task.delete()
        return Response({"message": "Task deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
