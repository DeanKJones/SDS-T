

fn trace_DEBUG_BVH(ray: Ray) -> RenderState {
    var renderState: RenderState;
    renderState.hit = false;
    renderState.color = vec3<f32>(0.0);

    // Debug colors
    let ROOT_COLOR = vec3<f32>(0.3, 0.0, 0.0);      // Strong red for root
    let INTERNAL_COLOR = vec3<f32>(0.0, 0.3, 0.0);  // Strong green for internal
    let LEAF_COLOR = vec3<f32>(0.0, 0.0, 0.3);      // Strong blue for leaf

    var debugColor = vec3<f32>(0.0);
    var stack: array<u32, 64>;
    var stackPtr: i32 = 0;
    stack[stackPtr] = 0u;  // Start with root

    // Add debug print
    debugColor += ROOT_COLOR;

    while (stackPtr >= 0) {
        let nodeIndex = stack[stackPtr];
        stackPtr -= 1;

        let node = bvhNodeBuffer.nodes[nodeIndex];
        
        // Print current node state
        if (nodeIndex == 0u) {
            debugColor += ROOT_COLOR;
        }

        // Test intersection with node bounds
        let intersectsBox = boolHitAABB(ray, node);
        if (!intersectsBox) {
            continue;
        }

        // Add hit intensity
        debugColor += vec3<f32>(0.1);

        // Process based on node type
        if (node.objectIndex >= 0) {
            // Leaf node
            debugColor += LEAF_COLOR;
            
            let object = objectInfoBuffer[node.objectIndex];
            
            // Process voxels in this leaf
            for (var i = 0u; i < object.voxelCount; i = i + 1u) {
                let voxelIndex = object.voxelOffset + i;
                let voxel = objectBuffer.voxels[voxelIndex];
                let result = hitVoxel(ray, voxel);
                
                if (result.hit) {
                    renderState = result;
                    renderState.color = vec3<f32>(0.8, 0.2, 0.2);
                    // Don't return yet - continue checking other voxels
                }
            }
        } else {
            // Internal node - push children
            debugColor += INTERNAL_COLOR;
            
            // Always push both children if we have stack space
            if (stackPtr < 62) {
                // Push right child first (processed last)
                stackPtr += 1;
                stack[stackPtr] = node.leftChild + 1u;
                
                // Push left child
                stackPtr += 1;
                stack[stackPtr] = node.leftChild;
            }
        }
    }

    // If no hit, show traversal visualization
    if (!renderState.hit) {
        renderState.color = debugColor;
    }

    return renderState;
}


fn trace(ray: Ray) -> RenderState {
    var renderState: RenderState;
    renderState.hit = false;
    renderState.color = vec3<f32>(0.0, 0.0, 0.0);

    var stack: array<u32, 64>;
    var stackPtr: i32 = 0;
    stack[stackPtr] = 0u;  // Root node

    // Debug visualization
    var traversalDepth: f32 = 0.0;

    while (stackPtr >= 0) {
        let nodeIndex = stack[stackPtr];
        stackPtr -= 1;

        let node = bvhNodeBuffer.nodes[nodeIndex];
        
        // Increment depth for visualization
        traversalDepth += 0.2;

        if (!boolHitAABB(ray, node)) {
            continue;
        }

        // Add visualization color
        renderState.color += vec3<f32>(0.1 * traversalDepth, 0.02, 0.02);

        if (node.objectIndex >= 0) {
            // Leaf node processing
            let object = objectInfoBuffer[node.objectIndex];
            for (var i = 0u; i < object.voxelCount; i = i + 1u) {
                let voxelIndex = object.voxelOffset + i;
                let voxel = objectBuffer.voxels[voxelIndex];
                let result = hitVoxel(ray, voxel);
                
                if (result.hit) {
                    renderState = result;
                    renderState.color = vec3<f32>(0.8, 0.2 * traversalDepth, 0.2);
                    return renderState;  // Early exit on hit
                }
            }
        } else {
            // Push children (right first so left is processed first)
            if (node.leftChild + 1u < arrayLength(&bvhNodeBuffer.nodes)) {
                stackPtr += 1;
                stack[stackPtr] = node.leftChild + 1u;  // Right child
            }
            if (node.leftChild < arrayLength(&bvhNodeBuffer.nodes)) {
                stackPtr += 1;
                stack[stackPtr] = node.leftChild;       // Left child
            }
        }
    }

    if (!renderState.hit) {
        // Sky color or debug visualization
        renderState.color = mix(
            pbrSkyColor(ray.direction),  // Sky color
            renderState.color,           // Debug color
            0.5                          // Mix factor
        );
    }

    return renderState;
}
