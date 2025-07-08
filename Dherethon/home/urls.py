from django.urls import path
from .views import *

app_name = 'home'

urlpatterns = [
    path('', home_view, name='main'),
    path('badge/', badge_list, name='badge_list'),
    path('refresh-recommendation/', get_random_recommendation, name='refresh_recommendation'),
    path('copy-challenge/<int:challenge_id>/', copy_challenge, name='copy_challenge'),

]