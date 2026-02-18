from django.urls import path
from .views import AuthViewSet, CustomAuthToken
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('login/', CustomAuthToken.as_view(), name='login'),
    path('register/', AuthViewSet.as_view({'post': 'register'}), name='register'),
    path('user_info/', AuthViewSet.as_view({'get': 'user_info'}), name='user_info'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
