from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .forms import ChallengeForm
from .models import *

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

@login_required
def detail(request, pk):
    challenge = get_object_or_404(Challenge, pk=pk)
    return render(request, 'challenges/detail.html', {'challenge': challenge})

@login_required
def create_challenge(request):
    if request.method == 'POST':
        form = ChallengeForm(request.POST, request.FILES)

        if form.is_valid():
            challenge = form.save(commit=False)
            challenge.user = request.user
            challenge.save()

            goals = request.POST.getlist('goals')
            for content in goals:
                if content.strip():
                    Goal.objects.create(challenge=challenge, content=content)

            return redirect('challenges:list')
    
    else:
        form = ChallengeForm()

    return render(request, 'challenges/create.html', {
        'form': form,
    })

