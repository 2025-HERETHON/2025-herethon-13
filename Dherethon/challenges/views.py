from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.forms import formset_factory
from .forms import ChallengeForm, GoalForm
from .models import *

@login_required
def list(request):
    challenges = Challenge.objects.all()
    goals = Goal.objects.all()
    return render(request, 'challenges/list.html', {'challenges': challenges, 'goals': goals})

@login_required
def detail(request, pk):
    challenge = get_object_or_404(Challenge, pk=pk)
    goals = Goal.objects.filter(challenge=challenge)
    return render(request, 'challenges/detail.html', {
        'challenge': challenge,
        'goals': goals
    })

@login_required
def create_challenge(request):
    GoalFormSet = formset_factory(GoalForm, extra=3) # 현재는 세부목표 1개만 추가 가능 -> extra를 수정해서 늘릴 수는 있는데 JS 사용이 나을 것 같습니다

    if request.method == 'POST':
        form = ChallengeForm(request.POST, request.FILES)
        formset = GoalFormSet(request.POST)

        if form.is_valid() and formset.is_valid():
            challenge = form.save(commit=False)
            challenge.user = request.user
            challenge.save()

            for goal_form in formset:
                content = goal_form.cleaned_data.get('content')
                if content:
                    Goal.objects.create(
                        challenge=challenge,
                        content=content
                    )

            return redirect('challenges:list')
    
    else:
        form = ChallengeForm()
        formset = GoalFormSet()

    return render(request, 'challenges/create.html', {
        'form': form,
        'formset': formset
    })

#세부목표 생성
@login_required
def create_goal(request, challenge_id, goal_id=None):
    challenge = get_object_or_404(Challenge, id=challenge_id)
    
    if goal_id:
        goal = get_object_or_404(Goal, id=goal_id)
    else:
        goal = None

    if request.method == 'POST':
        content = request.POST.get('content')
        date = request.POST.get('date')
        image = request.FILES.get('image') if 'image' in request.FILES else (goal.image if goal else None)

        if goal:
            # 수정
            goal.content = content
            goal.date = date
            goal.image = image
            goal.save()
        else:
            # 생성
            Goal.objects.create(challenge=challenge, content=content, date=date, image=image)

        return redirect('challenges:detail', pk=challenge.id)

    return render(request, 'challenges/create_goal.html', {
        'challenge_id': challenge_id,
        'goal': goal,
    })

#세부목표 인증 완료 여부
@login_required
def complete_goal(request, goal_id):
    if request.method == 'POST':
        goal = Goal.objects.get(id=goal_id)
        GoalProgress.objects.update_or_create(
            user=request.user,
            goal=goal,
            defaults={'is_completed': True}
        )
        return redirect('challenges:goal_detail', goal_id=goal_id)
    


def goal_detail(request, goal_id):
    goal = get_object_or_404(Goal, id=goal_id)
    return render(request, 'challenges/goal_detail.html', {'goal': goal})
