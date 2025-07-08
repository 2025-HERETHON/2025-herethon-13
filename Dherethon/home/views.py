from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from challenges.models import Challenge, Goal,GoalProgress, Category
from .models import Badge
from community.models import Post
import random
from django.db.models import Count, Q

from django.http import JsonResponse
from django.template.loader import render_to_string

from django.views.decorators.http import require_POST
from django.contrib import messages


@login_required
def home_view(request):
    user = request.user

    # --- 1. 로그인한 사용자의 도전 리스트 + 진행률 + 다음 세부목표
    my_challenges = Challenge.objects.filter(user=user)
    my_challenges_with_progress = []

    for ch in my_challenges:
        goals = ch.goals.all()
        total = goals.count()
        completed = GoalProgress.objects.filter(user=user, goal__in=goals, is_completed=True).count()
        progress = int((completed / total) * 100) if total > 0 else 0

        # ✅ 진행률이 100%인 도전은 제외
        if progress >= 100:
            continue

        # 아직 인증 안 된 세부목표 중 가장 빠른 것
        next_goal = goals.exclude(
            id__in=GoalProgress.objects.filter(user=user, is_completed=True).values_list('goal_id', flat=True)
        ).order_by('id').first()

        my_challenges_with_progress.append({
            'id': ch.id,
            'title': ch.title,
            'progress': progress,
            'next_goal': next_goal,
        })

    # --- 2. 인기 게시글 (좋아요 수 기준 상위 10개)
    popular_posts = Post.objects.annotate(
        like_count=Count('like')
    ).order_by('-like_count')[:3]

    # --- 3. 추천 도전 + 세부목표 (랜덤으로 여러 개)
    others_challenges = Challenge.objects.exclude(user=request.user).filter(is_public=True, goals__isnull=False).distinct()

    recommended_challenges = []

    if others_challenges.exists():
        # 최대 3개까지만 랜덤 추출
        selected_challenges = random.sample(list(others_challenges), min(3, others_challenges.count()))
        for ch in selected_challenges:
            recommended_challenges.append({
                'challenge': ch,
                'goals': ch.goals.all(),
            })

    context = {
        'my_challenges': my_challenges_with_progress,
        'popular_posts': popular_posts,
        'recommended_challenges': recommended_challenges,
    }

    return render(request, 'home/main.html', {
        'my_challenges': my_challenges_with_progress,
        'popular_posts': popular_posts,
        'recommended_challenges': recommended_challenges,
    })


@login_required
def get_random_recommendation(request):
    others_challenges = Challenge.objects.exclude(user=request.user).filter(is_public=True, goals__isnull=False).distinct()

    selected_challenge = None
    goals = []

    if others_challenges.exists():
        selected_challenge = random.choice(list(others_challenges))
        goals = selected_challenge.goals.all()

    html = render_to_string('home/_recommendation_card.html', {
        'challenge': selected_challenge,
        'goals': goals
    }, request=request)

    return JsonResponse({'html': html})

@require_POST
@login_required
def copy_challenge(request, challenge_id):
    original = get_object_or_404(Challenge, id=challenge_id)

    # 도전 복사
    new_challenge = Challenge.objects.create(
        user=request.user,
        category=original.category,
        title=original.title,
        image=original.image,
        start_date=original.start_date,
        end_date=original.end_date,
        frequency=original.frequency,
        is_public=False
    )

    for goal in original.goals.all():
        Goal.objects.create(
            challenge=new_challenge,
            title=goal.title,
            content=goal.content,
            date=goal.date,
            image=goal.image
        )

    # ✅ 복사한 도전에 대한 진행률 및 다음 목표 계산
    goals = new_challenge.goals.all()
    total = goals.count()
    completed = GoalProgress.objects.filter(user=request.user, goal__in=goals, is_completed=True).count()
    progress = int((completed / total) * 100) if total > 0 else 0

    next_goal = goals.exclude(
        id__in=GoalProgress.objects.filter(user=request.user, is_completed=True).values_list('goal_id', flat=True)
    ).order_by('id').first()

    # ✅ HTML 템플릿 조각 렌더링
    new_challenge_html = render_to_string('home/_challenge_card.html', {
        'challenge': {
            'id': new_challenge.id,
            'title': new_challenge.title,
            'progress': progress,
            'next_goal': next_goal,
        }
    }, request=request)

    return JsonResponse({'success': True, 'new_challenge_html': new_challenge_html})


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