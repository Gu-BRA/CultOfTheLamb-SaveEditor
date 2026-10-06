"""Enrich local catalogs using the installed game's text and artwork. Requires UnityPy."""
import json
import re
import struct
from pathlib import Path
import UnityPy

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'public/data'
BASE = Path('/Applications/Cult Of The Lamb.app/Contents/Resources/Data')
BUNDLES = BASE / 'StreamingAssets/aa/StandaloneOSX'
# Read bundle directories only; load texture/atlas dependencies on demand.
import lz4.block

def bundle_index(path):
    with path.open('rb') as f:
        def cstring():
            result=bytearray()
            while (c := f.read(1)) and c != b'\0': result.extend(c)
            return result.decode()
        if cstring() != 'UnityFS': return []
        version=struct.unpack('>I',f.read(4))[0]
        cstring(); cstring()
        size, compressed, unpacked, flags=struct.unpack('>QIII',f.read(20))
        if version >= 7: f.seek((f.tell()+15)//16*16)
        if flags & 128: f.seek(size-compressed)
        info=f.read(compressed)
        if flags & 63 in (2,3): info=lz4.block.decompress(info,uncompressed_size=unpacked)
        elif flags & 63 != 0: raise ValueError('Unsupported bundle-directory compression')
        blocks=struct.unpack_from('>I',info,16)[0]
        offset=20+blocks*10
        count=struct.unpack_from('>I',info,offset)[0];offset+=4
        names=[]
        for _ in range(count):
            offset+=20;end=info.index(0,offset);names.append(info[offset:end].decode().lower());offset=end+1
        return names

bundle_paths={name:path for path in BUNDLES.glob('*.bundle') for name in bundle_index(path)}
env=UnityPy.Environment()
real_find=env.find_file

def find_dependency(name, *args, **kwargs):
    try: return real_find(name,*args,**kwargs)
    except FileNotFoundError:
        path=bundle_paths.get(name.lower())
        if not path: raise
        env.load_file(str(path))
        return real_find(name,*args,**kwargs)

env.find_file=find_dependency
env.load_file(str(BASE / 'resources.assets'))
env.load_file(str(BASE / 'resources.assets.resS'))
for pattern in ['uiart_assets*', 'contentupdate_assets*', 'resources_assets*']:
    for path in BUNDLES.glob(pattern): env.load_file(str(path))
environments=[env]
source = next(o for o in environments[0].objects if o.type.name == 'MonoBehaviour' and o.read(check_read=False).m_Name == 'I2Languages')
b = source.get_raw_data()

def string(offset):
    length = struct.unpack_from('<i', b, offset)[0]
    if not 0 <= length < 100000 or offset + 4 + length > len(b):
        raise ValueError('Invalid string')
    return b[offset+4:offset+4+length].decode('utf8'), (offset+4+length+3)//4*4

terms = {}
for offset in range(0, len(b)-12, 4):
    try:
        key, end = string(offset)
        if '/' not in key or '\n' in key or '\0' in key:
            continue
        kind, count = struct.unpack_from('<ii', b, end)
        if kind != 0 or count != 21:
            continue
        end += 8
        translations = []
        for _ in range(count):
            value, end = string(end)
            translations.append(value)
        terms[key] = translations
    except (ValueError, UnicodeDecodeError, struct.error):
        continue
assert terms['Traits/ProudParent'][3] == 'Proud Parent'
assert terms['Traits/ProudParent'][9] == 'Orgulhoso do Filho'

def clean(text):
    text = re.sub(r'<s>.*?</s>', '', text, flags=re.S)
    text = re.sub(r'<br\s*/?>', ' ', text)
    return re.sub(r'<[^>]*>', '', text).strip()

def localized(key):
    row = terms.get(key)
    return clean(row[9] or row[3]) if row else ''

sprites = {}
for env in environments:
    for obj in env.objects:
        if obj.type.name == 'Sprite':
            sprites.setdefault(obj.read().m_Name, obj)

def norm(name):
    return re.sub(r'[^a-z0-9]', '', name.lower())

normalized = {}
for name in sprites:
    normalized.setdefault(norm(name), name)

def artwork(folder, identifier, candidates):
    for candidate in candidates:
        actual = candidate if candidate in sprites else normalized.get(norm(candidate))
        if actual:
            target = ROOT / 'public' / folder / f'{identifier}.png'
            target.parent.mkdir(parents=True, exist_ok=True)
            sprites[actual].read().image.save(target)
            return f'/{folder}/{identifier}.png', actual
    return '', ''

def inventory_artwork():
    """Read the game's item-ID to Sprite mapping rather than guess icon names."""
    from UnityPy.classes import PPtr
    for path in BUNDLES.glob('userinterface_assets_userinterface_auto_1_*.bundle'):
        env.load_file(str(path))
    mappings = [o for o in list(env.objects) if o.type.name == 'MonoBehaviour'
                and o.read(check_read=False).m_Name == 'Inventory Icon Mapping']
    assert len(mappings) == 1, 'Expected one native inventory icon map'
    obj = mappings[0]
    raw = obj.get_raw_data()
    name_length = struct.unpack_from('<i', raw, 28)[0]
    offset = (32 + name_length + 3) // 4 * 4
    count = struct.unpack_from('<i', raw, offset)[0]
    offset += 4
    assert 0 < count < 1000 and len(raw) == offset + count * 16
    result = {}
    for index in range(count):
        identifier, file_id, path_id = struct.unpack_from('<iiq', raw, offset + index * 16)
        assert identifier not in result
        if path_id:
            result[identifier] = PPtr(m_FileID=file_id, m_PathID=path_id,
                                      assetsfile=obj.assets_file)
    return result

def load(name):
    return json.loads((DATA / f'{name}.json').read_text())

def write(name, rows):
    (DATA / f'{name}.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n')

counts = {}
traits = load('followerTrait')
negative = {'Terrified','Drowsy','Zombie','OverworkedParent','MarriedJealous','MarriedMurderouslyJealous','ExistentialDread'}
positive = {'ProudParent','ChosenOne','PureBlood_1','PureBlood_2','PureBlood_3','PureBlood'}
for row in traits:
    key = row['gameKey']
    name = localized(f'Traits/{key}')
    desc = localized(f'Traits/{key}/Description')
    if name:
        row['name'] = name
    if desc:
        row['description'] = desc
        row['textSource'] = 'installed-game-localization'
    if row.get('effect') == 'Neutral' and desc:
        row['effect'] = 'Negative' if key in negative else 'Positive' if key in positive else 'Neutral'
    aliases = {'CriminalEvangelizing':'EvangelizingCriminal', 'MarriedDevoted':'DevotedSpouse'}
    image, source = artwork('Traits', row['id'], ['Icon_Trait_' + aliases.get(key,key)])
    if image:
        row.update(image=image, imageSource=source)
    if not row.get('image') or not (ROOT/'public'/row['image'].lstrip('/')).exists():
        row.update(image='/Catalog/unmapped.svg', imageIsPlaceholder=True)
    if not name or not desc:
        row['internal'] = True
        row['restricted'] = True
        row['description'] = 'Entrada interna sem nome ou efeito publicado na tradução desta versão. Mantida para preservar saves que já utilizem este ID.'
counts['traitsWithDescriptions'] = sum(row.get('textSource') is not None for row in traits)
write('followerTrait', traits)

# Tarot fronts are Spine atlas regions, not separate Unity Sprite objects.
atlas_text = next(o.read().m_Script for o in list(env.objects) if o.type.name == 'TextAsset' and o.read().m_Name == 'WeaponCard.atlas')
card_texture = next(o.read() for o in list(env.objects) if o.type.name == 'Texture2D' and o.read().m_Name == 'WeaponCard').image
regions = {}
for block in re.finditer(r'^(images/[^\n]+)\n((?:  [^\n]+\n)+)', atlas_text, re.M):
    properties = dict(line.strip().split(': ', 1) for line in block.group(2).splitlines())
    regions[block.group(1)] = properties

card_regions = {
    'ExtraMove': 'images/Ship', 'ShuffleNode': 'images/Maze',
    'CorruptedBombsAndHealth': 'images/corrupted/Corrupted_BombHealth',
    'CorruptedHeavy': 'images/corrupted/Corrupted_heavy_',
    'CorruptedTradeOff': 'images/corrupted/Corrupted_tradeOff',
    'CorruptedBlackHeartForRelic': 'images/corrupted/Corrupted_blackheartRelics',
    'CorruptedHealForRelic': 'images/corrupted/Corrupted_healForRelic',
    'CorruptedFullCorruption': 'images/FullCorruption',
    'CorruptedPoisonCoins': 'images/PoisonCoins',
    'CorruptedRelicCharge': 'images/RelicCharge',
    'CorruptedGoopyTrail': 'images/GoopyTrail',
}
for suffix in ['BetterTogether','BetterApart','Bonded','GoodTiming','Explosive']:
    card_regions['Coop'+suffix] = 'images/coop/CoOp_'+suffix


def card_artwork(key, identifier):
    candidates=[card_regions.get(key), 'images/'+key, 'images/Card_Trinket_'+key]
    region=next((candidate for candidate in candidates if candidate in regions),None)
    if not region: return '', ''
    properties=regions[region]
    assert properties['rotate']=='false', 'Unsupported rotated card region'
    x,y=map(int,properties['xy'].split(','))
    width,height=map(int,properties['size'].split(','))
    assert 0 <= x < x+width <= card_texture.width and 0 <= y < y+height <= card_texture.height
    target=ROOT/'public/Tarot_Cards'/f'{identifier}.png'
    target.parent.mkdir(parents=True,exist_ok=True)
    card_texture.crop((x,y,x+width,y+height)).save(target)
    return f'/Tarot_Cards/{identifier}.png', 'WeaponCard.atlas:'+region

cards = load('tarotCard')
back, back_source = artwork('Catalog', 'tarot-back', ['CardBack_Trinket','TarotCardBack'])
for row in cards:
    key = row['gameKey']
    name = localized(f'TarotCards/{key}/Name')
    desc = localized(f'TarotCards/{key}/Description')
    if '{0}' in desc and '{1}' in desc:
        desc = desc.replace('{0}', localized(f'TarotCards/{key}/Positive')).replace('{1}', localized(f'TarotCards/{key}/Negative'))
    # The shared enum also contains weapons, curses and sentinel/internal values.
    row['internal'] = row['id'] in list(range(19,31))+[49,84] or not name or not desc
    if name:
        row['name'] = name
    if desc:
        row['effect'] = desc
        row['effect_1'] = localized(f'TarotCards/{key}/Description1') or '—'
        row['effect_2'] = localized(f'TarotCards/{key}/Description2') or '—'
        row['textSource'] = 'installed-game-localization'
    if row.get('imageIsBack') or not row.get('image'):
        front, front_source = card_artwork(key, row['id'])
        if front:
            row.update(image=front, imageSource=front_source, imageIsBack=False)
    if not row.get('image'):
        # Use the real back of a tarot card, explicitly marked; do not guess front-art mappings.
        row.update(image=back, imageSource=back_source, imageIsBack=True)
counts['playerTarotCards'] = sum(not row['internal'] for row in cards)
counts['tarotFronts'] = sum(not row['internal'] and not row.get('imageIsBack') for row in cards)
write('tarotCard', cards)

itemkeys = {identifier:key for key,identifier in load('installedCatalog')['enums']['ITEM_TYPE'].items()}
aliases = {'EGG_FOLLOWER':'Yolk','WEBBER_SKULL':'WebberSkull','MEAT':'MeatLarge','MEAT_ROTTEN':'MeatLarge Rotten','FOLLOWER_MEAT_ROTTEN':'MeatRotten','DRINK_MUSHROOM_JUICE':'Drink_Mushroom','ROCK2':'Rock0002','ROCK3':'Rock0003','SEED_TREE':'Acorn','SOZO':'FaceShroom','SILK_THREAD':'Silk','RED_HEART':'Red Heart Pick Up','HALF_HEART':'Red Heart Pick Up_Half','BLUE_HEART':'Blue Heart Pick Up','HALF_BLUE_HEART':'Blue Heart Pick Up_Half','BLACK_HEART':'Black Heart Pick Up','TRINKET_CARD':'CardBack_Trinket','FOUND_ITEM_FOLLOWERSKIN':'FormIcon','FOLLOWERS':'FollowerBag','MEAL_BURNED':'Meal_Burnt','SEED_SOZO':'Sozo Shroom','POOP':'Poop','BLOOD_STONE':'Bloodstone','FLOWER_WHITE':'SacredFlowers','STAINED_GLASS':'StainedGlass','DISCIPLE_POINTS':'DivineInspiration','Necklace_Dark':'Item_GodDevilWings','Necklace_Light':'Item_GodAngelWings'}
groups = load('itemData')
inventory_icons = inventory_artwork()
for group in groups:
    for row in group['items']:
        key = itemkeys.get(row['id'], row.get('gameKey',''))
        row['gameKey'] = key
        name = localized(f'Inventory/{key}') or localized(f'CookingData/{key}/Name')
        desc = localized(f'Inventory/{key}/Description') or localized(f'CookingData/{key}/Description')
        if name:
            row['name'] = name
            row['textSource'] = 'installed-game-localization'
        if desc:
            row['description'] = desc
        if not row.get('image') or row.get('imageIsPlaceholder'):
            image, source = '', ''
            if row['id'] in inventory_icons:
                sprite = inventory_icons[row['id']].deref_parse_as_object()
                assert sprite.object_reader.type.name == 'Sprite'
                target = ROOT / 'public/Items' / f"{row['id']}.png"
                target.parent.mkdir(parents=True, exist_ok=True)
                sprite.image.save(target)
                image, source = f"/Items/{row['id']}.png", 'InventoryIconMapping:' + sprite.m_Name
            else:
                image, source = artwork('Items',row['id'],[aliases.get(key,key), 'Item_'+key, 'Icon_'+key])
            if image:
                row.update(image=image, imageSource=source, imageIsPlaceholder=False)
        row['internal'] = not name and row.get('textSource') is None
        if not row.get('image'):
            row.update(image='/Catalog/unmapped.svg', imageIsPlaceholder=True)
    if group['name']=='Additional IDs from installed game':
        group['name']='Itens e refeições adicionais'
counts['itemsWithImages'] = sum(bool(row.get('image')) and not row.get('imageIsPlaceholder') for group in groups for row in group['items'])
write('itemData', groups)

clothing = load('followerClothing')
for row in clothing:
    key=row['gameKey']
    name=localized(f'Clothing/{key}/Name')
    desc=localized(f'Clothing/{key}/Description')
    if name: row['name']=name
    if desc: row['description']=desc
write('followerClothing', clothing)
write('catalogEnrichment', {'source':'Installed game 1.4.12: I2Languages PT-BR and Unity Sprite assets. Tarot fronts are extracted from named regions in WeaponCard.atlas.', 'counts':counts})
print(json.dumps(counts))
