from django.apps import AppConfig


class KanbanboardConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'kanbanboard'

    def ready(self):
        import kanbanboard.signals  # noqa: F401 — register signals
