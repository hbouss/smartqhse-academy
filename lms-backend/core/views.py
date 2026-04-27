from pathlib import Path
from django.conf import settings
from django.http import JsonResponse, Http404, FileResponse


def debug_adapt_files(request):
    adapt_root = Path(settings.ADAPT_MODULES_ROOT)
    target = adapt_root / "fondamentaux" / "module-1"

    return JsonResponse({
        "MEDIA_ROOT": str(settings.MEDIA_ROOT),
        "ADAPT_MODULES_ROOT": str(settings.ADAPT_MODULES_ROOT),
        "adapt_root": str(adapt_root),
        "adapt_root_exists": adapt_root.exists(),
        "target_exists": target.exists(),
        "target_is_dir": target.is_dir(),
        "index_exists": (target / "index.html").exists(),
        "adapt_css_exists": (target / "adapt.css").exists(),
        "components_exists": (target / "course" / "en" / "components.json").exists(),
    })


def serve_adapt_module(request, file_path=""):
    adapt_root = Path(settings.ADAPT_MODULES_ROOT)
    normalized_path = (file_path or "").strip("/")

    if not normalized_path:
        raise Http404("Adapt root not specified.")

    target = adapt_root / normalized_path

    if target.is_dir():
        target = target / "index.html"

    try:
        target.resolve().relative_to(adapt_root.resolve())
    except ValueError:
        raise Http404("Invalid path.")

    if not target.exists() or not target.is_file():
        raise Http404("Adapt file not found.")

    return FileResponse(open(target, "rb"))