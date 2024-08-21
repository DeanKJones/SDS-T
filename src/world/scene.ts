import { Triangle } from "./geometry/triangle";
import { Camera } from "./camera";
import { Node } from "./bvh/node";
import { vec3 } from "gl-matrix";
import { SceneData } from "./management/scene_data";

export class Scene {
    data: SceneData;

    constructor() {

        this.data = new SceneData();

        const colorRed: vec3 = [
            1, 0, 0
        ];
        const colorBlue: vec3 = [
            0, 0, 1
        ]; 
        const colorGrey: vec3 = [
            0.9, 0.9, 0.9
        ]

        const cubeVerts = {
            bottom_left_front:  [-2.5, 0.0, 2.5] as vec3,
            bottom_left_back:   [-2.5, 0.0, -2.5] as vec3,
            bottom_right_front: [2.5, 0.0, 2.5] as vec3,
            bottom_right_back:  [2.5, 0.0, -2.5] as vec3,
            top_left_front:     [-2.5, 5.0, 2.5] as vec3,
            top_right_front:    [2.5, 5.0, 2.5] as vec3,
            top_left_back:      [-2.5, 5.0, -2.5] as vec3,
            top_right_back:     [2.5, 5.0, -2.5] as vec3,
        };
        

        const t_floor_1 = new Triangle( cubeVerts.bottom_left_front, 
                                        cubeVerts.bottom_left_back, 
                                        cubeVerts.bottom_right_back, colorGrey);
        const t_floor_2 = new Triangle( cubeVerts.bottom_left_front,  
                                        cubeVerts.bottom_right_back,
                                        cubeVerts.bottom_right_front, colorGrey);

        const t_wall_back_1 = new Triangle( cubeVerts.bottom_left_back, 
                                            cubeVerts.top_left_back, 
                                            cubeVerts.top_right_back, colorGrey, false);
        const t_wall_back_2 = new Triangle( cubeVerts.bottom_left_back, 
                                            cubeVerts.top_right_back, 
                                            cubeVerts.bottom_right_back, colorGrey, false);
        const t_wall_left_1 = new Triangle( cubeVerts.bottom_left_front,
                                            cubeVerts.top_left_back,
                                            cubeVerts.bottom_left_back, colorRed);
        const t_wall_left_2 = new Triangle( cubeVerts.bottom_left_front,
                                            cubeVerts.top_left_front,
                                            cubeVerts.top_left_back, colorRed);
        const t_wall_right_1 = new Triangle( cubeVerts.bottom_right_back,
                                            cubeVerts.top_right_back,
                                            cubeVerts.bottom_right_front, colorBlue);
        const t_wall_right_2 = new Triangle( cubeVerts.bottom_right_front,
                                            cubeVerts.top_right_back,
                                            cubeVerts.top_right_front, colorBlue);
        const t_wall_top_1 = new Triangle( cubeVerts.top_left_back,
                                            cubeVerts.top_left_front,
                                            cubeVerts.top_right_front, colorGrey);
        const t_wall_top_2 = new Triangle( cubeVerts.top_left_back,
                                            cubeVerts.top_right_front,
                                            cubeVerts.top_right_back, colorGrey);


        this.data.triangles.push(t_floor_1);
        this.data.triangles.push(t_floor_2);
        this.data.triangles.push(t_wall_back_1);
        this.data.triangles.push(t_wall_back_2);
        this.data.triangles.push(t_wall_left_1);
        this.data.triangles.push(t_wall_left_2);
        this.data.triangles.push(t_wall_right_1);
        this.data.triangles.push(t_wall_right_2);
        this.data.triangles.push(t_wall_top_1);
        this.data.triangles.push(t_wall_top_2);

        this.data.triangleCount = this.data.triangles.length;
        this.data.camera = new Camera([0, 3.0, 10.0], 180, 0);

        console.log("Starting BVH build...");
        this.buildBVH();
        console.log("BVH build completed.");
    }

    update() {

        this.data.triangles.forEach(
            (triangle) => triangle.update()
        );

        this.data.camera.calculateViewMatrix();
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

    get_scene_triangles(): Triangle[] {
        return this.data.triangles;
    }
}