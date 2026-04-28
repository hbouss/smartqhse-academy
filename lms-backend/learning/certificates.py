from io import BytesIO
from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.utils import timezone
from PIL import Image, ImageDraw, ImageFont

from .models import Certificate


def _load_font(size: int, bold: bool = False):
    font_candidates = []

    if bold:
        font_candidates.extend([
            Path(settings.BASE_DIR) / "certificates" / "assets" / "fonts" / "DejaVuSans-Bold.ttf",
            Path("/Library/Fonts/Arial Bold.ttf"),
            Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
            Path("/System/Library/Fonts/Supplemental/Helvetica Bold.ttf"),
        ])
    else:
        font_candidates.extend([
            Path(settings.BASE_DIR) / "certificates" / "assets" / "fonts" / "DejaVuSans.ttf",
            Path("/Library/Fonts/Arial.ttf"),
            Path("/System/Library/Fonts/Supplemental/Arial.ttf"),
            Path("/System/Library/Fonts/Supplemental/Helvetica.ttc"),
        ])

    for font_path in font_candidates:
        if font_path.exists():
            return ImageFont.truetype(str(font_path), size=size)

    return ImageFont.load_default()


def _text_width(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0]


def _text_height(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[3] - bbox[1]


def _draw_centered_text(draw, text, y, image_width, font, fill, shadow_fill=None, shadow_offset=2):
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    x = (image_width - text_width) / 2

    if shadow_fill:
        draw.text((x + shadow_offset, y + shadow_offset), text, font=font, fill=shadow_fill)

    draw.text((x, y), text, font=font, fill=fill)


def _wrap_text(draw, text, font, max_width):
    words = text.split()
    lines = []
    current_line = ""

    for word in words:
        test_line = f"{current_line} {word}".strip()
        if _text_width(draw, test_line, font) <= max_width:
            current_line = test_line
        else:
            if current_line:
                lines.append(current_line)
            current_line = word

    if current_line:
        lines.append(current_line)

    return lines


def _draw_centered_multiline_text(
    draw,
    text,
    y,
    image_width,
    font,
    fill,
    max_width,
    line_spacing=16,
    shadow_fill=None,
    shadow_offset=2,
):
    lines = _wrap_text(draw, text, font, max_width)
    line_height = _text_height(draw, "Ag", font) + line_spacing

    for i, line in enumerate(lines):
        _draw_centered_text(
            draw=draw,
            text=line,
            y=y + (i * line_height),
            image_width=image_width,
            font=font,
            fill=fill,
            shadow_fill=shadow_fill,
            shadow_offset=shadow_offset,
        )


def generate_certificate_for_enrollment(enrollment):
    if not enrollment.completed_at:
        return None

    existing = getattr(enrollment, "certificate", None)
    if existing and existing.file:
        return existing

    user = enrollment.user
    course = enrollment.course

    full_name = f"{user.first_name} {user.last_name}".strip()
    if not full_name:
        raise ValueError("Le prénom et le nom sont requis pour générer le certificat.")

    template_path = Path(settings.BASE_DIR) / "certificates" / "assets" / "certificate_template.png"
    if not template_path.exists():
        raise FileNotFoundError(f"Template certificat introuvable : {template_path}")

    if existing:
        certificate = existing
        if not certificate.full_name:
            certificate.full_name = full_name
            certificate.save(update_fields=["full_name"])
    else:
        certificate = Certificate.objects.create(
            user=user,
            course=course,
            enrollment=enrollment,
            full_name=full_name,
        )

    image = Image.open(template_path).convert("RGB")
    draw = ImageDraw.Draw(image)

    width, height = image.size

    # Tailles retravaillées pour un vrai rendu certificat
    header_font = _load_font(42, bold=True)
    name_font = _load_font(100, bold=True)
    subtitle_font = _load_font(36, bold=False)
    title_font = _load_font(42, bold=True)
    meta_font = _load_font(24, bold=False)
    small_meta_font = _load_font(20, bold=False)

    # Couleurs
    white = "#F8FAFC"
    soft_white = "#E2E8F0"
    light_blue = "#DDEFFE"
    muted = "#CBD5E1"
    shadow = "#06111F"

    # En-tête
    _draw_centered_text(
        draw=draw,
        text="CERTIFICAT DE RÉUSSITE",
        y=int(height * 0.16),
        image_width=width,
        font=header_font,
        fill=white,
        shadow_fill=shadow,
        shadow_offset=3,
    )

    _draw_centered_text(
        draw=draw,
        text="Ce certificat est décerné à",
        y=int(height * 0.25),
        image_width=width,
        font=subtitle_font,
        fill=muted,
        shadow_fill=shadow,
        shadow_offset=2,
    )

    # Nom apprenant très visible
    _draw_centered_text(
        draw=draw,
        text=full_name,
        y=int(height * 0.34),
        image_width=width,
        font=name_font,
        fill=light_blue,
        shadow_fill=shadow,
        shadow_offset=3,
    )

    _draw_centered_text(
        draw=draw,
        text="pour avoir validé avec succès la formation",
        y=int(height * 0.48),
        image_width=width,
        font=subtitle_font,
        fill=soft_white,
        shadow_fill=shadow,
        shadow_offset=2,
    )

    # Titre de la formation
    _draw_centered_multiline_text(
        draw=draw,
        text=course.title,
        y=int(height * 0.56),
        image_width=width,
        font=title_font,
        fill=white,
        max_width=int(width * 0.72),
        line_spacing=14,
        shadow_fill=shadow,
        shadow_offset=3,
    )

    issued_date = timezone.localtime(certificate.issued_at).strftime("%d/%m/%Y")

    # Bas de certificat
    draw.text(
        (int(width * 0.10), int(height * 0.86)),
        f"Date d'émission : {issued_date}",
        font=meta_font,
        fill=soft_white,
    )

    cert_text = f"Certificat n° : {certificate.certificate_number}"
    cert_text_width = _text_width(draw, cert_text, meta_font)
    draw.text(
        (width - int(width * 0.10) - cert_text_width, int(height * 0.86)),
        cert_text,
        font=meta_font,
        fill=soft_white,
    )

    draw.text(
        (int(width * 0.12), int(height * 0.905)),
        "Power HSE",
        font=small_meta_font,
        fill=soft_white,
    )

    draw.text(
        (int(width * 0.12), int(height * 0.935)),
        "Directeur de formation",
        font=small_meta_font,
        fill=muted,
    )

    # Export PDF plus net
    buffer = BytesIO()
    image.save(buffer, format="PDF", resolution=300.0)
    buffer.seek(0)

    filename = f"certificate_{course.slug}_{user.id}.pdf"

    if certificate.file:
        certificate.file.delete(save=False)

    certificate.file.save(filename, ContentFile(buffer.read()), save=True)

    return certificate