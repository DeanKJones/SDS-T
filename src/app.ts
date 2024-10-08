import { Renderer } from "./render/renderer.ts";
import { Scene } from "./world/scene";

export class App 
{
    canvases: Map<string, HTMLCanvasElement>;
    renderer: Renderer;
    scene!: Scene;

    forwards_amount: number;
    right_amount: number;
    up_amount: number;

    canvas_selected: boolean = false;
    
    constructor(canvases: { [key: string]: HTMLCanvasElement }) {
        this.canvases = new Map(Object.entries(canvases));

        this.renderer = new Renderer(this.canvases.get("viewportMain")!);
        this.renderer.Initialize().then(() => {
            this.scene = new Scene();
            this.renderer.setupScene(this.scene).then(() => {
                this.run();
            });
        });

        document.addEventListener('keydown', this.handle_keypress.bind(this));
        document.addEventListener('keyup', this.handle_keyrelease.bind(this));

        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement !== this.canvases.get("viewportMain")) {
                this.canvas_selected = false;
                console.log("Pointer unlocked");
            } else {
                this.canvas_selected = true;
                console.log("Pointer locked to viewportMain");
            }
        });

        this.forwards_amount = 0;
        this.right_amount = 0;
        this.up_amount = 0;

        this.canvases.get("viewportMain")!.onclick = () => {
            this.canvases.get("viewportMain")!.requestPointerLock();
        }

        this.canvases.get("viewportMain")!.addEventListener(
        "mousemove", 
        (event: MouseEvent) => {
            if (this.canvas_selected) {
                this.handle_mouse_move(event);
            }
        });
    }

    run = () => {

        var running: boolean = true;
        this.scene.update();

        for (let i = 0; i < 3; i++) {   // Here we are looping each axis as the move method is wack
            if (i == 0) this.scene.data.camera.move(i, this.right_amount);      // Right
            if (i == 1) this.scene.data.camera.move(i, this.up_amount);         // Up
            if (i == 2) this.scene.data.camera.move(i, this.forwards_amount);   // Forwards
        }

        // Render Viewport
        this.renderer.render(
            this.scene
        );
        // Render Scene Parameters
        const uiCameraInfoCtx = this.canvases.get("sceneParameters")!.getContext('2d');
        if (uiCameraInfoCtx) {
            this.scene.data.renderUI(uiCameraInfoCtx);
        }

        // Request the next frame
        if (running) {
            requestAnimationFrame(this.run);
        }
    }

    handle_keypress(event: KeyboardEvent) {
        if (this.canvas_selected == false) return;

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
        if (event.code == "KeyE") {
            this.up_amount = 0.02;
        }
        if (event.code == "KeyQ") {
            this.up_amount = -0.02;
        }
    }

    handle_keyrelease(event: KeyboardEvent) {
        if (this.canvas_selected == false) return;
        if (event.code == "KeyW" || event.code == "KeyS") {
            this.forwards_amount = 0;
        }
        if (event.code == "KeyA" || event.code == "KeyD") {
            this.right_amount = 0;
        }
        if (event.code == "KeyE" || event.code == "KeyQ") {
            this.up_amount = 0;
        }
    }

    handle_mouse_move(event: MouseEvent) {
        this.scene.data.camera.rotate(
            event.movementX / 5, event.movementY / 5
        );
    }
}