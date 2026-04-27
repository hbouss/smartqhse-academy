import os

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.emails import send_html_email
from .serializers import (
    RegisterSerializer,
    UserMeSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    ChangePasswordSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()

        display_name = f"{user.first_name} {user.last_name}".strip() or user.username

        subject = "Bienvenue sur SmartQHSE Academy"
        text_content = (
            f"Bonjour {display_name},\n\n"
            "Votre compte a bien été créé sur SmartQHSE Academy.\n"
            "Vous pouvez maintenant vous connecter à la plateforme."
        )

        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background:#0f172a; color:#ffffff; padding:32px;">
            <div style="max-width:600px; margin:0 auto; background:#111827; border:1px solid #1f2937; border-radius:20px; padding:32px;">
              <p style="color:#22d3ee; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase;">
                SmartQHSE Academy
              </p>
              <h1 style="font-size:28px; margin-bottom:16px;">Bienvenue {display_name}</h1>
              <p style="font-size:16px; line-height:1.7; color:#cbd5e1;">
                Votre compte a bien été créé sur SmartQHSE Academy.
              </p>
              <p style="font-size:16px; line-height:1.7; color:#cbd5e1;">
                Vous pouvez maintenant vous connecter, accéder à votre espace apprenant
                et retrouver vos formations.
              </p>
            </div>
          </body>
        </html>
        """

        send_html_email(
            subject=subject,
            to_email=user.email,
            text_content=text_content,
            html_content=html_content,
        )


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserMeSerializer(request.user)
        return Response(serializer.data)


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"message": "Si un compte existe avec cet email, un lien a été envoyé."},
                status=status.HTTP_200_OK,
            )

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        reset_link = f"{frontend_url}/reinitialiser-mot-de-passe?uid={uid}&token={token}"

        display_name = f"{user.first_name} {user.last_name}".strip() or user.username

        subject = "Réinitialisation de votre mot de passe"
        text_content = (
            f"Bonjour {display_name},\n\n"
            f"Vous avez demandé la réinitialisation de votre mot de passe sur SmartQHSE Academy.\n"
            f"Cliquez sur le lien suivant pour définir un nouveau mot de passe :\n\n"
            f"{reset_link}\n\n"
            f"Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email."
        )

        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background:#0f172a; color:#ffffff; padding:32px;">
            <div style="max-width:600px; margin:0 auto; background:#111827; border:1px solid #1f2937; border-radius:20px; padding:32px;">
              <p style="color:#22d3ee; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase;">
                SmartQHSE Academy
              </p>
              <h1 style="font-size:28px; margin-bottom:16px;">Réinitialisation du mot de passe</h1>
              <p style="font-size:16px; line-height:1.7; color:#cbd5e1;">
                Bonjour {display_name},
              </p>
              <p style="font-size:16px; line-height:1.7; color:#cbd5e1;">
                Vous avez demandé la réinitialisation de votre mot de passe sur SmartQHSE Academy.
              </p>
              <p style="font-size:16px; line-height:1.7; color:#cbd5e1;">
                Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :
              </p>
              <p style="margin:32px 0;">
                <a href="{reset_link}" style="display:inline-block; background:#06b6d4; color:#0f172a; text-decoration:none; padding:14px 24px; border-radius:999px; font-weight:700;">
                  Réinitialiser mon mot de passe
                </a>
              </p>
              <p style="font-size:14px; line-height:1.7; color:#94a3b8;">
                Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.
              </p>
            </div>
          </body>
        </html>
        """

        send_html_email(
            subject=subject,
            to_email=user.email,
            text_content=text_content,
            html_content=html_content,
        )

        return Response(
            {"message": "Si un compte existe avec cet email, un lien a été envoyé."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        new_password = serializer.validated_data["new_password"]

        user.set_password(new_password)
        user.save(update_fields=["password"])

        return Response(
            {"message": "Votre mot de passe a bien été réinitialisé."},
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])

        return Response(
            {"message": "Votre mot de passe a bien été mis à jour."},
            status=200,
        )