import re
import os

with open("generic_block.ts", "r", encoding="utf-8") as f:
    replacement = f.read()

for filename in ['server.ts', 'api/index.ts']:
    with open(filename, 'r', encoding='utf-8') as f:
        code = f.read()
    
    # We match from "if (req.path === '/' || req.path === '/index.html') {"
    # up to "const globalNav = `"
    
    pattern = r"if \(req\.path === '/' \|\| req\.path === '/index\.html'\) \{([\s\S]*?)const globalNav = `"
    
    # The replacement must include "const globalNav = `" at the end
    if re.search(pattern, code):
        new_code = re.sub(pattern, replacement + "\n    const globalNav = `", code)
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(new_code)
        print(f"Patched {filename}")
    else:
        print(f"Could not find pattern in {filename}")
