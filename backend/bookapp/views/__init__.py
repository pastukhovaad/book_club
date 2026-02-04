"""
Views module for Book Club API.

Split from monolithic views.py for better organization and maintainability.
This __init__.py re-exports all view functions to maintain backward compatibility
with urls.py, allowing existing imports like `from . import views` to continue working.
"""

# Import shared utilities
from .utils import local_epub_path, AnyListPagination

# Import user management views
from .users import (
    get_username,
    get_userinfo,
    get_user,
    get_user_books,
    update_user_profile,
    get_user_stats,
)

# Import notification views
from .notifications import (
    get_notification,
    notification_list,
    create_notification,
    delete_notification,
)

# Import book views
from .books import (
    book_list,
    public_book_list,
    get_book,
    get_book_chapter,
    get_book_chapters_list,
    create_book,
    update_book,
    delete_book,
)

# Import reading group views
from .groups import (
    get_reading_group,
    reading_group_list,
    get_group_reading_books,
    get_group_posted_books,
    create_reading_group,
    update_reading_group,
    delete_reading_group,
    add_user_to_group,
    confirm_user_to_group,
    remove_user_from_group,
    get_user_reading_groups,
    get_user_created_groups,
    user_to_reading_group_state_list,
)

# Import comment views
from .comments import (
    get_book_comments,
    create_book_comment,
    get_book_comment,
    update_book_comment,
    delete_book_comment,
    get_comment_replies,
    create_comment_reply,
    update_comment_reply,
    delete_comment_reply,
)

# Import reward views
from .rewards import (
    get_reward_templates,
    create_reward_template,
    get_my_rewards,
    get_my_reward_summaries,
    get_my_reward_placements,
    get_user_rewards,
    get_user_reward_summaries,
)

# Import quest views
from .quests import (
    get_quests,
    get_group_quests,
    create_quest,
    generate_daily_quests,
    generate_daily_personal_quests,
    get_quest_progress,
    get_my_quests,
)

# Import prize board views
from .boards import (
    get_prize_board,
    update_prize_board_settings,
    place_reward_on_board,
    remove_reward_from_board,
)

# Import reading progress views
from .reading_progress import (
    get_reading_progress,
    update_reading_progress,
    complete_book,
)

# Export all public APIs
__all__ = [
    # Utilities
    'local_epub_path',
    'AnyListPagination',
    # Users
    'get_username',
    'get_userinfo',
    'get_user',
    'get_user_books',
    'update_user_profile',
    'get_user_stats',
    # Notifications
    'get_notification',
    'notification_list',
    'create_notification',
    'delete_notification',
    # Books
    'book_list',
    'public_book_list',
    'get_book',
    'get_book_chapter',
    'get_book_chapters_list',
    'create_book',
    'update_book',
    'delete_book',
    # Groups
    'get_reading_group',
    'reading_group_list',
    'get_group_reading_books',
    'get_group_posted_books',
    'create_reading_group',
    'update_reading_group',
    'delete_reading_group',
    'add_user_to_group',
    'confirm_user_to_group',
    'remove_user_from_group',
    'get_user_reading_groups',
    'get_user_created_groups',
    'user_to_reading_group_state_list',
    # Comments
    'get_book_comments',
    'create_book_comment',
    'get_book_comment',
    'update_book_comment',
    'delete_book_comment',
    'get_comment_replies',
    'create_comment_reply',
    'update_comment_reply',
    'delete_comment_reply',
    # Rewards
    'get_reward_templates',
    'create_reward_template',
    'get_my_rewards',
    'get_my_reward_summaries',
    'get_my_reward_placements',
    'get_user_rewards',
    'get_user_reward_summaries',
    # Quests
    'get_quests',
    'get_group_quests',
    'create_quest',
    'generate_daily_quests',
    'generate_daily_personal_quests',
    'get_quest_progress',
    'get_my_quests',
    # Prize Board
    'get_prize_board',
    'update_prize_board_settings',
    'place_reward_on_board',
    'remove_reward_from_board',
    # Reading Progress
    'get_reading_progress',
    'update_reading_progress',
    'complete_book',
]
