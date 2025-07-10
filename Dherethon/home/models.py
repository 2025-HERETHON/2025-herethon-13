from django.db import models
from api.models import User
from challenges.models import Category, Challenge

class Badge(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, default=1)  # 임시 default 유지
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE)
    awarded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'challenge')

    def __str__(self):
        return f"{self.user.nickname} - {self.challenge.title}"
