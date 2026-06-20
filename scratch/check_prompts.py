import json
with open('d:/Tuan/phogotarot/content-plan/n8n-seo-content.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for node in data.get('nodes', []):
    if node['name'] in ['Outline Generator Agent', 'Chapter Writer Agent', 'Combine Chapters', 'Metadata & Prompt Generator']:
        with open('d:/Tuan/phogotarot/scratch/prompts_output.txt', 'a', encoding='utf-8') as out:
            out.write(f"--- {node['name']} ---\n")
            out.write(json.dumps(node.get('parameters', {}), indent=2, ensure_ascii=False) + '\n')
