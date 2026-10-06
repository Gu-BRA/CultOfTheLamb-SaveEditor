"""Prepare native Spine parts and ClothingData for the local appearance renderer.
Requires extract-follower-assets.py output and UnityPy/Pillow. Reads installed game only.
"""
import json, struct, shutil
from pathlib import Path
import UnityPy
from PIL import Image
root = Path(__file__).resolve().parents[1]
out = root / 'public/Follower_Renderer'
(out / 'parts').mkdir(parents=True, exist_ok=True)
props = json.loads(Path('/private/tmp/cotl-follower-regions.json').read_text())
atlas = Image.open('/private/tmp/cotl-Follower.png').convert('RGBA')
regions = {}
for index, (name, p) in enumerate(props.items()):
    x, y = map(int, p['xy'].split(',')); w, h = map(int, p['size'].split(','))
    rotated = p['rotate'] == 'true'
    image = atlas.crop((x, y, x + (h if rotated else w), y + (w if rotated else h)))
    if rotated: image = image.transpose(Image.Transpose.ROTATE_270)
    image.save(out / 'parts' / f'{index}.png')
    ow, oh = map(int, p['orig'].split(',')); ox, oy = map(int, p['offset'].split(','))
    regions[name] = dict(image=f'/Follower_Renderer/parts/{index}.png', width=w, height=h,
                         originalWidth=ow, originalHeight=oh, offsetX=ox, offsetY=oy)
(out / 'regions.json').write_text(json.dumps(regions))
shutil.copyfile('/private/tmp/cotl-Follower.skel', out / 'Follower.skel')
# Resolve MonoScript identities across assets; type trees aren't present in this build.
env = UnityPy.load('/Applications/Cult Of The Lamb.app/Contents/Resources/Data/resources.assets')
clothes = {}
for obj in env.objects:
    if obj.type.name != 'MonoBehaviour': continue
    b = obj.get_raw_data()
    if len(b) < 36 or struct.unpack_from('<q', b, 20)[0] != 2865: continue
    first = b.find(b'Clothes/')
    if first < 0: continue
    pos = first - 8
    def integer():
        global pos
        v = struct.unpack_from('<i', b, pos)[0]; pos += 4; return v
    def string():
        global pos
        n = integer(); s = b[pos:pos+n].decode(); pos = (pos+n+3)&~3; return s
    variants = [string() for _ in range(integer())]
    colors = []
    for _ in range(integer()):
        slots = {}
        for _ in range(integer()):
            slot = string(); slots[slot] = list(struct.unpack_from('<4f', b, pos)); pos += 16
        pos += 16 # AllColor (swatch), not a slot tint
        colors.append(slots)
    assert pos == len(b), (obj.path_id, pos, len(b))
    name_length = struct.unpack_from('<i', b, 28)[0]
    type_pos = ((32 + name_length + 3)&~3) + 12
    ident = struct.unpack_from('<i', b, type_pos)[0]
    clothes[str(ident)] = dict(variants=variants, colors=colors)
# Legacy enum names which still have matching native skeleton skins.
for ident, skin in [(5, 'Clothes/Robes_Baal'), (6, 'Clothes/Robes_Aym'), (9, 'Clothes/Rain1')]:
    clothes[str(ident)] = dict(variants=[skin], colors=[])
(root / 'public/data/followerClothingAppearance.json').write_text(json.dumps(clothes, ensure_ascii=False, indent=2)+'\n')
print(f'{len(regions)} texture parts; {len(clothes)} native clothing definitions')
