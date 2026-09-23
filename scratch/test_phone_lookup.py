import sys
import os

# Add backend to path
sys.path.append(os.path.abspath("backend"))

from app.routers.route_optimization import _infer_location_from_phone, _infer_carrier_and_asn

test_phones = [
    "9876543210",
    "7358123456",
    "9840123456",
    "9820123456",
    "9844123456",
    "9848123456",
    "9810123456",
    "9830123456",
    "+91 98401 23456",
    "07358123456",
    "+1 (415) 555-2671",
    "+44 7911 123456",
    "invalid_phone"
]

print("--- TESTING PHONE LOCATION INFERENCE ---")
for p in test_phones:
    loc = _infer_location_from_phone(p)
    meta = _infer_carrier_and_asn(p, loc)
    print(f"Phone: {p:<20} -> Location: {loc:<30} | Carrier: {meta['carrier']}")
