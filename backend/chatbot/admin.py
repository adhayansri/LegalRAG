from django.contrib import admin
from .models import ChatSession, Message, Citation

admin.site.register(ChatSession)
admin.site.register(Message)
admin.site.register(Citation)
