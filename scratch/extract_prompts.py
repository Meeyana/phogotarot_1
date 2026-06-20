import json

file_path = r'd:\Tuan\phogotarot\content-plan\n8n-seo-content.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

with open(r'd:\Tuan\phogotarot\scratch\prompts.txt', 'w', encoding='utf-8') as out:
    for n in data['nodes']:
        if n['name'] in ['Outline Generator Agent', 'Chapter Writer Agent', 'Validate & Normalize Input', 'Competitor Research Agent', 'Metadata & Prompt Generator']:
            out.write(f"--- {n['name']} ---\n")
            if 'parameters' in n:
                jsCode = n['parameters'].get('jsCode', '')
                text = n['parameters'].get('text', '')
                systemMessage = n['parameters'].get('systemMessage', '')
                options = n['parameters'].get('options', {})
                out.write((jsCode or text or systemMessage) + "\n")
                if 'systemMessage' in options:
                    out.write(options['systemMessage'] + "\n")
