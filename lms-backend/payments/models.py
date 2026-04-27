from django.conf import settings
from django.db import models

from catalog.models import Course, ProductBundle


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders'
    )

    course = models.ForeignKey(
        Course,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders'
    )

    bundle = models.ForeignKey(
        ProductBundle,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders'
    )

    stripe_session_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        unique=True
    )

    amount_eur = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        target = self.course.title if self.course else self.bundle.title if self.bundle else 'Order'
        return f'{self.user} - {target} - {self.status}'