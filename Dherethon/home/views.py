from django.contrib.auth.decorators import login_required
from django.shortcuts import render

# 메인 페이지 확인용, 추후 삭제
@login_required
def main_view(request):
    user = request.user  # 로그인한 사용자
    return render(request, 'home/main.html', {'user': user})