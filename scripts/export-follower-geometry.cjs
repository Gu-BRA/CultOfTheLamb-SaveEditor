const fs=require('fs');const spine=require('@pixi-spine/runtime-3.8');
const props=JSON.parse(fs.readFileSync('/private/tmp/cotl-follower-regions.json'));
const atlas={findRegion(path){const p=props[path];const [width,height]=p.size.split(',').map(Number);const [originalWidth,originalHeight]=p.orig.split(',').map(Number);const[offsetX,offsetY]=p.offset.split(',').map(Number);return {name:path,width,height,originalWidth,originalHeight,offsetX,offsetY,u:0,v:0,u2:1,v2:1,rotate:false};}};
const data=new spine.SkeletonBinary(new spine.AtlasAttachmentLoader(atlas)).readSkeletonData(new Uint8Array(fs.readFileSync('/private/tmp/cotl-Follower.skel')));
const catalog=JSON.parse(fs.readFileSync('public/data/followerSkin.json'));
const wanted=new Set([...catalog.flatMap(x=>x.variant).filter(x=>!x.startsWith('Unknown')), ...data.skins.map(x=>x.name).filter(x=>x!=='default' && !x.includes('/'))]);
const result={};
const outfitSkins={0:'Clothes/Rags',1:'Clothes/Sherpa',2:'Clothes/Warrior',3:'Clothes/Robes_Lvl1',7:'Clothes/Robes_Old',8:'Clothes/Holiday',9:'Clothes/HorseTown',10:'Other/Ghost',11:'Clothes/Undertaker',12:'Other/Dissenter',13:'Other/Brainwashed',14:'Other/Freezing',15:'Other/Overheated',16:'Clothes/Naked',17:'Other/Injured',18:null,19:'Clothes/Baby',20:'Other/Zombie'};
const clothing=JSON.parse(fs.readFileSync('public/data/followerClothing.json'));
const recipes=[...wanted].map(name=>({name,skins:[name],animation:'Avatars/avatar-normal'}));
for(const [id,skin] of Object.entries(outfitSkins))recipes.push({name:'outfit_'+id,skins:skin?['Deer',skin]:['Deer'],animation:'idle'});
recipes.push({name:'clothing_0',skins:['Deer'],animation:'idle'});
const aliases={Cultist_DLC:'Cultist_1',Cultist_DLC2:'Cultist_2',Heretic_DLC:'Heretic_1',Heretic_DLC2:'Heretic_2'};
for(const row of clothing){const skin='Clothes/'+(aliases[row.gameKey]||row.gameKey);if(data.findSkin(skin))recipes.push({name:'clothing_'+row.id,skins:skin?['Deer',skin]:['Deer'],animation:'idle'});}

for(const recipe of recipes){const {name,skins,animation}=recipe;if(skins.some(s=>!data.findSkin(s)))continue;
 const skeleton=new spine.Skeleton(data);const merged=new spine.Skin('preview');for(const skin of skins)merged.addSkin(data.findSkin(skin));skeleton.setSkin(merged);skeleton.setSlotsToSetupPose();const state=new spine.AnimationState(new spine.AnimationStateData(data));state.setAnimation(0,animation,false);state.apply(skeleton);skeleton.updateWorldTransform();
 const layers=[];
 for(const slot of skeleton.drawOrder){const a=slot.getAttachment();if(!a||!a.region||slot.color.a===0)continue;
 let vertices,uvs,triangles;
 if(a.type===0){a.updateOffset();vertices=new Float32Array(8);a.computeWorldVertices(slot.bone,vertices,0,2);uvs=[0,1,0,0,1,0,1,1];triangles=[0,1,2,2,3,0];}
 else if(a.type===2){vertices=new Float32Array(a.worldVerticesLength);a.computeWorldVertices(slot,0,vertices.length,vertices,0,2);uvs=Array.from(a.regionUVs);triangles=Array.from(a.triangles);}
 else continue;
 layers.push({slot:slot.data.name,path:a.path,vertices:Array.from(vertices),uvs,triangles,color:[slot.color.r*a.color.r,slot.color.g*a.color.g,slot.color.b*a.color.b,slot.color.a*a.color.a]});
 }
 result[name]=layers;
}
fs.writeFileSync('/private/tmp/cotl-portrait-geometry.json',JSON.stringify(result));console.log('skins',Object.keys(result).length,'requested',wanted.size);
