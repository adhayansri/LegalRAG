from rest_framework import serializers
from .models import ChatSession, Message, Citation

class CitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Citation
        fields = ['id', 'act', 'section', 'title', 'snippet']

class MessageSerializer(serializers.ModelSerializer):
    citations = CitationSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'session', 'sender', 'text', 'created_at', 'citations']

class ChatSessionSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = ['id', 'name', 'created_at', 'messages']
