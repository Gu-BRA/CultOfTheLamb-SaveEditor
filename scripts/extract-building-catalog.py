"""Extract the native construction menu and its save unlock conditions (game 1.4.12).
Read-only: never writes an installed save. Requires the local UnityPy/capstone environment.
"""
import json
import re
from pathlib import Path
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_ARM
# Share the validated metadata reader and native binary switch reader.
source = Path(__file__).with_name('extract-upgrade-trees.py')
exec(source.read_text().split('configs = {}')[0])
cs = Cs(CS_ARCH_ARM64, CS_MODE_ARM)
# AllStructures is assigned at 0x172b828; the next list is HiddenStructuresUntilUnlocked.
ids = []
for instruction in cs.disasm(read_address(0x1725cac, 0x5b7c), 0x1725cac):
    if instruction.mnemonic == 'mov' and instruction.op_str.startswith('w1, #'):
        ids.append(int(instruction.op_str.split('#')[1], 0))
ids = list(dict.fromkeys(ids))
assert len(ids) > 200 and ids[:3] == [2, 71, 137]
print('Native menu entries:', len(ids))
code = {i.address: i for i in cs.disasm(read_address(0x171e1bc, 0x10bc), 0x171e1bc)}
def unlock_condition(id):
    # Interpret only the dispatch arithmetic, never execute code from the game.
    regs = {19: id}
    pc = 0x171e26c
    comparison = (0, 0)
    def value(token):
        if token.startswith('#'): return int(token[1:], 0)
        return regs.get(int(token[1:]), 0)
    def assign(token, number):
        regs[int(token[1:])] = number & (0xffffffff if token.startswith('w') else 0xffffffffffffffff)
    for _ in range(100):
        if pc == 0x171f228: return {'kind': 'structure'}
        if pc == 0x171e388: return {'kind': 'flag', 'field': 'BuildShrineEnabled'}
        i = code[pc]
        if i.mnemonic == 'adrp' and i.op_str == 'x8, #0x6d22000':
            for address in range(pc, pc+80, 4):
                next_i = code[address]
                if next_i.mnemonic == 'mov' and next_i.op_str.startswith('w0, #'):
                    return {'kind': 'upgrade', 'id': int(next_i.op_str.split('#')[1], 0)}
            raise ValueError('Unexpected upgrade condition')
        args = i.op_str.split(', ')
        op = i.mnemonic
        target = pc + 4
        if op in ['cmp', 'tst']:
            a, b = value(args[0]), value(args[1])
            comparison = (a, b) if op == 'cmp' else (a & b, 0)
        elif op.startswith('b.'):
            a, b = comparison
            signed_a = a if a < 0x80000000 else a-0x100000000
            signed_b = b if b < 0x80000000 else b-0x100000000
            conditions = {'eq': a == b, 'ne': a != b, 'le': signed_a <= signed_b,
                          'gt': signed_a > signed_b, 'ls': a <= b, 'hi': a > b, 'hs': a >= b}
            if conditions[op[2:]]: target = value(args[0])
        elif op == 'b': target = value(args[0])
        elif op in ['adrp', 'adr', 'mov']: assign(args[0], value(args[1]))
        elif op in ['sub', 'and', 'lsl', 'add']:
            a, b = value(args[1]), value(args[2])
            if len(args) > 3: b <<= int(args[3].split('#')[1], 0)
            assign(args[0], {'sub': lambda: a-b, 'and': lambda: a & b,
                             'lsl': lambda: a << b, 'add': lambda: a+b}[op]())
        elif op == 'ldrh':
            match = re.fullmatch(r'(w\d+), \[(x\d+), (x\d+), lsl #1\]', i.op_str)
            assert match, i.op_str
            destination, base, index = match.groups()
            assign(destination, int.from_bytes(read_address(value(base)+value(index)*2, 2), 'little'))
        elif op == 'br': target = value(args[0])
        elif op == 'ret': return {'kind': 'builtin', 'enabled': bool(regs.get(0, 0))}
        elif op not in ['ldp']: raise ValueError(f'Unexpected dispatch instruction: {i}')
        pc = target
    raise ValueError('Native building condition did not terminate')

upgrades = json.loads((ROOT / 'public/data/upgradeTrees.json').read_text())
upgrade_images = {row['id']: row['image'] for tree in upgrades['trees']
                  if tree['key'] == 'divine' for row in tree['upgrades']}
# Assets are optional only when the game has no matching extracted native sprite.
for path in BUNDLES.glob('uiart_assets*'): env.load_file(str(path))
sprites = {}
for obj in env.objects:
    if obj.type.name == 'Sprite':
        name = obj.read().m_Name
        sprites.setdefault(re.sub('[^a-z0-9]', '', name.lower()), obj)
# Use the same Type -> IconImage table consulted by BuildMenuItem.Configure.
# Sprite-name guesses miss renamed artwork and artwork in dependent bundles.
from UnityPy.classes import PPtr
placement_bundle = next(BUNDLES.glob('uiprefabs_assets_uiprefabs_auto_46_*'))
env.load_file(str(placement_bundle))
placement_map = next(o for o in env.objects if o.path_id == 8624983468075156170)
native_icons = {}
for item in placement_map.read_typetree()['TypeAndPlacementObject']:
    id = item['Type']
    if id not in ids or not item['IconImage']['m_PathID']: continue
    sprite = PPtr(**item['IconImage'], assetsfile=placement_map.assets_file).read()
    target = ROOT / 'public/Buildings' / f'{id}.png'
    target.parent.mkdir(parents=True, exist_ok=True)
    sprite.image.save(target)
    native_icons[id] = f'/Buildings/{id}.png'
# Six legacy entries have null IconImage and empty placement models in this installation.
# Keep them editable, but distinguish illustrative SVGs from actual game artwork.
illustrations = {
    56: '<path d="M25 46c-9-8-5-16 2-22 0 7 4 8 5 10 5-8 2-12 1-17 12 10 17 20 7 29-4 4-11 4-15 0Z"/><path d="m18 54 28-5M18 49l28 5"/>',
    73: '<path d="m12 23 20-10 20 10v28H12Zm0 0 20 10 20-10M32 33v18"/><path d="M24 17l20 10"/>',
    74: '<path d="M10 27h44v27H10ZM10 27l8-12h28l8 12M18 38h10v9H18m18-9h10v9H36"/><path d="M32 15v12"/>',
    171: '<path d="M19 54h26M22 54l4-24h12l4 24M20 19h24v11H20ZM17 19l15-9 15 9M28 24h8M24 40h16"/>',
    213: '<path d="M18 54h28l-4-12H22Zm9-12V30h10v12M15 24c8-10 22-11 33-2M33 18 20 39"/>',
    214: '<path d="M18 54h28l-4-12H22Zm9-12V30h10v12M32 29C17 29 16 18 16 12c12 0 17 7 16 17Zm0 0c0-14 9-17 17-17 0 12-6 18-17 17Z"/>',
}
rows, translations = [], []
for id in ids:
    game_key = structures[id]
    labels = terms.get('Structures/'+game_key)
    if not labels or not labels[3]: continue
    descriptions = terms.get('Structures/'+game_key+'/Description', ['']*21)
    for values_row in [labels, descriptions]:
        if values_row[3]: translations.append([values_row[3], values_row[9] or values_row[3]])
    category = 'floors' if game_key.startswith(('TILE_', 'PLANK_PATH')) else 'decorations' if game_key.startswith('DECORATION_') or game_key == 'FARM_PLOT_SIGN' else 'buildings'
    condition = unlock_condition(id)
    if condition['kind'] == 'builtin' and not condition['enabled']:
        continue  # Old temple/shrine variants are permanently unavailable in the build menu.
    image = native_icons.get(id, '')
    if not image:
        image = upgrade_images.get(condition.get('id'), '') if condition['kind'] == 'upgrade' and structure_for(condition['id']) == id else ''
    if not image:
        # Match a native sprite's explicit internal key; never substitute another building.
        for key in [game_key, game_key.removeprefix('DECORATION_'), game_key.removeprefix('TILE_')]:
            sprite = sprites.get(re.sub('[^a-z0-9]', '', ('Icon_'+key).lower()))
            if sprite:
                target = ROOT / 'public/Buildings' / f'{id}.png'
                target.parent.mkdir(parents=True, exist_ok=True)
                sprite.read().image.save(target)
                image = f'/Buildings/{id}.png'
                break
    image_source = 'native'
    if not image:
        assert id in illustrations, f'Unexpected missing native artwork: {game_key}'
        target = ROOT / 'public/Buildings' / f'{id}.svg'
        target.write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g fill="none" stroke="#302c2a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">'+illustrations[id]+'</g></svg>\n')
        image = f'/Buildings/{id}.svg'
        image_source = 'illustrative'
    rows.append({'id': id, 'gameKey': game_key, 'name': labels[3], 'description': descriptions[3],
                 'category': category, 'image': image, 'imageSource': image_source, 'unlock': condition})
(ROOT / 'public/data/buildings.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2)+'\n')
(ROOT / 'locales/buildings.json').write_text(json.dumps(translations, ensure_ascii=False, indent=2)+'\n')
print('Buildings:', len(rows), 'Native images:', sum(row['imageSource']=='native' for row in rows))
print('Categories:', {key: sum(row['category']==key for row in rows) for key in ['buildings','decorations','floors']})
print('Unlock kinds:', {key: sum(row['unlock']['kind']==key for row in rows) for key in ['structure','upgrade','builtin','flag']})
