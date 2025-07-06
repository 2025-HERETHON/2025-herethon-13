from django.contrib import admin
from .models import *

admin.site.register(Category)
admin.site.register(Challenge)
admin.site.register(Goal)
admin.site.register(UserChallenge)
admin.site.register(GoalProgress)
admin.site.register(Badge)