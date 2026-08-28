
import sys
filename = sys.argv[1]
with open(filename, 'r', encoding='utf-8') as f:
    lines = f.readlines()
new_lines = lines[:952] + lines[1147:]
with open(filename, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

