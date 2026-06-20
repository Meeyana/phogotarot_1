import json

file_path = 'd:/Tuan/phogotarot/content-plan/n8n-seo-content.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for node in data.get('nodes', []):
    if node['name'] == 'Format Markdown Post':
        jscode = node['parameters']['jsCode']
        jscode = jscode.replace('const image = `/images/uploads/${slug}.png`;', 'const image = `https://phogotarot.com/images/uploads/${slug}.png`;')
        node['parameters']['jsCode'] = jscode
        break

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Updated Format Markdown Post to use absolute URL.")
