import { vec3 } from "gl-matrix"

export class Node {
    minCorner!: vec3;
    leftChild!: number;
    maxCorner!: vec3;
    primitiveCount!: number;
    objectIndex!: number;

    constructor() {
        this.minCorner = vec3.create();
        this.leftChild = -1;
        this.maxCorner = vec3.create();
        this.primitiveCount = 0;
        this.objectIndex = -1;
    }
}