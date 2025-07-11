from django.shortcuts import render, redirect
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import authenticate, login, logout
from api. forms import RegisterForm, LoginForm
from django.urls import reverse
from .models import *
from django.http import JsonResponse

def login_view(request):
    if request.method == 'POST':
        form = LoginForm(request=request, data=request.POST)
        if form.is_valid():
            login(request, form.get_user())
            return redirect(reverse('home:main'))
    else:
        form = LoginForm()
    return render(request, 'api/login.html', {'form': form})

def signup_view(request):
    if request.method == 'POST':
        form = RegisterForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()  # commit=True면 모든 필드 포함 저장됨
            return redirect('api:login')
    else:
        form = RegisterForm()
    return render(request, 'api/signup.html', {
        'form': form,
        'category_choices': User.CATEGORY_CHOICES
    }) 

def logout_view(request):
    logout(request)
    return redirect('api:login')

def check_username(request):
    username = request.GET.get('username')
    exists = User.objects.filter(username=username).exists()
    return JsonResponse({'exists': exists})

def check_nickname(request):
    nickname = request.GET.get('nickname')
    exists = User.objects.filter(nickname=nickname).exists()
    return JsonResponse({'exists': exists})