import json
import re

tenant_raw = """
A-202 | Mr. Atul Modi | 9821023697
A-301 | Mr. Hemant Kumar Rawat | 9167006403
A-302 | Mr. Balasankula Uday Bhaskar Rao | 9819412560
A-303 | Rahul Choudhry | 9819412560
A-402 | Mr. Deepika Tukaram Dudhe | 9769948692
A-403 | Mr. Siddharth Gupta | 9769989972
A-502 | Jaydeep Bithare | 9004413925
A-801 | Chandra Praksh | 9804939192
A-1102 | Sibabrata Choudhury | 9967870138
A-1201 | Mr. Shylesh Sivadasan | 9871978883
A-1302 | Capt. Shailesh Awasthi | 9768011109
A-1403 | Mr. Denesam Gunasekaran | 8891427205
A-1501 | Aditya Jha | 9867375983
A-1503 | Gelabikumar Harikrishrbhai Modi | 9004389112
A-1701 | Subhendu Sekher Manna | 9022799600
A-1703 | Sibprasad Ray | 9969220182

B-301 | Mr. Manoj Sharma | 7045489778
B-302 | Manish Gupta | 7045489778
B-501 | Mr. Ateet Wagh | 7715935590 / 7227953287
B-701 | Puthucode Gopalkrishnan | 9320201242
B-801 | Dr. Rajendra Khade | 9819415427
B-1002 | Mr. Vinod Ninnd Tembulkar | 9969227625
B-1202 | Satinder Singh | 9969226521
B-1301 | Sunil Kothari | 9821193517
B-1501 | Mr. Ankur Garg | 996922120
B-1702 | Mr. Arjun Narayan Kadam | 9969233506
B-1802 | Mrs. Saugata Sukumar Biswas | 9426614242

C-202 | Umesh Kumar Panday | 9579714477
C-402 | Mrs. Vidya Amrut Mety | 9892014873 / 9820002559
C-601 | Mr. Laxman Devaji Vaviya | 9372790056
C-702 | Mr. Sailesh Patel | 9969229171
C-1001 | Mrs. Devayani Nitin Phadke | 9820059254
C-1302 | Mr. Bharadawad Masikar | 9321240962 / 9560446188
C-1502 | Alpa Srivastava | 8591422976
C-1602 | Mr. Omkar Jhadhav | 9820455541
C-1702 | Mr. Garai Suman | 9833654655
C-1801 | Mr. Pramod Agrawal | 9820094710

D-202 | Komal C. Patel | 9819194395
D-301 | Dr. Swati Mane | 9969227621
D-401 | Mr. Ravi Gupta | 7042191478
D-402 | Mr. Vijay Anand & Mrs. Shanu Sinha | 8802999322
D-802 | Anoop V. Gopinathan | 9820624165
D-1102 | Mr. Gaurav Choudhary | 9819878143
D-1202 | Mr. Tushar Srivastava | 9167542327
D-1602 | Mrs. Sanjana Deb Guha | 99692239634
D-1801 | Mr. Ravi Kant | 9892860469

E-201 | (Vacant) | 9820648998
E-202 | Dilip Lalji Bhai Vaviya | 9869795158
E-401 | Yogesh Patnakr | 9818690824
E-402 | Gaurav Jain | 9969224179
E-501 | Himanshu Das | 9821041796
E-602 | Mr. Rajindra Bhadana | 9967088854
E-1201 | Mr. Manoj Govind Barvadiya | 9969228955
E-1202 | Mr. Pallavi Pandey | 9969220266
E-1402 | Henmant G Dudle | 9869282332
E-1502 | Mr. Manish S Chaudhari | 9833690268
E-1602 | Vijaya Laxmi O P Naidu | 9820211670

F-201 | Rishikesh .D Malkhede | 9892501550
F-301 | Mr. Abhishek Kumar | 9833886624
F-403 | Saurav Gupta | 7045846563
F-503 | Mr. Abhinandan Kumar | 9410390947 / 9022612344
F-601 | Mrs. Varshney Divya | 8971775163
F-702 | Mr. Animesh Gayen | 9967437740
F-703 | Ganapatrao L. Pawar | 9967145474 / 8108791874
F-1002 | Pratik Kharpuriya | 7652088368
F-1101 | Naresh Kumar | 9769412577
F-1102 | Suraj Uniyal | 9820196030
F-1103 | Mr. Shriyan Namrata | 9869054250
F-1201 | Shilpa Niraj Varma | 9820418244
F-1203 | Mrs. Minal V. Tulsian | 9969224368
F-1301 | Ashish Debath | 9820757840
F-1303 | Ranjit Gogoi | 9820233087
F-1401 | Mr. Amit Hemraj Bhanushali | 9999649900
F-1501 | Mr. Panigrahy Saroj Kumar | 9819878143
F-1603 | Mr. Aveg Srivastava | (Contact Not Found in list)
F-1703 | Mrs. Aparna Dinak | (Contact Not Found in list)
"""

tenants = {}
for line in tenant_raw.strip().split('\n'):
    if '|' in line:
        parts = [p.strip() for p in line.split('|')]
        if len(parts) >= 2:
            flat_id = parts[0].replace('-', '')
            name = parts[1]
            phone = parts[2] if len(parts) > 2 else ""
            
            if "(Vacant)" in name:
                continue
                
            tenants[flat_id] = {
                "tenantName": name,
                "tenantPhone": phone
            }

# Read lib/auth.ts
with open('lib/auth.ts', 'r') as f:
    lines = f.readlines()

new_lines = []
in_mock_users = False
for line in lines:
    if 'const MOCK_USERS: Use' in line:
        in_mock_users = True
        new_lines.append(line)
        continue
    
    if in_mock_users:
        if '];' in line:
            in_mock_users = False
            new_lines.append(line)
            continue
            
        # Try to find user entry
        match = re.search(r'"flat": "([A-F][0-9]{3,4})"', line)
        if match:
            flat_id = match.group(1)
            if flat_id in tenants:
                # We found a user that has a tenant.
                # We need to add tenantName and tenantPhone to the object.
                # This is tricky with regex/lines. Let's do it properly by parsing JSON if possible.
                pass

# Let's use a better approach: extract the whole MOCK_USERS array, parse it, update it, and write it back.

content = "".join(lines)
start_marker = 'const MOCK_USERS: UserWithPassword[] = ['
end_marker = '];'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    array_str = content[start_idx + len(start_marker) - 1 : end_idx + 1]
    # array_str is now like "[ ... ]"
    # Note: JSON parser might fail due to trailing commas or single quotes.
    # But Next.js/TS might use double quotes.
    
    import json
    try:
        # Pre-process array_str for json.loads (standardize quotes)
        # This is risky. Let's try to just use a regex to replace objects.
        pass
    except:
        pass

# Actually, let's just use the same approach as before: parse the whole file, update the MOCK_USERS part in Python, and write back.

# Revised script logic:
# 1. Extract the JSON part of MOCK_USERS.
# 2. Iterate through objects, adding tenantName/tenantPhone if flat matches.
# 3. Re-serialize and insert.

def update_mock_users():
    with open('lib/auth.ts', 'r') as f:
        content = f.read()

    start_marker = 'const MOCK_USERS: UserWithPassword[] = ['
    end_marker = '];'
    
    start_pos = content.find(start_marker) + len(start_marker) - 1
    end_pos = content.find(end_marker, start_pos) + 1
    
    users_json_str = content[start_pos:end_pos]
    
    # Standardize JSON for parsing
    # Handle common JS-isms that break JSON.loads
    # Remove trailing commas
    users_json_str = re.sub(r',\s*]', ']', users_json_str)
    users_json_str = re.sub(r',\s*}', '}', users_json_str)
    
    try:
        users = json.loads(users_json_str)
        for user in users:
            flat = user.get('flat', '').replace('-', '')
            if flat in tenants:
                user['tenantName'] = tenants[flat]['tenantName']
                user['tenantPhone'] = tenants[flat]['tenantPhone']
        
        new_json_str = json.dumps(users, indent=2)
        # Indent it to match the file
        indented_json = "\n  ".join(new_json_str.split('\n'))
        
        # Next.js might want the ]; on a new line
        final_content = content[:start_pos] + new_json_str + content[end_pos:]
        
        with open('lib/auth.ts', 'w') as f:
            f.write(final_content)
        print("Successfully updated lib/auth.ts")
    except Exception as e:
        print(f"Error: {e}")

update_mock_users()
