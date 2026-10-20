import bpy,math,json,os
from mathutils import Quaternion,Vector
import pathlib,sys,argparse
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
parser=argparse.ArgumentParser();parser.add_argument('--sources',required=True);parser.add_argument('--output',required=True);opts=parser.parse_args(args)
asset_dir=pathlib.Path(opts.sources).resolve();output=pathlib.Path(opts.output).resolve()
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=str(asset_dir/'Sports_Male_04/Export/Sports_Male_04.fbx'))
for filename in ['06_15.bvh','124_03.bvh']:
 bpy.ops.import_anim.bvh(filepath=str(asset_dir/filename),global_scale=.05,frame_start=1,use_fps_scale=False,update_scene_fps=True,update_scene_duration=True,axis_forward='-Z',axis_up='Y')
scene=bpy.context.scene
target=bpy.data.objects['Bip01']; source=bpy.data.objects['06_15']; human=next(o for o in scene.objects if o.type=='MESH')
# Restore the publisher's color/normal maps, then export web-compatible PBR materials.
for mat in human.data.materials:
 part='head' if 'head' in mat.name else 'body';mat.use_nodes=True;nodes=mat.node_tree.nodes;nodes.clear();out=nodes.new('ShaderNodeOutputMaterial');bs=nodes.new('ShaderNodeBsdfPrincipled');bs.inputs['Roughness'].default_value=.69;mat.node_tree.links.new(bs.outputs['BSDF'],out.inputs['Surface'])
 for kind in ['color','normal']:
  path=str(asset_dir/f'Sports_Male_04/Textures/m026_{part}_{kind}.tga');image=bpy.data.images.load(path,check_existing=False)
  if kind=='normal':image.colorspace_settings.name='Non-Color'
  image.scale(1024,1024);image.pack()
  tex=nodes.new('ShaderNodeTexImage');tex.image=image
  if kind=='color':mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
  else:
   normal=nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.65;mat.node_tree.links.new(tex.outputs['Color'],normal.inputs['Color']);mat.node_tree.links.new(normal.outputs['Normal'],bs.inputs['Normal'])
# Semantic chains, rather than matching bone labels or assuming identical bind axes.
mapping={'Bip01 Pelvis':'Hips','Bip01 Spine':'Spine','Bip01 Spine1':'Spine','Bip01 Spine2':'Spine1','Bip01 Neck':'Neck1','Bip01 Head':'Head'}
next_joint={'Bip01 Spine':('Spine','Spine1'),'Bip01 Spine1':('Spine','Spine1'),'Bip01 Spine2':('Spine1','Neck1'),'Bip01 Neck':('Neck1','Head')}
for side,long in [('L','Left'),('R','Right')]:
 for suffix,src in [('Clavicle','Shoulder'),('UpperArm','Arm'),('Forearm','ForeArm'),('Hand','Hand'),('Thigh','UpLeg'),('Calf','Leg'),('Foot','Foot'),('Toe0','ToeBase')]:mapping[f'Bip01 {side} {suffix}']=long+src
 for suffix,a,b in [('Clavicle','Shoulder','Arm'),('UpperArm','Arm','ForeArm'),('Forearm','ForeArm','Hand'),('Thigh','UpLeg','Leg'),('Calf','Leg','Foot')]:next_joint[f'Bip01 {side} {suffix}']=(long+a,long+b)
target_next={'Bip01 Spine':'Bip01 Spine1','Bip01 Spine1':'Bip01 Spine2','Bip01 Spine2':'Bip01 Neck','Bip01 Neck':'Bip01 Head'}
for side in ['L','R']:
 for a,b in [('Clavicle','UpperArm'),('UpperArm','Forearm'),('Forearm','Hand'),('Thigh','Calf'),('Calf','Foot')]:target_next[f'Bip01 {side} {a}']=f'Bip01 {side} {b}'
def retarget(source,clip_name):
 source_end=int(source.animation_data.action.frame_range[1])
 scene.frame_set(1)
 source_bind={n:(source.matrix_world@source.pose.bones[n].matrix).to_quaternion() for n in set(mapping.values())}
 target_bind={b.name:(target.matrix_world@b.matrix_local).to_quaternion() for b in target.data.bones}
 target_world_heads={b.name:target.matrix_world@b.head_local for b in target.data.bones}
 rest_local={b.name:((b.parent.matrix_local.inverted()@b.matrix_local) if b.parent else b.matrix_local).to_quaternion() for b in target.data.bones}
 world_target_q=target.matrix_world.to_quaternion();target_inverse=target.matrix_world.inverted()
 scene.frame_set(2);source_start=source.matrix_world@source.pose.bones['Hips'].head;target_start=target_world_heads['Bip01 Pelvis']
 forward=((source.pose.bones['LeftArm'].head-source.pose.bones['RightArm'].head).cross(Vector((0,0,1))));forward.z=0;forward.normalize();align=Quaternion(Vector((0,0,1)),math.atan2(forward.x,forward.y))
 scale=.94
 target.animation_data_create();action=bpy.data.actions.new(clip_name);target.animation_data.action=action
 ordered=list(target.data.bones)
 for pb in target.pose.bones:pb.rotation_mode='QUATERNION'
 # Bake the recorded stream at 60fps, excluding the conversion's artificial T-pose.
 for frame,srcframe in enumerate(range(2,source_end+1,2),1):
  scene.frame_set(srcframe);root_delta=align@(source.matrix_world@source.pose.bones['Hips'].matrix).to_quaternion()@source_bind['Hips'].inverted();computed={}
  for bone in ordered:
   pb=target.pose.bones[bone.name];parent_q=computed[bone.parent.name] if bone.parent else world_target_q
   if bone.name in mapping:
    srcname=mapping[bone.name]
    if ' Hand' in bone.name:
     forearm=bone.name.replace(' Hand',' Forearm');desired=computed[forearm]@target_bind[forearm].inverted()@target_bind[bone.name]
    elif bone.name in next_joint:
     a,b=next_joint[bone.name];direction=align@((source.matrix_world@source.pose.bones[b].head)-(source.matrix_world@source.pose.bones[a].head))
     restdir=target_world_heads[target_next[bone.name]]-target_world_heads[bone.name]
     base=root_delta@target_bind[bone.name];basedir=root_delta@restdir
     desired=basedir.rotation_difference(direction)@base if direction.length>.00001 else base
    else:
     desired=align@(source.matrix_world@source.pose.bones[srcname].matrix).to_quaternion()@source_bind[srcname].inverted()@target_bind[bone.name]
    pb.rotation_quaternion=rest_local[bone.name].inverted()@parent_q.inverted()@desired;pb.keyframe_insert(data_path='rotation_quaternion',frame=frame,group=bone.name);computed[bone.name]=desired
   else:computed[bone.name]=parent_q@rest_local[bone.name]
  hip_world=target_start+(align@((source.matrix_world@source.pose.bones['Hips'].head)-source_start))*scale
  hip=target.pose.bones['Bip01 Pelvis'];hip.location=target.data.bones['Bip01 Pelvis'].matrix_local.to_quaternion().inverted()@((target_inverse@hip_world)-target.data.bones['Bip01 Pelvis'].head_local);hip.keyframe_insert(data_path='location',frame=frame,group=hip.name)
 # Smooth between samples; no synthesized replacement of the captured rotations.
 for fc in action.fcurves:
  for k in fc.keyframe_points:k.interpolation='LINEAR'
 frames=(source_end-2)//2+1
 scene.render.fps=60;scene.frame_start=1;scene.frame_end=frames;scene.frame_set(1)
 rows=[]
 for f in range(1,frames+1):
  scene.frame_set(f);bpy.context.view_layer.update();rows.append({'t':(f-1)/60,**{n:list(target.matrix_world@target.pose.bones[n].head) for n in ['Bip01 Pelvis','Bip01 Head','Bip01 L Hand','Bip01 R Hand','Bip01 L Foot','Bip01 R Foot','Bip01 L Toe0','Bip01 R Toe0']}})
 return action,rows
clips=[];trajectories={}
for name,label in [('06_15','CMU_06_15_Dribble_Shoot'),('124_03','CMU_124_03_Basketball_Shoot')]:
 act,rows=retarget(bpy.data.objects[name],label);clips.append(act);trajectories[label]=rows
for other in list(bpy.data.actions):
 if other not in clips:bpy.data.actions.remove(other)
target.animation_data.action=clips[0];scene.frame_start=1;scene.frame_end=1000;scene.frame_set(1)
output.with_suffix('.trajectory.json').write_text(json.dumps(trajectories))
# Remove import-only objects; keep only the original skinned character and its skeleton.
bpy.ops.object.select_all(action='DESELECT');target.select_set(True);human.select_set(True);bpy.context.view_layer.objects.active=target
output.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(output),export_format='GLB',use_selection=True,export_animations=True,export_frame_range=False,export_frame_step=1,export_animation_mode='ACTIONS',export_force_sampling=True,export_image_format='AUTO',export_jpeg_quality=88,export_yup=True,export_skins=True,export_morph=False,export_extras=True)
# The exported GLB is the runtime artifact; a Blender install is not required to serve it.
print('EXPORTED',output.stat().st_size)
