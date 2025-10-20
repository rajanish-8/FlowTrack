from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Account, Project, ProjectMember, Task

# Custom User Admin for Account model
@admin.register(Account)
class AccountAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_super_admin', 'is_active', 'date_joined')
    list_filter = ('is_super_admin', 'is_active', 'is_staff', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'profile_picture', 'skills')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_super_admin', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'is_super_admin'),
        }),
    )
    
    actions = ['make_super_admin', 'remove_super_admin']
    
    def make_super_admin(self, request, queryset):
        queryset.update(is_super_admin=True)
        self.message_user(request, f"{queryset.count()} user(s) made super admin.")
    make_super_admin.short_description = "Make selected users super admin"
    
    def remove_super_admin(self, request, queryset):
        queryset.update(is_super_admin=False)
        self.message_user(request, f"{queryset.count()} user(s) removed from super admin.")
    remove_super_admin.short_description = "Remove super admin from selected users"

# Project Admin
@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'description_preview', 'member_count', 'task_count', 'created_at', 'end_date')
    list_filter = ('created_at', 'end_date')
    search_fields = ('name', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
    
    fieldsets = (
        (None, {'fields': ('name', 'description')}),
        ('Timeline', {'fields': ('created_at', 'end_date')}),
    )
    
    def description_preview(self, obj):
        return obj.description[:50] + "..." if len(obj.description) > 50 else obj.description
    description_preview.short_description = "Description"
    
    def member_count(self, obj):
        return obj.members.count()
    member_count.short_description = "Members"
    
    def task_count(self, obj):
        return obj.tasks.count()
    task_count.short_description = "Tasks"

# ProjectMember Admin
@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'project', 'role', 'joined_at')
    list_filter = ('role', 'joined_at', 'project')
    search_fields = ('user__username', 'user__email', 'project__name')
    ordering = ('-joined_at',)
    readonly_fields = ('joined_at',)
    
    fieldsets = (
        (None, {'fields': ('user', 'project', 'role')}),
        ('Timeline', {'fields': ('joined_at',)}),
    )
    
    actions = ['make_manager', 'make_member']
    
    def make_manager(self, request, queryset):
        queryset.update(role='manager')
        self.message_user(request, f"{queryset.count()} member(s) promoted to manager.")
    make_manager.short_description = "Promote selected members to manager"
    
    def make_member(self, request, queryset):
        queryset.update(role='member')
        self.message_user(request, f"{queryset.count()} member(s) demoted to member.")
    make_member.short_description = "Demote selected members to member"

# Task Admin
@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'assigned_to_user', 'status', 'priority', 'due_date')
    list_filter = ('status', 'priority', 'project', 'due_date', 'assigned_to__role')
    search_fields = ('title', 'description', 'project__name', 'assigned_to__user__username')
    ordering = ('title',)
    
    fieldsets = (
        (None, {'fields': ('title', 'description')}),
        ('Assignment', {'fields': ('project', 'assigned_to')}),
        ('Details', {'fields': ('status', 'priority', 'due_date')}),
    )
    
    def assigned_to_user(self, obj):
        return obj.assigned_to.user.username if obj.assigned_to else "Unassigned"
    assigned_to_user.short_description = "Assigned To"
    
    actions = ['mark_to_do', 'mark_in_progress', 'mark_review', 'mark_done']
    
    def mark_to_do(self, request, queryset):
        queryset.update(status='to do')
        self.message_user(request, f"{queryset.count()} task(s) marked as 'To Do'.")
    mark_to_do.short_description = "Mark selected tasks as 'To Do'"
    
    def mark_in_progress(self, request, queryset):
        queryset.update(status='in progress')
        self.message_user(request, f"{queryset.count()} task(s) marked as 'In Progress'.")
    mark_in_progress.short_description = "Mark selected tasks as 'In Progress'"
    
    def mark_review(self, request, queryset):
        queryset.update(status='review')
        self.message_user(request, f"{queryset.count()} task(s) marked as 'Review'.")
    mark_review.short_description = "Mark selected tasks as 'Review'"
    
    def mark_done(self, request, queryset):
        queryset.update(status='done')
        self.message_user(request, f"{queryset.count()} task(s) marked as 'Done'.")
    mark_done.short_description = "Mark selected tasks as 'Done'"

# Customize admin site
admin.site.site_header = "FlowTrack Administration"
admin.site.site_title = "FlowTrack Admin"
admin.site.index_title = "Welcome to FlowTrack Administration"
