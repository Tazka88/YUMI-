import sys
import urllib.request
import urllib.error

urls = [
    'http://localhost:3000/api/products',
    'http://localhost:3000/api/categories',
    'http://localhost:3000/api/settings',
    'http://localhost:3000/api/hero-banners',
    'http://localhost:3000/api/brands',
    'http://localhost:3000/api/admin/products',
    'http://localhost:3000/api/admin/settings'
]

for url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            print(f"[{url}] {response.status}")
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        print(f"[{url}] {e.code}: {body[:500]}")
    except urllib.error.URLError as e:
        print(f"[{url}] URL Error: {e.reason}")
