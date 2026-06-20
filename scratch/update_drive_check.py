import json

file_path = r'd:\Tuan\phogotarot\content-plan\n8n-seo-content.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# The new Drive node
new_drive_node = {
    "parameters": {
    "resource": "fileFolder",
    "queryString": "phogotarot",
    "filter": {},
    "options": {}
    },
    "type": "n8n-nodes-base.googleDrive",
    "typeVersion": 3,
    "position": [
    12750,
    5792
    ],
    "id": "check-drive-connection-id",
    "name": "Check Google Drive Connection",
    "credentials": {
    "googleDriveOAuth2Api": {
        "id": "gF2WBBgtcNehfPZM",
        "name": "Google Drive account 2"
    }
    },
    "alwaysOutputData": True
}

# The Code node to verify
verify_node = {
    "parameters": {
    "jsCode": "if (items.length === 0 || !items[0].json || !items[0].json.id) {\n  throw new Error(\"Lỗi: Không tìm thấy thư mục 'phogotarot' trên Google Drive hoặc kết nối thất bại!\");\n}\nreturn items;"
    },
    "type": "n8n-nodes-base.code",
    "typeVersion": 2,
    "position": [
    12950,
    5792
    ],
    "id": "verify-pre-flight-checks-id",
    "name": "Verify Pre-flight Checks"
}

# Replace Drive node
for i, node in enumerate(data['nodes']):
    if node['name'] == 'Check Google Drive Connection':
        data['nodes'][i] = new_drive_node
        break

# Add Verify node
data['nodes'].append(verify_node)

# Update connections
original_dests = data['connections']['Check Google Drive Connection']['main'][0]

# Route Drive -> Verify
data['connections']['Check Google Drive Connection'] = {
    "main": [
        [
            {
                "node": "Verify Pre-flight Checks",
                "type": "main",
                "index": 0
            }
        ]
    ]
}

# Route Verify -> original destinations
data['connections']['Verify Pre-flight Checks'] = {
    "main": [
        original_dests
    ]
}

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Updated Drive node and added Verify node successfully.")
