from django.urls import path
from .views import create_checkout_session, stripe_webhook, my_orders, create_bundle_checkout_session

urlpatterns = [
    path('checkout/<int:course_id>/', create_checkout_session, name='create_checkout_session'),
    path('checkout-bundle/<int:bundle_id>/', create_bundle_checkout_session, name='create_bundle_checkout_session'),
    path('webhook/', stripe_webhook, name='stripe_webhook'),
    path('my-orders/', my_orders, name='my_orders'),
]