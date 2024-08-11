import { Renderer } from "./render/renderer.ts";
import { Scene } from "./world/scene";
import $ from "jquery";

export class App {

    canvas: HTMLCanvasElement;
    renderer: Renderer;
    scene!: Scene;

    //Labels for displaying state
    keyLabel: HTMLElement;
    mouseXLabel: HTMLElement;
    mouseYLabel: HTMLElement;
    cameraPositionLabel: HTMLElement;

    forwards_amount: number;
    right_amount: number;
    
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        this.renderer = new Renderer(canvas);
        this.renderer.Initialize().then(() => {
            this.scene = new Scene();
            this.renderer.setupScene(this.scene).then(() => {
                this.run();
            });
        });

        this.keyLabel = <HTMLElement>document.getElementById("key-label");
        this.mouseXLabel = <HTMLElement>document.getElementById("mouse-x-label");
        this.mouseYLabel = <HTMLElement>document.getElementById("mouse-y-label");
        this.cameraPositionLabel = <HTMLElement>document.getElementById("camera-position");

        this.forwards_amount = 0;
        this.right_amount = 0;
        $(document).on(
            "keydown", 
            (event) => {
                this.handle_keypress(event);
            }
        );
        $(document).on(
            "keyup", 
            (event) => {
                this.handle_keyrelease(event);
            }
        );
        this.canvas.onclick = () => {
            this.canvas.requestPointerLock();
        }
        this.canvas.addEventListener(
            "mousemove", 
            (event: MouseEvent) => {this.handle_mouse_move(event);}
        );
        
    }

    run = () => {

        var running: boolean = true;

        this.scene.update();
        this.scene.move_scene_camera(this.forwards_amount, this.right_amount);
        this.updateCameraPosition();

        this.renderer.render(
            this.scene
        );

        if (running) {
            requestAnimationFrame(this.run);
        }
    }

    handle_keypress(event: JQuery.KeyDownEvent) {
        this.keyLabel.innerText = event.code;

        if (event.code == "KeyW") {
            this.forwards_amount = 0.02;
        }
        if (event.code == "KeyS") {
            this.forwards_amount = -0.02;
        }
        if (event.code == "KeyA") {
            this.right_amount = -0.02;
        }
        if (event.code == "KeyD") {
            this.right_amount = 0.02;
        }

    }

    handle_keyrelease(event: JQuery.KeyUpEvent) {
        this.keyLabel.innerText = event.code;

        if (event.code == "KeyW") {
            this.forwards_amount = 0;
        }
        if (event.code == "KeyS") {
            this.forwards_amount = 0;
        }
        if (event.code == "KeyA") {
            this.right_amount = 0;
        }
        if (event.code == "KeyD") {
            this.right_amount = 0;
        }

    }

    handle_mouse_move(event: MouseEvent) {
        this.mouseXLabel.innerText = event.clientX.toString();
        this.mouseYLabel.innerText = event.clientY.toString();
        
        this.scene.spin_scene_camera(
            event.movementX / 5, event.movementY / 5
        );
    }

    updateCameraPosition() {
        const cameraPosition = this.scene.data.camera.position;
        if (this.cameraPositionLabel) {
            this.cameraPositionLabel.innerText = `Camera Position: (${cameraPosition[0].toFixed(2)}, ${cameraPosition[1].toFixed(2)}, ${cameraPosition[2].toFixed(2)})`;
        }
    }

}