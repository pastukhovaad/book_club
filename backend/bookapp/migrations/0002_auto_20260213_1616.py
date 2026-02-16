from django.db import migrations


def seed_quest_templates(apps, schema_editor):
    QuestTemplate = apps.get_model("bookapp", "QuestTemplate")
    templates = [
        {
            "title": "Активный читатель",
            "description": "Прочитайте книгу сегодня",
            "quest_type": "read_books",
            "quest_scope": "personal",
            "target_count": 2,
        },
        {
            "title": "Читательский марафон",
            "description": "Оставьте комментарии к книгам",
            "quest_type": "create_comments",
            "quest_scope": "personal",
            "target_count": 3,
        },
        {
            "title": "Обсуждение",
            "description": "Ответьте на комментарии других читателей",
            "quest_type": "reply_comments",
            "quest_scope": "personal",
            "target_count": 2,
        },
        {
            "title": "Украшение",
            "description": "Разместите призы на доске",
            "quest_type": "place_rewards",
            "quest_scope": "personal",
            "target_count": 3,
        },
        {
            "title": "Книжный червь",
            "description": "Прочитайте несколько книг",
            "quest_type": "read_books",
            "quest_scope": "personal",
            "target_count": 2,
        },
        {
            "title": "Комментатор",
            "description": "Оставьте много комментариев",
            "quest_type": "create_comments",
            "quest_scope": "personal",
            "target_count": 5,
        },
        {
            "title": "Активные читатели",
            "description": "Прочитайте книгу сегодня",
            "quest_type": "read_books",
            "quest_scope": "group",
            "target_count": 20,
        },
        {
            "title": "Читательский марафон",
            "description": "Оставьте комментарии к книгам",
            "quest_type": "create_comments",
            "quest_scope": "group",
            "target_count": 30,
        },
        {
            "title": "Обсуждение",
            "description": "Ответьте на комментарии других читателей",
            "quest_type": "reply_comments",
            "quest_scope": "group",
            "target_count": 20,
        },
        {
            "title": "Украшение",
            "description": "Разместите призы на доске",
            "quest_type": "place_rewards",
            "quest_scope": "group",
            "target_count": 30,
        },
        {
            "title": "Книжный червь",
            "description": "Прочитайте несколько книг",
            "quest_type": "read_books",
            "quest_scope": "group",
            "target_count": 20,
        },
        {
            "title": "Комментатор",
            "description": "Оставьте много комментариев",
            "quest_type": "create_comments",
            "quest_scope": "group",
            "target_count": 50,
        },
    ]
    for t in templates:
        QuestTemplate.objects.get_or_create(title=t["title"], defaults=t)


class Migration(migrations.Migration):

    dependencies = [
        ("bookapp", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_quest_templates),
    ]
