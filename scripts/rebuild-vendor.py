"""Rebuild the patched standalone dependency without installing a JS toolchain."""
from pathlib import Path
import json, hashlib

root=Path(__file__).resolve().parent.parent
patch=json.loads((root/'scripts/vendor-patches.json').read_text(encoding='utf-8'))
source=root/'vendor/upstream/thinking-effort.js'
assert hashlib.sha256(source.read_bytes()).hexdigest()==patch['upstreamSha256'], 'Upstream source changed'
text=source.read_text(encoding='utf-8')
for old,new in patch['replacements']:
    assert text.count(old)==1, 'Patch anchor changed: '+old[:80]
    text=text.replace(old,new)
result=text.encode('utf-8')
assert hashlib.sha256(result).hexdigest()==patch['runtimeSha256'], 'Unexpected runtime output'
(root/'vendor/creative-components/thinking-effort.js').write_bytes(result)
print('PASS: exact runtime rebuilt from pinned upstream source')
