import json

file_path = r'd:\Tuan\phogotarot\content-plan\n8n-seo-content.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for node in data.get('nodes', []):
    if node['name'] == 'Validate & Normalize Input':
        old_code = node['parameters']['jsCode']
        new_code = old_code.replace(
            'const input = $input.first().json.body;',
            'const triggerData = $(\'Trigger Input\').first().json;\nconst input = triggerData.body || triggerData;'
        )
        node['parameters']['jsCode'] = new_code
        break

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Updated Validate & Normalize Input node code.")
