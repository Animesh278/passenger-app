import time
import requests
import math

BASE_URL = "https://realtime-location-tracke-5e9a7-default-rtdb.asia-southeast1.firebasedatabase.app"

# list of bus IDs and simple circular routes (you can edit)
buses = {
    "bus1": [(30.3165,78.0322), (30.3180,78.0330), (30.3195,78.0340)],
    "bus2": [(30.3200,78.035), (30.3210,78.036), (30.3220,78.037)],
}

DB_BUS_BASE = BASE_URL.rstrip("/") + "/buses/"

def interpolate(a,b,t):
    return (a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t)

def send(bus_id, lat, lng):
    url = DB_BUS_BASE + f"{bus_id}.json"
    payload = {
        "meta": {"id": bus_id, "route": "Demo"},
        "location": {"lat": lat, "lng": lng, "timestamp": int(time.time()*1000)}
    }
    try:
        r = requests.patch(url, json=payload, timeout=8)
        print(bus_id, "->", lat, lng, "status", r.status_code)
    except Exception as e:
        print("Error sending", e)

def run():
    steps = 20
    try:
        while True:
            for bus_id, stops in buses.items():
                for i in range(len(stops)):
                    a = stops[i]
                    b = stops[(i+1)%len(stops)]
                    for s in range(steps):
                        t = s/steps
                        lat,lng = interpolate(a,b,t)
                        send(bus_id, round(lat,6), round(lng,6))
                        time.sleep(0.6)
    except KeyboardInterrupt:
        print("Stopped by user")

if __name__ == "__main__":
    run()
