import * as THREE from 'three';
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
const fs = require('fs');
const path = require('path');

let scene, camera, renderer, geometry, material, mesh;

export const initKenBurns = (canvas, imageUrl, depthMapUrl) => {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ canvas });

  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(imageUrl);
  const depthTexture = textureLoader.load(depthMapUrl);

  geometry = new THREE.PlaneGeometry(2, 2);
  material = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: texture },
      tDepth: { value: depthTexture },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform sampler2D tDepth;
      uniform float uTime;
      varying vec2 vUv;

      void main() {
        vec2 uv = vUv;
        float depth = texture2D(tDepth, uv).r;
        
        // Simple Ken Burns effect
        float scale = 1.0 + 0.2 * sin(uTime * 0.001);
        vec2 center = vec2(0.5, 0.5);
        uv = (uv - center) * scale + center;
        
        // Apply depth-based displacement
        uv += depth * 0.05 * vec2(cos(uTime * 0.002), sin(uTime * 0.002));
        
        gl_FragColor = texture2D(tDiffuse, uv);
      }
    `,
  });

  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  camera.position.z = 1;

  animate();
};

const animate = () => {
  requestAnimationFrame(animate);
  material.uniforms.uTime.value += 1;
  renderer.render(scene, camera);
};

export const applyKenBurnsEffect = () => {
  // This function can be used to update parameters of the effect
  // For now, it's empty as the effect is continuously animated
};

export const exportVideo = (canvas) => {
  return new Promise((resolve, reject) => {
    const fps = 30;
    const duration = 5; // 5 seconds
    const totalFrames = fps * duration;
    const tempDir = path.join(__dirname, 'temp_frames');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    let frameCount = 0;

    const captureFrame = () => {
      if (frameCount >= totalFrames) {
        // All frames captured, start FFmpeg processing
        const inputPath = path.join(tempDir, 'frame_%d.png');
        const outputPath = path.join(__dirname, 'output.mp4');

        ffmpeg()
          .input(inputPath)
          .inputFPS(fps)
          .output(outputPath)
          .videoCodec('libx264')
          .outputOptions('-pix_fmt yuv420p')
          .on('end', () => {
            // Clean up temp files
            fs.readdirSync(tempDir).forEach(file => fs.unlinkSync(path.join(tempDir, file)));
            fs.rmdirSync(tempDir);
            resolve();
          })
          .on('error', (err) => {
            reject(err);
          })
          .run();
        return;
      }

      const framePath = path.join(tempDir, `frame_${frameCount}.png`);
      const dataURL = canvas.toDataURL('image/png');
      const base64Data = dataURL.replace(/^data:image\/png;base64,/, "");

      fs.writeFile(framePath, base64Data, 'base64', (err) => {
        if (err) {
          reject(err);
          return;
        }
        frameCount++;
        // Increment time for the next frame
        material.uniforms.uTime.value += 1000 / fps;
        renderer.render(scene, camera);
        captureFrame();
      });
    };

    captureFrame();
  });
};