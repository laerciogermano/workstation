#!/usr/bin/env python3
"""CLI mínimo da Google Drive API (OAuth usuário)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
CONFIG_DIR = Path.home() / ".config" / "google-drive-cli"
CREDENTIALS_PATH = CONFIG_DIR / "credentials.json"
TOKEN_PATH = CONFIG_DIR / "token.json"


def get_service():
    if not CREDENTIALS_PATH.is_file():
        sys.exit(
            f"Falta {CREDENTIALS_PATH}\n"
            "Baixe o JSON do cliente OAuth (Desktop) e salve nesse caminho."
        )

    creds = None
    if TOKEN_PATH.is_file():
        creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                str(CREDENTIALS_PATH), SCOPES
            )
            creds = flow.run_local_server(port=0)
        TOKEN_PATH.parent.mkdir(parents=True, exist_ok=True)
        TOKEN_PATH.write_text(creds.to_json(), encoding="utf-8")
        TOKEN_PATH.chmod(0o600)

    return build("drive", "v3", credentials=creds)


def cmd_ls(args: argparse.Namespace) -> None:
    service = get_service()
    folder = args.folder or "root"
    q = f"'{folder}' in parents and trashed = false"
    resp = (
        service.files()
        .list(
            pageSize=args.limit,
            fields="files(id, name, mimeType, modifiedTime)",
            q=q,
            orderBy="folder,name",
        )
        .execute()
    )
    files = resp.get("files", [])
    if not files:
        print("(vazio)")
        return
    for f in files:
        kind = "dir" if f["mimeType"] == "application/vnd.google-apps.folder" else "file"
        print(f"{kind}\t{f['id']}\t{f['name']}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Google Drive API CLI")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_ls = sub.add_parser("ls", help="Listar arquivos")
    p_ls.add_argument(
        "--folder",
        default=None,
        help="ID da pasta (omitir = raiz do Meu Drive)",
    )
    p_ls.add_argument("--limit", type=int, default=50)
    p_ls.set_defaults(func=cmd_ls)

    p_auth = sub.add_parser("auth", help="Abrir login OAuth e gravar token")
    p_auth.set_defaults(func=lambda _: get_service() and print(f"OK → {TOKEN_PATH}"))

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
