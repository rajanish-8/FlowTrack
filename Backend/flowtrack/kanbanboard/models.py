from django.db import models
from django.contrib.auth.models import User, AbstractUser
from django.core.exceptions import ValidationError


# Create your models here.

class Account(AbstractUser):
    username = models.CharField(max_length=50, unique=False)
    email = models.EmailField(max_length=100, unique=True)
    profile_picture= models.ImageField(upload_to="Profiles/", blank=True, default="Profiles/default.png", null=True)
    is_super_admin = models.BooleanField(default=False)
    skills = models.TextField(blank=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

class Project(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(blank=True,null=True)
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
    
    def clean(self):
        # Ensure user is only in one project
        if self.user and self.project:
            existing_membership = ProjectMember.objects.filter(user=self.user).exclude(pk=self.pk)
            if existing_membership.exists():
                raise ValidationError(f"User {self.user.username} is already assigned to another project.")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


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
