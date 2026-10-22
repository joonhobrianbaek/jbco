"""Convert the supplied unrigged floor-seated mesh into a small chair-seated web avatar.

Run with Blender 4.3+. Source stays outside the public tree. The imported face,
hair, shirt and UVs are retained; baked blue cushion faces are removed by UV
color and position, and short articulated trouser legs/shoes are added.
"""
import argparse, json, math, pathlib, sys
import bpy, bmesh
from mathutils import Vector

parser=argparse.ArgumentParser()
parser.add_argument('--source',required=True)
parser.add_argument('--output',required=True)
parser.add_argument('--preview')
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:])
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=args.source)
body=next(o for o in bpy.context.scene.objects if o.type=='MESH');body.name='FlameBuddyUpperBody'
bpy.context.view_layer.objects.active=body
bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
material=body.data.materials[0]
color_node=next(n for n in material.node_tree.nodes if n.type=='TEX_IMAGE' and n.image.name.startswith('Image_0'))
sample=color_node.image.copy();sample.scale(256,256);pixels=sample.pixels[:]
def rgb(uv):
    x=min(255,max(0,int(uv.x*255)));y=min(255,max(0,int(uv.y*255)));i=(y*256+x)*4
    return pixels[i:i+3]
bm=bmesh.new();bm.from_mesh(body.data);uv=bm.loops.layers.uv.active
remove=[]
for face in bm.faces:
    center=face.calc_center_median();colors=[rgb(loop[uv].uv) for loop in face.loops]
    blue=sum(1 for r,g,b in colors if b-r>.018 and b>=g-.015 and max(r,g,b)>.22)
    cushion=center.z<.38 and blue>=2 and (center.y>.15 or center.z<-.32 or abs(center.x)>.8)
    # Replace the original floor-resting feet and remaining seat base below waist.
    if cushion or center.z<-.565:
        remove.append(face)
bmesh.ops.delete(bm,geom=remove,context='FACES')
bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00002)
# Remove detached cushion fragments, preserving the connected face/body/arms.
seen=set();components=[]
for vertex in bm.verts:
    if vertex in seen:continue
    todo=[vertex];seen.add(vertex);component=[]
    while todo:
        v=todo.pop();component.append(v)
        for edge in v.link_edges:
            other=edge.other_vert(v)
            if other not in seen:seen.add(other);todo.append(other)
    components.append(component)
largest=max(components,key=len)
for component in components:
    if component is not largest:bmesh.ops.delete(bm,geom=component,context='VERTS')
for vertex in bm.verts:
    vertex.co.x*=.82;vertex.co.y*=.82;vertex.co.z=(vertex.co.z+.565)*.82+.595
bm.to_mesh(body.data);bm.free();bpy.data.images.remove(sample)
body.data.update()
# A small rigid-part hierarchy permits sitting/standing without claiming a skin rig.
def empty(name,location=(0,0,0),parent=None):
    e=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(e);e.location=location;e.parent=parent;return e
body_root=empty('BuddyBodyRoot');body.parent=body_root
triangles=sum(len(p.vertices)-2 for p in body.data.polygons)
modifier=body.modifiers.new('Web mesh simplification','DECIMATE');modifier.ratio=min(1,28000/max(1,triangles));modifier.use_collapse_triangulate=True
bpy.context.view_layer.objects.active=body;bpy.ops.object.modifier_apply(modifier=modifier.name)
for polygon in body.data.polygons:polygon.use_smooth=True
# Keep all source material maps, bounded for browser memory.
for image in list(bpy.data.images):
    if image.name.startswith('Image_') and image.size[0]>1024:
        image.scale(1024,1024);image.pack()
bs=next(n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
bs.inputs['Metallic'].default_value=0
# The supplied metallic channel is not useful for cloth; retain the source roughness.
for link in list(material.node_tree.links):
    if link.to_node==bs and link.to_socket==bs.inputs['Metallic']:material.node_tree.links.remove(link)
def cloth(name,color):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.9;return m
pants=cloth('Buddy charcoal trousers',(.055,.07,.09));shoes=cloth('Buddy dark shoes',(.025,.03,.035))
def oval(name,parent,center,scale,mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8)
    o=bpy.context.object;o.name=name;o.parent=parent;o.location=center;o.scale=scale;o.data.materials.append(mat)
    for p in o.data.polygons:p.use_smooth=True
    return o
for side,x in [('Left',-.22),('Right',.22)]:
    thigh=empty('Buddy'+side+'Thigh',(x,.02,.60))
    oval('Buddy'+side+'UpperLeg',thigh,(0,-.13,-.015),(.16,.22,.16),pants)
    shin=empty('Buddy'+side+'Shin',(0,-.28,-.02),thigh)
    oval('Buddy'+side+'LowerLeg',shin,(0,0,-.19),(.13,.13,.24),pants)
    oval('Buddy'+side+'Shoe',shin,(0,-.065,-.445),(.15,.22,.09),shoes)
# Open waist/cut surface is hidden by the rounded trouser seat.
oval('BuddyTrouserSeat',body_root,(0,.035,.58),(.39,.28,.17),pants)
output=pathlib.Path(args.output);output.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(output),export_format='GLB',export_animations=False,export_image_format='JPEG',export_jpeg_quality=85,export_extras=True)
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];count=sum(sum(len(p.vertices)-2 for p in o.data.polygons)for o in meshes)
print('WEB_AVATAR',json.dumps({'triangles':count,'bytes':output.stat().st_size,'meshes':len(meshes),'removed_source_faces':len(remove),'skins':0,'animations':0}))
if args.preview:
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=40;scene.cycles.use_denoising=False
    scene.render.resolution_x=900;scene.render.resolution_y=900;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.world.color=(.3,.3,.3)
    # Office chair is preview furniture, not part of the avatar GLB.
    seatmat=cloth('Preview office chair',(.13,.19,.16))
    def block(name,location,size):
        bpy.ops.mesh.primitive_cube_add(size=1,location=location);o=bpy.context.object;o.name=name;o.scale=size;o.data.materials.append(seatmat)
    block('Chair seat',(0,.04,.49),(.92,.73,.12));block('Chair back',(0,.36,.90),(.90,.12,.80));block('Chair stem',(0,.04,.25),(.08,.08,.42));block('Chair base',(0,.04,.065),(.85,.68,.07))
    target=Vector((0,0,1.0))
    for loc,power,size in [((3,-4,5),700,4),((-4,-1,2),450,3),((0,3,4),650,3)]:
        bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.data.energy=power;l.data.shape='DISK';l.data.size=size;l.rotation_euler=(target-l.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(2.6,-5,2.8));camera=bpy.context.object;camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=2.5;scene.camera=camera;scene.render.filepath=args.preview;bpy.ops.render.render(write_still=True)
