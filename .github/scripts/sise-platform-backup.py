#!/usr/bin/env python3
"""Export Supabase Auth user records and Storage objects for encrypted SISE backups.

This intentionally does not export passwords, active sessions, MFA secrets, or
other Supabase-managed runtime state. Restoring Auth users may require password
resets / re-invitations. Storage objects are downloaded byte-for-byte.
"""
import json
import os
import sys
import time
from pathlib import Path, PurePosixPath
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

BASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
API_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
OUT = Path(os.environ.get("BACKUP_DIR", "sise-platform-backup"))
HEADERS = {"apikey": API_KEY, "Authorization": f"Bearer {API_KEY}"}


def request_json(method, path, payload=None):
    body = None if payload is None else json.dumps(payload).encode()
    headers = dict(HEADERS)
    if body is not None:
        headers["Content-Type"] = "application/json"
    req = Request(BASE_URL + path, data=body, headers=headers, method=method)
    for attempt in range(4):
        try:
            with urlopen(req, timeout=120) as response:
                raw = response.read()
                return json.loads(raw.decode()) if raw else None
        except HTTPError as exc:
            if exc.code in (429, 500, 502, 503, 504) and attempt < 3:
                time.sleep(2 ** attempt)
                continue
            raise RuntimeError(f"Supabase API request failed (HTTP {exc.code})") from None
        except (URLError, TimeoutError) as exc:
            if attempt < 3:
                time.sleep(2 ** attempt)
                continue
            raise RuntimeError("Supabase API request failed due to a network error") from None


def download_object(bucket, object_path, destination):
    encoded_bucket = quote(bucket, safe="")
    encoded_path = quote(object_path, safe="/")
    req = Request(
        f"{BASE_URL}/storage/v1/object/{encoded_bucket}/{encoded_path}",
        headers=HEADERS,
        method="GET",
    )
    for attempt in range(4):
        try:
            with urlopen(req, timeout=180) as response:
                destination.parent.mkdir(parents=True, exist_ok=True)
                with destination.open("wb") as output:
                    while True:
                        chunk = response.read(1024 * 1024)
                        if not chunk:
                            break
                        output.write(chunk)
            return
        except HTTPError as exc:
            if exc.code in (429, 500, 502, 503, 504) and attempt < 3:
                time.sleep(2 ** attempt)
                continue
            raise RuntimeError(
                f"Storage download failed for bucket {bucket} (HTTP {exc.code})"
            ) from None
        except (URLError, TimeoutError):
            if attempt < 3:
                time.sleep(2 ** attempt)
                continue
            raise RuntimeError(f"Storage download failed for bucket {bucket}") from None


def safe_destination(root, relative):
    parts = PurePosixPath(relative)
    if parts.is_absolute() or any(part in ("", ".", "..") for part in parts.parts):
        raise RuntimeError("Storage returned an unsafe object path")
    target = (root / Path(*parts.parts)).resolve()
    if root.resolve() not in target.parents:
        raise RuntimeError("Storage object path escaped the backup directory")
    return target


def export_auth():
    users = []
    page = 1
    per_page = 1000
    while True:
        result = request_json(
            "GET",
            "/auth/v1/admin/users?" + urlencode({"page": page, "per_page": per_page}),
        )
        batch = result.get("users", []) if isinstance(result, dict) else []
        if not isinstance(batch, list):
            raise RuntimeError("Unexpected Auth users response")
        users.extend(batch)
        if len(batch) < per_page:
            break
        page += 1
    auth_dir = OUT / "auth"
    auth_dir.mkdir(parents=True, exist_ok=True)
    (auth_dir / "users.json").write_text(
        json.dumps(
            {"exported_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
             "count": len(users), "users": users},
            ensure_ascii=False, indent=2,
        ) + "\n",
        encoding="utf-8",
    )
    return len(users)


def list_storage_page(bucket, prefix, offset):
    return request_json(
        "POST",
        f"/storage/v1/object/list/{quote(bucket, safe='')}",
        {"prefix": prefix, "limit": 100, "offset": offset,
         "sortBy": {"column": "name", "order": "asc"}},
    )


def export_bucket(bucket):
    bucket_root = OUT / "storage" / bucket
    manifest = []
    seen = set()

    def walk(prefix):
        offset = 0
        while True:
            entries = list_storage_page(bucket, prefix, offset)
            if not isinstance(entries, list):
                raise RuntimeError(f"Unexpected Storage list response for bucket {bucket}")
            for entry in entries:
                name = entry.get("name")
                if not isinstance(name, str) or not name:
                    continue
                object_path = prefix + name
                if entry.get("id") is None and entry.get("metadata") is None:
                    walk(object_path.rstrip("/") + "/")
                    continue
                if object_path in seen:
                    continue
                seen.add(object_path)
                destination = safe_destination(bucket_root, object_path)
                download_object(bucket, object_path, destination)
                manifest.append({
                    "path": object_path,
                    "metadata": entry.get("metadata"),
                    "created_at": entry.get("created_at"),
                    "updated_at": entry.get("updated_at"),
                    "last_accessed_at": entry.get("last_accessed_at"),
                })
            if len(entries) < 100:
                break
            offset += len(entries)

    walk("")
    return manifest


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    buckets = request_json("GET", "/storage/v1/bucket")
    if not isinstance(buckets, list):
        raise RuntimeError("Unexpected Storage buckets response")

    user_count = export_auth()
    bucket_summaries = []
    total_objects = 0
    for bucket in buckets:
        name = bucket.get("name")
        if not isinstance(name, str) or not name:
            raise RuntimeError("Storage returned a bucket without a name")
        objects = export_bucket(name)
        total_objects += len(objects)
        bucket_summaries.append({
            "name": name,
            "public": bucket.get("public"),
            "object_count": len(objects),
            "objects": objects,
        })

    manifest = {
        "project_ref": "vwprdviufqukdvcroynt",
        "exported_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "auth_user_count": user_count,
        "storage_bucket_count": len(buckets),
        "storage_object_count": total_objects,
        "buckets": bucket_summaries,
        "auth_limitations": [
            "Passwords and password hashes are not exported.",
            "Active sessions, refresh tokens, MFA secrets, and runtime auth state are not exported.",
            "Restored users may need password resets or invitations.",
        ],
    }
    (OUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Platform export complete: {user_count} Auth users, "
        f"{len(buckets)} buckets, {total_objects} Storage objects."
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Platform backup failed: {exc}", file=sys.stderr)
        sys.exit(1)
