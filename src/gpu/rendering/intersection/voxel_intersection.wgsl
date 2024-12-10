#include "./aabb_intersection.wgsl"

fn hitVoxel(ray: Ray, voxel: Voxel) -> RenderState {
    var renderState: RenderState;
    renderState.hit = false;

    // Calculate voxel bounds (unit size)
    let voxel_min = voxel.position;
    let voxel_max = voxel.position + vec3<f32>(1.0, 1.0, 1.0);

    // Use the same intersection test as BVH
    let hitInfo = rayBoxIntersect(ray, voxel_min, voxel_max);

    if (hitInfo.hit) {
        renderState.hit = true;
        renderState.t = hitInfo.tNear;
        renderState.position = ray.origin + ray.direction * hitInfo.tNear;
        renderState.normal = hitInfo.normal;
        renderState.colorIndex = voxel.colorIndex;
        renderState.objectIndex = voxel.objectIndex;
    } else {
        renderState.t = 0.0;
        renderState.color = vec3<f32>(0.0, 0.0, 0.0);
        renderState.position = vec3<f32>(0.0, 0.0, 0.0);
        renderState.normal = vec3<f32>(0.0, 0.0, 0.0);
        renderState.colorIndex = 0u;
        renderState.objectIndex = 0u;
    }

    return renderState;
}