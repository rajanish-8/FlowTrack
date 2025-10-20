from rest_framework import serializers
from .models import Account, Project, Task, ProjectMember
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

class ProjectMemberMiniSerializer(serializers.ModelSerializer):
   username = serializers.CharField(source = "user.username")
   profile_picture = serializers.ImageField(source = "user.profile_picture")
   user_id = serializers.IntegerField(source = "user.id")
   class Meta:
      model = ProjectMember
      fields = ["username", "profile_picture", "user_id"]

class AccountMiniSerializer(serializers.ModelSerializer):
   profile_picture = serializers.ImageField(use_url=True)
   class Meta:
      model = Account
      fields = ["id","username", "profile_picture"]


class TaskSerializerForBoard(serializers.ModelSerializer):
   assigned_to = ProjectMemberMiniSerializer(read_only=True)
   class Meta:
      model=Task
      fields = ["id","title","due_date","assigned_to", "status", "priority"]

class CreateTaskForBoard(serializers.ModelSerializer):
   project = serializers.PrimaryKeyRelatedField(queryset= Project.objects.all(), write_only=True)
   assigned_to = serializers.PrimaryKeyRelatedField(queryset=ProjectMember.objects.all(),write_only=True)

   class Meta:
      model = Task
      fields = ["title", "description","due_date","priority","project","assigned_to"]   

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
                    assigned_to=validated_data.get("assigned_to")
            )

            return task
          
      except IntegrityError as e:
         raise serializers.ValidationError({"Error":f"Error creating Task {e}"})    
       


class ProjectSerializerForBoard(serializers.ModelSerializer):
   
   tasks = TaskSerializerForBoard(many=True,read_only=True )

   class Meta:
      model =  Project
      fields = ["id","name","tasks"]



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
        fields = ["id", "name", "description", "created_at", "end_date", "members", "team_member_ids", "manager_ids"]
    
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
      
      #second validation: Accounts are not enrolled in any other project
      already = ProjectMember.objects.filter(user_id__in=team_member_ids)
      if getattr(self, 'instance', None):
         # For updates, exclude current project members
         already = already.exclude(project=self.instance)
      
      already_user_ids = set(already.values_list("user_id", flat=True))
      if already_user_ids:
         raise serializers.ValidationError({"team_member_ids":f"Following members are already enrolled in other projects: {list(already_user_ids)}"})
      
      attrs["team_member_ids"] = list(team_member_ids)
      attrs["manager_ids"] = list(manager_ids)

      return attrs
   
   def create(self, validated_data):
      team_member_ids = validated_data.pop("team_member_ids",[])
      manager_ids = validated_data.pop("manager_ids",[])

      try:
         with transaction.atomic():
            project = Project.objects.create(
               name=validated_data.get("name"),
               description = validated_data.get("description",""),
               end_date = validated_data.get("end_date",None)
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

         team_member_ids |= manager_ids

         try:
            with transaction.atomic():
               instance.name = validated_data.get("name", instance.name)
               instance.description = validated_data.get("description", instance.description)
               instance.end_date = validated_data.get("end_date", instance.end_date)


               instance_team_member_ids = instance.members.values_list("user_id", flat=True)
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







