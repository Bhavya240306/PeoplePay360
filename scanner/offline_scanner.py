"""
Offline attendance QR scanner for PeoplePay360.

Runs standalone on any PC with a webcam (e.g. a kiosk at the office
entrance) - it is NOT part of the website. Each employee shows their own
personal QR code (from the "My QR Code" page in the website, logged in on
their own device) to this camera. The first scan of the day checks them
in; the next scan checks them out.

This script never talks to the database directly - it just decodes the
QR code shown to the camera and calls the same backend API the website
uses, authenticating itself as a trusted scanner device with a shared
key (rather than a user login, since no one is "logged in" at a kiosk).

Setup:
    pip install -r requirements.txt

Configure (environment variables, both optional):
    PP360_API_URL     Base URL of the backend API.
                       Default: http://localhost:8000/api
    PP360_SCANNER_KEY Must match SCANNER_API_KEY in backend/.env.
                       Default: peoplepay360-scanner-key

Run:
    python offline_scanner.py
"""

import os
import time

import cv2
import requests

API_URL = os.environ.get("PP360_API_URL", "http://localhost:8000/api").rstrip("/")
SCANNER_KEY = os.environ.get("PP360_SCANNER_KEY", "peoplepay360-scanner-key")
COOLDOWN_SECONDS = 5  # ignore the same QR code scanned again this soon


def report_scan(token):
    try:
        response = requests.post(
            f"{API_URL}/attendance/qr-scan/",
            json={"token": token},
            headers={"X-Scanner-Key": SCANNER_KEY},
            timeout=5,
        )
    except requests.RequestException as exc:
        print(f"[ERROR] Could not reach the server at {API_URL}: {exc}")
        return

    try:
        data = response.json()
    except ValueError:
        print(f"[ERROR] Unexpected response ({response.status_code}): {response.text}")
        return

    if response.status_code != 200:
        print(f"[REJECTED] {data.get('detail', response.text)}")
        return

    employee = data.get("employee", "")
    if data.get("action") == "check-in":
        print(f"CHECK-IN  {employee} at {data['time']} ({data.get('status')})")
    else:
        print(f"CHECK-OUT {employee} at {data['time']} - worked {data.get('worked_hours')}h")


def main():
    print(f"Backend: {API_URL}")
    if not SCANNER_KEY:
        print("WARNING: PP360_SCANNER_KEY is empty - the server will reject every scan.")

    detector = cv2.QRCodeDetector()
    capture = cv2.VideoCapture(0)
    if not capture.isOpened():
        raise SystemExit("Could not open the webcam (device 0). Is another app using it?")

    print("Scanner ready - show an employee's personal QR code to the camera. Press Q to quit.")

    last_token, last_scan_time = None, 0.0
    window = "PeoplePay360 - Attendance Scanner (Q to quit)"

    try:
        while True:
            ok, frame = capture.read()
            if not ok:
                continue

            decoded_text, _, _ = detector.detectAndDecode(frame)
            if decoded_text:
                now = time.time()
                if decoded_text != last_token or (now - last_scan_time) > COOLDOWN_SECONDS:
                    report_scan(decoded_text)
                    last_token, last_scan_time = decoded_text, now

            cv2.imshow(window, frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
    finally:
        capture.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
