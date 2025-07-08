from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .forms import ChallengeForm, GoalForm
from .models import *
from django.utils import timezone
from home.models import Badge
from django.utils.timezone import now
from datetime import datetime
from django.views.decorators.http import require_POST
from django.http import HttpResponseForbidden
from django.db.models.functions import TruncDate
from django.utils.timezone import localdate
from django.http import JsonResponse
from django.utils.dateparse import parse_date

# 로그인한 사용자 기준 list view
@login_required
def my_challenges(request):
    category_name = request.GET.get('category')
    challenges = Challenge.objects.filter(user=request.user).select_related('category')

    if category_name and category_name != '전체':
        challenges = challenges.filter(category__name=category_name)

    today = localdate()

    for challenge in challenges:
        # 진행률 계산
        total = challenge.goals.count()
        completed = GoalProgress.objects.filter(
            user=request.user, goal__challenge=challenge, is_completed=True
        ).count()
        challenge.progress_percent = int(completed / total * 100) if total > 0 else 0
        challenge.badge_received = Badge.objects.filter(user=request.user, challenge=challenge).exists()

                
        # 다음 세부 목표
        challenge.next_goal = Goal.objects.filter(
            challenge=challenge
        ).exclude(
            goalprogress__user=request.user,
            goalprogress__is_completed=True
        ).order_by('date', 'id').first()

        # D-Day 계산
        end_date = challenge.end_date.date() if hasattr(challenge.end_date, "date") else challenge.end_date
        d_day = (end_date - today).days
        challenge.d_day_value = abs(d_day)
        challenge.d_day_prefix = "D-" if d_day >= 0 else "D+"

    # 인증 필요 목표 목록
    incomplete_challenges = []
    awarded_challenge_ids = Badge.objects.filter(user=request.user).values_list('challenge_id', flat=True)

    valid_challenges = Challenge.objects.annotate(
        start_date_only=TruncDate('start_date'),
        end_date_only=TruncDate('end_date')
    ).filter(
        user=request.user,
        start_date_only__lte=today,
        end_date_only__gte=today
    ).exclude(
        id__in=awarded_challenge_ids  # 뱃지 받은 도전 제외
    ).order_by('end_date')

    incomplete_challenges = list(valid_challenges[:3])

    category_list = ['전체'] + list(Category.objects.values_list('name', flat=True))

    return render(request, 'challenges/challenge.html', {
        'challenges': challenges,
        'incomplete_challenges': incomplete_challenges,
        'selected_category': category_name or '전체',
        'category_list': category_list,
    })

@login_required
def detail(request, pk):
    challenge = get_object_or_404(Challenge, pk=pk)
    all_goals = Goal.objects.filter(challenge=challenge)

    today = localdate()

    # 오늘 날짜 인증글 (Challenge에 속한 Goal → GoalRecord)
    today_records = GoalRecord.objects.filter(
        goal__challenge=challenge,
        user=request.user,
        date=today
    )

    # D-Day 계산
    end_date = challenge.end_date.date() if hasattr(challenge.end_date, "date") else challenge.end_date
    d_day = (end_date - today).days
    challenge.d_day_value = abs(d_day)
    challenge.d_day_prefix = "D-" if d_day >= 0 else "D+"

    # D+ 계산
    start_date = challenge.start_date.date() if hasattr(challenge.start_date, "date") else challenge.start_date
    challenge.d_plus = (today - start_date).days

    # 완료한 세부 목표: GoalProgress에서 is_completed=True
    completed_goal_ids = GoalProgress.objects.filter(
        user=request.user,
        goal__challenge=challenge,
        is_completed=True
    ).values_list('goal_id', flat=True)

    # 완료한 목표와 진행 중 목표 나누기
    completed_goals = all_goals.filter(id__in=completed_goal_ids)
    ongoing_goals = all_goals.exclude(id__in=completed_goal_ids)

    # 진행률 계산
    total_goals = all_goals.count()
    completed_count = completed_goals.count()
    if total_goals > 0:
        progress = int((completed_count / total_goals) * 100)
    else:
        progress = 0

    # 뱃지 받은 여부
    badge_received = Badge.objects.filter(user=request.user, challenge=challenge).exists()
    # 뱃지를 받을 수 있는 상태인지 확인
    show_badge_prompt = (progress == 100 and not badge_received)

    return render(request, 'challenges/detail.html', {
        'challenge': challenge,
        'completed_goals': completed_goals,
        'ongoing_goals': ongoing_goals,
        'today': today,
        'progress': progress,
        'completed_count': completed_count,
        'total_goals': total_goals,
        'today': today,
        'today_records': today_records,
        'badge_received': badge_received,
        'show_badge_prompt': show_badge_prompt,
    })

# 도전 생성
@login_required
def create_challenge(request, pk=None):
    challenge = None
    goals = []

    if pk:
        challenge = get_object_or_404(Challenge, pk=pk)
        goals = Goal.objects.filter(challenge=challenge)
        if challenge.user != request.user:
            return redirect('challenges:my_challenges')

    if request.method == 'POST':
        form = ChallengeForm(request.POST, request.FILES, instance=challenge)

        if form.is_valid():
            saved = form.save(commit=False)
            saved.user = request.user
            saved.save()

            # 기존 세부 목표 업데이트
            if pk:
                for goal in Goal.objects.filter(challenge=saved):
                    key = f"goal_{goal.id}"
                    if key in request.POST:
                        goal.content = request.POST[key]
                        goal.save()

            # 새 세부 목표 추가
            new_goals = request.POST.getlist('goals')
            for content in new_goals:
                if content.strip():
                    Goal.objects.create(challenge=saved, content=content)

            return redirect('challenges:detail', pk=saved.pk)

    else:
        form = ChallengeForm(instance=challenge)

    return render(request, 'challenges/create.html', {
        'form': form,
        'challenge': challenge,
        'goals': goals,
    })

#세부목표 게시글 생성/수정
@login_required
def create_goal(request, challenge_id, record_id=None):
    challenge = get_object_or_404(Challenge, pk=challenge_id)
    all_goals = challenge.goals.all()

    # 뱃지를 받은 경우: 인증글 작성/수정 금지
    if Badge.objects.filter(user=request.user, challenge=challenge).exists():
        return redirect('challenges:detail', pk=challenge.id)

    record = None
    
    if record_id:
        record = get_object_or_404(GoalRecord, pk=record_id, user=request.user)

    if request.method == 'POST':
        goal_id = request.POST.get('goal')
        goal = get_object_or_404(Goal, pk=goal_id, challenge=challenge)

        title = request.POST.get('title')
        content = request.POST.get('content')
        date = parse_date(request.POST.get('date'))
        image = request.FILES.get('image')

        if record:
            # 수정
            record.title = title
            record.content = content
            record.date = date
            if image:
                record.image = image
            record.save()
        else:
            # 생성
            progress, _ = GoalProgress.objects.update_or_create(
            user=request.user,
            goal=goal,
            defaults={
                'is_completed': True,
                'content': content,
                'image': image,
                'date': date
            }
        )

        # GoalRecord 생성 후 연결
        record = GoalRecord.objects.create(
            user=request.user,
            goal=goal,
            goal_progress=progress,
            title=title,
            content=content,
            date=date,
            image=image
        )

        # 🔥 이게 누락되었음 → 반드시 연결 필요!
        progress.record = record
        progress.save()

        return redirect('challenges:detail', pk=challenge.id)

    return render(request, 'challenges/create_goal.html', {
        'challenge': challenge,
        'record': record,
        'all_goals': all_goals,
    })

@login_required
def goal_detail(request, record_id):
    record = get_object_or_404(GoalRecord, id=record_id, user=request.user)
    challenge = record.goal.challenge

    badge_received = Badge.objects.filter(user=request.user, challenge=challenge).exists()

    return render(request, 'challenges/goal_detail.html', {
        'record': record,
        'badge_received': badge_received,
    })

@login_required
@require_POST
def complete_challenge(request, challenge_id):
    challenge = get_object_or_404(Challenge, id=challenge_id, user=request.user)

    # 전체 목표 수
    total_goals = Goal.objects.filter(challenge=challenge).count()

    # 완료한 목표 수
    completed_goals = GoalProgress.objects.filter(
        user=request.user,
        goal__challenge=challenge,
        is_completed=True
    ).count()

    # 모든 세부 목표 완료 여부
    if total_goals == 0 or completed_goals < total_goals:
        return HttpResponseForbidden("모든 세부 목표를 완료하지 않았습니다.")

    # 이미 뱃지를 받은 경우 중복 지급 방지
    badge_exists = Badge.objects.filter(user=request.user, challenge=challenge).exists()
    if not badge_exists:
        Badge.objects.create(
            user=request.user,
            category=challenge.category,
            challenge=challenge
        )

    return redirect('challenges:detail', pk=challenge.id)

# 챌린지 삭제
@login_required
def delete_challenge(request, pk):
    challenge = get_object_or_404(Challenge, id=pk, user=request.user)

    # 뱃지 받은 경우 삭제 금지
    if Badge.objects.filter(user=request.user, challenge=challenge).exists():
        return redirect('challenges:detail', pk=pk)

    if request.method == 'POST':
        challenge.is_deleted = True  # ❌ 물리삭제 대신 논리삭제
        challenge.save()
        return redirect('challenges:my_challenges')  # 삭제 후 이동할 곳 설정
    
    return redirect('challenges:detail', pk=pk)

# 세부목표 인증글 삭제
@login_required
def delete_goal_record(request, record_id):
    record = get_object_or_404(GoalRecord, id=record_id, user=request.user)
    challenge = record.goal.challenge

    if Badge.objects.filter(user=request.user, challenge=challenge).exists():
        return redirect('challenges:detail', pk=challenge.id)

    if request.method == 'POST':
        # 인증글 삭제
        record.delete()
        # 관련 GoalProgress도 함께 삭제(상태 복구)
        GoalProgress.objects.filter(user=request.user, goal=record.goal).delete()

        return redirect('challenges:detail', pk=challenge.id)  # 삭제 후 이동할 곳 설정 (예: 나의 도전 페이지) -> 도전 상세 페이지로 변경

    return redirect('challenges:goal_detail', record_id=record_id)  # 직접 접근은 리디렉트

# 날짜별 인증글
@login_required
def goal_records_by_date(request, challenge_id):
    date_str = request.GET.get('date')
    
    if not date_str:
        return JsonResponse({'records': []})

    selected_date = parse_date(date_str)
    if not selected_date:
        return JsonResponse({'records': []})
    
    # 인증글 필터링: 로그인 사용자 + 챌린지에 속한 + 날짜 일치
    records = GoalRecord.objects.filter(
        user=request.user,
        goal__challenge_id=challenge_id,
        date=selected_date
    ).select_related('goal')

    result = []
    for record in records:
        result.append({
            'id': record.id,
            'title': record.title,
            'content': record.content,
            'date': record.date.strftime('%Y-%m-%d'),
            'goal_content': record.goal.content,
            'image_url': record.image.url if record.image else None,
        })

    return JsonResponse({'records': result})


@login_required
def copy_challenge(request, challenge_id):
    original = get_object_or_404(Challenge, id=challenge_id)

    # 새 도전 객체 생성 (기존 데이터를 기반으로)
    copied = Challenge.objects.create(
        user=request.user,
        title=original.title,
        category=original.category,
        start_date=original.start_date,
        end_date=original.end_date,
        frequency=original.frequency,
        is_public=False,
        image=original.image,
    )

    # 세부목표도 복사
    for goal in original.goals.all():
        goal.pk = None
        goal.challenge = copied
        goal.save()

    # 도전 생성 페이지로 리디렉션해서 수정하게
    return redirect('challenges:update_challenge', pk=copied.id)



@login_required
def edit_challenge(request, challenge_id):
    challenge = get_object_or_404(Challenge, id=challenge_id, user=request.user)

    if request.method == 'POST':
        form = ChallengeForm(request.POST, request.FILES, instance=challenge)
        if form.is_valid():
            updated_challenge = form.save()

            # 기존 목표 수정
            for key in request.POST:
                if key.startswith('goal_'):
                    goal_id = key.split('_')[1]
                    try:
                        goal = Goal.objects.get(id=goal_id, challenge=challenge)
                        goal.content = request.POST[key]
                        goal.save()
                    except Goal.DoesNotExist:
                        continue

            # 새 목표 추가
            new_goal_content = request.POST.get('goals')
            if new_goal_content:
                Goal.objects.create(
                    challenge=updated_challenge,
                    content=new_goal_content,
                    user=request.user
                )

            return redirect('challenges:my_challenges')
    else:
        form = ChallengeForm(instance=challenge)

    goals = Goal.objects.filter(challenge=challenge, user=request.user)

    return render(request, 'challenges/create.html', {
        'form': form,
        'challenge': challenge,
        'goals': goals,
        'mode': 'edit',  # ✅ 템플릿에서 폼 action 설정을 위해 필요
    })