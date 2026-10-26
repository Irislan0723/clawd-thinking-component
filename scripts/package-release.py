"""Only files recorded in release-files.json are permitted into the public zip."""
from pathlib import Path
import hashlib, json, zipfile

root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/'release-files.json').read_text(encoding='utf-8'))
paths=manifest['files']
assert len(paths)==len(set(paths)), 'Duplicate release path'
for name in paths:
    path=(root/name).resolve()
    assert root.resolve() in path.parents and path.is_file(), name
    assert 'private-assets' not in path.parts and '.git' not in path.parts, name
    assert not path.name.startswith('.env'), name
    assert hashlib.sha256(path.read_bytes()).hexdigest()==manifest['sha256'][name], 'File changed; review and update release manifest: '+name
archive=root.parent/'clawd-thinking-component-0.1.0.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for name in paths:z.write(root/name,'clawd-thinking-component/'+name)
    z.write(root/'release-files.json','clawd-thinking-component/release-files.json')
with zipfile.ZipFile(archive) as z:assert z.testzip() is None
print('Created',archive)
print('Files:',len(paths)+1,'Bytes:',archive.stat().st_size)
