
export class Voxel 
{
    x: number;
    y: number;
    z: number;
    colorIndex: number;

    constructor(x: number, y: number, z: number, colorIndex: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.colorIndex = colorIndex;
    }
}