"""Refresh factual catalog IDs from the locally installed Unity metadata (v31)."""
import gzip
import hashlib
import json
import plistlib
import re
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = Path('/Applications/Cult Of The Lamb.app/Contents')
DATA = ROOT / 'public/data'
metadata = APP / 'Resources/Data/il2cpp_data/Metadata/global-metadata.dat'
b = metadata.read_bytes()
assert struct.unpack_from('<II', b) == (0xFAB11BAF, 31), 'Unsupported Unity metadata schema; catalogs were not changed'

def pair(index):
    return struct.unpack_from('<II', b, 8 + index * 8)

strings, _ = pair(2)
types, type_bytes = pair(19)
fields, _ = pair(11)
defaults, default_bytes = pair(7)
values, _ = pair(8)
assert type_bytes % 88 == 0

def text(index):
    return b[strings + index:b.index(0, strings + index)].decode('utf-8')

def integer(offset):
    first = b[offset]
    if first < 128:
        v = first
    elif first < 192:
        v = ((first & 127) << 8) | b[offset + 1]
    elif first < 224:
        v = ((first & 63) << 24) | int.from_bytes(b[offset + 1:offset + 4], 'big')
    elif first == 240:
        v = int.from_bytes(b[offset + 1:offset + 5], 'little')
    elif first >= 254:
        v = 0xFFFFFFFE + (first == 255)
    else:
        raise ValueError('Unsupported enum integer encoding')
    return -(v // 2 + 1) if v & 1 else v // 2

default_indices = {f: i for f, _, i in struct.iter_unpack('<iii', b[defaults:defaults + default_bytes]) if i >= 0}
catalog = {}
targets = {'TraitType', 'FollowerOutfitType', 'FollowerClothingType', 'FleeceType', 'Card', 'ITEM_TYPE'}
for offset in range(types, types + type_bytes, 88):
    name = text(struct.unpack_from('<I', b, offset)[0])
    count = struct.unpack_from('<H', b, offset + 68)[0]
    if name not in targets or not struct.unpack_from('<I', b, offset + 80)[0] & 2:
        continue
    if name == 'ITEM_TYPE' and count < 100:
        continue
    start = struct.unpack_from('<i', b, offset + 32)[0]
    entries = {}
    for field in range(start, start + count):
        if field in default_indices:
            entries[text(struct.unpack_from('<I', b, fields + field * 12)[0])] = integer(values + default_indices[field])
    catalog[name] = entries
assert set(catalog) == targets

def label(key):
    return re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', key).replace('_', ' ').strip().title()

def read(name):
    return json.loads((DATA / (name + '.json')).read_text())

def write(name, data):
    (DATA / (name + '.json')).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

def refresh(name, enum, extra=None):
    previous = {row['id']: row for row in read(name)} if (DATA / (name + '.json')).exists() else {}
    rows = []
    for key, identifier in catalog[enum].items():
        row = dict(previous.get(identifier, {'id': identifier, 'name': label(key)}))
        row['gameKey'] = key
        if extra and identifier not in previous:
            row.update(extra(key, identifier))
        rows.append(row)
    write(name, rows)
    return len(rows)

def image(folder, identifier):
    return f'/{folder}/{identifier}.png' if (ROOT / f'public/{folder}/{identifier}.png').exists() else ''

counts = {}
counts['traits'] = refresh('followerTrait', 'TraitType', lambda k, i: {
    'image': image('Traits', i), 'effect': 'Neutral',
    'description': f'Nome interno confirmado no jogo: {k}. Efeito ainda não descrito no catálogo.'
})
counts['outfits'] = refresh('followerOutfit', 'FollowerOutfitType')
counts['clothing'] = refresh('followerClothing', 'FollowerClothingType')
counts['fleeces'] = refresh('fleeces', 'FleeceType')
counts['tarot'] = refresh('tarotCard', 'Card', lambda k, i: {
    'image': image('Tarot_Cards', i), 'effect': f'Nome interno: {k}', 'effect_1': '—', 'effect_2': '—'
})

groups = read('itemData')
ids = {item['id'] for group in groups for item in group['items']}
extra = []
for key, identifier in catalog['ITEM_TYPE'].items():
    if identifier not in ids:
        extra.append({'id': identifier, 'gameKey': key, 'name': label(key), 'image': image('Items', identifier)})
if extra:
    groups.append({'name': 'Additional IDs from installed game', 'items': extra})
write('itemData', groups)
counts['items'] = sum(len(group['items']) for group in groups)
necklaces = {row['id']: row for row in read('necklaces')}
for key, identifier in catalog['ITEM_TYPE'].items():
    if 'NECKLACE' in key:
        necklaces.setdefault(identifier, {'id': identifier, 'name': label(key)})
write('necklaces', list(necklaces.values()))
counts['necklaces'] = len(necklaces)

# Only fill skin/variant mappings witnessed unambiguously in the actual save.
save_path = Path.home() / 'Library/Containers/com.devolverdigital.cultofthelamb/Data/Library/Application Support/com.devolverdigital.cultofthelamb/user/slot_0'
save = json.loads(gzip.decompress(save_path.read_bytes()[2:]))
observed = {}
for follower in save.get('Followers', []) + save.get('Followers_Dead', []) + save.get('Followers_Recruit', []):
    observed.setdefault((follower['SkinCharacter'], follower['SkinVariation']), set()).add(follower['SkinName'])
skins = read('followerSkin')
for (skin, variant), names in observed.items():
    while len(skins) <= skin:
        skins.append({'name': f'Skin ID {len(skins)}', 'variant': []})
    if len(names) != 1:
        continue
    name = next(iter(names))
    while len(skins[skin]['variant']) <= variant:
        skins[skin]['variant'].append('')
    current = skins[skin]['variant'][variant]
    if not current or current.startswith('Unknown Skin'):
        skins[skin]['variant'][variant] = name
    if skins[skin]['name'].startswith(('Unknown Skin', 'Skin ID')):
        skins[skin]['name'] = name
write('followerSkin', skins)
version = plistlib.loads((APP / 'Info.plist').read_bytes())['CFBundleShortVersionString']
write('installedCatalog', {
    'gameVersion': version, 'metadataVersion': 31,
    'metadataSha256': hashlib.sha256(b).hexdigest(),
    'source': 'Enums from installed game metadata; existing descriptions retained. New labels use internal enum names.',
    'counts': counts, 'enums': catalog,
})
print(json.dumps({'gameVersion': version, 'counts': counts}))
