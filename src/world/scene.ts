import { Triangle } from "./geometry/triangle";
import { Camera } from "./camera";
import { vec3 } from "gl-matrix";
import { SceneData } from "./management/scene_data";
import { BVH } from "./bvh/bvh";

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

        new BVH(this.data).buildBVH();
        console.log("BVH build completed.");
    }

    update() {

        this.data.triangles.forEach(
            (triangle) => triangle.update()
        );

        this.data.camera.calculateViewMatrix();
    }

    get_scene_triangles(): Triangle[] {
        return this.data.triangles;
    }
}