from django.db import models

class ChatSession(models.Model):
    name = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Session {self.id} - {self.name or 'unnamed'}"

class Message(models.Model):
    SENDER_CHOICES = [
        ('user', 'User'),
        ('bot', 'Bot'),
    ]
    session = models.ForeignKey(ChatSession, related_name='messages', on_delete=models.CASCADE, null=True, blank=True)
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class Citation(models.Model):
    message = models.ForeignKey(Message, related_name='citations', on_delete=models.CASCADE)
    act = models.CharField(max_length=500, blank=True)
    section = models.CharField(max_length=200, blank=True)
    title = models.CharField(max_length=500, blank=True)
    snippet = models.TextField(blank=True)
