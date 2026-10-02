import re

with open('server.ts', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    "const categorySlug = parts[3];",
    "const categorySlug = parts[3];\n      console.log('SSR BRAND CAT:', slug, categorySlug);"
)

with open('server.ts', 'w', encoding='utf-8') as f:
    f.write(code)
