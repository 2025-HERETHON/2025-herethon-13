from django.urls import path
from .views import *

app_name = 'community'

urlpatterns = [
    # 기본 목록 및 작성
    path('', post_list, name='post_list'),
    path('create/', create_post, name='create_post'),

    # 게시글 상세 페이지 렌더링 (템플릿용)
    path('<int:post_id>/', post_detail, name='post_detail'),

    # ✅ 게시글 상세 JSON API (SPA용, JS fetch)
    path('<int:post_id>/json/', post_detail_json, name='post_detail_json'),

    # 댓글 관련
    path('<int:post_id>/comment/', add_comment, name='add_comment'),
    path('comment/<int:comment_id>/delete/', delete_comment, name='delete_comment'),

    # 좋아요 토글
    path('<int:post_id>/like/', toggle_like, name='toggle_like'),

    # 게시글 삭제
    path('post/<int:post_id>/delete/', delete_post, name='delete_post'),

    # 인증 기록 로딩 API
    path('load_goal_progresses/', load_goal_progresses, name='load_goal_progresses'),

    # 게시글 목록 JSON (검색 필터링용 등)
    path('api/posts/', post_list_json, name='post_list_json'),
    path('<int:post_id>/json/', post_detail_json, name='post_detail_json'),
    path('api/post/<int:post_id>/', post_detail_json, name='post_detail_json_api'),
]
