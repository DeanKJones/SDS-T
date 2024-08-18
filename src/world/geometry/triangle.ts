import { vec3, mat4 } from "gl-matrix";
import { Deg2Rad } from "../../math/deg_to_rad";

export class Triangle {

    position: vec3;
    eulers: vec3;
    model!: mat4;
    color: vec3;
    vertices: vec3[];

    constructor(v1: vec3, v2: vec3, v3: vec3, color: vec3) {
        this.vertices = [v1, v2, v3];
        this.position = this.get_centroid();
        this.eulers = vec3.create();
        this.color = color;
    }

    update() {
        this.eulers[2] += 1;
        this.eulers[2] %= 360;

        this.model = mat4.create();
        mat4.translate(this.model, this.model, this.position);
        mat4.rotateZ(this.model, this.model, Deg2Rad(this.eulers[2]));
    }

    get_model(): mat4 {
        return this.model;
    }

    get_centroid(): vec3 {
        const centroid = vec3.create();
        vec3.add(centroid, centroid, this.vertices[0]);
        vec3.add(centroid, centroid, this.vertices[1]);
        vec3.add(centroid, centroid, this.vertices[2]);
        vec3.scale(centroid, centroid, 1 / 3);
        return centroid;
    }
}