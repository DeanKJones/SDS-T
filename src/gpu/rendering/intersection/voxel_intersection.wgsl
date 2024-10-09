// voxel_intersection.wgsl

fn hitVoxel(ray: Ray, voxel: Voxel) -> RenderState {
    let voxel_min = voxel.position;
    let voxel_max = voxel.position + vec3<f32>(1.0, 1.0, 1.0); // Assuming unit-sized voxels

    let t1 = (voxel_min - ray.origin) / ray.direction;
    let t2 = (voxel_max - ray.origin) / ray.direction;

    let tmin = min(t1, t2);
    let tmax = max(t1, t2);

    let tNear = max(max(tmin.x, tmin.y), tmin.z);
    let tFar = min(min(tmax.x, tmax.y), tmax.z);

    var renderState: RenderState;
    renderState.hit = false;

    if (tNear < tFar && tFar > 0.0) {
        renderState.hit = true;
        renderState.t = tNear;
        renderState.position = ray.origin + ray.direction * tNear;

        // Calculate normal based on which face was hit
        let epsilon = 0.0001;
        if (abs(renderState.position.x - voxel_min.x) < epsilon) {
            renderState.normal = vec3<f32>(-1.0, 0.0, 0.0);
        } else if (abs(renderState.position.x - voxel_max.x) < epsilon) {
            renderState.normal = vec3<f32>(1.0, 0.0, 0.0);
        } else if (abs(renderState.position.y - voxel_min.y) < epsilon) {
            renderState.normal = vec3<f32>(0.0, -1.0, 0.0);
        } else if (abs(renderState.position.y - voxel_max.y) < epsilon) {
            renderState.normal = vec3<f32>(0.0, 1.0, 0.0);
        } else if (abs(renderState.position.z - voxel_min.z) < epsilon) {
            renderState.normal = vec3<f32>(0.0, 0.0, -1.0);
        } else {
            renderState.normal = vec3<f32>(0.0, 0.0, 1.0);
        }

        renderState.colorIndex = voxel.colorIndex;
        renderState.objectIndex = voxel.objectIndex;
    }

    return renderState;
}