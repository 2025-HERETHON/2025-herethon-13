from django.urls import path
from .views import *

app_name = 'challenges'

urlpatterns = [
    path('list/', list, name='list'),
    path('create/', create_challenge, name='create'),
]