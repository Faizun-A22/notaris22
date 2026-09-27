import os
import re

# This regex matches the content of className attributes, both "..." and {...}
pattern_attr = re.compile(r'className=\"([^\"]+)\"')
pattern_expr = re.compile(r'className=\{`([^`]+)`\}')

def find_duplicates(m, path, source):
    # Standardize spaces
    text = m.replace('\n', ' ').replace('\r', ' ')
    classes = text.split()
    border_count = classes.count('border')
    if border_count > 1:
        print(f'FILE: {path}')
        print(f'SOURCE: {source}')
        print(f'CLASSNAME: {m}')
        print('---')

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx'):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                    # Check className="..."
                    matches = pattern_attr.findall(content)
                    for m in matches:
                        find_duplicates(m, path, 'Attr')
                            
                    # Check className={`...`}
                    matches = pattern_expr.findall(content)
                    for m in matches:
                        find_duplicates(m, path, 'Expr')
            except Exception as e:
                pass
