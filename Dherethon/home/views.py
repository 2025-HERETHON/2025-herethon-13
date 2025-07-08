from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from .models import *
from challenges.models import Category

# 메인 페이지 확인용, 추후 삭제
@login_required
def main_view(request):
    user = request.user  # 로그인한 사용자
    return render(request, 'home/main.html', {'user': user})

@login_required
def badge_list(request):
    user = request.user
    selected_category = request.GET.get('category', '전체')

    if selected_category == '전체':
        badges = Badge.objects.filter(user=user)
    else:
        badges = Badge.objects.filter(user=user, category__name=selected_category)

    categories = Category.objects.all()
    badge_count = badges.count()

    return render(request, 'home/badge.html', {
        'badges': badges,
        'categories': categories,
        'selected_category': selected_category,
        'badge_count': badge_count,
    })