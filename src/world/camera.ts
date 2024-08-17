import { vec3, mat4, quat } from "gl-matrix";
import { Deg2Rad } from "../math/deg2rad";

export class Camera {

    position: vec3;
    orientation: quat;
    viewMatrix: mat4;
    projectionMatrix: mat4;
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
        this.viewMatrix = mat4.create();
        this.projectionMatrix = mat4.create();
    }

    calculateViewMatrix() {
        vec3.transformQuat(this.forwards, vec3.fromValues(0, 0, 1), this.orientation);
        vec3.cross(this.right, this.forwards, vec3.fromValues(0, 1, 0));
        vec3.normalize(this.right, this.right);
        vec3.cross(this.up, this.right, this.forwards);
        vec3.normalize(this.up, this.up);

        var target: vec3 = vec3.create();
        vec3.add(target, this.position, this.forwards);

        mat4.lookAt(this.viewMatrix, this.position, target, this.up);
    }

    calculateProjectionMatrix(aspectRatio: number, fov: number, near: number, far: number) {
        const mat = mat4.perspective(this.projectionMatrix, fov, aspectRatio, near, far);
        return mat;
    }

    updateMatrices(aspectRatio: number, fov: number, near: number, far: number) {
        this.calculateViewMatrix();
        this.calculateProjectionMatrix(aspectRatio, fov, near, far);
    }

    rotate(dX: number, dY: number) {
        // Create quaternions for the rotations
        let qx = quat.create();
        let qy = quat.create();
    
        // Rotate around the Y axis (yaw) for horizontal movement (dX)
        quat.rotateY(qy, qy, Deg2Rad(-dX));
    
        // Rotate around the X axis (pitch) for vertical movement (dY)
        quat.rotateX(qx, qx, Deg2Rad(-dY));
    
        // Combine the rotations
        quat.multiply(this.orientation, qy, this.orientation);
        quat.multiply(this.orientation, qx, this.orientation);
    
        // Normalize the quaternion to avoid drift
        quat.normalize(this.orientation, this.orientation);
    
        // Update the camera direction display
        this.calculateViewMatrix();
    }

    move(direction: number, amount: number) {
        if (direction == 0) {
            vec3.scaleAndAdd(this.position, this.position, this.right, amount);
        }
        if (direction == 1) {
            vec3.scaleAndAdd(this.position, this.position, this.up, amount);
        }
        if (direction == 2) {
            vec3.scaleAndAdd(this.position, this.position, this.forwards, amount);
        }
        // Update the camera direction display
        this.calculateViewMatrix();
    }
}