import os

for filename in ['server.ts', 'api/index.ts']:
    with open(filename, 'r', encoding='utf-8') as f:
        code = f.read()
    
    # Replace the broken line
    code = code.replace(".replace(/\n/g, '<br />')", r".replace(/\n/g, '<br />')")
    code = code.replace(".replace(/\r\n/g, '<br />')", r".replace(/\n/g, '<br />')")
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(code)
