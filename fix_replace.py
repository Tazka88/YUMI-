import re

for filename in ['server.ts', 'api/index.ts']:
    with open(filename, 'r', encoding='utf-8') as f:
        code = f.read()
    
    code = code.replace(".replace(//g, '<br />')", r".replace(/\n/g, '<br />')")
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(code)
