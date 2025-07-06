from django import forms
from .models import Challenge, Goal

class ChallengeForm(forms.ModelForm):
    class Meta:
        model = Challenge
        fields = ['title', 'category', 'image', 'start_date', 'end_date', 'is_public', 'frequency']
        widgets = {
            'start_date': forms.DateInput(attrs={'type': 'date'}),
            'end_date': forms.DateInput(attrs={'type': 'date'}),
        }

class GoalForm(forms.ModelForm):
    class Meta:
        model = Goal
        fields = ['content']
        widgets = {
            'content': forms.TextInput(attrs={'placeholder': '세부 목표를 입력해주세요.'})
        }