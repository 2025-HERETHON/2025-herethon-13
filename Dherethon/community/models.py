from django.db import models
from api.models import User
from challenges.models import Challenge, Goal,GoalProgress

class Post(models.Model):
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, null=True)
    goal_progress = models.OneToOneField(GoalProgress, on_delete=models.CASCADE, null=True)
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    image = models.ImageField(upload_to='post_images/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.nickname} - {self.goal.content}"

class Comment(models.Model):
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments', null=True)

    def __str__(self):
        return f"{self.user.nickname}의 댓글"
    
class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'post')

    def __str__(self):
        return f"{self.user.nickname} 이 {self.post.id}를 좋아합니다"

