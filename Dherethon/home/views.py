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
from challenges.forms import ChallengeForm, GoalForm
import json
from django.core.serializers.json import DjangoJSONEncoder

@login_required
def home_view(request):
    user = request.user
    CATEGORY_LIST = ['학습 / 공부', '커리어 / 직무', '운동 / 건강', '마음 / 루틴', '정리 / 관리', '취미', '기타']

    # 1. 내 도전들 (100% 완료 제외)
    my_challenges = Challenge.objects.filter(user=user, is_deleted=False)
    my_challenges_with_progress = []

    for ch in my_challenges:
        goals = ch.goals.all()
        total = goals.count()
        completed = GoalProgress.objects.filter(user=user, goal__in=goals, is_completed=True).count()
        progress = int((completed / total) * 100) if total > 0 else 0

        if progress >= 100:
            continue

        next_goal = goals.exclude(
            id__in=GoalProgress.objects.filter(user=user, is_completed=True).values_list('goal_id', flat=True)
        ).order_by('id').first()

        my_challenges_with_progress.append({
            'id': ch.id,
            'title': ch.title,
            'category': ch.category.name if ch.category else "기타",
            'goals': [next_goal.content] if next_goal else [],
            'imgDataUrl': ch.image.url if ch.image else "",
            'endDate': ch.end_date.isoformat() if ch.end_date else "",
            'user': {
                'nickname': ch.user.nickname if ch.user and ch.user.nickname else '알 수 없음'
            }
        })

    # 2. 인기 게시글
    popular_posts = Post.objects.annotate(
        like_count=Count('like')
    ).order_by('-like_count')[:3]

    popular_posts_serialized = []
    for p in popular_posts:
        popular_posts_serialized.append({
            'id': p.id,
            'content': p.content,
            'like': p.like_count,
            'liked': False,
            'writer': p.user.username if p.user else '익명',
            'challengeTitle': p.challenge.title if p.challenge else "",
            'category': p.challenge.category.name if p.challenge and p.challenge.category else "기타",
            'imgDataUrl': p.image.url if p.image else "",
            'date': p.created_at.strftime('%Y.%m.%d %H:%M'),
            'comments': [],
        })

    # 추천 챌린지 랜덤 선정 (본인 제외)
    others_challenges = Challenge.objects.exclude(user=user).filter(is_public=True, goals__isnull=False).distinct()
    recommended_challenge_dict = None

    if others_challenges.exists():
        recommended_challenge = random.choice(list(others_challenges))
        recommended_challenge_dict = {
            'id': recommended_challenge.id,
            'title': recommended_challenge.title,
            'category': recommended_challenge.category.name if recommended_challenge.category else "기타",
            'goals': list(recommended_challenge.goals.values_list('content', flat=True)),
            'imgDataUrl': recommended_challenge.image.url if recommended_challenge.image else "",
            'user': {
                'nickname': recommended_challenge.user.nickname if recommended_challenge.user else "알 수 없음"
            }
        }

    context = {
        'category_list': CATEGORY_LIST,
        'my_challenges_json': json.dumps(my_challenges_with_progress, cls=DjangoJSONEncoder, ensure_ascii=False),
        'popular_posts_json': json.dumps(popular_posts_serialized, cls=DjangoJSONEncoder, ensure_ascii=False),
        'recommended_challenge_json': json.dumps(recommended_challenge_dict, ensure_ascii=False),
        'loginUserNickname': user.nickname,
    }


    return render(request, 'home/main.html', context)

@login_required
def get_random_recommendation(request):
    others_challenges = Challenge.objects.exclude(user=request.user).filter(is_public=True, goals__isnull=False).select_related('user').distinct()

    selected_challenge = None
    goals = []
    username = '알 수 없음'  # 기본값

    if others_challenges.exists():
        selected_challenge = random.choice(list(others_challenges))
        goals = selected_challenge.goals.all()
        # 닉네임 제대로 가져오기
        username = selected_challenge.user.nickname if selected_challenge.user and selected_challenge.user.nickname else '알 수 없음'

    html = render_to_string('home/_recommendation_card.html', {
        'challenge': selected_challenge,
        'goals': goals,
        'username': username,  # 템플릿에 넘김
    }, request=request)

    return JsonResponse({'html': html})

@login_required
def copy_challenge(request, challenge_id):
    original = get_object_or_404(Challenge, id=challenge_id)

    # 1. 복사 생성 (저장은 하지 않음)
    copied_challenge = Challenge(
        user=request.user,
        category=original.category,
        title=original.title + " (복사본)",
        image=original.image,
        start_date=original.start_date,
        end_date=original.end_date,
        frequency=original.frequency,
        is_public=False
    )

    # 저장하지 않고 폼으로 넘길 수 있도록 객체만 생성

    # 세부목표도 함께 준비
    copied_goals = []
    for goal in original.goals.all():
        copied_goals.append(Goal(
            challenge=copied_challenge,  # 아직 저장 안 된 Challenge
            title=goal.title,
            content=goal.content,
            date=goal.date,
            image=goal.image,
        ))

    # 2. create.html 렌더 (challenge, goals 넘겨줌)
    return render(request, 'challenges/create.html', {
        'challenge': copied_challenge,
        'goals': copied_goals,
        'mode': 'copy',  # 복사모드 플래그
    })

@login_required
def edit_challenge(request, challenge_id):
    challenge = get_object_or_404(Challenge, id=challenge_id, user=request.user)

    if request.method == 'POST':
        form = ChallengeForm(request.POST, request.FILES, instance=challenge)
        if form.is_valid():
            form.save()

            # ✅ 기존 세부 목표 수정
            for key, value in request.POST.items():
                if key.startswith('goal_'):
                    goal_id = key.split('_')[1]
                    try:
                        goal = Goal.objects.get(id=goal_id, challenge=challenge)
                        goal.content = value
                        goal.save()
                    except Goal.DoesNotExist:
                        continue

            # ✅ 새로 추가된 세부 목표
            new_goal_contents = request.POST.getlist('goals')
            for content in new_goal_contents:
                if content.strip():  # 빈칸이 아닐 경우에만 추가
                    Goal.objects.create(challenge=challenge, content=content)

            return redirect('challenges:my_challenges')

    else:
        form = ChallengeForm(instance=challenge)

    goals = Goal.objects.filter(challenge=challenge)
    return render(request, 'challenges/create.html', {
        'form': form,
        'edit_mode': True,
        'challenge': challenge,
        'goals': goals,  # 👈 템플릿에서 기존 목표 표시용
    })


@login_required
@require_POST
@login_required
def save_copied_challenge(request):
    if request.method == 'POST':
        original_id = request.POST.get('original_challenge_id')
        original = get_object_or_404(Challenge, id=original_id)

        # Challenge 복사
        copied = Challenge.objects.create(
            title=original.title,
            category=original.category,
            image=original.image,
            start_date=original.start_date,
            end_date=original.end_date,
            frequency=original.frequency,
            is_public=original.is_public,
            user=request.user
        )

        # 세부 목표도 함께 복사
        original_goals = Goal.objects.filter(challenge=original)
        for goal in original_goals:
            Goal.objects.create(
                challenge=copied,
                content=goal.content
            )

        return redirect('challenges:edit_challenge', challenge_id=copied.id)


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