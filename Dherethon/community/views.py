from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from community.models import Post, Comment, Like
from challenges.models import Goal, GoalProgress, Challenge
from django.http import HttpResponseForbidden,JsonResponse
from .views import *

@login_required
def create_post(request):
    if request.method == 'POST':
        goal_id = request.POST.get('goal')
        goal = get_object_or_404(Goal, id=goal_id)

        # 인증 완료된 세부목표인지 확인
        if not GoalProgress.objects.filter(user=request.user, goal=goal, is_completed=True).exists():
            return redirect('community:post_list')

        content = request.POST.get('content')
        image = request.FILES.get('image')

        Post.objects.create(
            user=request.user,
            goal=goal,
            challenge=goal.challenge,
            content=content,
            image=image
        )
        return redirect('community:post_list')

    # 도전 전체 목록 넘김 (사용자가 만든 도전만)
    challenges = Challenge.objects.filter(user=request.user)
    return render(request, 'community/create_post.html', {'challenges': challenges})

@login_required
def post_list(request):
    posts = Post.objects.select_related('user', 'goal', 'goal__challenge').order_by('-created_at')
    return render(request, 'community/post_list.html', {'posts': posts})

@login_required
def post_detail(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    comments = Comment.objects.filter(post=post).select_related('user')
    comment_count = comments.count()
    liked = Like.objects.filter(post=post, user=request.user).exists()
    like_count = Like.objects.filter(post=post).count()

    return render(request, 'community/post_detail.html', {
        'post': post,
        'comments': comments,
        'comment_count': comment_count,
        'like_count': like_count,
        'liked': liked,
    })


@login_required
def add_comment(request, post_id):
    if request.method == 'POST':
        content = request.POST.get('content')
        post = get_object_or_404(Post, id=post_id)
        Comment.objects.create(user=request.user, post=post, content=content)
    return redirect('community:post_detail', post_id=post_id)

@login_required
def toggle_like(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    like, created = Like.objects.get_or_create(user=request.user, post=post)
    if not created:
        like.delete()
    return redirect('community:post_detail', post_id=post_id)

@login_required
def delete_comment(request, comment_id):
    comment = get_object_or_404(Comment, id=comment_id)

    if comment.user != request.user:
        return HttpResponseForbidden("본인 댓글만 삭제할 수 있습니다.")

    post_id = comment.post.id
    comment.delete()
    return redirect('community:post_detail', post_id=post_id)

@login_required
def load_goals(request):
    challenge_id = request.GET.get('challenge_id')
    completed_goals = GoalProgress.objects.filter(
        user=request.user,
        is_completed=True,
        goal__challenge_id=challenge_id
    ).values_list('goal_id', flat=True)

    goals = Goal.objects.filter(id__in=completed_goals)
    data = [{'id': g.id, 'content': g.content} for g in goals]
    return JsonResponse(data, safe=False)