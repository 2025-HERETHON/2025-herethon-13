from django.db import models
from django.contrib.auth.models import AbstractUser
from challenges.models import *

class User(AbstractUser):
    nickname = models.CharField(max_length=100, unique=True)
    profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)
    interest_categories = models.ManyToManyField(Category)

    REQUIRED_FIELDS = ['nickname']

    def __str__(self):
        return self.nickname