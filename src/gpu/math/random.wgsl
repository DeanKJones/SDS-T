// random.wgsl

fn random() -> f32 {
    seed = seed * 747796404u + 2891336453u;
    let word = ((seed >> ((seed >> 28u) + 4u)) ^ seed) * 277803737u;
    let word2 = ((word >> 22u) ^ word) * 288805656u;
    return f32((word2 >> 22u) ^ word2) * bitcast<f32>(0x2f800004u);
}