import React, { useState, useRef, useEffect } from 'react';
import { initKenBurns, applyKenBurnsEffect, exportVideo } from './kenBurns';

const App = () => {
  const [image, setImage] = useState(null);
  const [depthMap, setDepthMap] = useState(null);
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef(null);

  const handleImageUpload = (event, setter) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => setter(e.target.result);
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (image && depthMap && canvasRef.current) {
      initKenBurns(canvasRef.current, image, depthMap);
    }
  }, [image, depthMap]);

  const handleExport = async () => {
    if (!image || !depthMap) {
      alert('Please upload both an image and a depth map before exporting.');
      return;
    }
    setExporting(true);
    try {
      await exportVideo(canvasRef.current);
      alert('Video exported successfully!');
    } catch (error) {
      console.error('Error exporting video:', error);
      alert('Failed to export video. Please check the console for details.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <h1>3D Ken Burns Playground</h1>
      <input type="file" onChange={(e) => handleImageUpload(e, setImage)} accept="image/*" />
      <input type="file" onChange={(e) => handleImageUpload(e, setDepthMap)} accept="image/*" />
      <canvas ref={canvasRef} width="800" height="600"></canvas>
      <button onClick={handleExport} disabled={exporting}>
        {exporting ? 'Exporting...' : 'Export Video'}
      </button>
    </div>
  );
};

export default App;