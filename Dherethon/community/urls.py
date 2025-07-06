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
    path('load-goals/', load_goals, name='load_goals'),
]