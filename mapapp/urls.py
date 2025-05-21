from django.urls import path
from . import views

urlpatterns = [
    path('', views.map_view, name='map'),
    path('stations/', views.get_stations, name='stations'),
]
