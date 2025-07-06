from django.shortcuts import render, redirect
from django.forms import formset_factory
from django.contrib.auth.decorators import login_required
from .forms import ChallengeForm, GoalForm
from .models import *

@login_required
def list(request):
    challenges = Challenge.objects.all()
    goals = Goal.objects.all()
    return render(request, 'challenges/list.html', {'challenges': challenges, 'goals': goals})

@login_required
def create_challenge(request):
    GoalFormSet = formset_factory(GoalForm, extra=1) # 현재는 세부목표 1개만 추가 가능 -> extra를 수정해서 늘릴 수는 있는데 JS 사용이 나을 것 같습니다

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

