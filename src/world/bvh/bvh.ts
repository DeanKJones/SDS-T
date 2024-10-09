import { vec3 } from "gl-matrix";
import { Node } from "./node";
import { VoxelObject } from "../voxel/voxelObject";

export class BVH {
    nodes: Node[];
    nodesUsed: number;
    objectIndices: number[];

    constructor() {
        this.nodes = [];
        this.nodesUsed = 0;
        this.objectIndices = [];
    }

    buildBVH(objects: VoxelObject[]) {
        this.objectIndices = Array.from({ length: objects.length }, (_, i) => i);

        // Initialize nodes
        const totalNodes = 2 * objects.length - 1;
        this.nodes = new Array(totalNodes);
        for (let i = 0; i < totalNodes; i++) {
            this.nodes[i] = new Node();
        }

        const root: Node = this.nodes[0];
        root.leftChild = 0;
        root.primitiveCount = objects.length;
        root.objectIndex = -1;
        this.nodesUsed = 1;

        this.updateBounds(0, objects, this.objectIndices);
        this.subdivide(0, objects, this.objectIndices);
    }

    updateBounds(nodeIndex: number, objects: VoxelObject[], objectIndices: number[]) {
        const node: Node = this.nodes[nodeIndex];
        node.minCorner = vec3.fromValues(Infinity, Infinity, Infinity);
        node.maxCorner = vec3.fromValues(-Infinity, -Infinity, -Infinity);
    
        for (let i = 0; i < node.primitiveCount; i++) {
            const obj = objects[objectIndices[node.leftChild + i]];
            vec3.min(node.minCorner, node.minCorner, obj.aabb.min);
            vec3.max(node.maxCorner, node.maxCorner, obj.aabb.max);
            node.objectIndex = objectIndices[node.leftChild + i];
        }
    }

    subdivide(nodeIndex: number, objects: VoxelObject[], objectIndices: number[]) {
        const node: Node = this.nodes[nodeIndex];
    
        if (node.primitiveCount <= 1) { // Adjust threshold as needed
            return;
        }
    
        const extent: vec3 = vec3.subtract(vec3.create(), node.maxCorner, node.minCorner);
        let axis = extent.indexOf(Math.max(...extent));
    
        const splitPosition = node.minCorner[axis] + extent[axis] / 2;
    
        let i = node.leftChild;
        let j = i + node.primitiveCount - 1;
    
        while (i <= j) {
            const obj = objects[objectIndices[i]];
            const center = vec3.scale(
                vec3.create(),
                vec3.add(vec3.create(), obj.aabb.min, obj.aabb.max),
                0.5
            );
    
            if (center[axis] < splitPosition) {
                i += 1;
            } else {
                [objectIndices[i], objectIndices[j]] = [objectIndices[j], objectIndices[i]];
                j -= 1;
            }
        }
    
        const leftCount = i - node.leftChild;
        if (leftCount === 0 || leftCount === node.primitiveCount) {
            return;
        }
    
        const leftChildIndex = this.nodesUsed++;
        const rightChildIndex = this.nodesUsed++;
    
        this.nodes[leftChildIndex].leftChild = node.leftChild;
        this.nodes[leftChildIndex].primitiveCount = leftCount;
    
        this.nodes[rightChildIndex].leftChild = i;
        this.nodes[rightChildIndex].primitiveCount = node.primitiveCount - leftCount;
    
        node.leftChild = leftChildIndex;
        node.primitiveCount = 0;
    
        this.updateBounds(leftChildIndex, objects, objectIndices);
        this.updateBounds(rightChildIndex, objects, objectIndices);
        this.subdivide(leftChildIndex, objects, objectIndices);
        this.subdivide(rightChildIndex, objects, objectIndices);
    }
}