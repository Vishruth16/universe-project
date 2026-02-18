# auth_api/views.py
from django.contrib.auth.models import User
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.settings import api_settings

class CustomAuthToken(ObtainAuthToken):
    """
    Custom token authentication with user info in response
    """
    renderer_classes = api_settings.DEFAULT_RENDERER_CLASSES
    
    def post(self, request, *args, **kwargs):
        # Debug logging
        print(f"Request data: {request.data}")
        print(f"Request META: {dict(request.META)}")
        print(f"Content-Type: {request.content_type}")
        
        serializer = self.serializer_class(data=request.data,
                                          context={'request': request})
        
        # Check validation errors before raising exception
        if not serializer.is_valid():
            print(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email
        })

class AuthViewSet(viewsets.ViewSet):
    """
    A viewset for authentication actions
    """
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        """
        Register a new user
        """
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not username or not email or not password:
            return Response({
                'error': 'Please provide username, email, and password'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        if User.objects.filter(username=username).exists():
            return Response({
                'error': 'Username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'Email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def user_info(self, request):
        """
        Get current user information
        """
        if not request.user.is_authenticated:
            return Response({
                'error': 'Not authenticated'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name
        })