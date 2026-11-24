from django.urls import path
from . import views
from . import ai_views

urlpatterns = [
    path('signup/', views.SignupView.as_view(), name="signup"),
    path('login/', views.LoginView.as_view(), name="login"),
    path('organization/', views.OrganizationView.as_view(), name="organization"),
    path('organization/members/', views.OrganizationMembersView.as_view(), name="organization-members"),
    path('organization/members/<int:pk>/', views.OrganizationMemberDetailView.as_view(), name="organization-member-detail"),
    path('kanban-board/', views.KanbanBoardView.as_view(), name="kanban-board"),
    path('user-role/', views.UserRoleView.as_view(), name="user-role"),
    path('users/', views.UsersView.as_view(), name="users"),
    path('projects/<int:pk>/', views.ProjectAPIView.as_view(), name='project-detail'),
    path('projects/', views.ProjectAPIView.as_view(), name='project-list'),
    path("tasks/", views.TaskAPIView.as_view(), name="task-list"),  
    path("tasks/<int:pk>/", views.TaskAPIView.as_view(), name="task-detail"),
    path("tasks/<int:pk>/comments/", views.TaskCommentView.as_view(), name="task-comments"),
    path("tasks/<int:pk>/attachments/", views.TaskAttachmentView.as_view(), name="task-attachments"),
    path("attachments/<int:pk>/", views.AttachmentDetailView.as_view(), name="attachment-detail"),
    path("projects/<int:pk>/activities/", views.ProjectActivityLogView.as_view(), name="project-activities"),

    # Mini-CRM Clients & Time Tracking Endpoints
    path("clients/", views.ClientListCreateView.as_view(), name="client-list"),
    path("clients/<int:pk>/", views.ClientDetailView.as_view(), name="client-detail"),
    path("tasks/<int:pk>/time-entries/", views.TaskTimeEntryView.as_view(), name="task-time-entries"),
    path("time-entries/<int:pk>/", views.TimeEntryDetailView.as_view(), name="time-entry-detail"),

    # AI Feature Endpoints
    path("ai/enhance-task/", ai_views.AIEnhanceTaskView.as_view(), name="ai-enhance-task"),
    path("ai/breakdown-task/", ai_views.AIBreakdownTaskView.as_view(), name="ai-breakdown-task"),
    path("ai/sprint-summary/", ai_views.AISprintSummaryView.as_view(), name="ai-sprint-summary"),
    path("ai/chat/", ai_views.AIChatView.as_view(), name="ai-chat"),
    path("ai/config/", ai_views.AIConfigView.as_view(), name="ai-config"),
]
