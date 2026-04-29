from io import BytesIO
from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.utils import timezone

from reportlab.lib.colors import HexColor, white
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import registerFont, stringWidth
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

from .models import Certificate


FONT_REGULAR_NAME = "Helvetica"
FONT_BOLD_NAME = "Helvetica-Bold"
FONTS_REGISTERED = False


def _register_custom_fonts():
    global FONTS_REGISTERED, FONT_REGULAR_NAME, FONT_BOLD_NAME

    if FONTS_REGISTERED:
        return

    regular_candidates = [
        Path(settings.BASE_DIR) / "certificates" / "assets" / "fonts" / "DejaVuSans.ttf",
        Path("/Library/Fonts/Arial.ttf"),
        Path("/System/Library/Fonts/Supplemental/Arial.ttf"),
    ]
    bold_candidates = [
        Path(settings.BASE_DIR) / "certificates" / "assets" / "fonts" / "DejaVuSans-Bold.ttf",
        Path("/Library/Fonts/Arial Bold.ttf"),
        Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
    ]

    regular_path = next((p for p in regular_candidates if p.exists()), None)
    bold_path = next((p for p in bold_candidates if p.exists()), None)

    if regular_path:
        registerFont(TTFont("CertificateRegular", str(regular_path)))
        FONT_REGULAR_NAME = "CertificateRegular"

    if bold_path:
        registerFont(TTFont("CertificateBold", str(bold_path)))
        FONT_BOLD_NAME = "CertificateBold"

    FONTS_REGISTERED = True


def _fit_font_size(text: str, font_name: str, max_width: float, start_size: int, min_size: int = 18):
    size = start_size
    while size >= min_size:
        if stringWidth(text, font_name, size) <= max_width:
            return size
        size -= 2
    return min_size


def _draw_centered_text(c, text, y, page_width, font_name, font_size, fill_color, shadow_color=None, shadow_offset=1.5):
    text_width = stringWidth(text, font_name, font_size)
    x = (page_width - text_width) / 2

    if shadow_color:
        c.setFillColor(shadow_color)
        c.setFont(font_name, font_size)
        c.drawString(x + shadow_offset, y - shadow_offset, text)

    c.setFillColor(fill_color)
    c.setFont(font_name, font_size)
    c.drawString(x, y, text)


def _wrap_text(text: str, font_name: str, font_size: int, max_width: float):
    words = text.split()
    if not words:
        return []

    lines = []
    current = words[0]

    for word in words[1:]:
        candidate = f"{current} {word}"
        if stringWidth(candidate, font_name, font_size) <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word

    lines.append(current)
    return lines


def _draw_centered_multiline_text(
    c,
    text,
    y,
    page_width,
    font_name,
    font_size,
    fill_color,
    max_width,
    line_spacing=12,
    shadow_color=None,
    shadow_offset=1.5,
):
    lines = _wrap_text(text, font_name, font_size, max_width)
    if not lines:
        return

    current_y = y
    for line in lines:
        _draw_centered_text(
            c=c,
            text=line,
            y=current_y,
            page_width=page_width,
            font_name=font_name,
            font_size=font_size,
            fill_color=fill_color,
            shadow_color=shadow_color,
            shadow_offset=shadow_offset,
        )
        current_y -= (font_size + line_spacing)


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

    _register_custom_fonts()

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

    buffer = BytesIO()

    bg = ImageReader(str(template_path))
    bg_width, bg_height = bg.getSize()

    # PDF au format exact du template pour garder le rendu "plein cadre"
    page_width = float(bg_width)
    page_height = float(bg_height)

    c = canvas.Canvas(buffer, pagesize=(page_width, page_height))

    # Fond pleine page
    c.drawImage(bg, 0, 0, width=page_width, height=page_height, preserveAspectRatio=False, mask="auto")

    shadow = HexColor("#06111F")
    white_soft = HexColor("#F8FAFC")
    white_light = HexColor("#E2E8F0")
    white_muted = HexColor("#CBD5E1")
    accent = HexColor("#F8FBFF")

    # Tailles calibrées pour retrouver un rendu diplôme lisible
    header_size = 24
    subtitle_size = 22
    course_size = 26
    meta_size = 16
    footer_size = 14

    name_size = _fit_font_size(
        text=full_name,
        font_name=FONT_BOLD_NAME,
        max_width=page_width * 0.62,
        start_size=48,
        min_size=26,
    )

    course_lines = _wrap_text(course.title, FONT_BOLD_NAME, course_size, page_width * 0.62)
    course_block_height = len(course_lines) * (course_size + 8)

    # En-tête
    _draw_centered_text(
        c,
        "CERTIFICAT DE RÉUSSITE",
        page_height * 0.73,
        page_width,
        FONT_BOLD_NAME,
        header_size,
        white_soft,
        shadow,
    )

    _draw_centered_text(
        c,
        "Ce certificat est décerné à",
        page_height * 0.64,
        page_width,
        FONT_REGULAR_NAME,
        subtitle_size,
        white_muted,
        shadow,
    )

    _draw_centered_text(
        c,
        full_name,
        page_height * 0.56,
        page_width,
        FONT_BOLD_NAME,
        name_size,
        accent,
        shadow,
    )

    _draw_centered_text(
        c,
        "pour avoir validé avec succès la formation",
        page_height * 0.46,
        page_width,
        FONT_REGULAR_NAME,
        subtitle_size,
        white_light,
        shadow,
    )

    _draw_centered_multiline_text(
        c,
        course.title,
        page_height * 0.37,
        page_width,
        FONT_BOLD_NAME,
        course_size,
        white_soft,
        page_width * 0.62,
        line_spacing=8,
        shadow_color=shadow,
    )

    issued_date = timezone.localtime(certificate.issued_at).strftime("%d/%m/%Y")

    left_text = f"Date d’émission : {issued_date}"
    right_text = f"Certificat n° : {certificate.certificate_number}"

    c.setFont(FONT_REGULAR_NAME, meta_size)
    c.setFillColor(white_light)
    c.drawString(page_width * 0.14, page_height * 0.11, left_text)

    right_width = stringWidth(right_text, FONT_REGULAR_NAME, meta_size)
    c.drawString(page_width - (page_width * 0.14) - right_width, page_height * 0.11, right_text)

    c.setFont(FONT_REGULAR_NAME, footer_size)
    c.setFillColor(white_light)
    c.drawString(page_width * 0.16, page_height * 0.19, "Directeur de Formation")

    c.showPage()
    c.save()

    buffer.seek(0)

    filename = f"certificate_{course.slug}_{user.id}.pdf"

    if certificate.file:
        certificate.file.delete(save=False)

    certificate.file.save(filename, ContentFile(buffer.read()), save=True)

    return certificate