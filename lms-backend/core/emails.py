from django.conf import settings
from django.core.mail import EmailMultiAlternatives


def send_html_email(subject, to_email, text_content, html_content):
    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to_email],
    )
    email.attach_alternative(html_content, "text/html")
    email.send(fail_silently=False)