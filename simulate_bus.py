import requests, time, random

DB_URLS = [
    "https://realtime-location-tracke-5e9a7-default-rtdb.asia-southeast1.firebasedatabase.app",  
    ]

def update_location(bus_id, lat, lng):
    payload = {"lat": lat, "lng": lng, "timestamp": int(time.time() * 1000)}
    for base in DB_URLS:
        try:
            res = requests.patch(f"{base}/buses/{bus_id}/location.json", json=payload, timeout=5)
            print(f"[{bus_id}] Updated at {base}, status {res.status_code}")
        except Exception as e:
            print(f"[{bus_id}] Failed at {base}: {e}")


lat, lng = 30.3165, 78.0322

while True:
    for bus_id in ["bus1", "bus2"]:
        lat += random.uniform(0.0001, 0.0003)
        lng += random.uniform(0.0001, 0.0003)
        update_location(bus_id, lat, lng)
    time.sleep(3)
