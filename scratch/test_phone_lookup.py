import sys
import os

sys.path.append(os.path.abspath("backend"))

from app.routers.route_optimization import _infer_location_from_phone, _infer_carrier_and_asn

test_phones = [
    "9443123456",
    "9894123456",
    "9786123456",
    "9486123456",
    "9942123456",
    "9840123456",
    "7358123456",
    "9820123456"
]

print("--- TESTING NAMAKKAL & TN PHONE LOCATION INFERENCE ---")
for p in test_phones:
    loc = _infer_location_from_phone(p)
    meta = _infer_carrier_and_asn(p, loc)
    print(f"Phone: {p:<15} -> Location: {loc:<32} | Carrier: {meta['carrier']}")
