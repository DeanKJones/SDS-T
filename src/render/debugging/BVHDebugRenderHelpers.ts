import { vec3 } from 'gl-matrix';
import { Node } from '../../world/bvh/node';

export function generateBVHLineVertices(nodes: Array<Node>): Float32Array {
    const lines: number[] = [];
    let maxDepth = 0;

    function processNode(nodeIndex: number, depth: number) {
        const node = nodes[nodeIndex];
        maxDepth = Math.max(maxDepth, depth);

        const corners = [
            node.minCorner,
            vec3.fromValues(node.maxCorner[0], node.minCorner[1], node.minCorner[2]),
            vec3.fromValues(node.maxCorner[0], node.maxCorner[1], node.minCorner[2]),
            vec3.fromValues(node.minCorner[0], node.maxCorner[1], node.minCorner[2]),
            vec3.fromValues(node.minCorner[0], node.minCorner[1], node.maxCorner[2]),
            vec3.fromValues(node.maxCorner[0], node.minCorner[1], node.maxCorner[2]),
            node.maxCorner,
            vec3.fromValues(node.minCorner[0], node.maxCorner[1], node.maxCorner[2]),
        ];

        for (let i = 0; i < 4; i++) {
            lines.push(...corners[i], depth, ...corners[(i + 1) % 4], depth);
            lines.push(...corners[i + 4], depth, ...corners[((i + 1) % 4) + 4], depth);
            lines.push(...corners[i], depth, ...corners[i + 4], depth);
        }

        if (node.primitiveCount === 0) {
            processNode(node.leftChild, depth + 1);
            processNode(node.leftChild + 1, depth + 1);
        }
    }

    processNode(0, 0); // Start from the root node
    return new Float32Array(lines);
}