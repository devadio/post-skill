#!/usr/bin/env python3
"""
Devad CORE POST test runner for Python 3.

This replaces the older PHP runner with the same goals as the updated Node.js
version:
- env-based config instead of hardcoded secrets
- dry-run validation before live publish
- safer API error handling
- payload defaults aligned with the Google Sheet script lessons
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import sys
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse
from urllib.request import Request, urlopen


API_BASE = os.getenv("DEVAD_POST_API_BASE") or os.getenv("POST_API_BASE") or "https://devad.io/api/v1/post"
API_TOKEN = (
    os.getenv("DEVAD_POST_API_KEY")
    or os.getenv("DEVAD_POST_TOKEN")
    or os.getenv("DEVAD_WORKSPACE_API_KEY")
    or os.getenv("POST_API_TOKEN")
    or ""
)
ALLOW_WRITES = os.getenv("DEVAD_POST_ALLOW_WRITES") == "1"
REQUEST_TIMEOUT_SECONDS = int(os.getenv("POST_API_TIMEOUT_MS", "30000")) / 1000
PINTEREST_BOARD_ID = os.getenv("POST_PINTEREST_BOARD_ID", "")

TEST_MEDIA = {
    "image": os.getenv("POST_TEST_IMAGE_URL", "https://via.placeholder.com/1080x1080.jpg"),
    "image2": os.getenv("POST_TEST_IMAGE_URL_2", "https://via.placeholder.com/1080x1080/FF5733.jpg"),
    "image3": os.getenv("POST_TEST_IMAGE_URL_3", "https://via.placeholder.com/1080x1080/33C1FF.jpg"),
    "video": os.getenv("POST_TEST_VIDEO_URL", "https://www.w3schools.com/html/mov_bbb.mp4"),
    "large_video": os.getenv("POST_TEST_LARGE_VIDEO_URL", "https://www.w3schools.com/html/mov_bbb.mp4"),
}


class ResponseAwareError(RuntimeError):
    def __init__(self, message: str, response_code: Optional[int] = None, response_text: Optional[str] = None):
        super().__init__(message)
        self.response_code = response_code
        self.response_text = response_text


def load_account_ids() -> Dict[str, str]:
    defaults = {
        "facebook": "",
        "instagram": "",
        "twitter": "",
        "linkedin": "",
        "tiktok": "",
        "youtube": "",
        "pinterest": "",
        "telegram": "",
        "tumblr": "",
        "google_business": "",
    }

    env_map = {
        "facebook": os.getenv("POST_ACCOUNT_FACEBOOK", ""),
        "instagram": os.getenv("POST_ACCOUNT_INSTAGRAM", ""),
        "twitter": os.getenv("POST_ACCOUNT_TWITTER", ""),
        "linkedin": os.getenv("POST_ACCOUNT_LINKEDIN", ""),
        "tiktok": os.getenv("POST_ACCOUNT_TIKTOK", ""),
        "youtube": os.getenv("POST_ACCOUNT_YOUTUBE", ""),
        "pinterest": os.getenv("POST_ACCOUNT_PINTEREST", ""),
        "telegram": os.getenv("POST_ACCOUNT_TELEGRAM", ""),
        "tumblr": os.getenv("POST_ACCOUNT_TUMBLR", ""),
        "google_business": os.getenv("POST_ACCOUNT_GOOGLE_BUSINESS", ""),
    }

    json_map: Dict[str, str] = {}
    raw_json = os.getenv("POST_ACCOUNT_IDS_JSON", "")
    if raw_json:
        try:
            json_map = json.loads(raw_json)
        except json.JSONDecodeError as exc:
            raise RuntimeError("POST_ACCOUNT_IDS_JSON is not valid JSON.") from exc

    merged = defaults.copy()
    merged.update(json_map)
    merged.update(env_map)
    return merged


ACCOUNT_IDS = load_account_ids()


def base_caption(test_name: str) -> str:
    return f"POST API test - {test_name}. #devadio #test"


def normalize_media_spec(media_spec: Optional[Dict[str, List[str]]] = None) -> Dict[str, List[str]]:
    media_spec = media_spec or {}
    return {
        "images": [item for item in media_spec.get("images", []) if item],
        "videos": [item for item in media_spec.get("videos", []) if item],
    }


def detect_media_type(media_spec: Dict[str, List[str]]) -> str:
    if media_spec["images"] and media_spec["videos"]:
        raise RuntimeError("Mixed image and video payloads are not supported in the test runner.")
    if len(media_spec["videos"]) > 1:
        raise RuntimeError("Only one video is supported per test payload.")
    if len(media_spec["videos"]) == 1:
        return "video"
    if len(media_spec["images"]) > 1:
        return "carousel"
    if len(media_spec["images"]) == 1:
        return "image"
    return "text"


def build_platform_settings(provider_key: str, detected_type: str, content: str) -> Dict[str, object]:
    title = (content or "POST API Test")[:95]
    settings: Dict[str, object] = {}

    if provider_key == "facebook":
        settings["post_type"] = detected_type
        settings["fb_type"] = "reels" if detected_type == "video" else "feed"
        return settings

    if provider_key == "instagram":
        settings["post_type"] = detected_type
        if detected_type == "video":
            settings["ig_type"] = "reels"
        elif detected_type == "image":
            settings["ig_type"] = "feed"
        return settings

    if provider_key in {"linkedin", "twitter", "telegram", "tumblr"}:
        settings["post_type"] = detected_type
        return settings

    if provider_key == "tiktok":
        settings["post_type"] = detected_type
        settings["privacy_level"] = "SELF_ONLY"
        settings["music_usage_confirmed"] = True
        settings["tt_consent"] = 1
        settings["duet"] = False
        settings["stitch"] = False
        settings["comment"] = False
        return settings

    if provider_key == "youtube":
        settings["post_type"] = "video"
        settings["title"] = title
        settings["youtube_title"] = title
        settings["type"] = "unlisted"
        settings["category"] = 22
        return settings

    if provider_key == "pinterest":
        settings["post_type"] = "image"
        settings["pinterest_title"] = title
        settings["pinterest_board"] = PINTEREST_BOARD_ID
        return settings

    if provider_key == "google_business":
        settings["post_type"] = "text" if detected_type == "text" else "image"
        return settings

    return settings


def create_post_entry(provider_key: str, integration_id: str, content: str, media_spec: Optional[Dict[str, List[str]]] = None) -> Dict[str, object]:
    normalized = normalize_media_spec(media_spec)
    detected_type = detect_media_type(normalized)
    value_entry: Dict[str, object] = {"content": content}

    if normalized["images"]:
        value_entry["image"] = normalized["images"]
    if normalized["videos"]:
        value_entry["video"] = normalized["videos"]

    entry: Dict[str, object] = {
        "integration": {"id": integration_id or ""},
        "value": [value_entry],
    }
    settings = build_platform_settings(provider_key, detected_type, content)
    if settings:
        entry["settings"] = settings
    return entry


def create_single_platform_payload(provider_key: str, integration_id: str, content: str, media_spec: Optional[Dict[str, List[str]]] = None) -> Dict[str, object]:
    return {"posts": [create_post_entry(provider_key, integration_id, content, media_spec)], "type": "now"}


def build_test_payload(test_name: str) -> Dict[str, object]:
    tests = {
        "facebook_text": lambda: create_single_platform_payload("facebook", ACCOUNT_IDS["facebook"], base_caption("facebook_text")),
        "facebook_image": lambda: create_single_platform_payload("facebook", ACCOUNT_IDS["facebook"], base_caption("facebook_image"), {"images": [TEST_MEDIA["image"]]}),
        "facebook_carousel": lambda: create_single_platform_payload("facebook", ACCOUNT_IDS["facebook"], base_caption("facebook_carousel"), {"images": [TEST_MEDIA["image"], TEST_MEDIA["image2"], TEST_MEDIA["image3"]]}),
        "facebook_video": lambda: create_single_platform_payload("facebook", ACCOUNT_IDS["facebook"], base_caption("facebook_video"), {"videos": [TEST_MEDIA["video"]]}),
        "instagram_image": lambda: create_single_platform_payload("instagram", ACCOUNT_IDS["instagram"], base_caption("instagram_image"), {"images": [TEST_MEDIA["image"]]}),
        "instagram_carousel": lambda: create_single_platform_payload("instagram", ACCOUNT_IDS["instagram"], base_caption("instagram_carousel"), {"images": [TEST_MEDIA["image"], TEST_MEDIA["image2"], TEST_MEDIA["image3"]]}),
        "instagram_video": lambda: create_single_platform_payload("instagram", ACCOUNT_IDS["instagram"], base_caption("instagram_video"), {"videos": [TEST_MEDIA["video"]]}),
        "twitter_text": lambda: create_single_platform_payload("twitter", ACCOUNT_IDS["twitter"], base_caption("twitter_text")),
        "twitter_image": lambda: create_single_platform_payload("twitter", ACCOUNT_IDS["twitter"], base_caption("twitter_image"), {"images": [TEST_MEDIA["image"]]}),
        "twitter_carousel": lambda: create_single_platform_payload("twitter", ACCOUNT_IDS["twitter"], base_caption("twitter_carousel"), {"images": [TEST_MEDIA["image"], TEST_MEDIA["image2"], TEST_MEDIA["image3"]]}),
        "linkedin_text": lambda: create_single_platform_payload("linkedin", ACCOUNT_IDS["linkedin"], base_caption("linkedin_text")),
        "linkedin_image": lambda: create_single_platform_payload("linkedin", ACCOUNT_IDS["linkedin"], base_caption("linkedin_image"), {"images": [TEST_MEDIA["image"]]}),
        "linkedin_carousel": lambda: create_single_platform_payload("linkedin", ACCOUNT_IDS["linkedin"], base_caption("linkedin_carousel"), {"images": [TEST_MEDIA["image"], TEST_MEDIA["image2"], TEST_MEDIA["image3"]]}),
        "linkedin_video": lambda: create_single_platform_payload("linkedin", ACCOUNT_IDS["linkedin"], base_caption("linkedin_video"), {"videos": [TEST_MEDIA["video"]]}),
        "tiktok_image": lambda: create_single_platform_payload("tiktok", ACCOUNT_IDS["tiktok"], base_caption("tiktok_image"), {"images": [TEST_MEDIA["image"]]}),
        "tiktok_video": lambda: create_single_platform_payload("tiktok", ACCOUNT_IDS["tiktok"], base_caption("tiktok_video"), {"videos": [TEST_MEDIA["video"]]}),
        "tiktok_large_video": lambda: create_single_platform_payload("tiktok", ACCOUNT_IDS["tiktok"], base_caption("tiktok_large_video"), {"videos": [TEST_MEDIA["large_video"]]}),
        "youtube_video": lambda: create_single_platform_payload("youtube", ACCOUNT_IDS["youtube"], base_caption("youtube_video"), {"videos": [TEST_MEDIA["video"]]}),
        "pinterest_image": lambda: create_single_platform_payload("pinterest", ACCOUNT_IDS["pinterest"], base_caption("pinterest_image"), {"images": [TEST_MEDIA["image"]]}),
        "telegram_text": lambda: create_single_platform_payload("telegram", ACCOUNT_IDS["telegram"], base_caption("telegram_text")),
        "telegram_image": lambda: create_single_platform_payload("telegram", ACCOUNT_IDS["telegram"], base_caption("telegram_image"), {"images": [TEST_MEDIA["image"]]}),
        "telegram_video": lambda: create_single_platform_payload("telegram", ACCOUNT_IDS["telegram"], base_caption("telegram_video"), {"videos": [TEST_MEDIA["video"]]}),
        "google_image": lambda: create_single_platform_payload("google_business", ACCOUNT_IDS["google_business"], base_caption("google_image"), {"images": [TEST_MEDIA["image"]]}),
    }

    if test_name not in tests:
        raise RuntimeError(f"Unknown command or test '{test_name}'. Use list-tests to see supported tests.")
    return tests[test_name]()


def validate_payload(payload: Dict[str, object], require_integration_ids: bool = True) -> None:
    posts = payload.get("posts")
    if not isinstance(posts, list) or not posts:
        raise RuntimeError("Payload must include a non-empty posts array.")

    for index, post in enumerate(posts):
        label = f"posts[{index}]"
        integration_id = str(post.get("integration", {}).get("id", "")).strip()
        if require_integration_ids and (not integration_id or integration_id == "FILL_ME"):
            raise RuntimeError(f"{label} is missing a valid integration ID.")

        values = post.get("value")
        if not isinstance(values, list) or not values:
            raise RuntimeError(f"{label} must include value[0].")

        first_value = values[0]
        images = first_value.get("image", []) if isinstance(first_value.get("image", []), list) else []
        videos = first_value.get("video", []) if isinstance(first_value.get("video", []), list) else []
        detected_type = detect_media_type({"images": images, "videos": videos})
        settings = post.get("settings", {})
        is_pinterest_payload = "pinterest_title" in settings

        if settings.get("ig_type") == "reel":
            raise RuntimeError(f"{label} uses ig_type=reel. Use ig_type=reels with post_type=video.")
        if settings.get("post_type") == "reel":
            raise RuntimeError(f"{label} uses post_type=reel. Use post_type=video plus ig_type=reels.")
        if settings.get("post_type") == "story" and detected_type == "carousel":
            raise RuntimeError(f"{label} cannot create a story from carousel media.")
        if len(images) > 1 and settings.get("ig_type"):
            raise RuntimeError(f"{label} should not set ig_type on carousel payloads.")
        if settings.get("post_type") == "video" and detected_type not in {"video", "text"}:
            raise RuntimeError(f"{label} declares post_type=video but the media is not a single video.")
        if is_pinterest_payload and not str(settings.get("pinterest_board", "")).strip():
            raise RuntimeError(f"{label} is missing POST_PINTEREST_BOARD_ID.")


def assert_token_present(command_name: str) -> None:
    if not API_TOKEN:
        raise RuntimeError(f"A DEVAD_POST_API_KEY, DEVAD_POST_TOKEN, DEVAD_WORKSPACE_API_KEY, or POST_API_TOKEN value is required for '{command_name}'.")
    if not API_TOKEN.startswith("wsk_"):
        raise RuntimeError("CORE POST live requests require a workspace API key with the wsk_ prefix.")


def assert_live_allowed(command_name: str, confirmed: bool) -> None:
    if not ALLOW_WRITES:
        raise RuntimeError(f"Live '{command_name}' is blocked. Set DEVAD_POST_ALLOW_WRITES=1 and pass --live --confirm --idempotency-key <stable-key>.")
    if not confirmed:
        raise RuntimeError(f"Live '{command_name}' requires --confirm.")


def assert_idempotency_key(command_name: str, idempotency_key: str) -> None:
    if not idempotency_key.strip():
        raise RuntimeError(f"Live '{command_name}' requires a stable --idempotency-key or DEVAD_POST_IDEMPOTENCY_KEY.")


def build_api_url(path_name: str) -> str:
    return f"{API_BASE}{path_name}"


def try_parse_json(raw_text: str):
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        return None


def api_request_json(method: str, path_name: str, body: Optional[Dict[str, object]] = None, idempotency_key: str = "") -> Dict[str, object]:
    request_body = None if body is None else json.dumps(body).encode("utf-8")
    headers = {
        "Accept": "application/json",
    }
    if API_TOKEN:
        headers["Authorization"] = f"Bearer {API_TOKEN}"
    if idempotency_key:
        headers["Idempotency-Key"] = idempotency_key
    if request_body is not None:
        headers["Content-Type"] = "application/json"

    request = Request(build_api_url(path_name), data=request_body, headers=headers, method=method)

    try:
        with urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            raw_text = response.read().decode("utf-8", errors="replace")
            parsed_json = try_parse_json(raw_text)
            return {
                "code": response.status,
                "body": parsed_json if parsed_json is not None else raw_text,
                "raw_text": raw_text,
            }
    except Exception as exc:
        response_code = getattr(exc, "code", None)
        response_text = ""
        if hasattr(exc, "read"):
            response_text = exc.read().decode("utf-8", errors="replace")
        if response_code in {401, 403} or "do_login" in response_text or "login" in response_text.lower():
            raise ResponseAwareError("Authentication failed. Check the CORE workspace API key.", response_code, response_text) from exc
        if response_text:
            parsed_json = try_parse_json(response_text)
            message = parsed_json.get("message") if isinstance(parsed_json, dict) and parsed_json.get("message") else response_text
            raise ResponseAwareError(f"Request failed: {message}", response_code, response_text) from exc
        raise


def guess_filename_from_url(raw_url: str) -> str:
    file_name = Path(urlparse(raw_url).path).name
    return file_name or "upload.bin"


def guess_mime_type(file_name: str) -> str:
    mime_type, _ = mimetypes.guess_type(file_name)
    return mime_type or "application/octet-stream"


def read_upload_source(source: str) -> Tuple[bytes, str, str]:
    if source.lower().startswith(("http://", "https://")):
        with urlopen(source, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            data = response.read()
            content_type = response.headers.get("Content-Type") or guess_mime_type(source)
        return data, guess_filename_from_url(source), content_type

    source_path = Path(source).expanduser().resolve()
    if not source_path.exists():
        raise RuntimeError(f"Upload source not found: {source_path}")
    data = source_path.read_bytes()
    return data, source_path.name, guess_mime_type(source_path.name)


def build_multipart_body(field_name: str, file_name: str, content_type: str, file_data: bytes) -> Tuple[bytes, str]:
    boundary = f"----postdevadio-{uuid.uuid4().hex}"
    lines = [
        f"--{boundary}".encode("utf-8"),
        f'Content-Disposition: form-data; name="{field_name}"; filename="{file_name}"'.encode("utf-8"),
        f"Content-Type: {content_type}".encode("utf-8"),
        b"",
        file_data,
        f"--{boundary}--".encode("utf-8"),
        b"",
    ]
    body = b"\r\n".join(lines)
    return body, boundary


def upload_source(source: str, dry_run: bool, idempotency_key: str = "") -> str:
    file_data, file_name, content_type = read_upload_source(source)

    if dry_run:
        return json.dumps({
            "dryRun": True,
            "fileName": file_name,
            "contentType": content_type,
            "size": len(file_data),
        }, indent=2)

    body, boundary = build_multipart_body("file", file_name, content_type, file_data)
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": f"multipart/form-data; boundary={boundary}",
    }
    if idempotency_key:
        headers["Idempotency-Key"] = idempotency_key

    request = Request(build_api_url("/media"), data=body, headers=headers, method="POST")
    try:
        with urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            raw_text = response.read().decode("utf-8", errors="replace")
            payload = try_parse_json(raw_text)
            media = payload.get("media") if isinstance(payload, dict) else None
            if not isinstance(media, dict) or not media.get("id"):
                raise ResponseAwareError("Upload succeeded but no media.id was returned.", response.status, raw_text)
            return json.dumps(media, indent=2)
    except Exception as exc:
        response_code = getattr(exc, "code", None)
        response_text = ""
        if hasattr(exc, "read"):
            response_text = exc.read().decode("utf-8", errors="replace")
        if response_code in {401, 403} or "do_login" in response_text or "login" in response_text.lower():
            raise ResponseAwareError("Authentication failed. Check the CORE workspace API key.", response_code, response_text) from exc
        raise


def print_response(label: str, result: Dict[str, object]) -> None:
    print(f"{label} -> HTTP {result['code']}")
    print(json.dumps(result["body"], indent=2) if not isinstance(result["body"], str) else result["body"])


def print_usage() -> None:
    lines = [
        "Usage:",
        "  python scripts/test_runner.py list-tests",
        "  python scripts/test_runner.py accounts",
        "  python scripts/test_runner.py health",
        "  python scripts/test_runner.py facebook_image --print-payload",
        "  python scripts/test_runner.py facebook_image --live --confirm --idempotency-key row-42-facebook-image",
        "  python scripts/test_runner.py upload <path-or-url> --live --confirm --idempotency-key row-42-media-0",
        "",
        "Required env for live requests:",
        "  DEVAD_POST_API_KEY or DEVAD_POST_TOKEN or DEVAD_WORKSPACE_API_KEY",
        "  DEVAD_POST_ALLOW_WRITES=1",
        "  DEVAD_POST_IDEMPOTENCY_KEY or --idempotency-key",
    ]
    print("\n".join(lines))


def parse_args(argv: List[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("command", nargs="?")
    parser.add_argument("extra", nargs="*")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--live", action="store_true")
    parser.add_argument("--confirm", action="store_true")
    parser.add_argument("--idempotency-key", default=os.getenv("DEVAD_POST_IDEMPOTENCY_KEY", ""))
    parser.add_argument("--print-payload", action="store_true")
    parser.add_argument("--help", "-h", action="store_true")
    return parser.parse_args(argv)


def main(argv: List[str]) -> int:
    args = parse_args(argv)

    if args.help or not args.command:
        print_usage()
        return 0

    if args.command == "list-tests":
        print("\n".join(sorted([
            "facebook_text",
            "facebook_image",
            "facebook_carousel",
            "facebook_video",
            "instagram_image",
            "instagram_carousel",
            "instagram_video",
            "twitter_text",
            "twitter_image",
            "twitter_carousel",
            "linkedin_text",
            "linkedin_image",
            "linkedin_carousel",
            "linkedin_video",
            "tiktok_image",
            "tiktok_video",
            "tiktok_large_video",
            "youtube_video",
            "pinterest_image",
            "telegram_text",
            "telegram_image",
            "telegram_video",
            "google_image",
        ])))
        return 0

    if args.command == "health":
        print_response("health", api_request_json("GET", "/health"))
        return 0

    if args.command == "accounts":
        assert_token_present("accounts")
        print_response("accounts", api_request_json("GET", "/accounts"))
        return 0

    if args.command == "upload":
        if not args.extra:
            raise RuntimeError("Missing upload source. Use: python scripts/test_runner.py upload <path-or-url>")
        if args.live:
            assert_live_allowed("upload", args.confirm)
            assert_idempotency_key("upload", args.idempotency_key)
            assert_token_present("upload")
        print(upload_source(args.extra[0], not args.live, args.idempotency_key))
        return 0

    payload = build_test_payload(args.command)
    if args.live:
        assert_live_allowed(args.command, args.confirm)
        assert_idempotency_key(args.command, args.idempotency_key)
        assert_token_present(args.command)
    validate_payload(payload, require_integration_ids=args.live)

    if args.print_payload or not args.live:
        print(json.dumps(payload, indent=2))

    if not args.live:
        print("\nDry run passed. No live request was sent.")
        return 0

    print_response(args.command, api_request_json("POST", "/posts", payload, args.idempotency_key))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main(sys.argv[1:]))
    except ResponseAwareError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        if exc.response_code is not None:
            print(f"HTTP: {exc.response_code}", file=sys.stderr)
        if exc.response_text:
            print(f"Server response: {exc.response_text}", file=sys.stderr)
        raise SystemExit(1)
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        raise SystemExit(1)
