import json
import os

file_path = r'd:\Tuan\phogotarot\content-plan\n8n-seo-content.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for node in data.get('nodes', []):
    if node['name'] in ['Generate Banner Image', 'Generate Inline Image']:
        if 'jsonBody' in node['parameters']:
            node['parameters']['jsonBody'] = node['parameters']['jsonBody'].replace('"aspectRatio": "4:3"', '"aspectRatio": "16:9"')

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Aspect ratio updated to 16:9")
