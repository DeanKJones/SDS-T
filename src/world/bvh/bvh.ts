import { vec3 } from "gl-matrix";
import { Node } from "./node";
import { SceneData } from "../management/scene_data";
import { Triangle } from "../geometry/triangle";


export class BVH {
    data: SceneData;

    constructor(sceneData: SceneData) {
        this.data = sceneData;
    }

    buildBVH() {
        const allTriangles = this.data.triangles;
        //this.data.triangleCount = allTriangles.length;
        this.data.triangleIndices = Array.from({ length: this.data.triangleCount }, (_, i) => i);

        this.data.nodes = new Array(2 * this.data.triangleCount - 1);
        for (let i = 0; i < 2 * this.data.triangleCount - 1; i++) {
            this.data.nodes[i] = new Node();
        }

        const root: Node = this.data.nodes[0];
        root.leftChild = 0;
        root.primitiveCount = this.data.triangleCount;
        this.data.nodesUsed += 1;

        this.updateBounds(0, allTriangles, this.data.triangleIndices);
        this.subdivide(0, allTriangles, this.data.triangleIndices);
    }

    updateBounds(nodeIndex: number, triangles: Triangle[], triangleIndices: number[]) {
        const node: Node = this.data.nodes[nodeIndex];
        node.minCorner = [999999, 999999, 999999];
        node.maxCorner = [-999999, -999999, -999999];

        for (let i = 0; i < node.primitiveCount; i++) {
            const triangle: Triangle = triangles[triangleIndices[node.leftChild + i]];

            triangle.vertices.forEach((corner: vec3) => {
                vec3.min(node.minCorner, node.minCorner, corner);
                vec3.max(node.maxCorner, node.maxCorner, corner);
            });
        }
    }

    subdivide(nodeIndex: number, triangles: Triangle[], triangleIndices: number[]) {
        const node: Node = this.data.nodes[nodeIndex];

        if (node.primitiveCount <= 2) {
            return;
        }

        const extent: vec3 = vec3.subtract(vec3.create(), node.maxCorner, node.minCorner);
        let axis = 0;
        if (extent[1] > extent[axis]) {
            axis = 1;
        }
        if (extent[2] > extent[axis]) {
            axis = 2;
        }

        const splitPosition = node.minCorner[axis] + extent[axis] / 2;

        let i = node.leftChild;
        let j = i + node.primitiveCount - 1;

        while (i <= j) {
            if (triangles[triangleIndices[i]].get_centroid()[axis] < splitPosition) {
                i += 1;
            } else {
                const temp = triangleIndices[i];
                triangleIndices[i] = triangleIndices[j];
                triangleIndices[j] = temp;
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

        this.updateBounds(leftChildIndex, triangles, triangleIndices);
        this.updateBounds(rightChildIndex, triangles, triangleIndices);
        this.subdivide(leftChildIndex, triangles, triangleIndices);
        this.subdivide(rightChildIndex, triangles, triangleIndices);
    }
}