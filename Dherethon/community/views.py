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
from django.utils.timezone import localtime

@login_required
def post_add_page(request):
    # 사용자의 도전 정보
    challenges = Challenge.objects.filter(user=request.user).select_related('category')

    challenges_data = [
        {
            "id": ch.id,
            "title": ch.title,
            "category": ch.category.name if ch.category else "기타"
        }
        for ch in challenges
    ]

    # 인증 완료된 GoalProgress + GoalRecord 연결
    progresses = GoalProgress.objects.filter(
        user=request.user,
        is_completed=True
    ).select_related('goal', 'goal__challenge')

    progresses_data = []
    for p in progresses:
        record = GoalRecord.objects.filter(
            user=request.user,
            goal=p.goal,
            date=p.date
        ).first()

        if not record:
            continue

        progresses_data.append({
            "id": p.id,
            "progressId": p.id,  # JS에서 cert.progressId 용
            "challenge_id": p.goal.challenge.id,
            "goal_title": p.goal.title or p.goal.content,
            "date": localtime(p.date).strftime('%Y-%m-%d'),
            "content": record.content or "",
            "image_url": record.image.url if record.image else "",
        })

    # ✅ 렌더링 시 JSON 데이터 문자열로 주입
    return render(request, 'community/create_post.html', {
        'challengesRaw': json.dumps(challenges_data, ensure_ascii=False),
        'goalProgressesRaw': json.dumps(progresses_data, ensure_ascii=False),
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

    # ✅ GET 요청 처리
    challenges = Challenge.objects.filter(user=request.user).select_related('category')
    goal_progresses = GoalProgress.objects.filter(
        user=request.user,
        is_completed=True
    ).select_related('goal', 'goal__challenge')

    # 카테고리와 도전 리스트
    challenges_data = [
        {
            'id': ch.id,
            'title': ch.title,
            'category': ch.category.name if ch.category else "기타"
        } for ch in challenges
    ]

    # 인증 완료된 목표와 기록
    progresses_data = []
    for p in goal_progresses:
        record = GoalRecord.objects.filter(
            user=request.user,
            goal=p.goal,
            date=p.date
        ).first()

        if not record:
            continue

        progresses_data.append({
            'id': p.id,
            'challenge_id': p.goal.challenge.id,
            'goal_title': p.goal.title or '',
            "date": p.date.strftime('%Y-%m-%d'),
            'content': record.content or '',
            'image_url': record.image.url if record.image else '',
        })

    return render(request, 'community/create_post.html', {
        'challengesRaw': json.dumps(challenges_data, ensure_ascii=False),
        'goalProgressesRaw': json.dumps(progresses_data, ensure_ascii=False),
    })

@login_required
def delete_post(request, post_id):
    post = get_object_or_404(Post, id=post_id, user=request.user)  # 🔥 사용자 조건 추가!
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
def post_detail_json(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    comments = Comment.objects.filter(post=post).select_related('user').order_by('created_at')

    like_count = Like.objects.filter(post=post).count()
    liked = Like.objects.filter(post=post, user=request.user).exists()

    post_data = {
        'id': post.id,

        'content': post.content,
        'writer': post.user.nickname if hasattr(post.user, 'nickname') else post.user.username,
        'isMine': request.user == post.user, 
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

    return JsonResponse(post_data)


def post_detail(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    comments = Comment.objects.filter(post=post)
    
    post_data = {
        'id': post.id,

        'content': post.content,
        'writer': post.user.nickname,
     
        'challengeTitle': post.goal.challenge.title if post.goal else '',
        'detailGoal': post.goal.content if post.goal else '',
        'date': post.created_at.strftime('%Y.%m.%d %H:%M'),
        'comments': [
            {
                'writer': comment.user.nickname,
                'date': comment.created_at.strftime('%Y.%m.%d %H:%M'),
                'text': comment.content
            } for comment in comments
        ]
    }

    return render(request, 'community/post_detail.html', {
        'post': post,
        'post_data': json.dumps(post_data, cls=DjangoJSONEncoder)
    })

@login_required
def add_comment(request, post_id):
    if request.method == 'POST':
        content = request.POST.get('content')
        if not content:
            return JsonResponse({'error': '내용이 비어 있습니다.'}, status=400)

        post = get_object_or_404(Post, id=post_id)
        comment = Comment.objects.create(user=request.user, post=post, content=content)

        return JsonResponse({
            'message': '댓글이 등록되었습니다.',
            'writer': getattr(request.user, 'nickname', request.user.username),
            'date': localtime(comment.created_at).strftime("%Y.%m.%d %H:%M"),
            'text': escape(comment.content)
        })

    return JsonResponse({'error': '잘못된 요청'}, status=400)


@login_required
def toggle_like(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    like, created = Like.objects.get_or_create(user=request.user, post=post)

    if not created:
        like.delete()

    like_count = Like.objects.filter(post=post).count()

    return JsonResponse({
        'liked': created,
        'like_count': like_count
    })

@login_required
def delete_comment(request, comment_id):
    comment = get_object_or_404(Comment, id=comment_id)
    if comment.user != request.user:
        return HttpResponseForbidden("본인 댓글만 삭제할 수 있습니다.")

    comment.delete()
    return JsonResponse({'message': '댓글 삭제 완료'})



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