from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import User
from challenges.models import *
from django.core.exceptions import ValidationError

class RegisterForm(UserCreationForm):
    username = forms.CharField(
        label="아이디",
        widget=forms.TextInput(attrs={
            'placeholder': '아이디를 입력하세요.',
            'class': 'mainInput'  # 추가
        }),
        error_messages={
            'unique': '이미 존재하는 아이디입니다.',
        }
    )
    nickname = forms.CharField(
        widget=forms.TextInput(attrs={
            'placeholder': '닉네임을 입력하세요.',
            'class': 'mainInput'  # 추가
        }),
        error_messages={
            'unique': '이미 존재하는 닉네임입니다.',
        }
    )
    profile_image = forms.ImageField(required=False)

    password1 = forms.CharField(
        label='비밀번호',
        widget=forms.PasswordInput(attrs={
            'placeholder': '비밀번호를 입력하세요.',
            'class': 'mainInput'  # 추가
        }),
    )
    password2 = forms.CharField(
        label='비밀번호 확인',
        widget=forms.PasswordInput(attrs={
            'placeholder': '비밀번호를 입력하세요.',
            'class': 'mainInput'  # 추가
        }),
    )

    interest_categories = forms.CharField(
        widget=forms.HiddenInput(),
        required=True,
        label='관심 있는 카테고리',
        error_messages={'required': '카테고리를 선택해주세요.'}
    )

    class Meta:
        model = User
        fields = ['username', 'nickname', 'profile_image', 'password1', 'password2', 'interest_categories']


class LoginForm(AuthenticationForm):
    username = forms.CharField(
        label='아이디',
        widget=forms.TextInput(attrs={
            'class': 'inputBox',
            'placeholder': '아이디를 입력하세요.'
        })
    )
    password = forms.CharField(
        label='비밀번호',
        widget=forms.PasswordInput(attrs={
            'class': 'inputBox',
            'placeholder': '비밀번호를 입력하세요.'
        })
    )

    error_messages = {
        'invalid_login': "아이디 또는 비밀번호가 올바르지 않습니다."
    }
