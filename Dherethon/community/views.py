from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseForbidden
from django.core.serializers import serialize
from community.models import Post, Comment, Like
from challenges.models import Category, GoalProgress, Challenge, GoalRecord
from django.db.models import Count
from django.core.serializers.json import DjangoJSONEncoder
import json
from django.utils.html import escape
from django.utils.timezone import localtime
from django.utils.safestring import mark_safe
# 인증 완료된 세부목표 목록 중에서 선택하여 게시글 작성
def post_add_page(request):
    challenges = Challenge.objects.filter(user=request.user).select_related('category')
    challenges_data = json.dumps([
        {
            "id": ch.id,
            "title": ch.title,
            "category": ch.category.name if ch.category else "기타"  # ← null 대응
        } for ch in challenges
    ])
    return render(request, 'community/post_add.html', {
        'challenges_data': challenges_data
    })
@login_required
def create_post(request):
    if request.method == 'POST':
        progress_id = request.POST.get('goal_progress')

        progress = get_object_or_404(
            GoalProgress,
            id=progress_id,
            user=request.user,
            is_completed=True
        )

        if Post.objects.filter(goal_progress=progress).exists():
            return redirect('community:post_list')

        record = GoalRecord.objects.filter(
            user=request.user,
            goal=progress.goal,
            date=progress.date
        ).first()

        if not record:
            return redirect('community:create_post')

        Post.objects.create(
            user=request.user,
            goal=progress.goal,
            challenge=progress.goal.challenge,
            goal_progress=progress,
            content=record.content,
            image=record.image
        )

        return redirect('community:post_list')

    # ✅ GET 요청일 때: challenge 리스트를 JSON 직렬화하여 넘기기
    challenges = Challenge.objects.filter(user=request.user)
    challenges_json = serialize('json', challenges)

    return render(request, 'community/create_post.html', {
        'challenges_json': challenges_json
    })

@login_required
def delete_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    if post.user != request.user:
        return HttpResponseForbidden("본인 글만 삭제할 수 있습니다.")
    post.delete()
    return redirect('community:post_list')

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
    for cat in categories:
        cat.post_count = Post.objects.filter(goal__challenge__category=cat).count()

    popular_posts = Post.objects.annotate(like_count=Count('like')).order_by('-like_count')[:3]

    return render(request, 'community/post_list.html', {
        'posts': posts,
        'query': query or '',
        'selected_category': category or '전체',
        'categories': categories,
        'popular_posts': popular_posts,
    })


@login_required
def post_detail(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    comments = Comment.objects.filter(post=post).select_related('user')
    comment_count = comments.count()
    liked = Like.objects.filter(post=post, user=request.user).exists()
    like_count = Like.objects.filter(post=post).count()

    # ✅ JS 렌더링용 직렬화 데이터 구성
    post_data = {
        'id': post.id,
        'title': f"{post.goal.content} 인증글",  # title이 모델엔 없어서 goal 기반으로 생성
        'content': post.content,
        'writer': post.user.nickname if hasattr(post.user, 'nickname') else post.user.username,
        'category': post.challenge.category.name if post.challenge and post.challenge.category else '',
        'challengeTitle': post.challenge.title if post.challenge else '',
        'detailGoal': post.goal.content if post.goal else '',
        'date': localtime(post.created_at).strftime("%Y.%m.%d %H:%M"),
        'imgDataUrl': post.image.url if post.image else '',
        'like': like_count,
        'liked': liked,
        'comments': [
            {
                'writer': c.user.nickname if hasattr(c.user, 'nickname') else c.user.username,
                'date': localtime(c.created_at).strftime("%Y.%m.%d %H:%M"),
                'text': escape(c.content)
            } for c in comments
        ]
    }

    return render(request, 'community/post_detail.html', {
        'post': post,
        'comments': comments,
        'comment_count': comment_count,
        'like_count': like_count,
        'liked': liked,
        'post_data': mark_safe(json.dumps(post_data, cls=DjangoJSONEncoder)) 
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
    ).select_related('goal', 'record').order_by('-date')

    results = []
    for progress in progresses:
        record = getattr(progress, 'record', None)
        if not record:
            continue
        results.append({
            'id': progress.id,  # 그대로 두되
            'progressId': progress.id,  # 추가! ← JS cert.progressId 용
            'goalTitle': progress.goal.title or progress.goal.content,
            'date': progress.date.strftime('%Y.%m.%d'),
            'content': record.content,
            'image_url': record.image.url if record.image else '',
        })

    return JsonResponse(results, safe=False)


@login_required
def post_list_json(request):
    posts = Post.objects.select_related('user', 'goal__challenge__category').order_by('-created_at')

    data = []
    for post in posts:
        data.append({
            'id': post.id,
            'writer': post.user.nickname,
            'title': post.content[:30],  # 게시글 요약
            'challengeTitle': post.goal.challenge.title,
            'category': post.goal.challenge.category.name,
            'like': post.like_set.count(),
            'imgDataUrl': post.image.url if post.image else '',
        })

    return JsonResponse(data, safe=False)