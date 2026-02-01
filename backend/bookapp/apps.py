from django.apps import AppConfig


class BookappConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'bookapp'

    def ready(self):
        """Import signals when Django starts."""
        import bookapp.signals  # noqa
