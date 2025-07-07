from django.db import models
from django.conf import settings
from django.utils import timezone
# from api.models import User 
    
class Category(models.Model):
    CATEGORY_CHOICES = [
        ('학습 / 공부', '학습 / 공부'),
        ('커리어 / 직무', '커리어 / 직무'),
        ('운동 / 건강', '운동 / 건강'),
        ('마음 / 루틴', '마음 / 루틴'),
        ('정리 / 관리', '정리 / 관리'),
        ('취미', '취미'),
        ('기타', '기타'),
    ]
    name = models.CharField(max_length=50, unique=True, choices=CATEGORY_CHOICES, default='학습 / 공부')
    # color_code = models.CharField(max_length=50) 잠시 삭제

    def __str__(self):
        return self.name
    
class Challenge(models.Model):
    FREQUENCY_CHOICES = [
        ('daily', '매일'),
        ('weekday', '평일'),
        ('weekend', '주말'),
        ('every_other_day', '격일'),
        ('weekly', '주 1회'),
        ('twice_a_week', '주 2회'),
        ('montly', '월 1회'),
    ]
    
    category = models.ForeignKey(Category, on_delete=models.PROTECT, null=True)
    user = models.ForeignKey("api.User", on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    image = models.ImageField(upload_to='challenge_images/', blank=True, null=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='daily')
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_completed = models.BooleanField(default=False)

    def __str__(self):
        return self.title
    
# 세부 목표
class Goal(models.Model):
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=100, null=True, blank=True) # 제목 추가
    content = models.CharField(max_length=200)
    date = models.DateField(null=True, blank=True)
    image = models.ImageField(upload_to='goals_image/', null= True, blank= True)

    def __str__(self):
        return f"{self.challenge.title} - {self.content}"
    
# 인증 기록용 모델 추가
class GoalRecord(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='records')
    title = models.CharField(max_length=100)
    content = models.TextField()
    image = models.ImageField(upload_to='goal_records/', null=True, blank=True)
    date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    goal_progress = models.OneToOneField(
        'GoalProgress',
        on_delete=models.CASCADE,
        related_name='record',
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.user.nickname} - {self.goal.content} 인증"

# 사용자의 도전 참여 기록
class UserChallenge(models.Model):
    user = models.ForeignKey("api.User", on_delete=models.CASCADE)
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.nickname} 참여 중: {self.challenge.title}"
    
# 사용자별 세부 목표 완료 여뷰    
class GoalProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)
    content = models.TextField(null=True, blank=True)
    image = models.ImageField(upload_to='goal_progress_images/', null=True, blank=True)
    date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.nickname} - {self.goal.content} - {'완료' if self.is_completed else '미완료'}"

