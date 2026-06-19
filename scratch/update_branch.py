import json

file_path = r"d:\Tuan\phogotarot\content-plan\n8n-seo-content.json"

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for node in data.get('nodes', []):
    if node['type'] == 'n8n-nodes-base.github':
        node['parameters']['branch'] = 'feature/cloudfare-d1'

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Updated branch for GitHub nodes.")
