"""Extract original Spine follower assets for local previews. Requires UnityPy."""
import json
import re
from pathlib import Path
import UnityPy

base = Path('/Applications/Cult Of The Lamb.app/Contents/Resources/Data')
env = UnityPy.Environment(str(base/'resources.assets'), str(base/'resources.assets.resS'))
for obj in env.objects:
    if obj.type.name == 'TextAsset':
        data = obj.read()
        if data.m_Name in ['Follower.skel', 'Follower.atlas']:
            (Path('/private/tmp')/('cotl-'+data.m_Name)).write_bytes(data.m_Script.encode('utf8', 'surrogateescape'))
texture = next(o.read() for o in env.objects if o.type.name == 'Texture2D' and o.read().m_Name == 'Follower')
texture.image.save('/private/tmp/cotl-Follower.png')
regions = {}
text = Path('/private/tmp/cotl-Follower.atlas').read_text()
for block in re.finditer(r'^([^\s][^\n]+)\n((?:  [^\n]+\n)+)', text, re.M):
    regions[block[1]] = dict(line.strip().split(': ', 1) for line in block[2].splitlines())
Path('/private/tmp/cotl-follower-regions.json').write_text(json.dumps(regions))
print(f'Extracted {len(regions)} original follower regions.')
