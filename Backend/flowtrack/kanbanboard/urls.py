from django.urls import path
from . import views

urlpatterns = [
   path('signup/', views.SignupView.as_view(), name="signup"),
   path('login/', views.LoginView.as_view(), name="login"),
   path('kanban-board/', views.KanbanBoardView.as_view(), name="kanban-board"),
   path('user-role/', views.UserRoleView.as_view(), name="user-role"),
   path('users/', views.UsersView.as_view(), name="users"),
   path('projects/<int:pk>/', views.ProjectAPIView.as_view(), name='project-detail'),
   path('projects/', views.ProjectAPIView.as_view(), name='project-list'),
   path("tasks/", views.TaskAPIView.as_view(), name="task-list"),  
   path("tasks/<int:pk>/", views.TaskAPIView.as_view(), name="task-detail"), 
]