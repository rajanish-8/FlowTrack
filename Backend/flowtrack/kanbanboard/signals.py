"""
signals.py — Django signals for FlowTrack.

Handles:
- Email notification when a task is assigned (task.assigned_to changes).
- In-app Notification creation when task is assigned or due in 24 h.
"""

import datetime
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings


@receiver(pre_save, sender='kanbanboard.Task')
def track_assignment_change(sender, instance, **kwargs):
    """Store the old assigned_to on the instance so post_save can compare."""
    if instance.pk:
        try:
            old = sender.objects.get(pk=instance.pk)
            instance._old_assigned_to_id = old.assigned_to_id
        except sender.DoesNotExist:
            instance._old_assigned_to_id = None
    else:
        instance._old_assigned_to_id = None


@receiver(post_save, sender='kanbanboard.Task')
def on_task_saved(sender, instance, created, **kwargs):
    """
    After a Task is saved:
    1. If assignment changed → create Notification + send console email.
    2. If due_date == tomorrow → create "task due" Notification.
    """
    # Avoid circular imports
    from .models import Notification

    old_assigned_id = getattr(instance, '_old_assigned_to_id', None)
    new_assigned = instance.assigned_to  # ProjectMember or None

    # ── 1. Assignment changed ──────────────────────────────────────────────
    assignment_changed = (
        created and new_assigned is not None
    ) or (
        not created
        and new_assigned is not None
        and new_assigned.pk != old_assigned_id
    )

    if assignment_changed and new_assigned is not None:
        assignee_user = new_assigned.user
        Notification.objects.create(
            user=assignee_user,
            message=f"You have been assigned to task: '{instance.title}'",
            type=Notification.TYPE_TASK_ASSIGNED,
            related_task=instance,
        )

        # Console email (EMAIL_BACKEND = console)
        try:
            send_mail(
                subject=f"[FlowTrack] New task assigned: {instance.title}",
                message=(
                    f"Hi {assignee_user.username},\n\n"
                    f"You have been assigned to task '{instance.title}' "
                    f"in project '{instance.project.name}'.\n\n"
                    f"Due date: {instance.due_date or 'Not set'}\n"
                    f"Priority: {instance.priority}\n\n"
                    "— FlowTrack"
                ),
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@flowtrack.app'),
                recipient_list=[assignee_user.email],
                fail_silently=True,
            )
        except Exception:
            pass  # Never crash the request because of email

    # ── 2. Due-tomorrow notification ───────────────────────────────────────
    if instance.due_date:
        tomorrow = datetime.date.today() + datetime.timedelta(days=1)
        if instance.due_date == tomorrow and new_assigned is not None:
            assignee_user = new_assigned.user
            # Avoid duplicate due-soon notifications
            already_notified = Notification.objects.filter(
                user=assignee_user,
                type=Notification.TYPE_TASK_DUE,
                related_task=instance,
            ).exists()
            if not already_notified:
                Notification.objects.create(
                    user=assignee_user,
                    message=f"Task '{instance.title}' is due tomorrow!",
                    type=Notification.TYPE_TASK_DUE,
                    related_task=instance,
                )


@receiver(post_save, sender='kanbanboard.TaskComment')
def on_comment_added(sender, instance, created, **kwargs):
    """Create a Notification for the task assignee when a comment is added."""
    if not created:
        return

    from .models import Notification

    task = instance.task
    if task.assigned_to is None:
        return

    assignee_user = task.assigned_to.user

    # Don't notify the author of their own comment
    if instance.user_id == assignee_user.pk:
        return

    Notification.objects.create(
        user=assignee_user,
        message=f"{instance.user.username} commented on task '{task.title}': {instance.content[:80]}",
        type=Notification.TYPE_COMMENT_ADDED,
        related_task=task,
    )
