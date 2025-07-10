from django.urls import path
from .views import *

app_name = 'home'

urlpatterns = [
    path('', main_view, name='main'),
    path('badge/', badge_list, name='badge_list'),
]