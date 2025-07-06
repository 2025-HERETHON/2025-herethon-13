from django.urls import path
from .views import *

app_name = 'challenges'

urlpatterns = [
    # 세부목표 생성
    path('challenge/<int:challenge_id>/goals/create/', create_goal, name='create_goal'),

    # 세부목표 상세
    path('goals/<int:goal_id>/', goal_detail, name='goal_detail'),

    # 세부목표 인증 완료 처리
    path('goals/<int:goal_id>/complete/', complete_goal, name='complete_goal'),
]
