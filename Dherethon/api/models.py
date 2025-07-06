from django.db import models
from django.contrib.auth.models import AbstractUser
from challenges.models import *

class User(AbstractUser):
    CATEGORY_CHOICES = [
        ('학습 / 공부', '학습 / 공부'),
        ('커리어 / 직무', '커리어 / 직무'),
        ('운동 / 건강', '운동 / 건강'),
        ('마음 / 루틴', '마음 / 루틴'),
        ('정리 / 관리', '정리 / 관리'),
        ('취미', '취미'),
        ('기타', '기타'),
    ]
    nickname = models.CharField(max_length=100, unique=True)
    profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)
    interest_categories = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='학습 / 공부'
    )

    REQUIRED_FIELDS = ['nickname']

    def __str__(self):
        return self.nickname