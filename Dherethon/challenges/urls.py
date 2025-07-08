from django.urls import path
from .views import *

app_name = 'challenges'

urlpatterns = [
    # 챌린지 메인 페이지
    path('', my_challenges, name='my_challenges'),

    # 챌린지 상세
    path('detail/<int:pk>/', detail, name='detail'),

    # 챌린지 생성
    path('challenge/create/', create_challenge, name='create'),
    path('challenge/<int:pk>/edit/', create_challenge, name='update_challenge'),
    path('record/delete/<int:record_id>/', delete_goal_record, name='delete_goal_record'),

    # 세부목표 생성 및 수정
    path('challenge/<int:challenge_id>/goals/create/', create_goal, name='create_goal'),  # 생성
    path('challenge/<int:challenge_id>/goals/<int:record_id>/edit/', create_goal, name='edit_goal'),  # 수정

    # 세부목표 상세
    path('record/<int:record_id>/', goal_detail, name='goal_detail'),

    # 도전 완료 처리
    # path('complete/<int:pk>/', complete_challenge, name='complete_challenge'),
]
