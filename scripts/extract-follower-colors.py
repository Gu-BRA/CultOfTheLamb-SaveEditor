"""Read the installed game's WorshipperData palette and complete skin-ID catalog."""
import json
import struct
from pathlib import Path
import UnityPy

ROOT=Path(__file__).resolve().parents[1]
BASE=Path('/Applications/Cult Of The Lamb.app/Contents/Resources/Data')
env=UnityPy.Environment(str(BASE/'resources.assets'),str(BASE/'globalgamemanagers.assets'))
script_ids={o.path_id for o in env.objects if o.type.name=='MonoScript' and o.read().m_ClassName=='WorshipperData'}
objects=[o for o in env.objects if o.type.name=='MonoBehaviour' and o.read(check_read=False).m_Script.m_PathID in script_ids]
assert len(objects)==1,'Expected one WorshipperData asset'
b=objects[0].get_raw_data();at=28

def integer():
 global at
 value=struct.unpack_from('<i',b,at)[0];at+=4;return value

def string():
 global at
 length=integer();assert 0<=length<10000
 value=b[at:at+length].decode('utf8');at=(at+length+3)//4*4;return value

def color():
 global at
 value=struct.unpack_from('<4f',b,at);at+=16
 assert all(0<=x<=1.01 for x in value)
 return value

def palette():
 count=integer();assert 0<=count<100
 slots={string():color() for _ in range(count)}
 return {'slots':slots,'allColor':color()}

string();at+=12 # SkeletonData PPtr
colors=[palette() for _ in range(integer())]
characters=[]
for i in range(integer()):
 title=string();drop=integer();flags=[integer() for _ in range(4)]
 assert all(x in [0,1] for x in flags)
 variants=[string() for _ in range(integer())]
 palettes=[palette() for _ in range(integer())]
 characters.append(dict(id=i,title=title,drop=drop,hidden=flags[0],invariant=flags[1],lockColor=flags[2],premium=flags[3],skins=variants,colors=palettes))
assert at==len(b),'Unrecognized WorshipperData layout'
assert characters[0]['skins'][0]=='Deer' and characters[2]['skins'][0]=='Cow'
Path('/private/tmp/cotl-palettes.json').write_text(json.dumps(dict(globalColors=colors,characters=characters)))
p=ROOT/'public/data/followerSkin.json';old=json.loads(p.read_text())
rows=[dict(name=old[c['id']]['name'] if c['id']<len(old) and not old[c['id']]['name'].startswith(('Unknown','Skin ID')) else c['title'],variant=c['skins'],source='installed-WorshipperData') for c in characters]
p.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print('Native groups:',len(characters),'variants:',sum(len(c['skins']) for c in characters),'global palettes:',len(colors))
