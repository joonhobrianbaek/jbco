"""Build a seated, textured Microsoft Rocketbox preview; run with Blender 4.3+."""
import bpy, math, pathlib, argparse, sys, json
from mathutils import Vector, Matrix, Quaternion
parser=argparse.ArgumentParser();parser.add_argument('--sources',required=True);parser.add_argument('--output',required=True);parser.add_argument('--model',default='Male_Adult_02');parser.add_argument('--web',action='store_true');parser.add_argument('--slickback',action='store_true')
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:]);root=pathlib.Path(args.sources);output=pathlib.Path(args.output)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=str(root/f'Export/{args.model}_facial.fbx'))
for obj in bpy.context.scene.objects:obj.animation_data_clear()
arm=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE');human=next(o for o in bpy.context.scene.objects if o.type=='MESH');scene=bpy.context.scene
texture_prefix=next((root/'Textures').glob('*_head_color.tga')).name.split('_head_color')[0]
if args.slickback:
    # Sweep the existing textured scalp backwards; keep its connected surface and UVs.
    h=arm.matrix_world@arm.data.bones['Bip01 Head'].head_local;head_image=bpy.data.images.load(str(root/f'Textures/{texture_prefix}_head_color.tga'));width,height=head_image.size;pixels=list(head_image.pixels);uv_layer=human.data.uv_layers.active.data;scalp={}
    for polygon in human.data.polygons:
        if 'head' not in human.data.materials[polygon.material_index].name:continue
        for loop_index in polygon.loop_indices:
            index=human.data.loops[loop_index].vertex_index;uv=uv_layer[loop_index].uv;pixel=(min(height-1,max(0,int(uv.y*height)))*width+min(width-1,max(0,int(uv.x*width))))*4;rgb=pixels[pixel:pixel+3]
            if max(rgb)<.26:scalp[index]=True
    inverse=human.matrix_world.inverted()
    for index in scalp:
        original=human.data.shape_keys.key_blocks[0].data[index].co.copy();world=human.matrix_world@original
        if world.z<h.z+.065:continue
        t=min(1,max(0,(world.z-h.z-.065)/.15));world.y+=.035*t;world.z+=.012*math.sin(t*math.pi);delta=inverse@world-original
        for key in human.data.shape_keys.key_blocks:key.data[index].co+=delta
for mat in human.data.materials:
    kind='opacity' if 'opacity' in mat.name else 'head' if 'head' in mat.name else 'body';mat.use_nodes=True;nodes=mat.node_tree.nodes;nodes.clear();out=nodes.new('ShaderNodeOutputMaterial');bs=nodes.new('ShaderNodeBsdfPrincipled');bs.inputs['Roughness'].default_value=.78 if kind=='body' else .64;mat.node_tree.links.new(bs.outputs['BSDF'],out.inputs['Surface'])
    for channel in (['color'] if kind=='opacity' else ['color','normal']):
        image=bpy.data.images.load(str(root/f'Textures/{texture_prefix}_{kind}_{channel}.tga'));image.colorspace_settings.name='Non-Color' if channel=='normal' else 'sRGB';image.scale(2048 if channel=='color' and kind!='opacity' else 1024,2048 if channel=='color' and kind!='opacity' else 1024);image.file_format='JPEG' if channel=='color' and kind!='opacity' else 'PNG';image.pack();tex=nodes.new('ShaderNodeTexImage');tex.image=image
        if channel=='color':
            mat.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
            if kind=='opacity':mat.node_tree.links.new(tex.outputs['Alpha'],bs.inputs['Alpha']);mat.surface_render_method='DITHERED'
        else:
            normal=nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.45;mat.node_tree.links.new(tex.outputs['Color'],normal.inputs['Color']);mat.node_tree.links.new(normal.outputs['Normal'],bs.inputs['Normal'])
for poly in human.data.polygons:poly.use_smooth=True
bones=arm.pose.bones
for b in bones:b.rotation_mode='QUATERNION'
def update():bpy.context.view_layer.update()
def point(name):return arm.matrix_world@bones[name].head
def world(name):return arm.matrix_world@bones[name].matrix
rest_rot={b.name:world(b.name).to_quaternion() for b in bones}
arm.location.z+=.63-point('Bip01 Pelvis').z;update()
def set_rotation(name,q):
    m=world(name);loc,_,scale=m.decompose();bones[name].matrix=arm.matrix_world.inverted()@Matrix.LocRotScale(loc,q,scale);update()
def aim(name,child,target):
    origin=point(name);delta=(point(child)-origin).rotation_difference(Vector(target)-origin);set_rotation(name,delta@world(name).to_quaternion())
# Lean slightly toward the keyboard rather than lengthening the arms.
set_rotation('Bip01 Spine',Quaternion(Vector((1,0,0)),math.radians(9))@world('Bip01 Spine').to_quaternion())
for side,sign in [('L',1),('R',-1)]:
    prefix='Bip01 '+side+' ';hip=point(prefix+'Thigh');thigh_length=(point(prefix+'Calf')-hip).length;calf_length=(point(prefix+'Foot')-point(prefix+'Calf')).length;foot_height=(arm.matrix_world.to_3x3()@arm.data.bones[prefix+'Foot'].head_local).z;foot_z=.05+foot_height;knee_z=foot_z+calf_length*.999;knee_y=hip.y-math.sqrt(max(.01,thigh_length**2-(knee_z-hip.z)**2));aim(prefix+'Thigh',prefix+'Calf',(hip.x,knee_y,knee_z));knee=point(prefix+'Calf');aim(prefix+'Calf',prefix+'Foot',(knee.x,knee.y+.006,foot_z));set_rotation(prefix+'Foot',rest_rot[prefix+'Foot'])
    upper,fore,hand=prefix+'UpperArm',prefix+'Forearm',prefix+'Hand';s=point(upper);w=Vector((sign*.19,-.44,.875));l1=(point(fore)-s).length;l2=(point(hand)-point(fore)).length;d=(w-s).length;direction=(w-s).normalized();
    if d>l1+l2-.002:w=s+direction*(l1+l2-.002);d=(w-s).length
    distance=(l1*l1-l2*l2+d*d)/(2*d);bend=Vector((sign*.8,.05,-.7));bend=(bend-direction*bend.dot(direction)).normalized();elbow=s+direction*distance+bend*math.sqrt(max(0,l1*l1-distance*distance));aim(upper,fore,elbow);aim(fore,hand,w)
    # Orient the hand by its finger frame, with fingers pointing along the keyboard.
    origin=point(hand);forward=(point(prefix+'Finger2')-origin).normalized();across=point(prefix+'Finger4')-point(prefix+'Finger1');across=(across-forward*across.dot(forward)).normalized();normal=across.cross(forward).normalized();source=Matrix((across,forward,normal)).transposed();f=Vector((0,-1,-.08)).normalized();a=Vector((sign,0,0));n=a.cross(f).normalized();target=Matrix((a,f,n)).transposed();set_rotation(hand,(target@source.inverted()).to_quaternion()@world(hand).to_quaternion())
update()
# Retain real eyelid blendshapes, discard unrelated phoneme shapes from the web asset.
keep={'Basis','AK_09_EyeBlinkLeft','AK_10_EyeBlinkRight'}
for key in list(human.data.shape_keys.key_blocks)[::-1]:
    if key.name not in keep:human.shape_key_remove(key)
scene.render.fps=30;scene.frame_start=1;scene.frame_end=151
for bone in bones:
    for frame in [1,151]:
        bone.keyframe_insert(data_path='rotation_quaternion',frame=frame);bone.keyframe_insert(data_path='location',frame=frame)
if arm.animation_data and arm.animation_data.action:arm.animation_data.action.name='SeatedKeyboardPose'
for key in human.data.shape_keys.key_blocks:
    if key.name=='Basis':continue
    for frame,value in [(1,0),(90,0),(92,1),(96,0),(151,0)]:key.value=value;key.keyframe_insert(data_path='value',frame=frame)
# Bone transforms are the seated base pose; blink is the only authored animation.
human['asset_source']='Microsoft Rocketbox '+args.model;human['hair_style']='slickback' if args.slickback else 'original';human['license']='MIT';human['pose']='Seated keyboard pose authored for BB Office; no motion capture';human['texture_resolution']=2048
scene.frame_set(1);update();points={n:list(point('Bip01 '+n)) for n in ['Pelvis','Head','L Hand','R Hand','L Foot','R Foot']};print('POSE_METERS',json.dumps(points))
output.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(output),export_format='GLB',export_animations=True,export_force_sampling=True,export_frame_range=True,export_extras=True,export_yup=True,export_image_format='JPEG' if args.web else 'AUTO',export_jpeg_quality=92)
output.with_suffix('.pose.json').write_text(json.dumps(points,indent=2)+'\n');print('WROTE',str(output))
