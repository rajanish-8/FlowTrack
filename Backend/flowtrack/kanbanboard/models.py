from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError


# Create your models here.

class Account(AbstractUser):
    username = models.CharField(max_length=50, unique=False)
    email = models.EmailField(max_length=100, unique=True)
    profile_picture= models.ImageField(upload_to="Profiles/", blank=True, default="Profiles/default.png", null=True)
    # Legacy application-level flag. Organization roles now live on OrganizationMembership.
    is_super_admin = models.BooleanField(default=False)
    skills = models.TextField(blank=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

class Organization(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class OrganizationMembership(models.Model):
    ROLE_OWNER = "owner"
    ROLE_MANAGER = "manager"
    ROLE_MEMBER = "member"

    ROLE_CHOICES = [
        (ROLE_OWNER, "Organization Owner"),
        (ROLE_MANAGER, "Manager"),
        (ROLE_MEMBER, "Member"),
    ]

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(Account, on_delete=models.CASCADE, related_name="organization_memberships")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=ROLE_MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["organization", "user"], name="unique_user_per_organization"),
            models.UniqueConstraint(fields=["user"], name="unique_organization_per_user"),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.organization.name} ({self.role})"

    def clean(self):
        if self.pk and self.role != self.ROLE_OWNER:
            old = OrganizationMembership.objects.filter(pk=self.pk).first()
            if old and old.role == self.ROLE_OWNER:
                other_owner_exists = OrganizationMembership.objects.filter(
                    organization=old.organization,
                    role=self.ROLE_OWNER,
                ).exclude(pk=self.pk).exists()
                if not other_owner_exists:
                    raise ValidationError("Cannot demote the only organization owner.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

class Client(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="clients")
    name = models.CharField(max_length=100)
    contact_name = models.CharField(max_length=100, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    phone = models.CharField(max_length=40, blank=True, default="")
    website = models.URLField(blank=True, default="")
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Project(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(blank=True,null=True)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="projects", null=True, blank=True)
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True, blank=True, related_name="projects")
    members = models.ManyToManyField(Account, through='ProjectMember', related_name="projects")
    
class ProjectMember(models.Model):
    ROLE_CHOICES = [
        ('manager','Manager'),
        ('member','Member')
    ]

    user = models.ForeignKey(Account, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE) 
    role = models.CharField(max_length=10,choices=ROLE_CHOICES, default="member")
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'project')  # Prevent duplicate memberships


class Task(models.Model):
    PRIORITY = [
        ('high','High'),
        ('medium','Medium'),
        ('low','Low')
    ]

    STATUS = [
        ('to do', 'To do'),
        ('in progress', "In progress"),
        ('review','Review'),
        ('done','Done')
    ]

    title = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY, default="low")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    assigned_to = models.ForeignKey(ProjectMember, on_delete=models.CASCADE, related_name="assigned_tasks")  # or ManyToManyField if multiple
    status = models.CharField(max_length=20, choices=STATUS, default="to do")
    checklist = models.JSONField(default=list, blank=True)
    estimated_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0.0)
    recurrence = models.CharField(max_length=20, default="none")
    resolution = models.TextField(blank=True, default="")
    blocked_reason = models.CharField(max_length=255, blank=True, default="")
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    def __str__(self):
        return self.title


class TimeEntry(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='time_entries')
    user = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='time_entries')
    duration_minutes = models.PositiveIntegerField(default=0)
    date = models.DateField(auto_now_add=True)
    notes = models.CharField(max_length=255, blank=True, default="")
    billable = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.duration_minutes}m on {self.task.title}"


class TaskComment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='task_comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.user.username} on {self.task.title}"


class TaskAttachment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    user = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True)
    file = models.FileField(upload_to="TaskAttachments/")
    filename = models.CharField(max_length=255)
    file_size = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.filename} ({self.task.title})"


class ActivityLog(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=60)
    details = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.project.name}] {self.details}"


class Notification(models.Model):
    TYPE_TASK_ASSIGNED = 'task_assigned'
    TYPE_TASK_DUE = 'task_due'
    TYPE_COMMENT_ADDED = 'comment_added'
    TYPE_GENERAL = 'general'

    TYPE_CHOICES = [
        (TYPE_TASK_ASSIGNED, 'Task Assigned'),
        (TYPE_TASK_DUE, 'Task Due Soon'),
        (TYPE_COMMENT_ADDED, 'Comment Added'),
        (TYPE_GENERAL, 'General'),
    ]

    user = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    type = models.CharField(max_length=30, choices=TYPE_CHOICES, default=TYPE_GENERAL)
    related_task = models.ForeignKey(Task, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.type}] {self.user.email}: {self.message[:50]}"
