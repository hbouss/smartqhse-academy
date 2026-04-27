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
        ])
    else:
        font_candidates.extend([
            Path(settings.BASE_DIR) / "certificates" / "assets" / "fonts" / "DejaVuSans.ttf",
            Path("/Library/Fonts/Arial.ttf"),
            Path("/System/Library/Fonts/Supplemental/Arial.ttf"),
        ])

    for font_path in font_candidates:
        if font_path.exists():
            return ImageFont.truetype(str(font_path), size=size)

    return ImageFont.load_default()


def _draw_centered_text(draw, text, y, image_width, font, fill):
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    x = (image_width - text_width) / 2
    draw.text((x, y), text, font=font, fill=fill)


def _draw_centered_multiline_text(draw, text, y, image_width, font, fill, max_width):
    words = text.split()
    lines = []
    current_line = ""

    for word in words:
        test_line = f"{current_line} {word}".strip()
        bbox = draw.textbbox((0, 0), test_line, font=font)
        test_width = bbox[2] - bbox[0]

        if test_width <= max_width:
            current_line = test_line
        else:
            if current_line:
                lines.append(current_line)
            current_line = word

    if current_line:
        lines.append(current_line)

    line_bbox = draw.textbbox((0, 0), "Ag", font=font)
    line_height = (line_bbox[3] - line_bbox[1]) + 10

    for i, line in enumerate(lines):
        _draw_centered_text(
            draw,
            line,
            y=y + (i * line_height),
            image_width=image_width,
            font=font,
            fill=fill,
        )


def generate_certificate_for_enrollment(enrollment):
    if not enrollment.completed_at:
        return None

    existing = getattr(enrollment, "certificate", None)
    if existing:
        return existing

    user = enrollment.user
    course = enrollment.course

    full_name = f"{user.first_name} {user.last_name}".strip()
    if not full_name:
        raise ValueError("Le prénom et le nom sont requis pour générer le certificat.")

    template_path = Path(settings.BASE_DIR) / "certificates" / "assets" / "certificate_template.png"
    if not template_path.exists():
        raise FileNotFoundError(f"Template certificat introuvable : {template_path}")

    certificate = Certificate.objects.create(
        user=user,
        course=course,
        enrollment=enrollment,
        full_name=full_name,
    )

    image = Image.open(template_path).convert("RGB")
    draw = ImageDraw.Draw(image)

    width, height = image.size

    name_font = _load_font(74, bold=True)
    subtitle_font = _load_font(28, bold=False)
    title_font = _load_font(30, bold=True)
    meta_font = _load_font(20, bold=False)

    name_color = "#F8FAFC"
    subtitle_color = "#CBD5E1"
    title_color = "#E2E8F0"
    meta_color = "#E2E8F0"

    _draw_centered_text(
        draw,
        full_name,
        y=int(height * 0.38),
        image_width=width,
        font=name_font,
        fill=name_color,
    )

    _draw_centered_text(
        draw,
        "a validé avec succès la formation",
        y=int(height * 0.50),
        image_width=width,
        font=subtitle_font,
        fill=subtitle_color,
    )

    _draw_centered_multiline_text(
        draw,
        course.title,
        y=int(height * 0.58),
        image_width=width,
        font=title_font,
        fill=title_color,
        max_width=int(width * 0.72),
    )

    issued_date = timezone.localtime(certificate.issued_at).strftime("%d/%m/%Y")

    draw.text(
        (int(width * 0.12), int(height * 0.84)),
        f"Date d'émission : {issued_date}",
        font=meta_font,
        fill=meta_color,
    )

    draw.text(
        (int(width * 0.60), int(height * 0.84)),
        f"Certificat n° : {certificate.certificate_number}",
        font=meta_font,
        fill=meta_color,
    )

    buffer = BytesIO()
    image.save(buffer, format="PDF", resolution=100.0)
    buffer.seek(0)

    filename = f"certificate_{course.slug}_{user.id}.pdf"
    certificate.file.save(filename, ContentFile(buffer.read()), save=True)

    return certificate