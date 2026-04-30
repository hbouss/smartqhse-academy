from django.core.mail import EmailMultiAlternatives, get_connection
from django.conf import settings


def send_html_email(subject, to_email, text_content, html_content):
    connection = get_connection(
        fail_silently=False,
        timeout=8,
    )

    email = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to_email],
        connection=connection,
    )
    email.attach_alternative(html_content, "text/html")
    email.send(fail_silently=False)