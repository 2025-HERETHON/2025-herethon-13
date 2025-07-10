from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from .models import *
from challenges.models import Category
import json

# 메인 페이지 확인용, 추후 삭제
@login_required
def main_view(request):
    user = request.user  # 로그인한 사용자
    return render(request, 'home/main.html', {'user': user})

# @login_required
# def badge_list(request):
#     user = request.user
#     selected_category = request.GET.get('category', '전체')

#     if selected_category == '전체':
#         badges = Badge.objects.filter(user=user)
#     else:
#         badges = Badge.objects.filter(user=user, category__name=selected_category)

#     categories = Category.objects.all()
#     badge_count = badges.count()

#     return render(request, 'home/badge.html', {
#         'badges': badges,
#         'categories': categories,
#         'selected_category': selected_category,
#         'badge_count': badge_count,
#     })

@login_required
def badge_list(request):
    user = request.user
    selected_category = request.GET.get('category', '전체')

    if selected_category == '전체':
        badges = Badge.objects.filter(user=user).select_related('challenge', 'category')
    else:
        badges = Badge.objects.filter(user=user, category__name=selected_category).select_related('challenge', 'category')

    categories = Category.objects.all()
    badge_count = badges.count()

    # 👉 프론트 JS에서 쓰기 위한 JSON 데이터 생성
    badge_list = []
    for badge in badges:
        badge_list.append({
            'title': badge.challenge.title,
            'startDate': badge.challenge.start_date.strftime('%Y.%m.%d'),
            'endDate': badge.challenge.end_date.strftime('%Y.%m.%d'),
            'category': badge.category.name,
            'challengeId': badge.challenge.id
        })

    return render(request, 'home/badge.html', {
        'badges': badges,
        'categories': categories,
        'selected_category': selected_category,
        'badge_count': badge_count,
        'badges_json': json.dumps(badge_list),  # ← 💡 이거 추가됨
    })