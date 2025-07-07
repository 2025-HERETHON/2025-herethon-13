from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseForbidden
from community.models import Post, Comment, Like
from challenges.models import Category, GoalProgress, Challenge, GoalRecord

# 인증 완료된 세부목표 목록 중에서 선택하여 게시글 작성
@login_required
def create_post(request):
    if request.method == 'POST':
        progress_id = request.POST.get('goal_progress')
        progress = get_object_or_404(GoalProgress, id=progress_id, user=request.user, is_completed=True)

        # 이미 게시된 인증 기록이면 중복 방지
        if Post.objects.filter(goal_progress=progress).exists():
            return redirect('community:post_list')

        # ✅ GoalRecord에서 content, image 가져오기
        record = GoalRecord.objects.filter(user=request.user, goal=progress.goal, date=progress.date).first()
        if not record:
            return redirect('community:create_post')  # 혹은 에러 메시지 띄우기

        Post.objects.create(
            user=request.user,
            goal=progress.goal,
            challenge=progress.goal.challenge,
            goal_progress=progress,
            content=record.content,
            image=record.image
        )
        return redirect('community:post_list')

    challenges = Challenge.objects.filter(user=request.user)
    return render(request, 'community/create_post.html', {'challenges': challenges})

@login_required
def post_list(request):
    query = request.GET.get('q')
    category = request.GET.get('category')

    posts = Post.objects.select_related('user', 'goal__challenge__category').order_by('-created_at')

    if query:
        posts = posts.filter(content__icontains=query)

    if category and category != '전체':
        posts = posts.filter(goal__challenge__category__name=category)

    # 카테고리 목록을 보내줌 (전체 포함)
    from challenges.models import Category
    categories = Category.objects.all()

    return render(request, 'community/post_list.html', {
        'posts': posts,
        'query': query or '',
        'selected_category': category or '전체',
        'categories': categories,
    })

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
def load_goal_progresses(request):
    challenge_id = request.GET.get('challenge_id')

    if not challenge_id:
        return JsonResponse({'error': 'challenge_id가 없습니다.'}, status=400)

    progresses = GoalProgress.objects.filter(
        user=request.user,
        goal__challenge_id=challenge_id,
        is_completed=True
    ).select_related('goal').order_by('-date')

    results = []
    for progress in progresses:
        record = GoalRecord.objects.filter(user=request.user, goal=progress.goal, date=progress.date).first()

        results.append({
            'id': progress.id,
            'goalTitle': progress.goal.title,
            'date': progress.date.strftime('%Y.%m.%d'),
            'content': record.content if record else '내용 없음',
            'image_url': record.image.url if record and record.image else '',
        })

    return JsonResponse({'progresses': results})