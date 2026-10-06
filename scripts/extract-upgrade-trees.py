"""Extract only the Divine Inspiration and Sermons trees from the installed game.
Run with the UnityPy environment used by enrich-game-catalog.py. No save is written.
"""
import ast
import hashlib
import json
import re
import plistlib
import struct
from pathlib import Path
import UnityPy
import lz4.block

ROOT = Path(__file__).resolve().parents[1]
BASE = Path('/Applications/Cult Of The Lamb.app/Contents/Resources/Data')
BUNDLES = BASE / 'StreamingAssets/aa/StandaloneOSX'
# Reuse the directory reader without executing the catalog enrichment script.
source = ast.parse((ROOT / 'scripts/enrich-game-catalog.py').read_text())
function = next(n for n in source.body if isinstance(n, ast.FunctionDef) and n.name == 'bundle_index')
exec(compile(ast.Module(body=[function], type_ignores=[]), '<bundle_index>', 'exec'))
paths = {name: p for p in BUNDLES.glob('*.bundle') for name in bundle_index(p)}
env = UnityPy.Environment()
original_find = env.find_file

def find_dependency(name, *args, **kwargs):
    try:
        return original_find(name, *args, **kwargs)
    except FileNotFoundError:
        env.load_file(str(paths[name.lower()]))
        return original_find(name, *args, **kwargs)
env.find_file = find_dependency

def clean(text):
    text = re.sub(r'<s>.*?</s>', '', text, flags=re.S)
    return re.sub(r'<[^>]*>', '', re.sub(r'<br\s*/?>', ' ', text)).strip()

# The English and Brazilian Portuguese columns are those used by the other native catalogs.
env.load_file(str(BASE / 'resources.assets'))
languages = next(o for o in env.objects if o.type.name == 'MonoBehaviour'
                 and o.read(check_read=False).m_Name == 'I2Languages').get_raw_data()
def string(offset):
    length = struct.unpack_from('<i', languages, offset)[0]
    if not 0 <= length < 100000 or offset + 4 + length > len(languages):
        raise ValueError('Invalid localization string')
    return languages[offset+4:offset+4+length].decode('utf8'), (offset+4+length+3)//4*4
terms = {}
for offset in range(0, len(languages)-12, 4):
    try:
        key, end = string(offset)
        if not key.startswith(('UpgradeSystem/', 'Structures/')):
            continue
        kind, count = struct.unpack_from('<ii', languages, end)
        if kind != 0 or count != 21:
            continue
        end += 8
        translations = []
        for _ in range(count):
            value, end = string(end)
            translations.append(clean(value))
        terms[key] = translations
    except (ValueError, UnicodeDecodeError, struct.error):
        continue

b = (BASE / 'il2cpp_data/Metadata/global-metadata.dat').read_bytes()
assert struct.unpack_from('<II', b) == (0xFAB11BAF, 31)
s = struct.unpack_from('<I', b, 24)[0]
types = struct.unpack_from('<I', b, 160)[0]
fields = struct.unpack_from('<I', b, 96)[0]
defaults, size = struct.unpack_from('<II', b, 64)
values = struct.unpack_from('<I', b, 72)[0]
indices = {f: i for f, _, i in struct.iter_unpack('<iii', b[defaults:defaults+size]) if i >= 0}
def text(index):
    return b[s+index:b.index(0, s+index)].decode()
def integer(index):
    offset = values + index
    first = b[offset]
    if first < 128: v = first
    elif first < 192: v = ((first & 127) << 8) | b[offset+1]
    elif first < 224: v = ((first & 63) << 24) | int.from_bytes(b[offset+1:offset+4], 'big')
    elif first == 240: v = int.from_bytes(b[offset+1:offset+5], 'little')
    else: raise ValueError('Unexpected upgrade enum encoding')
    return -(v//2+1) if v & 1 else v//2
# Metadata type index is version-specific, so verify the enum shape before writing.
p = types + 5048*88
start = struct.unpack_from('<i', b, p+32)[0]
count = struct.unpack_from('<H', b, p+68)[0]
enum = {integer(indices[i]): text(struct.unpack_from('<I', b, fields+i*12)[0])
        for i in range(start, start+count) if i in indices}
assert enum[42] == 'Building_Temple' and enum[157] == 'PUpgrade_Heart_1'
structure_p = types + 4306*88
structure_start = struct.unpack_from('<i', b, structure_p+32)[0]
structure_count = struct.unpack_from('<H', b, structure_p+68)[0]
structures = {integer(indices[i]): text(struct.unpack_from('<I', b, fields+i*12)[0])
              for i in range(structure_start, structure_start+structure_count) if i in indices}
assert structures[100] == 'COMPOST_BIN' and structures[27] == 'SHRINE'
version = plistlib.loads((BASE.parents[1] / 'Info.plist').read_bytes())['CFBundleShortVersionString']
assert version == '1.4.12', 'Native function addresses must be refreshed for this game version'
# Decode the read-only ARM64 switch tables in GetStructureTypeFromUpgrade.
# This is the native association used by GetLocalizedDescription, not a guessed name match.
dylib = BASE.parents[1] / 'Frameworks/GameAssembly.dylib'
f = dylib.open('rb')
magic, architectures = struct.unpack('>II', f.read(8))
assert magic == 0xcafebabe
arm_base = None
for _ in range(architectures):
    cpu, _, offset, _, _ = struct.unpack('>IIIII', f.read(20))
    if cpu == 0x100000c: arm_base = offset
assert arm_base is not None
f.seek(arm_base)
header = f.read(32)
commands = struct.unpack_from('<I', header, 16)[0]
segments = []
for _ in range(commands):
    command, size = struct.unpack('<II', f.read(8))
    data = f.read(size-8)
    if command == 0x19:
        vmaddr, _, fileoff, filesize = struct.unpack_from('<QQQQ', data, 16)
        segments.append((vmaddr, fileoff, filesize))
def read_address(address, size):
    vmaddr, fileoff, _ = next(seg for seg in segments if seg[0] <= address < seg[0]+seg[2])
    f.seek(arm_base+fileoff+address-vmaddr)
    return f.read(size)
def structure_for(id):
    if 14 <= id <= 156:
        jump = read_address(0x5dbf788+id-14, 1)[0]
        instruction = int.from_bytes(read_address(0xa122c0+jump*4, 4), 'little')
        if instruction == 0xd65f03c0: return 100
        assert instruction & 0xffe0001f == 0x52800000, 'Unexpected native upgrade switch'
        return (instruction >> 5) & 0xffff
    if 210 <= id <= 213:
        return int.from_bytes(read_address(0x5dbfb80+(id-210)*4, 4), 'little')
    if id == 237: return 304
    if 238 <= id <= 284:
        return int.from_bytes(read_address(0x5dbfa50+(id-238)*4, 4), 'little')
    return 27
configs = {}
for pattern in ['userinterface_assets_userinterface_auto_5_*', 'userinterface_assets_userinterface_auto_14_*']:
    env.load_file(str(next(BUNDLES.glob(pattern))))
for o in list(env.objects):
    if o.type.name == 'MonoBehaviour' and o.path_id in [2628116960679460411, 4397170510328710975]:
        configs[o.path_id] = o.read_typetree()
nodes = {}
icon_mapping = None
for path in sorted(BUNDLES.glob('uiprefabs_assets*')):
    bundle = UnityPy.load(str(path))
    local = {}
    for o in bundle.objects:
        if o.type.name != 'MonoBehaviour': continue
        d = o.read_typetree()
        if '_upgrade' in d and '_nodeTier' in d: local[o.path_id] = (o, d)
    for _, (o, d) in local.items():
        config = d['_treeConfig']['m_PathID']
        if config not in configs: continue
        row = {'tier': d['_nodeTier'], 'parents': [local[r['m_PathID']][1]['_upgrade'] for r in d['_prerequisiteNodes']],
               'requiresUpgrade': d['requiresUpgrade']}
        key = (config, d['_upgrade'])
        assert key not in nodes or nodes[key] == row, 'Conflicting native tree nodes'
        nodes[key] = row
        if icon_mapping is None:
            external = o.assets_file.externals[d['_upgradeMapping']['m_FileID']-1].path.rsplit('/', 1)[-1].lower()
            env.load_file(str(paths[external]))
            icon_mapping = next(x for x in env.objects if x.path_id == d['_upgradeMapping']['m_PathID'])

mapping = icon_mapping.read_typetree()
# Fail clearly if the installed game changes the native icon-map schema.
from UnityPy.classes import PPtr
icons = {}
selected_ids = {id for config in configs.values() for id in config['_allUpgrades']}
for row in mapping['_upgradeImage']:
    id = row['_ugpradeType']
    if id not in selected_ids: continue
    sprite = PPtr(**row['_sprite'], assetsfile=icon_mapping.assets_file).read()
    target = ROOT / 'public/Upgrades' / f'{id}.png'
    target.parent.mkdir(parents=True, exist_ok=True)
    sprite.image.save(target)
    icons[id] = f'/Upgrades/{id}.png'
assert selected_ids <= icons.keys(), 'A native upgrade icon is missing'
output = {'source': {'gameVersion': version, 'metadataSha256': hashlib.sha256(b).hexdigest()}, 'trees': []}
translations = []
for config_id, key, name, tier_field in [
    (2628116960679460411, 'divine', 'Divine Inspiration', 'CurrentUpgradeTreeTier'),
    (4397170510328710975, 'sermons', 'Sermons', 'CurrentPlayerUpgradeTreeTier')]:
    config = configs[config_id]
    upgrades = []
    for id in config['_allUpgrades']:
        node = nodes[(config_id, id)]
        game_key = enum[id]
        labels = terms['UpgradeSystem/'+game_key+'/Name']
        descriptions = terms.get('UpgradeSystem/'+game_key+'/Description', ['']*21)
        if not descriptions[3] and key == 'divine':
            structure_key = structures[structure_for(id)]
            descriptions = terms.get('Structures/'+structure_key+'/Description', ['']*21)
        if game_key in ['Economy_Refinery', 'Economy_Refinery_2']:
            # Original localization lists these resources only as embedded sprite tags.
            descriptions = ['']*21
            descriptions[3] = 'Consecrate resources into wooden planks, stone blocks and gold bars.'
            descriptions[9] = 'Consagre recursos para obter tábuas de madeira, blocos de pedra e barras de ouro.'
        if not descriptions[3]:
            descriptions = ['']*21
            descriptions[3] = f'Unlocks {labels[3]}.'
            descriptions[9] = f'Desbloqueia {labels[9] or labels[3]}.'
        for values_row in [labels, descriptions]:
            if values_row[3]: translations.append([values_row[3], values_row[9] or values_row[3]])
        upgrades.append({'id': id, 'gameKey': game_key, 'name': labels[3], 'description': descriptions[3], 'image': icons[id], **node})
    output['trees'].append({'key': key, 'name': name, 'tierField': tier_field,
                           'tiers': config['_tierConfigurations'], 'upgrades': upgrades})
(ROOT / 'public/data/upgradeTrees.json').write_text(json.dumps(output, ensure_ascii=False, indent=2)+'\n')
(ROOT / 'locales/upgrades.json').write_text(json.dumps(translations, ensure_ascii=False, indent=2)+'\n')
print('Extracted trees:', [(x['name'], len(x['upgrades'])) for x in output['trees']])
