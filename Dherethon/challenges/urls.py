from django.urls import path
from .views import *


app_name = 'challenges'

urlpatterns = [
    # 챌린지 메인 페이지
    path('', my_challenges, name='my_challenges'),

    # 챌린지 상세
    path('detail/<int:pk>/', detail, name='detail'),

    # 챌린지
    path('challenge/create/', create_challenge, name='create'), # 생성
    path('challenge/<int:pk>/edit/', create_challenge, name='update_challenge'), # 수정
    path('challenge/delete/<int:pk>', delete_challenge, name='delete_challenge'), # 삭제
    path('<int:challenge_id>/copy/', copy_challenge, name='copy_challenge'),  
    path('challenge/<int:pk>/edit/', edit_challenge, name='edit_challenge'),

    # 세부목표
    path('challenge/<int:challenge_id>/goals/create/', create_goal, name='create_goal'),  # 생성
    path('challenge/<int:challenge_id>/goals/<int:record_id>/edit/', create_goal, name='edit_goal'),  # 수정
    path('record/delete/<int:record_id>/', delete_goal_record, name='delete_goal_record'), # 삭제

    # 날짜별 세부목표 인증글
    # 날짜별 세부목표 인증글
    path('challenge/<int:challenge_id>/records/', goal_records_by_date, name='goal_records_by_date'),

    # 세부목표 상세
    path('record/<int:record_id>/', goal_detail, name='goal_detail'),

    # 도전 완료 처리
    path('<int:challenge_id>/complete/', complete_challenge, name='complete_challenge'),

    
]
