from django.urls import path
from .views import *

app_name = 'api'

urlpatterns = [
    path('login/', login_view, name='login'),
    path('signup/', signup_view, name='signup'),
    path('logout/', logout_view, name='logout'),

    # 중복확인
    path('check-username/', check_username, name='check_username'),
    path('check-nickname/', check_nickname, name='check_nickname'),
]