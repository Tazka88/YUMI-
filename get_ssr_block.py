import re

for filename in ['server.ts', 'api/index.ts']:
    with open(filename, 'r', encoding='utf-8') as f:
        code = f.read()
    
    match = re.search(r"if \(req\.path === '/' \|\| req\.path === '/index\.html'\) \{([\s\S]*?)const globalNav = `", code)
    if match:
        print(f"Matched in {filename}")
        with open(f"ssr_block_{filename.replace('/', '_')}.txt", "w", encoding="utf-8") as out:
            out.write(match.group(0))
