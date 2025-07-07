from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseForbidden
from community.models import Post, Comment, Like
from challenges.models import Goal, GoalProgress, Challenge

# 인증 완료된 세부목표 목록 중에서 선택하여 게시글 작성
@login_required
def create_post(request):
    if request.method == 'POST':
        goal_id = request.POST.get('goal')
        goal = get_object_or_404(Goal, id=goal_id)

        # 인증 완료된 세부목표인지 확인
        progress = GoalProgress.objects.filter(user=request.user, goal=goal, is_completed=True).first()
        if not progress:
            return redirect('community:post_list')

        # content, image는 이미 GoalProgress에 저장된 값을 활용
        content = progress.content
        image = progress.image

        Post.objects.create(
            user=request.user,
            goal=goal,
            challenge=goal.challenge,
            content=content,
            image=image
        )
        return redirect('community:post_list')

    # 사용자 도전 및 인증 완료된 세부목표 리스트
    challenges = Challenge.objects.filter(user=request.user)
    return render(request, 'community/create_post.html', {'challenges': challenges})

# 도전 선택 시 인증 완료된 세부목표 로딩
@login_required
def load_goals(request):
    challenge_id = request.GET.get('challenge_id')

    completed_goals = GoalProgress.objects.filter(
        user=request.user,
        is_completed=True,
        goal__challenge_id=challenge_id
    ).select_related('goal')

    data = []
    for gp in completed_goals:
        data.append({
            'id': gp.goal.id,
            'content': gp.goal.content,
            'image_url': gp.image.url if gp.image else ''
        })
    return JsonResponse(data, safe=False)

# 나머지 뷰는 이전과 동일
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
