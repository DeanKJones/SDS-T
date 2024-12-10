
struct RayHitInfo {
    hit: bool,
    tNear: f32,
    tFar: f32,
    normal: vec3<f32>,
}

// Common intersection test function to ensure consistency
fn rayBoxIntersect(ray: Ray, boxMin: vec3<f32>, boxMax: vec3<f32>) -> RayHitInfo {
    var hitInfo: RayHitInfo;
    hitInfo.hit = false;
    hitInfo.tNear = -99999.0;
    hitInfo.tFar = 99999.0;

    let dirfrac = vec3<f32>(
        1.0 / (ray.direction.x + 0.00001),
        1.0 / (ray.direction.y + 0.00001),
        1.0 / (ray.direction.z + 0.00001)
    );

    // Calculate intersections with slabs
    let t1 = (boxMin - ray.origin) * dirfrac;
    let t2 = (boxMax - ray.origin) * dirfrac;

    // Find largest entry and smallest exit
    let tmin = max(max(min(t1.x, t2.x), min(t1.y, t2.y)), min(t1.z, t2.z));
    let tmax = min(min(max(t1.x, t2.x), max(t1.y, t2.y)), max(t1.z, t2.z));

    // Check if there is a valid intersection
    hitInfo.hit = tmax >= 0.0 && tmax >= tmin;
    hitInfo.tNear = tmin;
    hitInfo.tFar = tmax;

    // Calculate hit normal if there is an intersection
    if (hitInfo.hit) {
        let hitPoint = ray.origin + ray.direction * tmin;
        let epsilon = 0.0001;
        
        // Determine which face was hit by comparing hit point with bounds
        if (abs(hitPoint.x - boxMin.x) < epsilon) {
            hitInfo.normal = vec3<f32>(-1.0, 0.0, 0.0);
        } else if (abs(hitPoint.x - boxMax.x) < epsilon) {
            hitInfo.normal = vec3<f32>(1.0, 0.0, 0.0);
        } else if (abs(hitPoint.y - boxMin.y) < epsilon) {
            hitInfo.normal = vec3<f32>(0.0, -1.0, 0.0);
        } else if (abs(hitPoint.y - boxMax.y) < epsilon) {
            hitInfo.normal = vec3<f32>(0.0, 1.0, 0.0);
        } else if (abs(hitPoint.z - boxMin.z) < epsilon) {
            hitInfo.normal = vec3<f32>(0.0, 0.0, -1.0);
        } else {
            hitInfo.normal = vec3<f32>(0.0, 0.0, 1.0);
        }
    }

    return hitInfo;
}

//fn boolHitAABB(ray: Ray, node: Node) -> bool {
//    let hitInfo = rayBoxIntersect(ray, node.minCorner, node.maxCorner);
//    return hitInfo.hit;
//}

fn boolHitAABB(ray: Ray, node: Node) -> bool {
    let invDir = vec3<f32>(1.0 / (ray.direction + vec3<f32>(0.000001)));
    
    let t1 = (node.minCorner - ray.origin) * invDir;
    let t2 = (node.maxCorner - ray.origin) * invDir;
    
    let tmin = min(t1, t2);
    let tmax = max(t1, t2);
    
    let tNear = max(max(tmin.x, tmin.y), tmin.z);
    let tFar = min(min(tmax.x, tmax.y), tmax.z);
    
    return tFar >= max(0.0, tNear);
}