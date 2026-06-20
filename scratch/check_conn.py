import json
with open('d:/Tuan/phogotarot/content-plan/n8n-seo-content.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for conn, destinations in data.get('connections', {}).items():
    if conn in ['Upload Banner Image to GitHub', 'Publish Blog Post to GitHub']:
        for dest_type, targets in destinations.items():
            for target in targets:
                if target:
                    for t in target:
                        print(f'{conn} -> {t.get("node", "")}')
