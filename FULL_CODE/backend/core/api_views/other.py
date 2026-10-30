"""Other API helpers and endpoints."""

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_http_methods

from ..h5_assistant import ProtocolAssistant, visit_list
from .common import _body, _error, _h5_data_dir, api_login_required


@api_login_required
@require_http_methods(["GET"])
def dashboard(request):
    return JsonResponse({"status": "ok", "app": "ArogyaSathi Medical Clinic API"})


@api_login_required
@require_http_methods(["POST"])
def seed_dynamic_data(request):
    return _error("No sample data is available to seed", 409)


@api_login_required
@require_http_methods(["GET"])
def companion_visit_list(request):
    data_dir = _h5_data_dir()
    if data_dir is None:
        return _error("The offline H5 protocol pack is not configured", 503)
    return JsonResponse({"results": visit_list(data_dir / "household_register.csv")})


@api_login_required
@csrf_protect
@require_http_methods(["POST"])
def companion_answer(request):
    data = _body(request)
    question = str((data or {}).get("question", "")).strip()
    if not question:
        return _error("A protocol question is required")
    data_dir = _h5_data_dir()
    if data_dir is None:
        return _error("The offline H5 protocol pack is not configured", 503)
    return JsonResponse({"answer": ProtocolAssistant(data_dir).answer(question)})
