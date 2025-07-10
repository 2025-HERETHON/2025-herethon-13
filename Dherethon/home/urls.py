from django.urls import path
from .views import *

app_name = 'home'

urlpatterns = [
    path('', home_view, name='main'),
    path('badge/', badge_list, name='badge_list'),
    path('refresh-recommendation/', get_random_recommendation, name='refresh_recommendation'),
    path('copy/<int:challenge_id>/', copy_challenge, name='copy_challenge'),
    path('save_copy/', save_copied_challenge, name='save_copied_challenge'),
    path('edit_challenge/<int:challenge_id>/', edit_challenge, name='edit_challenge'),
]