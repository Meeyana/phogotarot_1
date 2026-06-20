import json

file_path = 'd:/Tuan/phogotarot/content-plan/n8n-seo-content.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Update Merge node
for node in data.get('nodes', []):
    if node['name'] == 'Merge':
        node['parameters']['numberInputs'] = 4
    elif node['name'] == 'Upload Banner Image to GitHub':
        node['parameters']['filePath'] = "=src/assets/uploads/{{ JSON.parse($('Metadata & Prompt Generator').item.json.choices[0].message.content).slug }}.png"
    elif node['name'] == 'Format Markdown Post':
        jscode = node['parameters']['jsCode']
        jscode = jscode.replace('https://phogotarot.com/images/uploads/', '../../assets/uploads/')
        node['parameters']['jsCode'] = jscode

# 2. Update connections
if 'Upload Banner Image to GitHub' not in data['connections']:
    data['connections']['Upload Banner Image to GitHub'] = {
        'main': [
            []
        ]
    }

# n8n connections format:
# "NodeName": { "main": [ [ { "node": "TargetNode", "type": "main", "index": 0 } ] ] }
# We need to make sure 'main' has a first element which is an array of targets.
if len(data['connections']['Upload Banner Image to GitHub']['main']) == 0:
    data['connections']['Upload Banner Image to GitHub']['main'].append([])

data['connections']['Upload Banner Image to GitHub']['main'][0] = [
    {
        "node": "Merge",
        "type": "main",
        "index": 3
    }
]

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Successfully updated n8n JSON to sequence GitHub uploads.")
