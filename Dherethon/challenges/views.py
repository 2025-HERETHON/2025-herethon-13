from django.shortcuts import render, redirect, get_object_or_404
from .models import *
from django.contrib.auth.decorators import login_required

#세부목표 생성
@login_required
def create_goal(request, challenge_id):
    if request.method == 'POST':
        content = request.POST.get('content')
        date = request.POST.get('date')
        image = request.FILES.get('image') 
        challenge = Challenge.objects.get(id=challenge_id)
        Goal.objects.create(challenge=challenge, content=content, date=date,image=image)
        return redirect('challenge_detail', challenge_id=challenge.id)
    else:
        return render(request, 'challenges/create_goal.html', {'challenge_id': challenge_id})

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
        return redirect('goal_detail', goal_id=goal_id)
    


def goal_detail(request, goal_id):
    goal = get_object_or_404(Goal, id=goal_id)
    return render(request, 'challenges/goal_detail.html', {'goal': goal})
