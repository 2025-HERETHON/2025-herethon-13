from django.db import models
# from api.models import User 
from .views import *
    
class Category(models.Model):
    name = models.CharField(max_length=50)
    # color_code = models.CharField(max_length=50) 잠시 삭제

    def __str__(self):
        return self.name
    
class Challenge(models.Model):
    category = models.ForeignKey(Category, on_delete=models.PROTECT, null=True)
    user = models.ForeignKey("api.User", on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    goal = models.CharField(max_length=200)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    frequency = models.CharField(max_length=100)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
class Badge(models.Model):
    user = models.ForeignKey("api.User", on_delete=models.CASCADE)
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.user.nickname} - {self.challenge.title}"


