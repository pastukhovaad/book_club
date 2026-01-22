from django.urls import path

from . import views

urlpatterns = [
    path("register_user/", views.register_user, name="register_user"),
    path("create_book/", views.create_book, name="create_book"),
    path("book_list/<int:amount>/", views.book_list, name="book_list"),
    # path("group_list", views.reading_group_list, name="group_list"),
    path(
        "group_list/<int:amount>/",
        views.reading_group_list,
        name="group_list",
    ),
    path("books/<slug:slug>", views.get_book, name="get_book"),
    path("update_book/<int:pk>/", views.update_book, name="update_book"),
    path("delete_book/<int:pk>/", views.delete_book, name="delete_book"),
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
    path("update_group/<int:pk>/", views.update_reading_group, name="update_reading_group"),
    path("delete_group/<int:pk>/", views.delete_reading_group, name="delete_reading_group"),
    path("group/<int:pk>/add_user/", views.add_user_to_group, name="add_user_to_group"),
    path("group/<int:pk>/remove_user/", views.remove_user_from_group, name="remove_user_from_group"),
]
