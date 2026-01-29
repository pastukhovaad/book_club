from django.urls import path

from . import views

urlpatterns = [
    path("register_user/", views.register_user, name="register_user"),
    path("create_book/", views.create_book, name="create_book"),
    path("create_notification/", views.create_notification, name="create_notification"),
    path("book_list/<int:amount>/", views.book_list, name="book_list"),
    # path("group_list", views.reading_group_list, name="group_list"),
    path(
        "group_list/<int:amount>/",
        views.reading_group_list,
        name="group_list",
    ),
    path(
        "notifications/<int:amount>/",
        views.notification_list,
        name="notification_list",
    ),
    path("books/<slug:slug>/chapters/<int:chapter_id>/", views.get_book_chapter, name="get_book_chapter"),
    path("books/<slug:slug>/chapters/", views.get_book_chapters_list, name="get_book_chapters_list"),
    path("books/<slug:slug>", views.get_book, name="get_book"),
    path("update_book/<int:pk>/", views.update_book, name="update_book"),
    path("delete_book/<int:pk>/", views.delete_book, name="delete_book"),
    path(
        "delete_notification/<int:pk>/",
        views.delete_notification,
        name="delete_notification",
    ),
    path("update_user/", views.update_user_profile, name="update_user"),
    path("get_username", views.get_username, name="get_username"),
    path("get_userinfo/<str:username>", views.get_userinfo, name="get_userinfo"),
    path("get_user/<str:email>", views.get_user, name="get_user"),
    path(
        "groups/<slug:slug>", views.get_reading_group, name="get_reading_group"
    ),  # REM
    path("groups/", views.reading_group_list, name="get_reading_groups"),  # REM
    path("books/", views.book_list, name="get_books"),  # REM
    path("books/<slug:slug>/page", views.get_book, name="get_book_page"),
    path("create_group/", views.create_reading_group, name="create_reading_group"),
    path(
        "update_group/<int:pk>/",
        views.update_reading_group,
        name="update_reading_group",
    ),
    path(
        "delete_group/<int:pk>/",
        views.delete_reading_group,
        name="delete_reading_group",
    ),
    path("group/<int:pk>/add_user/", views.add_user_to_group, name="add_user_to_group"),
    path(
        "group/<int:pk>/remove_user/",
        views.remove_user_from_group,
        name="remove_user_from_group",
    ),
    path("notifications/", views.notification_list, name="notification_list"),
    path("get_notification/<int:id>/", views.get_notification, name="get_notification"),
    path(
        "user_to_reading_group_state_list/<int:pk>/",
        views.user_to_reading_group_state_list,
        name="user_to_reading_group_state_list",
    ),
    path(
        "user_reading_groups/",
        views.get_user_reading_groups,
        name="get_user_reading_groups",
    ),
    path(
        "group/<int:pk>/confirm_user/<int:user_id>/",
        views.confirm_user_to_group,
        name="confirm_user_to_group",
    ),
    # Book Comments endpoints
    path(
        "books/<slug:slug>/comments/",
        views.get_book_comments,
        name="get_book_comments"
    ),
    path(
        "books/<slug:slug>/comments/create/",
        views.create_book_comment,
        name="create_book_comment"
    ),
    path(
        "books/<slug:slug>/comments/<int:comment_id>/",
        views.get_book_comment,
        name="get_book_comment"
    ),
    path(
        "books/<slug:slug>/comments/<int:comment_id>/update/",
        views.update_book_comment,
        name="update_book_comment"
    ),
    path(
        "books/<slug:slug>/comments/<int:comment_id>/delete/",
        views.delete_book_comment,
        name="delete_book_comment"
    ),
    # Comment Replies endpoints
    path(
        "books/<slug:slug>/comments/<int:comment_id>/replies/",
        views.get_comment_replies,
        name="get_comment_replies"
    ),
    path(
        "books/<slug:slug>/comments/<int:comment_id>/replies/create/",
        views.create_comment_reply,
        name="create_comment_reply"
    ),
    path(
        "books/<slug:slug>/comments/<int:comment_id>/replies/<int:reply_id>/update/",
        views.update_comment_reply,
        name="update_comment_reply"
    ),
    path(
        "books/<slug:slug>/comments/<int:comment_id>/replies/<int:reply_id>/delete/",
        views.delete_comment_reply,
        name="delete_comment_reply"
    ),
]
