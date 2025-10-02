// =============================================================================
// CUSTOM THREE.JS POINTS MATERIAL
// Enhanced and deobfuscated version for better readability
// =============================================================================

import * as THREE from "three";

/**
 * Creates a custom PointsMaterial with additional features like alpha support and clipping
 * @param {Object} options - Configuration options for the material
 * @param {THREE.Texture} options.map - Texture map for the material
 * @param {number} options.color - Base color of the material (default: 0xffffff)
 * @param {boolean} options.transparent - Whether the material is transparent (default: true)
 * @param {boolean} options.vertexColors - Whether to use vertex colors (default: true)
 * @param {boolean} options.sizeAttenuation - Whether point size decreases with distance (default: true)
 * @param {boolean} options.alphaSupport - Whether to add alpha channel support (default: false)
 * @param {number} options.clipBandWidth - Width for horizontal clipping band (default: 0)
 * @param {number} options.vClipSlope - Slope for diagonal clipping (default: 0)
 * @param {number} options.clipFrontZ - Front Z clipping distance (default: 0.1)
 * @param {number} options.blending - Blending mode (default: THREE.NormalBlending)
 * @param {number} options.opacity - Material opacity (default: 1)
 * @param {boolean} options.depthWrite - Whether to write to depth buffer (default: true)
 * @returns {THREE.PointsMaterial} Enhanced points material
 */
export function makeMat({
  map = null,
  color = 0xffffff,
  transparent = true,
  vertexColors = true,
  sizeAttenuation = true,
  alphaSupport = false,
  clipBandWidth = 0,
  vClipSlope = 0,
  clipFrontZ = 0.1,
  blending = THREE.NormalBlending,
  opacity = 1,
  depthWrite = true,
} = {}) {
  // Create the base PointsMaterial
  const material = new THREE.PointsMaterial({
    map: map,
    color: color,
    transparent: transparent,
    vertexColors: vertexColors,
    sizeAttenuation: sizeAttenuation,
    blending: blending,
    opacity: opacity,
    depthWrite: depthWrite,
  });

  // Add custom shader modifications
  material.onBeforeCompile = (shader) => {
    // Add custom attributes and varyings to vertex shader
    shader.vertexShader = shader.vertexShader.replace(
      "uniform float size;",
      "attribute float size;" +
        (alphaSupport
          ? "\nattribute float alpha;\nvarying float vAlpha;"
          : "") +
        (clipBandWidth > 0 || vClipSlope > 0 ? "\nvarying vec3 vViewPos;" : "")
    );

    // Build custom vertex shader code
    let vertexShaderAddition = "";

    // Add view position calculation for clipping
    if (clipBandWidth > 0 || vClipSlope > 0) {
      vertexShaderAddition += "  vViewPos = mvPosition.xyz;\n";
    }

    // Add alpha varying assignment
    if (alphaSupport) {
      vertexShaderAddition += "  vAlpha = alpha;\n";
    }

    // Insert the additions into vertex shader
    if (vertexShaderAddition) {
      shader.vertexShader = shader.vertexShader.replace(
        "#include <project_vertex>",
        "#include <project_vertex>\n" + vertexShaderAddition
      );
    }

    // Modify fragment shader for alpha support
    if (alphaSupport) {
      shader.fragmentShader = shader.fragmentShader
        .replace("void main() {", "varying float vAlpha;\nvoid main() {")
        .replace(
          "gl_FragColor = vec4( outgoingLight, diffuseColor.a );",
          "gl_FragColor = vec4( outgoingLight, diffuseColor.a * vAlpha );"
        );
    }

    // Add clipping functionality to fragment shader
    if (clipBandWidth > 0 || vClipSlope > 0) {
      shader.fragmentShader = shader.fragmentShader.replace(
        "void main() {",
        "varying vec3 vViewPos;\nvoid main() {"
      );

      let clippingCode = "";

      // Add horizontal band clipping
      if (clipBandWidth > 0) {
        clippingCode +=
          "\n  if (vViewPos.z < -" +
          clipBandWidth.toFixed(3) +
          " && abs(vViewPos.x) < " +
          clipFrontZ.toFixed(3) +
          ") discard;";
      }

      // Add diagonal slope clipping
      if (vClipSlope > 0) {
        clippingCode +=
          "if (abs(vViewPos.x) < " +
          clipFrontZ.toFixed(3) +
          " && vViewPos.z < -" +
          vClipSlope.toFixed(3) +
          " * (-vViewPos.z)) discard;";
      }

      // Determine insertion point based on alpha support
      const insertionPoint = alphaSupport
        ? "gl_FragColor = vec4( outgoingLight, diffuseColor.a * vAlpha );"
        : "gl_FragColor = vec4( outgoingLight, diffuseColor.a );";

      // Insert clipping code
      if (clippingCode) {
        shader.fragmentShader = shader.fragmentShader.replace(
          insertionPoint,
          clippingCode + "\n  " + insertionPoint
        );
      }
    }
  };

  return material;
}
