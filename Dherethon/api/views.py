from django.shortcuts import render, redirect
from django.contrib.auth.forms import AuthenticationForm
from api. forms import RegisterForm, LoginForm
from django.contrib.auth import authenticate, login, logout

def signup_view(request):
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('') # 로그인 html 작성
    else:
        form = RegisterForm()
    return render(request, 'signup.html', {'form': form})

def login_view(request):
    if request.method == 'POST':
        form = LoginForm(request=request, data=request.POST)
        if form.is_valid():
            username=form.cleaned_data.get('username')
            password=form.cleaned_data.get('password')
            user=authenticate(request=request, username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect('') # 추후 redirect 작성
    else:
        form = LoginForm()
    return render(request, 'login.html', {'form': form})