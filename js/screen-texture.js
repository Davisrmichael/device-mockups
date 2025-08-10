// js/screen-texture.js
// Handles applying uploaded images to the phone screen material

export function makeScreenTextureManager(model, screenMaterialName = 'Screen') {
    let screenMaterial = null;
    let textureLoader = new THREE.TextureLoader();
    let emissiveEnabled = true;

    // Try to find the screen material in the loaded model
    function findScreenMaterial() {
        model.traverse((child) => {
            if (child.isMesh) {
                child.material.forEach?.((mat) => {
                    if (mat.name === screenMaterialName) {
                        screenMaterial = mat;
                    }
                });
                if (child.material.name === screenMaterialName) {
                    screenMaterial = child.material;
                }
            }
        });

        if (!screenMaterial) {
            console.error(`Screen material "${screenMaterialName}" not found in model`);
        }
    }

    // Apply the given texture to the screen
    function applyTexture(image) {
        if (!screenMaterial) findScreenMaterial();
        if (!screenMaterial) return;

        let texture = textureLoader.load(
            image,
            () => {
                // Equal X/Y scale
                texture.wrapS = THREE.ClampToEdgeWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;

                // Cover mode with auto Y-flip
                texture.center.set(0.5, 0.5);
                texture.rotation = Math.PI; // Flip 180° vertically

                // Assign to base map
                screenMaterial.map = texture;
                screenMaterial.map.needsUpdate = true;

                // Also apply to emissive if enabled
                if (emissiveEnabled) {
                    screenMaterial.emissiveMap = texture;
                    screenMaterial.emissive = new THREE.Color(0xffffff);
                    screenMaterial.emissiveIntensity = 1;
                    screenMaterial.emissiveMap.needsUpdate = true;
                } else {
                    screenMaterial.emissiveMap = null;
                    screenMaterial.emissive.set(0x000000);
                }

                screenMaterial.needsUpdate = true;
            },
            undefined,
            (err) => {
                console.error('Error loading texture:', err);
            }
        );
    }

    function clearTexture() {
        if (!screenMaterial) return;
        screenMaterial.map = null;
        screenMaterial.emissiveMap = null;
        screenMaterial.emissive.set(0x000000);
        screenMaterial.needsUpdate = true;
    }

    function setEmissive(enabled) {
        emissiveEnabled = enabled;
        if (screenMaterial && screenMaterial.map) {
            applyTexture(screenMaterial.map.image.src || screenMaterial.map.image.currentSrc);
        }
    }

    return {
        applyTexture,
        clearTexture,
        setEmissive
    };
}
