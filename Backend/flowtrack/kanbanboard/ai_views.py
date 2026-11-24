from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from .models import Project
from .permissions import get_user_membership
from . import ai_service

class AIEnhanceTaskView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        title = request.data.get("title", "")
        description = request.data.get("description", "")
        project_id = request.data.get("project_id")

        project_name = "Workspace"
        if project_id:
            membership = get_user_membership(request.user)
            if membership:
                proj = Project.objects.filter(id=project_id, organization=membership.organization).first()
                if proj:
                    project_name = proj.name

        data = ai_service.enhance_task(title=title, current_description=description, project_name=project_name)
        return Response(data, status=status.HTTP_200_OK)


class AIBreakdownTaskView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        title = request.data.get("title", "")
        description = request.data.get("description", "")

        data = ai_service.breakdown_task(title=title, description=description)
        return Response(data, status=status.HTTP_200_OK)


class AISprintSummaryView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        project_id = request.data.get("project_id")
        membership = get_user_membership(request.user)
        if not membership:
            return Response({"error": "No organization membership found."}, status=status.HTTP_403_FORBIDDEN)

        if project_id:
            project = Project.objects.filter(id=project_id, organization=membership.organization).first()
        else:
            project = Project.objects.filter(organization=membership.organization).first()

        if not project:
            return Response({"error": "Project not found."}, status=status.HTTP_404_NOT_FOUND)

        summary_data = ai_service.generate_sprint_summary(project)
        return Response(summary_data, status=status.HTTP_200_OK)


class AIChatView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message = request.data.get("message", "")
        project_id = request.data.get("project_id")
        if not message:
            return Response({"error": "Message is required."}, status=status.HTTP_400_BAD_REQUEST)

        membership = get_user_membership(request.user)
        if not membership:
            return Response({"error": "No organization membership found."}, status=status.HTTP_403_FORBIDDEN)

        if project_id:
            project = Project.objects.filter(id=project_id, organization=membership.organization).first()
        else:
            project = Project.objects.filter(organization=membership.organization).first()

        if not project:
            return Response({"error": "Project not found."}, status=status.HTTP_404_NOT_FOUND)

        user_name = request.user.first_name or request.user.username or "Team Member"
        chat_data = ai_service.chat_with_board(project, message, user_name=user_name)
        return Response(chat_data, status=status.HTTP_200_OK)


class AIConfigView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        current_key = ai_service.get_gemini_key()
        has_key = bool(current_key)
        masked_key = (current_key[:6] + "..." + current_key[-4:]) if len(current_key) > 10 else ("*" * len(current_key))
        return Response({
            "has_gemini_key": has_key,
            "active_engine": "Google Gemini 1.5 Flash" if has_key else "Smart Built-in Heuristic Engine",
            "masked_key": masked_key,
        }, status=status.HTTP_200_OK)

    def post(self, request):
        raw_key = request.data.get("gemini_api_key", "").strip()
        api_key = ai_service.clean_gemini_key(raw_key)
        if not api_key:
            return Response({"error": "Please provide a valid Gemini API key."}, status=status.HTTP_400_BAD_REQUEST)

        # Test key
        is_valid, error_msg = ai_service.test_gemini_key(api_key)
        if not is_valid:
            return Response({
                "error": f"Verification failed: {error_msg}"
            }, status=status.HTTP_400_BAD_REQUEST)

        ai_service.save_gemini_key(api_key)
        return Response({
            "success": True,
            "message": "Google Gemini 1.5 Flash connected and verified successfully!",
            "active_engine": "Google Gemini 1.5 Flash"
        }, status=status.HTTP_200_OK)
