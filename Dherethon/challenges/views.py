from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .forms import ChallengeForm, GoalForm
from .models import *
from datetime import date
from django.utils import timezone
from django.db.models import Q
from datetime import datetime

@login_required
def list(request):
    challenges = Challenge.objects.all()
    goals = Goal.objects.all()

    challenge_progress = {}
    for challenge in challenges:
        total = challenge.goals.count()
        completed = GoalProgress.objects.filter(user=request.user, goal__challenge=challenge, is_completed=True).count()
        percent = int(completed / total * 100) if total > 0 else 0
        challenge_progress[challenge.id] = percent

    return render(request, 'challenges/list.html', {'challenges': challenges, 'goals': goals, 'challenge_progress': challenge_progress})

# 로그인한 사용자 기준 list view
@login_required
def my_challenges(request):
    category_name = request.GET.get('category')
    challenges = Challenge.objects.filter(user=request.user).select_related('category')

    if category_name and category_name != '전체':
        challenges = challenges.filter(category__name=category_name)

    today = timezone.now().date()

    for challenge in challenges:
        # 진행률 계산
        total = challenge.goals.count()
        completed = GoalProgress.objects.filter(
            user=request.user, goal__challenge=challenge, is_completed=True
        ).count()
        challenge.progress_percent = int(completed / total * 100) if total > 0 else 0

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
    incomplete_goals = []
    seen_challenges = set()

    all_goals = Goal.objects.filter(
        challenge__user=request.user
    ).exclude(
        goalprogress__user=request.user,
        goalprogress__is_completed=True
    ).order_by('challenge', 'date', 'id')

    for goal in all_goals:
        if goal.challenge_id not in seen_challenges:
            incomplete_goals.append(goal)
            seen_challenges.add(goal.challenge_id)

    category_list = "전체,학습 / 공부,커리어 / 직무,운동 / 건강,마음 / 루틴,정리 / 관리,취미,기타".split(',')

    return render(request, 'challenges/challenge.html', {
        'challenges': challenges,
        'incomplete_goals': incomplete_goals,
        'selected_category': category_name or '전체',
        'category_list': category_list, 
    })

@login_required
def detail(request, pk):
    challenge = get_object_or_404(Challenge, pk=pk)
    all_goals = Goal.objects.filter(challenge=challenge)

    today = timezone.now().date()

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

    record = None
    
    if record_id:
        record = get_object_or_404(GoalRecord, pk=record_id, user=request.user)

    if request.method == 'POST':
        goal_id = request.POST.get('goal')
        goal = get_object_or_404(Goal, pk=goal_id, challenge=challenge)

        title = request.POST.get('title')
        content = request.POST.get('content')
        date = request.POST.get('date')
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
            GoalRecord.objects.create(
                user = request.user,
                goal = goal,
                title = title,
                content = content,
                date = date,
                image = image
            )

        
        # 진행 상태 갱신
        GoalProgress.objects.update_or_create(
            user=request.user,
            goal=goal,
            defaults={
                'is_completed': True,
                'content': content,
                'image': image,
                'date': datetime.strptime(date, "%Y-%m-%d").date()
            }
        )
            
        return redirect('challenges:detail', pk=challenge.id)

    return render(request, 'challenges/create_goal.html', {
        'challenge': challenge,
        'record': record,
        'all_goals': all_goals,
    })

@login_required
def goal_detail(request, record_id):
    record = get_object_or_404(GoalRecord, id=record_id)

    return render(request, 'challenges/goal_detail.html', {
        'record': record
    })

@login_required
def delete_goal_record(request, record_id):
    record = get_object_or_404(GoalRecord, id=record_id, user=request.user)

    if request.method == 'POST':
        record.delete()
        return redirect('challenges:my_challenges')  # 삭제 후 이동할 곳 설정 (예: 나의 도전 페이지)

    return redirect('challenges:record_detail', record_id=record_id)  # 직접 접근은 리디렉트