// pbr_sky.wgsl

fn pbrSkyColor(direction: vec3<f32>) -> vec3<f32> {
    // Simple gradient sky model
    let t: f32 = 0.5 * (direction.y + 1.0);
    let skyColor: vec3<f32> = mix(vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(0.5, 0.7, 1.0), t);
    return skyColor;
}