from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.shortcuts import render
from django.urls import include, path


def home(request):
    return render(request, "home.html")


urlpatterns = [
    path("", home, name="home"),
    path("login/", auth_views.LoginView.as_view(template_name="login.html"), name="login"),
    path("logout/", auth_views.LogoutView.as_view(), name="logout"),
    path("dashboard/", include("core.dashboard_urls")),
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
]
