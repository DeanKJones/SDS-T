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
        console.log("Starting BVH construction with", objects.length, "objects");
        
        this.objectIndices = Array.from({ length: objects.length }, (_, i) => i);

        // Initialize nodes
        const totalNodes = 2 * objects.length - 1;
        this.nodes = new Array(totalNodes);
        for (let i = 0; i < totalNodes; i++) {
            this.nodes[i] = new Node();
        }

        // Initialize root
        const root: Node = this.nodes[0];
        this.nodesUsed = 1;  // Start with just root node

        if (objects.length === 1) {
            // Special case for single object
            root.leftChild = 0;
            root.primitiveCount = 1;
            root.objectIndex = 0;
            this.updateBounds(0, objects, this.objectIndices);
            console.log("Created single-node BVH", {
                bounds: {
                    min: Array.from(root.minCorner),
                    max: Array.from(root.maxCorner)
                },
                objectIndex: root.objectIndex
            });
            return;
        }

        // Multiple objects case
        root.leftChild = 1;  // Next available node index
        root.primitiveCount = objects.length;
        root.objectIndex = -1;  // Not a leaf

        this.updateBounds(0, objects, this.objectIndices);
        this.subdivide(0, objects, this.objectIndices);

        console.log("BVH Construction completed:", {
            totalNodes: this.nodesUsed,
            rootBounds: {
                min: Array.from(root.minCorner),
                max: Array.from(root.maxCorner)
            }
        });
    }

    updateBounds(nodeIndex: number, objects: VoxelObject[], objectIndices: number[]) {
        const node: Node = this.nodes[nodeIndex];
        node.minCorner = vec3.fromValues(Infinity, Infinity, Infinity);
        node.maxCorner = vec3.fromValues(-Infinity, -Infinity, -Infinity);

        for (let i = 0; i < node.primitiveCount; ++i) {
            const objIndex = objectIndices[node.leftChild + i];
            const obj = objects[i];     
        
            if (!obj || !obj.aabb) {
                console.warn(`VoxelObject at index ${objIndex} is missing or missing aabb.`);
                continue;
            }

            vec3.min(node.minCorner, node.minCorner, obj.aabb.min);
            vec3.max(node.maxCorner, node.maxCorner, obj.aabb.max);

            // Add debug logging
            console.log(`Object ${i} AABB:`, {
                min: Array.from(obj.aabb.min),
                max: Array.from(obj.aabb.max)
            });
        } 

        // Log final node bounds
        console.log(`Node ${nodeIndex} final bounds:`, {
            min: Array.from(node.minCorner),
            max: Array.from(node.maxCorner)
        });
    }

    subdivide(nodeIndex: number, objects: VoxelObject[], objectIndices: number[]) {
        const node: Node = this.nodes[nodeIndex];
        
        console.log(`Subdividing node ${nodeIndex}:`, {
            primitiveCount: node.primitiveCount,
            leftChild: node.leftChild,
            objectIndex: node.objectIndex
        });

        // Base case - create leaf
        if (node.primitiveCount <= 1) {
            node.objectIndex = objectIndices[node.leftChild];
            console.log(`Created leaf node ${nodeIndex} with object ${node.objectIndex}`);
            return;
        }

        // Find split axis and position
        const extent: vec3 = vec3.subtract(vec3.create(), node.maxCorner, node.minCorner);
        const axis = extent.indexOf(Math.max(...extent));
        const splitPosition = node.minCorner[axis] + extent[axis] / 2;

        // Partition objects
        let startIndex = node.leftChild;
        let endIndex = startIndex + node.primitiveCount - 1;
        let splitIndex = startIndex;

        if (splitIndex >= 0 && splitIndex < objectIndices.length) {
            const objectIndex = objectIndices[splitIndex];
            if (objectIndex >= 0 && objectIndex < objects.length) {
              const obj = objects[objectIndex];
            
                const center = vec3.scale(
                    vec3.create(),
                    vec3.add(vec3.create(), obj.aabb.min, obj.aabb.max),
                    0.5
                );

                if (center[axis] < splitPosition) {
                    splitIndex++;
                } else {
                    [objectIndices[splitIndex], objectIndices[endIndex]] = 
                    [objectIndices[endIndex], objectIndices[splitIndex]];
                    endIndex--;
                }
            } else {
                console.error('objectIndex out of bounds');
            }
        } else {
            console.error('splitIndex out of bounds');
        }

        const leftCount = splitIndex - startIndex;
        
        // Check if split was successful
        if (leftCount === 0 || leftCount === node.primitiveCount) {
            // Couldn't split - make leaf node
            node.objectIndex = objectIndices[node.leftChild];
            console.log(`Created forced leaf node ${nodeIndex} with object ${node.objectIndex}`);
            return;
        }

        // Create child nodes
        const leftChildIndex = this.nodesUsed++;
        const rightChildIndex = this.nodesUsed++;

        // Set up left child
        this.nodes[leftChildIndex].leftChild = startIndex;
        this.nodes[leftChildIndex].primitiveCount = leftCount;
        this.nodes[leftChildIndex].objectIndex = -1;

        // Set up right child
        this.nodes[rightChildIndex].leftChild = splitIndex;
        this.nodes[rightChildIndex].primitiveCount = node.primitiveCount - leftCount;
        this.nodes[rightChildIndex].objectIndex = -1;

        // Update parent
        node.leftChild = leftChildIndex;
        node.primitiveCount = 0;
        node.objectIndex = -1;

        console.log(`Created internal node ${nodeIndex} with children ${leftChildIndex}, ${rightChildIndex}`);

        // Process children
        this.updateBounds(leftChildIndex, objects, objectIndices);
        this.updateBounds(rightChildIndex, objects, objectIndices);
        
        this.subdivide(leftChildIndex, objects, objectIndices);
        this.subdivide(rightChildIndex, objects, objectIndices);
    }
}