import { mat4, vec3, quat } from 'gl-matrix';

export class Transform {
    private position: vec3;
    private rotation: quat;
    private scale: vec3;
    private matrix: mat4;
    private isDirty: boolean;

    constructor() {
        this.position = vec3.fromValues(0, 0, 0);
        this.rotation = quat.create();
        this.scale = vec3.fromValues(1, 1, 1);
        this.matrix = mat4.create();
        this.isDirty = true;
    }

    getMatrix(): mat4 {
        if (this.isDirty) {
            this.updateMatrix();
        }
        return this.matrix;
    }

    private updateMatrix() {
        mat4.fromRotationTranslationScale(
            this.matrix,
            this.rotation,
            this.position,
            this.scale
        );
        this.isDirty = false;
    }

    setPosition(x: number, y: number, z: number) {
        vec3.set(this.position, x, y, z);
        this.isDirty = true;
    }

    setRotationEuler(x: number, y: number, z: number) {
        quat.fromEuler(this.rotation, x, y, z);
        this.isDirty = true;
    }

    setScale(x: number, y: number, z: number) {
        vec3.set(this.scale, x, y, z);
        this.isDirty = true;
    }

    translate(x: number, y: number, z: number) {
        vec3.add(this.position, this.position, vec3.fromValues(x, y, z));
        this.isDirty = true;
    }

    rotate(angleInDegrees: number, axis: vec3) {
        const angleInRadians = angleInDegrees * Math.PI / 180;
        const rotationQuat = quat.create();
        quat.setAxisAngle(rotationQuat, axis, angleInRadians);
        quat.multiply(this.rotation, this.rotation, rotationQuat);
        this.isDirty = true;
    }

    getPosition(): vec3 {
        return vec3.clone(this.position);
    }

    getRotation(): quat {
        return quat.clone(this.rotation);
    }

    getScale(): vec3 {
        return vec3.clone(this.scale);
    }
}