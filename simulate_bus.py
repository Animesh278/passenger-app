import time
import requests

# Replace with your actual Firebase Realtime DB URL
DB_URL = "https://realtime-location-tracke-5e9a7-default-rtdb.asia-southeast1.firebasedatabase.app/buses/bus1/location.json"

# Example bus route (Dehradun area)
bus_stops = [
    (30.3165, 78.0322),  # Stop 1: Clock Tower
    (30.3190, 78.0340),  # Stop 2: Rajpur Road
    (30.3220, 78.0365),  # Stop 3: Parade Ground
    (30.3250, 78.0390),  # Stop 4: ISBT
]

def move_smoothly(start, end, steps=20):
    """Generate intermediate points between two coordinates"""
    lat1, lng1 = start
    lat2, lng2 = end
    for i in range(steps + 1):
        lat = lat1 + (lat2 - lat1) * i / steps
        lng = lng1 + (lng2 - lng1) * i / steps
        yield (lat, lng)

while True:
    for i in range(len(bus_stops)):
        start = bus_stops[i]
        end = bus_stops[(i + 1) % len(bus_stops)]  # loop back to first stop
        for lat, lng in move_smoothly(start, end, steps=20):
            payload = {
                "lat": lat,
                "lng": lng,
                "timestamp": int(time.time() * 1000)
            }
            try:
                res = requests.patch(DB_URL, json=payload)  # ✅ changed from PUT to PATCH
                print("Updated:", payload, "status:", res.status_code)
            except Exception as e:
                print("Error:", e)
            time.sleep(2)  # update every 2 sec
