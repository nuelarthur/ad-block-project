import os
import json
from urllib.parse import quote

def parse_easylist_line(line):
    if line.startswith('!') or line.strip() == '':
        return None
    rule = {
        "id": None,  # ID to be assigned later
        "priority": 1,
        "action": {
            "type": "block"
        },
        "condition": {
            "urlFilter": "",
            "resourceTypes": ["main_frame", "sub_frame", "script", "xmlhttprequest", "image", "stylesheet", "object", "other"]
        }
    }
    url_pattern = line.split('$')[0].strip()
    if '*' in url_pattern or '^' in url_pattern or '|' in url_pattern:
        url_pattern = url_pattern.replace('^', '*').replace('||', '*://*.')
    else:
        url_pattern = '*' + url_pattern + '*'
    url_pattern = quote(url_pattern)
    rule['condition']['urlFilter'] = url_pattern
    return rule

def parse_hosts_line(line):
    parts = line.split()
    if len(parts) < 2 or not parts[1].strip():
        return None
    domain = parts[1].strip()
    return {
        "id": None,  # ID to be assigned later
        "priority": 1,
        "action": {
            "type": "block"
        },
        "condition": {
            "urlFilter": f"*://{domain}/*",
            "resourceTypes": ["main_frame", "sub_frame", "script", "xmlhttprequest", "image", "stylesheet", "object", "other"]
        }
    }

def process_file(file_path):
    rules = []
    with open(file_path, 'r', encoding='utf-8') as file:
        for idx, line in enumerate(file):
            if '0.0.0.0' in line:  # this pattern for hosts files
                rule = parse_hosts_line(line)
            else:
                rule = parse_easylist_line(line)
            if rule is not None:
                rule['id'] = idx + 1  # Assign a unique ID to each rule
                rules.append(rule)
    return rules

def write_rules(rules, filename):
    with open(filename, 'w', encoding='utf-8') as out_file:
        json.dump(rules, out_file, indent=4)

def split_rules(rules, max_rules_per_file):
    num_files = (len(rules) - 1) // max_rules_per_file + 1
    split_rules = [rules[i * max_rules_per_file:(i + 1) * max_rules_per_file] for i in range(num_files)]
    return split_rules


def main():
    max_rules_per_file = 70000
    adblock_folder = 'adblock'
    rules_folder = 'rules'
    if not os.path.exists(rules_folder):
        os.mkdir(rules_folder)

    for filename in os.listdir(adblock_folder):
        if filename.endswith('.txt'):
            file_path = os.path.join(adblock_folder, filename)
            rules = process_file(file_path)
            split_rules_list = split_rules(rules, max_rules_per_file)
            for i, rules_subset in enumerate(split_rules_list):
                rules_filename = f"{filename.replace('.txt', '')}_{i + 1}_rules.json"
                output_path = os.path.join(rules_folder, rules_filename)
                write_rules(rules_subset, output_path)
                print(f"Processed {filename} into {output_path}")

            # rules_filename = filename.replace('.txt', '_rules.json')
            # output_path = os.path.join(rules_folder, rules_filename)
            # with open(output_path, 'w', encoding='utf-8') as out_file:
            #     json.dump(rules, out_file, indent=4)
            # print(f"Processed {filename} into {output_path}")

if __name__ == "__main__":
    main()





# import json
# from urllib.parse import quote

# def parse_easylist_line(line):
#     # Ignore comments and metadata
#     if line.startswith('!') or line.strip() == '':
#         return None

#     # Initialize rule structure
#     rule = {
#         "id": None,  # ID to be assigned later
#         "priority": 1,
#         "action": {
#             "type": "block"
#         },
#         "condition": {
#             "urlFilter": "",
#             "resourceTypes": ["main_frame", "sub_frame", "script", "xmlhttprequest", "image", "stylesheet", "object", "other"]
#         }
#     }

#     # Extract URL pattern, ignore options for simplicity
#     url_pattern = line.split('$')[0].strip()
#     if '*' in url_pattern or '^' in url_pattern or '|' in url_pattern:
#         # Convert Adblock Plus wildcards to Chrome compatible ones
#         url_pattern = url_pattern.replace('^', '*').replace('||', '*://*.')
#     else:
#         url_pattern = '*' + url_pattern + '*'

#      # Normalize URL filter to ASCII characters
#     url_pattern = quote(url_pattern)

#     rule['condition']['urlFilter'] = url_pattern

#     return rule

# def main():
#     rules = []
#     with open('easylist.txt', 'r', encoding='utf-8') as file:
#         for idx, line in enumerate(file):
#             rule = parse_easylist_line(line)
#             if rule is not None:
#                 rule['id'] = idx + 1  # Assign a unique ID to each rule
#                 rules.append(rule)

#     with open('rules.json', 'w', encoding='utf-8') as out_file:
#         json.dump(rules, out_file, indent=4)

# if __name__ == "__main__":
#     main()
