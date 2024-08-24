struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) depth: f32,
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) depth: f32,
};

struct Uniforms {
    viewProjectionMatrix: mat4x4<f32>,
    maxDepth: f32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.position = uniforms.viewProjectionMatrix * vec4<f32>(input.position, 1.0);
    output.depth = input.depth;
    return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
    let alpha = 1.0 - (input.depth / uniforms.maxDepth);
    return vec4<f32>(1.0, 1.0, 1.0, alpha);
}