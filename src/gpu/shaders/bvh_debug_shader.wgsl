// bvh_debug_shader.wgsl

// Define a structure representing a node in the BVH (Bounding Volume Hierarchy)
struct Node {
    min: vec3<f32>, // Minimum corner of the bounding box
    max: vec3<f32>, // Maximum corner of the bounding box
    leftChild: u32, // Index of the left child node
    primitiveCount: u32, // Number of primitives contained in this node
};

// Declare a storage buffer containing an array of nodes
@group(0) @binding(0) var<storage, read> nodes: array<Node>;
// Declare a uniform buffer containing the view-projection matrix
@group(0) @binding(1) var<uniform> viewProjectionMatrix: mat4x4<f32>;

// Constant representing the number of edges in a cube
const EDGES_PER_CUBE = 12u;

@vertex
fn vertexMain(
    @builtin(instance_index) instanceIndex: u32,    // Index of the current instance
    @builtin(vertex_index) vertexIndex: u32         // Index of the current vertex
) -> @builtin(position) vec4f {
    // Calculate the line instance index and node instance index
    let lineInstanceIdx = instanceIndex % EDGES_PER_CUBE;
    let nodeInstanceIdx = instanceIndex / EDGES_PER_CUBE;
    // Fetch the node corresponding to the current instance
    let node = nodes[nodeInstanceIdx];
    var pos: vec3f;
    let fVertexIndex = f32(vertexIndex);

    // Calculate the dimensions of the bounding box
    let dx = node.max.x - node.min.x;
    let dy = node.max.y - node.min.y;
    let dz = node.max.z - node.min.z;

    // Define the 8 corners of the bounding box
    let a0 = node.min;
    let a1 = vec3f(node.min.x + dx, node.min.y,      node.min.z     );
    let a2 = vec3f(node.min.x + dx, node.min.y,      node.min.z + dz);
    let a3 = vec3f(node.min.x,      node.min.y,      node.min.z + dz);
    let a4 = vec3f(node.min.x,      node.min.y + dy, node.min.z     );
    let a5 = vec3f(node.min.x + dx, node.min.y + dy, node.min.z     );
    let a6 = node.max;
    let a7 = vec3f(node.min.x,      node.min.y + dy, node.min.z + dz);

    // Interpolate between the corners based on the line instance index
    if (lineInstanceIdx == 0) {             // Bottom face
        pos = mix(a0, a1, fVertexIndex);    
    } else if (lineInstanceIdx == 1) {      // Right face
        pos = mix(a1, a2, fVertexIndex);
    } else if (lineInstanceIdx == 2) {      // Top face
        pos = mix(a2, a3, fVertexIndex);
    } else if (lineInstanceIdx == 3) {      // Left face
        pos = mix(a0, a3, fVertexIndex);
    } else if (lineInstanceIdx == 4) {      // Bottom-top edges
        pos = mix(a0, a4, fVertexIndex);
    } else if (lineInstanceIdx == 5) {      // Right-top edges
        pos = mix(a1, a5, fVertexIndex);
    } else if (lineInstanceIdx == 6) {      // Left-top edges
        pos = mix(a2, a6, fVertexIndex);
    } else if (lineInstanceIdx == 7) {      // Bottom-top edges
        pos = mix(a3, a7, fVertexIndex);    
    } else if (lineInstanceIdx == 8) {      // Bottom-top edges
        pos = mix(a4, a5, fVertexIndex);
    } else if (lineInstanceIdx == 9) {      // Right-top edges
        pos = mix(a5, a6, fVertexIndex);
    } else if (lineInstanceIdx == 10) {     // Left-top edges
        pos = mix(a6, a7, fVertexIndex);
    } else if (lineInstanceIdx == 11) {     // Bottom-top edges
        pos = mix(a7, a4, fVertexIndex);
    }
    // Transform the position to clip space
    return viewProjectionMatrix * vec4(pos, 1);
}

@fragment
fn fragmentMain() -> @location(0) vec4f {
    // Output a constant color
    return vec4f(1.0, 1.0, 1.0, 1.0);
}