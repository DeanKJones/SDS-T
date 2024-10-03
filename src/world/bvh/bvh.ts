import { vec3 } from "gl-matrix";
import { Node } from "./node";
import { SceneData } from "../management/scene_data";

export class BVH {
    data: SceneData;

    constructor(sceneData: SceneData) {
        this.data = sceneData;
    }

    buildBVH() {
        // I want to update this to loop over voxel svo bounding boxes, geometry bounding boxes and other types
        // Flatten all voxels from all voxel objects into a single array
        const allVoxels: {position: vec3, colorIndex: number, objectIndex: number}[] = [];
        this.data.voxelObjects.forEach((voxelObject, objectIndex) => {
            for (let i = 0; i < voxelObject.voxels.length; i += 4) {
                allVoxels.push({
                    position: vec3.fromValues(
                        voxelObject.voxels[i].x,
                        voxelObject.voxels[i].y,
                        voxelObject.voxels[i].z
                    ),
                    colorIndex: voxelObject.voxels[i].colorIndex,
                    objectIndex: objectIndex
                });
            }
        });

        this.data.voxelCount = allVoxels.length;
        this.data.voxelIndices = Array.from({ length: this.data.voxelCount }, (_, i) => i);

        // Create nodes for the BVH
        this.data.nodes = new Array(2 * this.data.voxelCount - 1);
        for (let i = 0; i < 2 * this.data.voxelCount - 1; i++) {
            this.data.nodes[i] = new Node();
        }

        const root: Node = this.data.nodes[0];
        root.leftChild = 0;
        root.primitiveCount = this.data.voxelCount;
        this.data.nodesUsed = 1;

        this.updateBounds(0, allVoxels, this.data.voxelIndices);
        this.subdivide(0, allVoxels, this.data.voxelIndices);
    }

    updateBounds(nodeIndex: number, voxels: {position: vec3, colorIndex: number, objectIndex: number}[], voxelIndices: number[]) {
        const node: Node = this.data.nodes[nodeIndex];
        node.minCorner = vec3.fromValues(Infinity, Infinity, Infinity);
        node.maxCorner = vec3.fromValues(-Infinity, -Infinity, -Infinity);

        for (let i = 0; i < node.primitiveCount; i++) {
            const voxel = voxels[voxelIndices[node.leftChild + i]];
            vec3.min(node.minCorner, node.minCorner, voxel.position);
            vec3.max(node.maxCorner, node.maxCorner, voxel.position);
        }
    }

    subdivide(nodeIndex: number, voxels: {position: vec3, colorIndex: number, objectIndex: number}[], voxelIndices: number[]) {
        const node: Node = this.data.nodes[nodeIndex];

        if (node.primitiveCount <= 27) { // You can adjust this threshold
            return;                     // I'm using 27 which effectively seperates the voxels by their svos
        }

        const extent: vec3 = vec3.subtract(vec3.create(), node.maxCorner, node.minCorner);
        let axis = 0;
        if (extent[1] > extent[axis]) axis = 1;
        if (extent[2] > extent[axis]) axis = 2;

        const splitPosition = node.minCorner[axis] + extent[axis] / 2;

        let i = node.leftChild;
        let j = i + node.primitiveCount - 1;

        while (i <= j) {
            if (voxels[voxelIndices[i]].position[axis] < splitPosition) {
                i += 1;
            } else {
                const temp = voxelIndices[i];
                voxelIndices[i] = voxelIndices[j];
                voxelIndices[j] = temp;
                j -= 1;
            }
        }

        const leftCount = i - node.leftChild;
        if (leftCount === 0 || leftCount === node.primitiveCount) {
            return;
        }

        const leftChildIndex = this.data.nodesUsed;
        this.data.nodesUsed += 1;
        const rightChildIndex = this.data.nodesUsed;
        this.data.nodesUsed += 1;

        this.data.nodes[leftChildIndex].leftChild = node.leftChild;
        this.data.nodes[leftChildIndex].primitiveCount = leftCount;

        this.data.nodes[rightChildIndex].leftChild = i;
        this.data.nodes[rightChildIndex].primitiveCount = node.primitiveCount - leftCount;

        node.leftChild = leftChildIndex;
        node.primitiveCount = 0;

        this.updateBounds(leftChildIndex, voxels, voxelIndices);
        this.updateBounds(rightChildIndex, voxels, voxelIndices);
        this.subdivide(leftChildIndex, voxels, voxelIndices);
        this.subdivide(rightChildIndex, voxels, voxelIndices);
    }
}