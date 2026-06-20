import json

file_path = r'd:\Tuan\phogotarot\content-plan\n8n-seo-content.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for node in data.get('nodes', []):
    if node['name'] == 'Generate Banner Image':
        node['parameters']['jsonBody'] = '''={
    "contents": [{
      "parts": [
        {"text": "{{ JSON.parse($json.choices[0].message.content).prompt }}"}
      ]
    }],
    "generationConfig": {
        "responseModalities": ["IMAGE"],
        "responseFormat": {
            "image": {
                "aspectRatio": "16:9"
            }
        }
    }
}'''
    elif node['name'] == 'Generate Inline Image':
        node['parameters']['jsonBody'] = '''={
    "contents": [{
      "parts": [
        {"text": "{{ $json.input_prompt }}"}
      ]
    }],
    "generationConfig": {
        "responseModalities": ["IMAGE"],
        "responseFormat": {
            "image": {
                "aspectRatio": "16:9"
            }
        }
    }
}'''

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Updated jsonBody for both image nodes.")
