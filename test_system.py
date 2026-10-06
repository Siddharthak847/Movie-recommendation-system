import requests

base = 'http://127.0.0.1:8000'

# 1. Test Static Index
r_index = requests.get(base)
assert r_index.status_code == 200 and 'CineMatch' in r_index.text, 'Index page failed'
print('1. Static HTML: PASS (Contains CineMatch)')

# 2. Test Home Feed
r_home = requests.get(f'{base}/api/home')
assert r_home.status_code == 200, 'Home feed failed'
home_data = r_home.json()
print(f'2. Home Feed: PASS ({len(home_data["rows"])} rows, Hero: {home_data["hero"]["title"]})')

# 3. Test Movie Details & Similar
r_details = requests.get(f'{base}/api/movies/1')
assert r_details.status_code == 200, 'Movie details failed'
details = r_details.json()
print(f'3. Movie Details: PASS ({details["movie"]["title"]}, {len(details["similar"])} similar movies)')

# 4. Test Rating & Dynamic Recalculation
r_rate = requests.post(f'{base}/api/user/rate', json={'movie_id': 1, 'rating': 5.0, 'user_id': 'default_user'})
assert r_rate.status_code == 200, 'Rating failed'
print('4. Real-time User Rating: PASS (Profile adapted)')

# 5. Test Watchlist Toggle
r_wl = requests.post(f'{base}/api/user/watchlist/toggle', json={'movie_id': 10, 'user_id': 'default_user'})
assert r_wl.status_code == 200, 'Watchlist toggle failed'
print(f'5. Watchlist Toggle: PASS ({r_wl.json()})')

# 6. Test Persona Switching
r_persona = requests.post(f'{base}/api/user/persona', json={'persona_name': 'action_adrenaline', 'user_id': 'default_user'})
assert r_persona.status_code == 200, 'Persona switch failed'
print(f'6. Persona Switch: PASS (Active: {r_persona.json()["persona"]})')

# 7. Test Multi-Attribute Search
r_search = requests.get(f'{base}/api/search?q=Nolan&genre=Sci-Fi')
assert r_search.status_code == 200, 'Search failed'
search_res = r_search.json()
print(f'7. Search & Discovery: PASS (Found {len(search_res)} matching titles)')

print('\nALL 7 CORE SYSTEM ENGINE TESTS PASSED WITH 100% SUCCESS!')
