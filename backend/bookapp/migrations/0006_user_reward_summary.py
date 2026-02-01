import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("bookapp", "0005_add_page_tracking_to_reading_progress"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserRewardSummary",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "total_count",
                    models.PositiveIntegerField(default=0, verbose_name="Количество"),
                ),
                (
                    "last_received_at",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="Последняя дата получения"
                    ),
                ),
                (
                    "reward_template",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reward_summaries",
                        to="bookapp.rewardtemplate",
                        verbose_name="Шаблон приза",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="reward_summaries",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Пользователь",
                    ),
                ),
            ],
            options={
                "verbose_name": "Сводка по призам",
                "verbose_name_plural": "Сводки по призам",
            },
        ),
        migrations.AlterUniqueTogether(
            name="userrewardsummary",
            unique_together={("user", "reward_template")},
        ),
        migrations.AddIndex(
            model_name="userrewardsummary",
            index=models.Index(
                fields=["user", "reward_template"],
                name="reward_summary_user_reward_template_idx",
            ),
        ),
    ]
