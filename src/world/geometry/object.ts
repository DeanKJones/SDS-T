import { Triangle } from "./triangle";

export class Object {
    triangles: Triangle[];
    triangleCount: number;
    triangleIndices: number[];

    constructor(triangles: Triangle[]) {
        this.triangles = triangles;
        this.triangleCount = triangles.length;
        this.triangleIndices = Array.from({ length: this.triangleCount }, (_, i) => i);
    }
}