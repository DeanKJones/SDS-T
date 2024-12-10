#include "./pbr_sky.wgsl"
#include "./trace_scene.wgsl"
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

struct Voxel {
    position: vec3<f32>,     // 12 bytes + 4 bytes padding = 16 bytes
    colorIndex: u32,         // 4 bytes
    objectIndex: u32,        // 4 bytes
    objectVoxelCount: u32,   // 4 bytes
    padding: u32,            // 4 bytes (to make total size 32 bytes)
    triangles: array<Triangle>, // New field for triangles
}

struct ObjectData {
    voxels: array<Voxel>,
}

struct ObjectInfo {
    voxelOffset: u32,   // 4 bytes
    voxelCount: u32,    // 4 bytes
    padding1: u32,      // 4 bytes
    padding2: u32,      // 4 bytes
}

struct Node {
    minCorner: vec3<f32>,   // 12 bytes + 4 bytes padding = 16 bytes
    maxCorner: vec3<f32>,   // 12 bytes + 4 bytes padding = 16 bytes
    leftChild: u32,         // 4 bytes
    primitiveCount: u32,    // 4 bytes
    objectIndex: i32,       // 4 bytes
    padding: u32,           // 4 bytes
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

        result = trace_DEBUG_BVH(temp_ray); // debugging trace function used to visualize BVH traversal

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