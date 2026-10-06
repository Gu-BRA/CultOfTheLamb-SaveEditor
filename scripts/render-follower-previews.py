import json
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
props=json.loads(Path('/private/tmp/cotl-follower-regions.json').read_text())
geometry=json.loads(Path('/private/tmp/cotl-portrait-geometry.json').read_text())
atlas=Image.open('/private/tmp/cotl-Follower.png').convert('RGBA')
cache={}
def region(path):
 if path not in cache:
  p=props[path];x,y=map(int,p['xy'].split(','));w,h=map(int,p['size'].split(','));rotated=p['rotate']=='true'
  im=atlas.crop((x,y,x+(h if rotated else w),y+(w if rotated else h)))
  if rotated:im=im.transpose(Image.Transpose.ROTATE_270)
  cache[path]=im
 return cache[path]
def render(layers, bounds=None):
 points=np.concatenate([np.array(l['vertices']).reshape(-1,2) for l in (bounds or layers)]);lo=points.min(axis=0);hi=points.max(axis=0);scale=460/max(hi-lo);shift=(np.array([512,512])-(hi-lo)*scale)/2-lo*scale
 canvas=Image.new('RGBA',(512,512))
 for l in layers:
  source=region(l['path']);rgba=np.asarray(source).astype(float)*np.array(l['color']);source=Image.fromarray(np.uint8(rgba.clip(0,255)))
  xy=np.array(l['vertices']).reshape(-1,2)*scale+shift;uv=np.array(l['uvs']).reshape(-1,2)*[source.width,source.height]
  layer=Image.new('RGBA',canvas.size)
  for indices in np.array(l['triangles']).reshape(-1,3):
   dest=xy[indices];src=uv[indices]
   if not np.isfinite(dest).all() or not np.isfinite(src).all():continue
   matrix=np.column_stack((dest,np.ones(3)))
   if abs(np.linalg.det(matrix))<1e-7:continue
   coeff=np.linalg.solve(matrix,src).T.reshape(-1)
   x0,y0=np.maximum(np.floor(dest.min(axis=0)).astype(int)-1,0)
   x1,y1=np.minimum(np.ceil(dest.max(axis=0)).astype(int)+2,512)
   if x1<=x0 or y1<=y0:continue
   coeff[2]+=coeff[0]*x0+coeff[1]*y0;coeff[5]+=coeff[3]*x0+coeff[4]*y0
   size=(int(x1-x0),int(y1-y0))
   tile=source.transform(size,Image.Transform.AFFINE,coeff,resample=Image.Resampling.BILINEAR)
   mask=Image.new('L',size);ImageDraw.Draw(mask).polygon([tuple(p-[x0,y0]) for p in dest],fill=255)
   layer.paste(tile,(int(x0),int(y0)),mask)
  canvas.alpha_composite(layer)
 return canvas.resize((128,128),Image.Resampling.LANCZOS)
if __name__=='__main__':
 root=Path(__file__).resolve().parents[1]
 out=root/'public/Follower_Previews';out.mkdir(parents=True,exist_ok=True)
 manifest={'layeredSkins':{},'characters':[], 'source':'Installed game Follower.skel 3.8.99, avatar-normal and idle poses; base colours, no live status simulation.','skins':{},'outfits':{},'clothing':{}}
 for index,(name,layers) in enumerate(geometry.items()):
  # Keep unmapped legacy clothing enum aliases out of the previews.
  if name in ['clothing_1','clothing_2','clothing_3','clothing_4']:continue
  image=render(layers);image.save(out/f'{index}.png')
  kind='outfits' if name.startswith('outfit_') else 'clothing' if name.startswith('clothing_') else 'skins'
  key=name.split('_',1)[1] if kind!='skins' else name
  manifest[kind][key]=f'/Follower_Previews/{index}.png'
 palettes=json.loads(Path('/private/tmp/cotl-palettes.json').read_text())
 manifest['characters']=[dict(id=c['id'],skins=c['skins'],lockColor=c['lockColor'],colors=[p['slots'] for p in c['colors']+palettes['globalColors']]) for c in palettes['characters']]
 available={skin for c in palettes['characters'] for skin in c['skins']}
 for index,(name,layers) in enumerate(geometry.items()):
  if name not in available:continue
  descriptors=[]
  for part,layer in enumerate(layers):
   vertices=np.array(layer['vertices']).reshape(-1,2)
   if not np.isfinite(vertices).all() or np.ptp(vertices[:,0])<1e-6 or np.ptp(vertices[:,1])<1e-6:continue
   rendered=render([layer],layers)
   if not rendered.getbbox():continue
   filename=f'{index}-layer-{part}.png';rendered.save(out/filename)
   descriptors.append({'slot':layer['slot'],'image':'/Follower_Previews/'+filename})
  manifest['layeredSkins'][name]=descriptors
 manifest['source']='Installed game 1.4.12 Follower.skel 3.8.99 and WorshipperData: native slot palettes, local colours followed by GlobalColourList as appended in WorshipperData.Awake.'
 (root/'public/data/followerPreviews.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 print({key:len(manifest[key]) for key in ['skins','outfits','clothing']})
