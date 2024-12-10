import { vec3 } from "gl-matrix";
import { Triangle } from "../geometry/triangle";

export class Voxel 
{
    position: vec3;
    colorIndex: number;
    triangles: Triangle[];

    constructor(x: number, y: number, z: number, colorIndex: number) {
        this.position = vec3.create();
        this.position[0] = x;
        this.position[1] = y;
        this.position[2] = z;
        this.colorIndex = colorIndex;
        this.triangles = [];
    }
}