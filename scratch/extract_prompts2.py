import json

file_path = r'd:\Tuan\phogotarot\content-plan\n8n-seo-content.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

with open(r'd:\Tuan\phogotarot\scratch\prompts2.txt', 'w', encoding='utf-8') as out:
    for n in data['nodes']:
        if 'Agent' in n['name'] or 'Generator' in n['name']:
            out.write(f"--- {n['name']} ---\n")
            if 'parameters' in n:
                out.write(n['parameters'].get('jsonBody', '') + "\n")
