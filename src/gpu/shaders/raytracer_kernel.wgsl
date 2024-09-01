#include "pbr_sky.wgsl"

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
    position: vec3<f32>,
    colorIndex: u32,
    objectIndex: u32,
}

struct ObjectData {
    voxels: array<Voxel>,
}

struct Node {
    minCorner: vec3<f32>,
    leftChild: f32,
    maxCorner: vec3<f32>,
    primitiveCount: f32,
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

struct SceneData {
    cameraPos: vec3<f32>,
    cameraForwards: vec3<f32>,
    cameraRight: vec3<f32>,
    maxBounces: f32,
    cameraUp: vec3<f32>,
    primitiveCount: f32,
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

@group(0) @binding(0) var color_buffer: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(1) var<uniform> scene: SceneData;
@group(0) @binding(2) var<storage, read> objects: ObjectData;
@group(0) @binding(3) var<storage, read> bvh_nodes: BVH;
@group(0) @binding(4) var<storage, read> voxel_indices: ObjectIndices;

var<private> seed: u32 = 42069u;

@compute @workgroup_size(1,1,1)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {

    let screen_size: vec2<i32> = vec2<i32>(textureDimensions(color_buffer));
    let screen_pos : vec2<i32> = vec2<i32>(i32(GlobalInvocationID.x), i32(GlobalInvocationID.y));

    let horizontal_coefficient: f32 = (f32(screen_pos.x) - f32(screen_size.x) / 2) / f32(screen_size.x);
    let vertical_coefficient: f32 = (f32(screen_pos.y) - f32(screen_size.y) / 2) / f32(screen_size.x);

    let forwards: vec3<f32> = scene.cameraForwards;
    let right: vec3<f32> = scene.cameraRight;
    let up: vec3<f32> = scene.cameraUp;

    var myRay: Ray;
    myRay.direction = normalize(forwards + horizontal_coefficient * right + vertical_coefficient * up);
    myRay.origin = scene.cameraPos;

    let pixel_color : vec3<f32> = rayColor(myRay);

    textureStore(color_buffer, screen_pos, vec4<f32>(pixel_color, 1.0));
}

fn rayColor(ray: Ray) -> vec3<f32> {

    var color: vec3<f32> = vec3(1.0, 1.0, 1.0);
    var result: RenderState;

    var temp_ray: Ray;
    temp_ray.origin = ray.origin;
    temp_ray.direction = ray.direction;

    let bounces: u32 = u32(scene.maxBounces);
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
    var node: Node = bvh_nodes.nodes[0];
    var stack: array<Node, 15>;
    var stackLocation: u32 = 0;

    while (true) {

        var primitiveCount: u32 = u32(node.primitiveCount);
        var contents: u32 = u32(node.leftChild);

        if (primitiveCount == 0) {
            var child1: Node = bvh_nodes.nodes[contents];
            var child2: Node = bvh_nodes.nodes[contents + 1];

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
            for (var i: u32 = 0; i < primitiveCount; i++) {
        
                var newRenderState: RenderState = hitVoxel(
                    ray, 
                    objects.voxels[u32(i + contents)],
                    nearestHit
                );
                if (newRenderState.hit) {
                    if (newRenderState.t < nearestHit) {
                        nearestHit = newRenderState.t;
                        renderState = newRenderState;
                    }
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

fn hit_sphere(ray: Ray, sphere: Sphere, tMin: f32, tMax: f32, oldRenderState: RenderState) -> RenderState {
    
    let co: vec3<f32> = ray.origin - sphere.center;
    let a: f32 = dot(ray.direction, ray.direction);
    let b: f32 = 2.0 * dot(ray.direction, co);
    let c: f32 = dot(co, co) - sphere.radius * sphere.radius;
    let discriminant: f32 = b * b - 4.0 * a * c;

    var renderState: RenderState;
    renderState.color = oldRenderState.color;

    if (discriminant > 0.0) {

        let t: f32 = (-b - sqrt(discriminant)) / (2 * a);

        if (t > tMin && t < tMax) {

            renderState.position = ray.origin + t * ray.direction;
            renderState.normal = normalize(renderState.position - sphere.center);
            renderState.t = t;
            renderState.color = sphere.color;
            renderState.hit = true;
            return renderState;
        }
    }

    renderState.hit = false;
    return renderState;
    
}

fn hit_triangle(ray: Ray, tri: Triangle, tMin: f32, tMax: f32, oldRenderState: RenderState) -> RenderState {
    
    //Set up a blank renderstate,
    //right now this hasn't hit anything
    var renderState: RenderState;
    renderState.color = oldRenderState.color;
    renderState.hit = false;

    //Direction vectors
    let edge_ab: vec3<f32> = tri.corner_b - tri.corner_a;
    let edge_ac: vec3<f32> = tri.corner_c - tri.corner_a;
    //Normal of the triangle
    var n: vec3<f32> = normalize(cross(edge_ab, edge_ac));
    var ray_dot_tri: f32 = dot(ray.direction, n);
    
    //backface reversal
    if (ray_dot_tri > 0.0) {
        ray_dot_tri = ray_dot_tri * -1;
        n = n * 1; // idk why but this seemed to have fixed an issue with backface material scattering
    }
    //early exit, ray parallel with triangle surface
    if (abs(ray_dot_tri) < 0.00001) {
        return renderState;
    }

    var system_matrix: mat3x3<f32> = mat3x3<f32>(
        ray.direction,
        tri.corner_a - tri.corner_b,
        tri.corner_a - tri.corner_c
    );
    let denominator: f32 = determinant(system_matrix);
    if (abs(denominator) < 0.00001) {
        return renderState;
    }

    system_matrix = mat3x3<f32>(
        ray.direction,
        tri.corner_a - ray.origin,
        tri.corner_a - tri.corner_c
    );
    let u: f32 = determinant(system_matrix) / denominator;
    
    if (u < 0.0 || u > 1.0) {
        return renderState;
    }

    system_matrix = mat3x3<f32>(
        ray.direction,
        tri.corner_a - tri.corner_b,
        tri.corner_a - ray.origin,
    );
    let v: f32 = determinant(system_matrix) / denominator;
    if (v < 0.0 || u + v > 1.0) {
        return renderState;
    }

    system_matrix = mat3x3<f32>(
        tri.corner_a - ray.origin,
        tri.corner_a - tri.corner_b,
        tri.corner_a - tri.corner_c
    );
    let t: f32 = determinant(system_matrix) / denominator;

    if (t > tMin && t < tMax) {

        renderState.position = ray.origin + t * ray.direction;
        renderState.normal = n;
        renderState.color = tri.color;
        renderState.t = t;
        renderState.hit = true;
        return renderState;
    }
    return renderState;
}

fn hitVoxel(ray: Ray, voxel: Voxel, currentDepth: f32) -> RenderState {
    let voxel_min = voxel.position;
    let voxel_max = voxel.position + vec3<f32>(1.0, 1.0, 1.0); // Assuming unit-sized voxels

    var renderState: RenderState;
    renderState.hit = false;

    let tNear = hit_aabb_voxel(ray, voxel_min, voxel_max);

    if (tNear >= 0.0 && tNear < currentDepth) {
        let intersectionPoint = ray.origin + ray.direction * tNear;

        // Calculate normal based on which face was hit
        let epsilon = 0.0001;
        var normal: vec3<f32>;
        if (abs(intersectionPoint.x - voxel_min.x) < epsilon) {
            normal = vec3<f32>(-1.0, 0.0, 0.0);
        } else if (abs(intersectionPoint.x - voxel_max.x) < epsilon) {
            normal = vec3<f32>(1.0, 0.0, 0.0);
        } else if (abs(intersectionPoint.y - voxel_min.y) < epsilon) {
            normal = vec3<f32>(0.0, -1.0, 0.0);
        } else if (abs(intersectionPoint.y - voxel_max.y) < epsilon) {
            normal = vec3<f32>(0.0, 1.0, 0.0);
        } else if (abs(intersectionPoint.z - voxel_min.z) < epsilon) {
            normal = vec3<f32>(0.0, 0.0, -1.0);
        } else {
            normal = vec3<f32>(0.0, 0.0, 1.0);
        }

        // Backface culling
        if (dot(normal, ray.direction) < 0.0) {
            renderState.hit = true;
            renderState.t = tNear;
            renderState.position = intersectionPoint;
            renderState.normal = normal;
            renderState.objectIndex = voxel.objectIndex;
            renderState.colorIndex = voxel.colorIndex;

            // manage voxel color index
            // I would like to pass a color pallet as an image texture. 
            // Then reading each color index over the sampled pixel colors can save some space
            // For now it's just red
            renderState.color = vec3<f32>(1.0, 0.0, 0.0);
        }
    }
    return renderState;
}

fn hit_aabb_voxel(ray: Ray, minCorner: vec3<f32>, maxCorner: vec3<f32>) -> f32 {
    var inverseDir: vec3<f32> = vec3(1.0) / ray.direction;
    var t1: vec3<f32> = (minCorner - ray.origin) * inverseDir;
    var t2: vec3<f32> = (maxCorner - ray.origin) * inverseDir;
    var tMin: vec3<f32> = min(t1, t2);
    var tMax: vec3<f32> = max(t1, t2);

    let tNear = max(max(tMin.x, tMin.y), tMin.z);
    let tFar = min(min(tMax.x, tMax.y), tMax.z);

    if (tNear < tFar && tFar > 0.0) {
        return tNear;
    } else {
        return -1.0; // No hit
    }
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
        return 99999;
    }
    else {
        return t_min;
    }
}

fn random() -> f32 {
    seed = seed * 747796404u + 2891336453u;
    let word = ((seed >> ((seed >> 28u) + 4u)) ^ seed) * 277803737u;
    let word2 = ((word >> 22u) ^ word) * 288805656u;
    return f32((word2 >> 22u) ^ word2) * bitcast<f32>(0x2f800004u);
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