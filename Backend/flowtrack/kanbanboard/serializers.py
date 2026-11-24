from rest_framework import serializers
from .models import Account, Organization, OrganizationMembership, Project, Task, ProjectMember, TaskComment, ActivityLog, TaskAttachment, Client, TimeEntry, Notification
from django.db import transaction, IntegrityError

class SignupSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length = 50)
    last_name = serializers.CharField(max_length = 50, required=False, allow_blank=True)
    email = serializers.EmailField()
    password = serializers.CharField(write_only = True)
    skills = serializers.CharField(required=False, allow_blank=True)
    profilePicture = serializers.ImageField(required = False)

    def validate_email(self, value):
        if Account.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email is already in use.")
        return value
    

    def create(self, validated_data):
     account = Account.objects.create_user(
        username = validated_data.get("email"),
        first_name = validated_data["first_name"],
        last_name = validated_data.get("last_name", ""),
        email = validated_data["email"],
        password = validated_data["password"],
        profile_picture = validated_data.get("profilePicture"),  
        skills = validated_data.get("skills", "")
     )
     account.save()
     return account

class OrganizationSerializer(serializers.ModelSerializer):
   class Meta:
      model = Organization
      fields = ["id", "name", "description", "created_at"]
      read_only_fields = ["id", "created_at"]

class CreateOrganizationSerializer(serializers.ModelSerializer):
   class Meta:
      model = Organization
      fields = ["name", "description"]

   def validate(self, attrs):
      user = self.context["request"].user
      if OrganizationMembership.objects.filter(user=user).exists():
         raise serializers.ValidationError("You already belong to an organization.")
      return attrs

   def create(self, validated_data):
      user = self.context["request"].user
      with transaction.atomic():
         organization = Organization.objects.create(**validated_data)
         OrganizationMembership.objects.create(
            organization=organization,
            user=user,
            role=OrganizationMembership.ROLE_OWNER,
         )
      return organization

class OrganizationMembershipSerializer(serializers.ModelSerializer):
   user_id = serializers.IntegerField(source="user.id", read_only=True)
   username = serializers.CharField(source="user.username", read_only=True)
   email = serializers.EmailField(source="user.email", read_only=True)
   profile_picture = serializers.ImageField(source="user.profile_picture", use_url=True, read_only=True)

   class Meta:
      model = OrganizationMembership
      fields = ["id", "user_id", "username", "email", "profile_picture", "role", "joined_at"]
      read_only_fields = ["id", "joined_at"]

class AddOrganizationMemberSerializer(serializers.Serializer):
   email = serializers.EmailField()
   role = serializers.ChoiceField(choices=[
      OrganizationMembership.ROLE_MANAGER,
      OrganizationMembership.ROLE_MEMBER,
   ])

   def validate_email(self, value):
      try:
         self.user = Account.objects.get(email__iexact=value)
      except Account.DoesNotExist:
         raise serializers.ValidationError("No account exists for this email. Ask the user to sign up first.")
      return value

   def validate(self, attrs):
      organization = self.context["organization"]
      if OrganizationMembership.objects.filter(user=self.user).exclude(organization=organization).exists():
         raise serializers.ValidationError("This user already belongs to another organization.")
      if OrganizationMembership.objects.filter(user=self.user, organization=organization).exists():
         raise serializers.ValidationError("This user is already in your organization.")
      return attrs

   def create(self, validated_data):
      organization = self.context["organization"]
      return OrganizationMembership.objects.create(
         organization=organization,
         user=self.user,
         role=validated_data["role"],
      )

class UpdateOrganizationMemberSerializer(serializers.Serializer):
   role = serializers.ChoiceField(choices=[
      OrganizationMembership.ROLE_MANAGER,
      OrganizationMembership.ROLE_MEMBER,
   ])

class ProjectMemberMiniSerializer(serializers.ModelSerializer):
   id = serializers.IntegerField(read_only=True)
   username = serializers.CharField(source = "user.username")
   profile_picture = serializers.ImageField(source = "user.profile_picture")
   user_id = serializers.IntegerField(source = "user.id")
   class Meta:
      model = ProjectMember
      fields = ["id", "username", "profile_picture", "user_id"]

class AccountMiniSerializer(serializers.ModelSerializer):
   profile_picture = serializers.ImageField(use_url=True)
   class Meta:
      model = Account
      fields = ["id","username", "email", "profile_picture"]


class TaskSerializerForBoard(serializers.ModelSerializer):
   assigned_to = ProjectMemberMiniSerializer(read_only=True)
   project = serializers.IntegerField(source="project.id", read_only=True)
   total_time_minutes = serializers.SerializerMethodField()

   class Meta:
      model=Task
      fields = [
         "id","title","description","due_date","assigned_to", "status", "priority", 
         "project", "checklist", "created_at", "estimated_hours", "recurrence", 
         "resolution", "blocked_reason", "tags", "total_time_minutes"
      ]

   def get_total_time_minutes(self, obj):
      return sum(entry.duration_minutes for entry in obj.time_entries.all())

class CreateTaskForBoard(serializers.ModelSerializer):
   project = serializers.PrimaryKeyRelatedField(queryset= Project.objects.all(), write_only=True, required=False)
   assigned_to = serializers.PrimaryKeyRelatedField(queryset=ProjectMember.objects.all(),write_only=True, required=False)
   checklist = serializers.JSONField(required=False)
   tags = serializers.JSONField(required=False)

   class Meta:
      model = Task
      fields = [
         "title", "description","due_date","priority","project","assigned_to", 
         "status", "checklist", "estimated_hours", "recurrence", "resolution", 
         "blocked_reason", "tags"
      ]   

   def create(self, validated_data):
      try:
         with transaction.atomic():
            task = Task.objects.create(
                 title=validated_data.get("title"),
                 description=validated_data.get("description", ""),
                 due_date=validated_data.get("due_date"),
                 priority=validated_data.get("priority", "low"),
                 status=validated_data.get("status", "to do"),
                 project=validated_data.get("project"),
                 assigned_to=validated_data.get("assigned_to"),
                 checklist=validated_data.get("checklist", []),
                 estimated_hours=validated_data.get("estimated_hours", 0.0),
                 recurrence=validated_data.get("recurrence", "none"),
                 resolution=validated_data.get("resolution", ""),
                 blocked_reason=validated_data.get("blocked_reason", ""),
                 tags=validated_data.get("tags", [])
            )

            return task
          
      except IntegrityError as e:
         raise serializers.ValidationError({"Error":f"Error creating Task {e}"})    
       


class ProjectSerializerForBoard(serializers.ModelSerializer):
   tasks = TaskSerializerForBoard(many=True,read_only=True )
   members = serializers.SerializerMethodField()
   client = serializers.IntegerField(source="client.id", read_only=True)
   client_name = serializers.CharField(source="client.name", read_only=True)

   class Meta:
      model =  Project
      fields = ["id","name","members","tasks", "client", "client_name"]

   def get_members(self, obj):
      return ProjectMemberDetailSerializer(obj.projectmember_set.select_related("user"), many=True).data



class ProjectMemberDetailSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id')
    username = serializers.CharField(source='user.username')
    email = serializers.CharField(source='user.email')
    profile_picture = serializers.ImageField(source='user.profile_picture', use_url=True)
    
    class Meta:
        model = ProjectMember
        fields = ["id", "user_id", "username", "email", "profile_picture", "role"]

class ProjectDetailSerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()
    team_member_ids = serializers.ListField(child=serializers.IntegerField(), write_only = True)
    manager_ids = serializers.ListField(child = serializers.IntegerField(), write_only = True)

    class Meta:
        model = Project
        fields = ["id", "name", "description", "created_at", "end_date", "organization", "members", "team_member_ids", "manager_ids"]
    
    def get_members(self, obj):
        # Get ProjectMember objects related to this project
        project_members = obj.projectmember_set.all()
        return ProjectMemberDetailSerializer(project_members, many=True).data

class CreateProjectSerializer(serializers.ModelSerializer):
   team_member_ids = serializers.ListField(child=serializers.IntegerField(), write_only = True)
   manager_ids = serializers.ListField(child = serializers.IntegerField(), write_only = True)

   class Meta:
      model = Project
      fields = ["name", "description",  "end_date", "team_member_ids", "manager_ids"]

   def validate(self, attrs):
      organization = self.context.get("organization")
      #extract team_member_ids and manager_ids for verification
      team_member_ids = set(attrs.get("team_member_ids",[]))
      manager_ids = set(attrs.get("manager_ids",[]))
      
      #taking union
      team_member_ids |= manager_ids    
      
      #first validation: Accounts exist
      accounts = Account.objects.filter(id__in=team_member_ids)
      if accounts.count() != len(team_member_ids):
         existing = set(accounts.values_list("id", flat=True))
         missing = list(team_member_ids - existing)
         raise serializers.ValidationError({"team_member_ids": f"User Ids not found: {missing}"})

      if organization:
         org_member_ids = set(
            OrganizationMembership.objects.filter(
               organization=organization,
               user_id__in=team_member_ids,
            ).values_list("user_id", flat=True)
         )
         missing_from_org = list(team_member_ids - org_member_ids)
         if missing_from_org:
            raise serializers.ValidationError({"team_member_ids": f"Users are not in this organization: {missing_from_org}"})
      
      attrs["team_member_ids"] = list(team_member_ids)
      attrs["manager_ids"] = list(manager_ids)

      return attrs
   
   def create(self, validated_data):
      team_member_ids = validated_data.pop("team_member_ids",[])
      manager_ids = validated_data.pop("manager_ids",[])
      owner = self.context.get("owner")
      if owner:
         team_member_ids = set(team_member_ids)
         manager_ids = set(manager_ids)
         team_member_ids.add(owner.id)
         manager_ids.add(owner.id)

      try:
         with transaction.atomic():
            project = Project.objects.create(
               name=validated_data.get("name"),
               description = validated_data.get("description",""),
               end_date = validated_data.get("end_date",None),
               organization = self.context.get("organization")
            )

            members = []
            for id in team_member_ids:
               role = "manager" if id in manager_ids else "member"
               members.append(ProjectMember(user_id = id, project = project, role = role))

            ProjectMember.objects.bulk_create(members)   

            return project

      except IntegrityError as e:
         raise serializers.ValidationError({"Error":f"{e}"})     


   def update(self, instance, validated_data):
         team_member_ids = set(validated_data.pop("team_member_ids",[]))
         manager_ids = set(validated_data.pop("manager_ids",[]))
         owner = self.context.get("owner")
         if owner:
            team_member_ids.add(owner.id)
            manager_ids.add(owner.id)

         team_member_ids |= manager_ids

         try:
            with transaction.atomic():
               instance.name = validated_data.get("name", instance.name)
               instance.description = validated_data.get("description", instance.description)
               instance.end_date = validated_data.get("end_date", instance.end_date)


               instance_team_member_ids = instance.members.values_list("id", flat=True)
               instance_team_member_ids = set(instance_team_member_ids)
               new_member_ids = team_member_ids-instance_team_member_ids
               remove_members_ids = instance_team_member_ids - team_member_ids
                
               
               ProjectMember.objects.filter(project=instance, user_id__in=remove_members_ids).delete()

            # Add new members
               members_to_add = []
               for user_id in new_member_ids:
                 role = "manager" if user_id in manager_ids else "member"
                 members_to_add.append(ProjectMember(user_id=user_id, project=instance, role=role))
               ProjectMember.objects.bulk_create(members_to_add)

            # Update roles of existing members if changed
               for member in ProjectMember.objects.filter(project=instance):
                 if member.user_id in manager_ids:
                    member.role = "manager"
                 else:
                    member.role = "member"
                  
                 member.save()
               
               return instance


         except IntegrityError as e:
            raise serializers.ValidationError({"error":f"Error updating project : {e}"})       



         
class UserRoleSerializer(serializers.ModelSerializer):
    project_id = serializers.IntegerField(source='project.id')
    project_name = serializers.CharField(source='project.name')
    role = serializers.CharField()
    
    class Meta:
        model = ProjectMember
        fields = ["project_id", "project_name", "role"]


class TaskCommentSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_profile_picture = serializers.ImageField(source='user.profile_picture', read_only=True)

    class Meta:
        model = TaskComment
        fields = ['id', 'task', 'user', 'user_username', 'user_profile_picture', 'content', 'created_at']
        read_only_fields = ['user', 'task', 'created_at']


class ActivityLogSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = ActivityLog
        fields = ['id', 'project', 'user', 'user_username', 'action', 'details', 'created_at']
        read_only_fields = ['created_at']


class TaskAttachmentSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = TaskAttachment
        fields = ['id', 'task', 'user', 'user_username', 'file', 'file_url', 'filename', 'file_size', 'created_at']
        read_only_fields = ['user', 'task', 'created_at', 'file_url']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file:
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class ClientSerializer(serializers.ModelSerializer):
    projects_count = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = ["id", "name", "contact_name", "email", "phone", "website", "notes", "created_at", "projects_count"]
        read_only_fields = ["id", "created_at", "projects_count"]

    def get_projects_count(self, obj):
        return obj.projects.count()


class TimeEntrySerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = TimeEntry
        fields = ["id", "task", "user", "user_username", "user_email", "duration_minutes", "date", "notes", "billable", "created_at"]
        read_only_fields = ["id", "user", "created_at"]


class NotificationSerializer(serializers.ModelSerializer):
    related_task_title = serializers.CharField(source='related_task.title', read_only=True, allow_null=True)

    class Meta:
        model = Notification
        fields = ['id', 'user', 'message', 'type', 'related_task', 'related_task_title', 'is_read', 'created_at']
        read_only_fields = ['id', 'user', 'message', 'type', 'related_task', 'created_at']




