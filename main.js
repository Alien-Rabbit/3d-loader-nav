
console.log('three js loading script main.js loaded');


let cachedModules = null;
let glbCache = {};

let sceneRef, cameraRef, rendererRef;


function attachSceneRefs(scene, camera, renderer) {
    sceneRef = scene;
    cameraRef = camera;
    rendererRef = renderer;
}

const scrubber = document.getElementById("scrubber");
scrubber.oninput = () => applyCameraAt(scrubber.value / scrubber.max);


window.loadThree = (function () {
    cachedModules = null; // Cache the loaded modules
    return async function () {
        if (cachedModules) {
            console.log("Three.js modules already loaded.");
            return cachedModules;
        }

        try {
            console.log("Loading Three.js and GLTFLoader...");

            // Correct import for Three.js and GLTFLoader using explicit paths
            const THREE = await import('https://unpkg.com/three@latest/build/three.module.js?module');
            const { GLTFLoader } = await import('https://unpkg.com/three@latest/examples/jsm/loaders/GLTFLoader.js?module');

            console.log("Three.js and GLTFLoader loaded successfully!");

            // Store in cache to prevent multiple imports
            cachedModules = { THREE, GLTFLoader };
            console.log(cachedModules);
            return cachedModules;
        } catch (error) {
            console.error("Error loading Three.js modules:", error);
            throw error;
        }

    };
})();

window.preloadGLB = async function (rootPath) {
    if (!cachedModules) {
        console.error("Three.js modules not loaded.");
        return null;
    }
    const loader = new cachedModules.GLTFLoader();

    try {
        const response = await fetch(rootPath);
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const links = [...doc.querySelectorAll('a')]
            .map(a => a.getAttribute('href'))
            .filter(href => href.endsWith('.glb'));

        const loadPromises = links.map(href => {
            return new Promise((resolve, reject) => {
                loader.load(
                    rootPath + href,
                    (gltf) => {
                        glbCache[href] = gltf;
                        resolve(gltf);
                    },
                    undefined,
                    reject
                );
            });
        });

        await Promise.all(loadPromises);
        console.log('All .glb assets preloaded:', glbCache);
        return glbCache;
    } catch (error) {
        console.error('Error preloading GLB assets:', error);
        return null;
    }
};

window.loadThreeJSWithModel = async function (modelPath, backgroundTex, light, scale, posx, posy, posz, speed, custumAnim) {
    let model = modelPath;

    // Remove any existing WebGL content to prevent duplication
    let existingCanvas = document.querySelector("#three-container canvas");
    if (existingCanvas) {
        existingCanvas.remove();
    }

    // Ensure cached modules exist
    if (!window.loadThree || !cachedModules) {
        console.error("Three.js modules not loaded.");
        return;
    }

    const THREE = cachedModules.THREE;
    const GLTFLoader = cachedModules.GLTFLoader;

    // Initialize Three.js scene
    const scene = new THREE.Scene();

    const texLoader = new THREE.TextureLoader();
    // Load background image
    if (backgroundTex) {
        texLoader.load(backgroundTex, function (texture) {
            scene.background = texture;  // Set as background
        });
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(light, 1);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    scene.background = new THREE.Color('black');

    // Camera and renderer setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("three-container").appendChild(renderer.domElement);
    attachSceneRefs(scene, camera, renderer);

    // Load the GLB model
    const clock = new THREE.Clock();
    let mixer = null; // Mixer for animations
    let animNum = null; // if custom anim 

    const loader = new GLTFLoader();
    loader.load(
        model,
        (gltf) => {
            scene.add(gltf.scene);

            // custom pos ?
            if (posx, posy, posz) {
                gltf.scene.position.set(posx, posy, posz);
            } else {
                gltf.scene.position.set(0, 0, 0);
            }

            // custom scaling ?
            if (scale) {
                gltf.scene.scale.set(scale, scale, scale);
            }
            else {
                gltf.scene.scale.set(1, 1, 1);
            }
            console.log("Model loaded:", model, gltf.animations);
            // Ensure animations exist
            if (gltf.animations.length > 0) {
                mixer = new THREE.AnimationMixer(gltf.scene);
                if (custumAnim >= 0 && custumAnim != null) {
                    console.log(gltf.animations[custumAnim].name);
                    animNum = gltf.animations[custumAnim];
                    const actionCustom = mixer.clipAction(animNum);
                    actionCustom.play()
                } else
                    gltf.animations.forEach((clip) => {
                        console.log("Playing animation:", clip.name);
                        const action = mixer.clipAction(clip);
                        action.play();
                    });
            } else {
                console.warn("No animations found in model:", model);
            }
        },
        undefined,
        (error) => {
            console.error("Error loading model:", error);
        }
    );

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        if (speed) { scene.rotation.y += speed }; // Slow rotation)
        if (mixer) mixer.update(clock.getDelta()); // Update mixer if it exists
        renderer.render(scene, camera);
    }
    animate();
};

window.modelWithPath = function (modelPath, backgroundTex, scale, Tarx, Tary, Tarz, duration) {
 
    let model = modelPath;
    // Remove any existing WebGL content to prevent duplication
    let existingCanvas = document.querySelector("#three-container canvas");
    if (existingCanvas) {
        existingCanvas.remove();
    }

    // Ensure cached modules exist
    if (!window.loadThree || !cachedModules) {
        console.error("Three.js modules not loaded.");
        return;
    }

    const THREE = cachedModules.THREE;
    const GLTFLoader = cachedModules.GLTFLoader;
    // Initialize Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    attachSceneRefs(scene, camera, renderer);
    const loaderMove = new GLTFLoader();

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("three-container").appendChild(renderer.domElement);

    // Camera's initial position
    const startPosition = new THREE.Vector3(0, 2, 5);
    camera.position.copy(startPosition);

    // Target position for camera movement
    const targetPos = new THREE.Vector3(Tarx, Tary, Tarz);
    console.log(targetPos);
    // Lighting setup
    const light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);

    const texLoader = new THREE.TextureLoader();
    // Load background image
    if (backgroundTex) {
        texLoader.load(backgroundTex, function (texture) {
            scene.background = texture;  // Set as background
        });
    }

    loaderMove.load(
        model,
        (gltf) => {
            scene.add(gltf.scene);
            gltf.scene.position.set(0, -3, 0);
            if (scale) {
                gltf.scene.scale.set(scale, scale, scale);
            }
            else {
                gltf.scene.scale.set(1, 1, 1);
            }
            console.log("Model loaded:", model, gltf.animations);
        },
        undefined,
        (error) => {
            console.error("Error loading model:", error);
        }
    );

    // Animation parameters
    let startTime = null;
    let animationActive = true;

    // Function to animate the camera
    function animateCamera(time) {
        if (!startTime) startTime = time;

        // Calculate elapsed time as a fraction of the duration
        const elapsed = (time - startTime) / duration;
        if (elapsed < 1 && animationActive) {
            // Move the camera smoothly from startPosition to targetPosition
            camera.position.lerpVectors(startPosition, targetPos, elapsed);
            requestAnimationFrame(animateCamera);
        } else {
            // Reset camera position after the animation finishes
            camera.position.copy(targetPos);
            animationActive = false;

            // After a short delay, reset the camera back to the starting position
            setTimeout(() => {
                camera.position.copy(startPosition);
                startTime = null; // Reset the timer for a new movement
                animationActive = true; // Allow for future animations
            }, 1000); // Reset after 1 second at target position
        }
        renderer.render(scene, camera); // Render the scene

        
    }
    // Start the camera animation loop
    requestAnimationFrame(animateCamera);
}

function playCameraTimeline(keys) {
    if (!cachedModules) {
        console.error("Three.js modules not loaded.");
        return;
    }
    const THREE = cachedModules.THREE;
    let index = 0;

    function moveNext() {
        if (index >= keys.length - 1) return;

        const from = new THREE.Vector3(
            keys[index].x,
            keys[index].y,
            keys[index].z
        );

        const to = new THREE.Vector3(
            keys[index + 1].x,
            keys[index + 1].y,
            keys[index + 1].z
        );

        const duration = keys[index + 1].t;
        let start = null;

        function animate(time) {
            if (!start) start = time;
            const t = Math.min((time - start) / duration, 1);

            cameraRef.position.lerpVectors(from, to, t);
            rendererRef.render(sceneRef, cameraRef);

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                index++;
                moveNext();
            }
        }

        requestAnimationFrame(animate);
    }

    moveNext();
}

let cameraPath = [
    {
        time: 0,
        position: { x: 0, y: 2, z: 5 },
        lookAt: { x: 0, y: 0, z: 0 }
    }
];

// let sceneRef, cameraRef, rendererRef;

document.getElementById("addKey").onclick = () => {
    const key = {
        x: parseFloat(camX.value),
        y: parseFloat(camY.value),
        z: parseFloat(camZ.value),
        t: parseInt(camT.value)
    };
    cameraPath.push(key);
    renderTimeline();
};



function renderTimeline() {
    const tl = document.getElementById("timeline");
    tl.innerHTML = "";

    cameraPath.forEach((k, i) => {
        const div = document.createElement("div");
        div.className = "keyframe";
        div.textContent = `Key ${i + 1} — ${k.time}ms`;
        tl.appendChild(div);
    });

    updateScrubberRange();
}

function totalDuration() {
    return Math.max(...cameraPath.map(k => k.time));
}

function buildSpline() {
    if (!cachedModules) {
        console.error("Three.js modules not loaded.");
        return null;
    }
    const THREE = cachedModules.THREE;
    return new THREE.CatmullRomCurve3(
        cameraPath.map(k =>
            new THREE.Vector3(k.position.x, k.position.y, k.position.z)
        )
    );
}

scrubber.oninput = () => {
    const t = scrubber.value / scrubber.max;
    applyCameraAt(t);
};

scrubber.addEventListener("input", () => {
    if (!cameraRef || !rendererRef) return;

    const t = scrubber.value / scrubber.max;
    applyCameraAt(t);
});

function applyCameraAt(t) {
    if (!cachedModules) {
        console.error("Three.js modules not loaded.");
        return;
    }
    const THREE = cachedModules.THREE;
    const spline = buildSpline();
    const pos = spline.getPoint(t);

    cameraRef.position.copy(pos);

    const idx = Math.floor(t * (cameraPath.length - 1));
    const a = cameraPath[idx];
    const b = cameraPath[Math.min(idx + 1, cameraPath.length - 1)];

    const look = new THREE.Vector3(
        THREE.MathUtils.lerp(a.lookAt.x, b.lookAt.x, t),
        THREE.MathUtils.lerp(a.lookAt.y, b.lookAt.y, t),
        THREE.MathUtils.lerp(a.lookAt.z, b.lookAt.z, t)
    );

    cameraRef.lookAt(look);
    rendererRef.render(sceneRef, cameraRef);
}

function playCameraSpline(duration = 5000) {
    if (!cachedModules) {
        console.error("Three.js modules not loaded.");
        return;
    }
    const spline = buildSpline();
    let start = null;

    function animate(time) {
        if (!start) start = time;
        const t = Math.min((time - start) / duration, 1);

        const pos = spline.getPoint(t);
        cameraRef.position.copy(pos);

        applyCameraAt(t);

        if (t < 1) {
            requestAnimationFrame(animate);
        }
    }
    requestAnimationFrame(animate);
}

function updateLookAt(index) {
    cameraPath[index].lookAt = {
        x: parseFloat(lx.value),
        y: parseFloat(ly.value),
        z: parseFloat(lz.value)
    };
}

function updateScrubberRange() {
    scrubber.max = totalDuration() || 1000;
    scrubber.value = 0;
}

let recorder, recordedChunks = [];

function startRecording() {
    const stream = rendererRef.domElement.captureStream(60);
    recorder = new MediaRecorder(stream, {
        mimeType: "video/mp4"
    });

    recorder.ondataavailable = e => recordedChunks.push(e.data);
    recorder.onstop = exportVideo;
    recorder.start();
}

function stopRecording() {
    recorder.stop();
}

function exportVideo() {
    const blob = new Blob(recordedChunks, { type: "video/mp4" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "camera-animation.mp4";
    a.click();

    recordedChunks = [];
}


document.getElementById("glbUpload").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    await loadThree();
    loadThreeJSWithModel(url, null, 0xffffff, 1, 0, 0, 0, 0);
};

document.getElementById("playPath").onclick = () => {
    if (cameraPath.length < 2) return;
    playCameraTimeline(cameraPath);
};


