from django.urls import path
from .views import *

app_name = 'community'

urlpatterns = [
    path('', post_list, name='post_list'),
    path('create/', create_post, name='create_post'),
    path('<int:post_id>/', post_detail, name='post_detail'),
    path('<int:post_id>/comment/', add_comment, name='add_comment'),
    path('<int:post_id>/like/', toggle_like, name='toggle_like'),
    path('comment/<int:comment_id>/delete/', delete_comment, name='delete_comment'),
    path('post/<int:post_id>/delete/', delete_post, name='delete_post'),
    path('load_goal_progresses/', load_goal_progresses, name='load_goal_progresses'),
    path('api/posts/', post_list_json, name='post_list_json'),
    
]