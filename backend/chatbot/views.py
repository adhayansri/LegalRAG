import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from . import rag
from .models import ChatSession, Message, Citation
from .serializers import MessageSerializer, ChatSessionSerializer


class ChatAPIView(APIView):
    """POST /api/chat/  { prompt, session_id (optional) }"""

    def post(self, request):
        prompt = request.data.get('prompt')
        session_id = request.data.get('session_id')

        print("Incoming prompt:", prompt)

        if not prompt:
            # Always return HTTP 200 with stable error shape
            print("Missing prompt in request")
            return Response({
                'answer': 'Sorry, an internal error occurred while processing your request.',
                'sources': [],
                'fallback': True,
                'model': ''
            }, status=200)

        # find or create session
        session = None
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id)
            except ChatSession.DoesNotExist:
                session = ChatSession.objects.create()
        else:
            session = ChatSession.objects.create()

        # persist user message
        user_msg = Message.objects.create(session=session, sender='user', text=prompt)

        # call rag generate (handles Ollama exceptions internally and returns fallback)
        try:
            import traceback as _tb
            print("Using generate_answer from:", rag.generate_answer.__module__)
            print("Calling generate_answer()")
            result = rag.generate_answer(prompt)
            # Log keys and important fields
            try:
                print("Result keys:", list(result.keys()))
                print("Fallback:", result.get('fallback'))
                print("Model:", result.get('model'))
            except Exception:
                print("Failed to print result details")
        except Exception as e:
            # Shouldn't happen because rag.generate_answer handles exceptions, but be defensive
            import logging, traceback
            logging.exception('Unexpected error in generate_answer: %s', e)
            print("Exception in generate_answer:")
            traceback.print_exc()
            result = {
                'answer': 'Sorry, an internal error occurred while processing your request.',
                'sources': [],
                'fallback': True,
                'model': ''
            }

        bot_text = result.get('answer', '')
        sources = result.get('sources', [])
        fallback = bool(result.get('fallback', False))

        bot_msg = Message.objects.create(session=session, sender='bot', text=bot_text)

        # store citations
        for s in sources:
            Citation.objects.create(
                message=bot_msg,
                act=s.get('act', ''),
                section=str(s.get('section', '')),
                title=s.get('title', ''),
                snippet=s.get('snippet', '')
            )

        # Return stable response format required by client (always HTTP 200)
        return Response({
            'answer': bot_text,
            'sources': sources,
            'fallback': fallback,
            'model': result.get('model', ''),
            'session_id': session.id,
            'message_id': bot_msg.id,
            'debug': result.get('debug', {})
        }, status=200)
