import { vec3, mat4, quat } from "gl-matrix";
import { Deg2Rad } from "../math/deg2rad";

export class Camera {

    position: vec3;
    orientation: quat;
    view: mat4;
    forwards: vec3;
    right: vec3;
    up: vec3;

    constructor(position: vec3, theta: number, phi: number) {
        this.position = position;
        this.orientation = quat.create();
        quat.rotateX(this.orientation, this.orientation, Deg2Rad(phi));
        quat.rotateY(this.orientation, this.orientation, Deg2Rad(theta));
        this.forwards = [0, 0, -1]; // Default forward direction
        this.up = [0, 1, 0]; // Default up direction
        this.right = [1, 0, 0]; // Default right direction
        this.view = mat4.create();
    }

    update() {

        vec3.transformQuat(this.forwards, vec3.fromValues(0, 0, 1), this.orientation);

        vec3.cross(this.right, this.forwards, vec3.fromValues(0, 1, 0));
        vec3.normalize(this.right, this.right);

        vec3.cross(this.up, this.right, this.forwards);
        vec3.normalize(this.up, this.up);

        var target: vec3 = vec3.create();
        vec3.add(target, this.position, this.forwards);

        mat4.lookAt(this.view, this.position, target, this.up);
    }

    get_view(): mat4 {
        return this.view;
    }
}