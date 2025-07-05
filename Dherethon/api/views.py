from django.shortcuts import render, redirect
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import authenticate, login, logout
from api. forms import RegisterForm, LoginForm
from django.urls import reverse

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
            user = form.save()
            return redirect('api:login')
    else:
        form = RegisterForm()
    return render(request, 'api/signup.html', {'form': form})

def logout_view(request):
    logout(request)
    return redirect('api:login')
