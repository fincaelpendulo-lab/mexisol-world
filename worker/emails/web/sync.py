# Rebuilds the website-workflow emails and uploads the ones that changed to GoHighLevel.
# The workflow email actions have "Sync Edits to Template" on, so the workflows pick up
# the new version on their own.
# Run: python3 worker/emails/web/sync.py           (check only: what changed, broken images or links)
#      python3 worker/emails/web/sync.py --push    (upload the changed templates)
# The GHL token is read from the GHL MCP server entry in ~/.claude.json and never printed.
import hashlib, json, os, re, subprocess, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, 'ghl-templates.json')
USER_ID = 'J26LjnY3aQuHmGdhvz6G'  # "Finca El Péndulo" user, shown as the last editor in GHL

def ghl_config():
    return json.load(open(os.path.expanduser('~/.claude.json')))['mcpServers']['ghl']['headers']

def ghl(method, path, body=None):
    cfg = ghl_config()
    req = urllib.request.Request('https://services.leadconnectorhq.com' + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={'Authorization': cfg['Authorization'], 'Version': '2021-07-28', 'Content-Type': 'application/json',
                 'Accept': 'application/json', 'User-Agent': 'mexisol-email-sync'})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read() or b'{}')

def reachable(url):
    try:
        req = urllib.request.Request(url, method='HEAD', headers={'User-Agent': 'mexisol-email-sync'})
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status < 400
    except Exception:
        return False

subprocess.run([sys.executable, os.path.join(HERE, 'build.py')], check=True, stdout=subprocess.DEVNULL)
state = json.load(open(STATE))
subjects = json.load(open(os.path.join(HERE, 'subjects.json')))
push = '--push' in sys.argv
problems, changed = [], []

for name, t in state.items():
    html = open(os.path.join(HERE, name + '.html')).read()
    for url in sorted(set(re.findall(r'(?:src|href)="(https://mexisol\.world[^"]*)"', html))):
        if not reachable(url):
            problems.append(f'{name}: {url} does not load')
    if t.get('subject') and t['subject'] != subjects[name]:
        problems.append(f'{name}: subject is now "{subjects[name]}". Change it by hand in the workflow email action (GHL keeps the subject there)')
    digest = hashlib.sha256(html.encode()).hexdigest()
    if digest != t.get('sha256'):
        changed.append((name, html, digest))

print('Changed:', ', '.join(n for n, _, _ in changed) or 'nothing')
for p in problems:
    print('PROBLEM:', p)
if push and changed:
    if any('does not load' in p for p in problems):
        sys.exit('Not pushed: fix the broken images or links first.')
    LOCATION = ghl_config()['locationId']
    for name, html, digest in changed:
        ghl('POST', '/emails/builder/data', {'locationId': LOCATION, 'templateId': state[name]['id'], 'updatedBy': USER_ID,
            'html': html, 'editorType': 'html', 'dnd': {'elements': [], 'attrs': {}, 'templateSettings': {}}})
        state[name]['sha256'] = digest
        state[name]['subject'] = subjects[name]
        print('Pushed', name, '->', state[name]['ghl_name'])
    open(STATE, 'w').write(json.dumps(state, indent=1, ensure_ascii=False) + '\n')
elif changed and not push:
    print('Run with --push to upload.')
