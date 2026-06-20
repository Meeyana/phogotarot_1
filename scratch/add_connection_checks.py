import json

file_path = r'd:\Tuan\phogotarot\content-plan\n8n-seo-content.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Define the two new nodes
check_github = {
    "parameters": {
    "resource": "repository",
    "operation": "get",
    "owner": {
        "__rl": True,
        "value": "Meeyana",
        "mode": "name"
    },
    "repository": {
        "__rl": True,
        "value": "phogotarot_1",
        "mode": "list"
    }
    },
    "type": "n8n-nodes-base.github",
    "typeVersion": 1,
    "position": [
    12550,
    5792
    ],
    "id": "check-github-connection-id",
    "name": "Check GitHub Connection",
    "credentials": {
    "githubApi": {
        "id": "42caaWujl9sIRVV2",
        "name": "GitHub account"
    }
    },
    "continueOnFail": False
}

check_drive = {
    "parameters": {
    "operation": "list",
    "options": {
        "fields": [
        "id",
        "name"
        ],
        "limit": 1
    }
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
    "continueOnFail": False
}

# Add nodes
data['nodes'].append(check_github)
data['nodes'].append(check_drive)

# Update connections
if 'Trigger Input' in data['connections']:
    # Get the original destination
    original_dests = data['connections']['Trigger Input']['main'][0]
    
    # Reroute Trigger Input to Check GitHub
    data['connections']['Trigger Input']['main'][0] = [
        {
            "node": "Check GitHub Connection",
            "type": "main",
            "index": 0
        }
    ]
    
    # Route Check GitHub to Check Drive
    data['connections']['Check GitHub Connection'] = {
        "main": [
            [
                {
                    "node": "Check Google Drive Connection",
                    "type": "main",
                    "index": 0
                }
            ]
        ]
    }
    
    # Route Check Drive to original destinations (Validate & Normalize Input)
    data['connections']['Check Google Drive Connection'] = {
        "main": [
            original_dests
        ]
    }

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Added pre-flight connection checks successfully.")
