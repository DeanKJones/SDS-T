#include "./pbr_sky.wgsl"
#include "../math/random.wgsl"

#include "./intersection/sphere_intersection.wgsl"
#include "./intersection/triangle_intersection.wgsl"
#include "./intersection/voxel_intersection.wgsl"

var<private> TAU = 6.2831855;

struct Sphere {
    center: vec3<f32>,
    color: vec3<f32>,
    radius: f32,
}

struct Triangle {
    corner_a: vec3<f32>,
    //float
    corner_b: vec3<f32>,
    //float
    corner_c: vec3<f32>,
    //float
    color: vec3<f32>,
    //float
    isLambert: u32,
}

struct Voxel {      // 16 bytes
    position: vec3<f32>,
    _padding0: f32,
    colorIndex: u32,
    objectIndex: u32,
    objectVoxelCount: u32,
    _padding1: u32,
}

struct ObjectData {
    voxels: array<Voxel>,
}

struct ObjectInfo {
    voxelOffset: u32,
    voxelCount: u32,
}

struct Node {
    minCorner: vec3<f32>,
    _padding0: f32,
    leftChild: f32,
    maxCorner: vec3<f32>,
    primitiveCount: f32,
    _padding1: u32,
    objectIndex: f32,
    _padding2: f32,
}

struct BVH {
    nodes: array<Node>,
}

struct ObjectIndices {
    primitiveIndices: array<u32>,
}

struct Ray {
    direction: vec3<f32>,
    origin: vec3<f32>,
}

struct SceneParameters {
    cameraPos: vec3<f32>,
    cameraForwards: vec3<f32>,
    cameraRight: vec3<f32>,
    maxBounces: f32,
    cameraUp: vec3<f32>,
}

struct RenderState {
    t: f32,
    color: vec3<f32>,
    hit: bool,
    position: vec3<f32>,
    normal: vec3<f32>,
    colorIndex: u32,
    objectIndex: u32,
}

struct seed_t {
    v: vec3<i32>,
}

@group(0) @binding(0) var colorBuffer: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(1) var<uniform> sceneParameterBuffer: SceneParameters;
@group(0) @binding(2) var<storage, read> objectBuffer: ObjectData;
@group(0) @binding(3) var<storage, read> objectInfoBuffer: array<ObjectInfo>;
@group(0) @binding(4) var<storage, read> bvhNodeBuffer: BVH;

var<private> seed: u32 = 42069u;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {

    let screen_size: vec2<u32> = vec2<u32>(textureDimensions(colorBuffer));

    let x = GlobalInvocationID.x;
    let y = GlobalInvocationID.y;

    if (x >= screen_size.x || y >= screen_size.y) {
        return;
    }
    let screen_pos: vec2<u32> = vec2<u32>(x, y);

    let horizontal_coefficient: f32 = (f32(screen_pos.x) - f32(screen_size.x) / 2) / f32(screen_size.x);
    let vertical_coefficient: f32 = (f32(screen_pos.y) - f32(screen_size.y) / 2) / f32(screen_size.x);

    let forwards: vec3<f32> = sceneParameterBuffer.cameraForwards;
    let right: vec3<f32> = sceneParameterBuffer.cameraRight;
    let up: vec3<f32> = sceneParameterBuffer.cameraUp;

    var myRay: Ray;
    myRay.direction = normalize(forwards + horizontal_coefficient * right + vertical_coefficient * up);
    myRay.origin = sceneParameterBuffer.cameraPos;

    let pixel_color : vec3<f32> = rayColor(myRay);

    textureStore(colorBuffer, screen_pos, vec4<f32>(pixel_color, 1.0));
}

fn rayColor(ray: Ray) -> vec3<f32> {

    var color: vec3<f32> = vec3(1.0, 1.0, 1.0);
    var result: RenderState;

    var temp_ray: Ray;
    temp_ray.origin = ray.origin;
    temp_ray.direction = ray.direction;

    let bounces: u32 = u32(sceneParameterBuffer.maxBounces);
    for(var bounce: u32 = 0; bounce < bounces; bounce++) {

        result = trace(temp_ray);

        //unpack color
        color = color * result.color;

        //early exit
        if (!result.hit) {
            break;
        }

        //Set up for next trace
        temp_ray.origin = result.position;
        temp_ray.direction = normalize(reflect(temp_ray.direction, result.normal));
    }

    //Rays which reached terminal state and bounced indefinitely
    if (result.hit) {
        color = result.color;
    }

    return color;
}

fn trace(ray: Ray) -> RenderState {

    //Set up the Render State
    var renderState: RenderState;
    renderState.hit = false;
    var nearestHit: f32 = 9999;

    //Set up for BVH Traversal
    var node: Node = bvhNodeBuffer.nodes[0];
    var stack: array<Node, 15>;
    var stackLocation: u32 = 0;

    while (true) {

        var primitiveCount: u32 = u32(node.primitiveCount);
        var contents: u32 = u32(node.leftChild);

        if (primitiveCount == 0) {
            
            // Visualize BVH intersection 
            renderState.color = vec3<f32>(0.3, 0.0, 0.0);

            var child1: Node = bvhNodeBuffer.nodes[contents];
            var child2: Node = bvhNodeBuffer.nodes[contents + 1];

            var distance1: f32 = hit_aabb(ray, child1);
            var distance2: f32 = hit_aabb(ray, child2);

            if (distance1 > distance2) {
                var tempDist: f32 = distance1;
                distance1 = distance2;
                distance2 = tempDist;

                var tempChild: Node = child1;
                child1 = child2;
                child2 = tempChild;
            }
            if (distance1 > nearestHit) {
                if (stackLocation == 0) {
                    break;
                }
                else {
                    stackLocation -= 1;
                    node = stack[stackLocation];
                }
            }
            else {
                node = child1;
                if (distance2 < nearestHit) {
                    stack[stackLocation] = child2;
                    stackLocation += 1;
                }
            }
        }
        else {
            let objectIndex = u32(node.objectIndex);
            let objectInfo = objectInfoBuffer[objectIndex];

            for (var i: u32 = 0u; i < objectInfo.voxelCount; i = i + 1u) {
                let voxelIndex = objectInfo.voxelOffset + i;
                let voxel = objectBuffer.voxels[voxelIndex];
                let newRenderState = hitVoxel(ray, voxel);

                if (newRenderState.hit && newRenderState.t < nearestHit) {
                    nearestHit = newRenderState.t;
                    renderState = newRenderState;
                }
            }

            if (stackLocation == 0) {
                break;
            }
            else {
                stackLocation -= 1;
                node = stack[stackLocation];
            }
        }
    }

    if (!renderState.hit) {
        //sky color
        let skyColor: vec3<f32> = pbrSkyColor(ray.direction);
        renderState.color = skyColor;
    }

    return renderState;
}

fn hit_aabb(ray: Ray, node: Node) -> f32 {
    var inverseDir: vec3<f32> = vec3(1.0) / ray.direction;
    var t1: vec3<f32> = (node.minCorner - ray.origin) * inverseDir;
    var t2: vec3<f32> = (node.maxCorner - ray.origin) * inverseDir;
    var tMin: vec3<f32> = min(t1, t2);
    var tMax: vec3<f32> = max(t1, t2);

    var t_min: f32 = max(max(tMin.x, tMin.y), tMin.z);
    var t_max: f32 = min(min(tMax.x, tMax.y), tMax.z);

    if (t_min > t_max || t_max < 0) {
        return 99999.0;
    }
    else {
        return t_min;
    }
}

fn random_cos_weighted_hemisphere_direction(n: vec3<f32>) -> vec3<f32> {
    let  r = vec2<f32>(random(), random());
    let uu = normalize(cross(n, select(vec3<f32>(0,1,0), vec3<f32>(1,0,0), abs(n.y) > .5)));
    let vv = cross(uu, n);
    let ra = sqrt(r.y);
    let rx = ra * cos(TAU * r.x);
    let ry = ra * sin(TAU * r.x);
    let rz = sqrt(1. - r.y);
    let rr = vec3<f32>(rx * uu + ry * vv + rz * n);
    return normalize(rr);
}