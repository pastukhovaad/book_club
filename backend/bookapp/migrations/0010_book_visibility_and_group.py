import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("bookapp", "0009_alter_customuser_username"),
    ]

    operations = [
        migrations.AddField(
            model_name="book",
            name="visibility",
            field=models.CharField(
                choices=[
                    ("public", "Публичная (видимая всем)"),
                    ("group", "Групповая (видимая только членам вашей группы)"),
                    ("personal", "Личная (видимая только вам)"),
                ],
                default="public",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="book",
            name="reading_group",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="books",
                to="bookapp.readinggroup",
            ),
        ),
    ]
