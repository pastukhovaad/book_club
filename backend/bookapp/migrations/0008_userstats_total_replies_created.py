from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        (
            "bookapp",
            "0007_rename_reward_summary_user_reward_template_idx_bookapp_use_user_id_657e96_idx",
        ),
    ]

    operations = [
        migrations.AddField(
            model_name="userstats",
            name="total_replies_created",
            field=models.PositiveIntegerField(
                default=0, verbose_name="Всего ответов создано"
            ),
        ),
    ]
