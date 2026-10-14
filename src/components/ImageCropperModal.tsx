import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, RotateCw, Check, Scissors, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onConfirm?: (croppedDataUrl: string) => void;
  onCropComplete?: (croppedDataUrl: string) => void;
  onClose: () => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onConfirm,
  onCropComplete,
  onClose
}) => {
  useEscapeKey(onClose, isOpen);

  const [rotation, setRotation] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [crop, setCrop] = useState({ x: 10, y: 10, width: 80, height: 80 }); // Percentage 0 - 100
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState({ x: 10, y: 10, width: 80, height: 80 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset when new image arrives
  useEffect(() => {
    if (isOpen) {
      setRotation(0);
      setZoom(1);
      setCrop({ x: 10, y: 10, width: 80, height: 80 });
    }
  }, [isOpen, imageSrc]);

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Drag handlers
  const handleStartDrag = (handle: string, clientX: number, clientY: number) => {
    setIsDragging(handle);
    setDragStart({ x: clientX, y: clientY });
    setInitialCrop({ ...crop });
  };

  const handlePointerDown = (e: React.PointerEvent, handle: string) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    handleStartDrag(handle, e.clientX, e.clientY);
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStart.y) / rect.height) * 100;

    setCrop(() => {
      let nextX = initialCrop.x;
      let nextY = initialCrop.y;
      let nextW = initialCrop.width;
      let nextH = initialCrop.height;

      if (isDragging === 'box') {
        nextX = Math.max(0, Math.min(100 - initialCrop.width, initialCrop.x + dx));
        nextY = Math.max(0, Math.min(100 - initialCrop.height, initialCrop.y + dy));
      } else if (isDragging === 'top-left') {
        const potentialX = Math.min(initialCrop.x + initialCrop.width - 15, Math.max(0, initialCrop.x + dx));
        const potentialY = Math.min(initialCrop.y + initialCrop.height - 15, Math.max(0, initialCrop.y + dy));
        nextW = initialCrop.width + (initialCrop.x - potentialX);
        nextH = initialCrop.height + (initialCrop.y - potentialY);
        nextX = potentialX;
        nextY = potentialY;
      } else if (isDragging === 'top-right') {
        const potentialY = Math.min(initialCrop.y + initialCrop.height - 15, Math.max(0, initialCrop.y + dy));
        nextW = Math.max(15, Math.min(100 - initialCrop.x, initialCrop.width + dx));
        nextH = initialCrop.height + (initialCrop.y - potentialY);
        nextY = potentialY;
      } else if (isDragging === 'bottom-left') {
        const potentialX = Math.min(initialCrop.x + initialCrop.width - 15, Math.max(0, initialCrop.x + dx));
        nextW = initialCrop.width + (initialCrop.x - potentialX);
        nextH = Math.max(15, Math.min(100 - initialCrop.y, initialCrop.height + dy));
        nextX = potentialX;
      } else if (isDragging === 'bottom-right') {
        nextW = Math.max(15, Math.min(100 - initialCrop.x, initialCrop.width + dx));
        nextH = Math.max(15, Math.min(100 - initialCrop.y, initialCrop.height + dy));
      }

      return {
        x: Math.round(nextX * 10) / 10,
        y: Math.round(nextY * 10) / 10,
        width: Math.round(nextW * 10) / 10,
        height: Math.round(nextH * 10) / 10,
      };
    });
  }, [isDragging, dragStart, initialCrop]);

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setIsDragging(null);
    }
  };

  // Process Crop and generate compressed Canvas JPEG
  const handleApplyCrop = () => {
    const doCrop = (img: HTMLImageElement) => {
      try {
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;
        if (!naturalWidth || !naturalHeight) {
          console.error('Invalid image dimensions for crop');
          if (onConfirm) onConfirm(imageSrc);
          if (onCropComplete) onCropComplete(imageSrc);
          onClose();
          return;
        }

        // Create an intermediate canvas for rotation
        const rotCanvas = document.createElement('canvas');
        const rotCtx = rotCanvas.getContext('2d');
        if (!rotCtx) {
          if (onConfirm) onConfirm(imageSrc);
          if (onCropComplete) onCropComplete(imageSrc);
          onClose();
          return;
        }

        const isRotated90or270 = rotation === 90 || rotation === 270;
        rotCanvas.width = isRotated90or270 ? naturalHeight : naturalWidth;
        rotCanvas.height = isRotated90or270 ? naturalWidth : naturalHeight;

        rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
        rotCtx.rotate((rotation * Math.PI) / 180);
        rotCtx.drawImage(img, -naturalWidth / 2, -naturalHeight / 2);

        // Now calculate crop coordinates on rotated image
        const cropPxX = Math.max(0, (crop.x / 100) * rotCanvas.width);
        const cropPxY = Math.max(0, (crop.y / 100) * rotCanvas.height);
        const cropPxW = Math.min(rotCanvas.width - cropPxX, (crop.width / 100) * rotCanvas.width);
        const cropPxH = Math.min(rotCanvas.height - cropPxY, (crop.height / 100) * rotCanvas.height);

        // Target canvas
        const targetCanvas = document.createElement('canvas');
        const targetCtx = targetCanvas.getContext('2d');
        if (!targetCtx) {
          if (onConfirm) onConfirm(imageSrc);
          if (onCropComplete) onCropComplete(imageSrc);
          onClose();
          return;
        }

        // Limit max dimension to 1200px for high readability of handwriting while keeping file size small (~150kb)
        const maxDim = 1200;
        let outW = cropPxW;
        let outH = cropPxH;
        if (outW > maxDim || outH > maxDim) {
          if (outW > outH) {
            outH = Math.round((outH * maxDim) / outW);
            outW = maxDim;
          } else {
            outW = Math.round((outW * maxDim) / outH);
            outH = maxDim;
          }
        }

        targetCanvas.width = Math.max(10, Math.round(outW));
        targetCanvas.height = Math.max(10, Math.round(outH));

        targetCtx.imageSmoothingEnabled = true;
        targetCtx.imageSmoothingQuality = 'high';

        targetCtx.drawImage(
          rotCanvas,
          cropPxX,
          cropPxY,
          cropPxW,
          cropPxH,
          0,
          0,
          targetCanvas.width,
          targetCanvas.height
        );

        // Compress to JPEG 0.85
        const croppedBase64 = targetCanvas.toDataURL('image/jpeg', 0.85);
        if (onConfirm) onConfirm(croppedBase64);
        if (onCropComplete) onCropComplete(croppedBase64);
        onClose();
      } catch (err) {
        console.error('Error during image crop:', err);
        if (onConfirm) onConfirm(imageSrc);
        if (onCropComplete) onCropComplete(imageSrc);
        onClose();
      }
    };

    if (imgRef.current && imgRef.current.naturalWidth > 0) {
      doCrop(imgRef.current);
    } else {
      const image = new Image();
      if (!imageSrc.startsWith('data:') && !imageSrc.startsWith('blob:')) {
        image.crossOrigin = 'anonymous';
      }
      image.onload = () => doCrop(image);
      image.onerror = (e) => {
        console.error('Failed to load image for cropping', e);
        if (onConfirm) onConfirm(imageSrc);
        if (onCropComplete) onCropComplete(imageSrc);
        onClose();
      };
      image.src = imageSrc;
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div 
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={e => e.stopPropagation()}
    >
      <div 
        className="w-full max-w-4xl bg-gray-900 border border-gray-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-gray-100"
        onClick={e => e.stopPropagation()}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 bg-gray-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Recortar Foto de Evidencia / Cuaderno
              </h3>
              <p className="text-[11px] text-gray-400">
                Arrastra las esquinas del recuadro para encuadrar únicamente los apuntes.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Stage */}
        <div className="flex-1 overflow-hidden relative flex items-center justify-center p-4 bg-black/50 select-none">
          <div 
            ref={containerRef}
            className="relative max-w-full max-h-[58vh] flex items-center justify-center overflow-hidden rounded-lg shadow-inner"
            style={{ touchAction: 'none' }}
          >
            {/* The Image */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Evidencia a recortar"
              style={{
                transform: `rotate(${rotation}deg) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.2s ease',
                maxHeight: '56vh',
                maxWidth: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />

            {/* Dark Mask Outside Crop Area */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at center, transparent, transparent)`,
                boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.65)`,
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                width: `${crop.width}%`,
                height: `${crop.height}%`,
              }}
            />

            {/* Interactive Crop Frame */}
            <div
              className="absolute border-2 border-blue-400 bg-blue-500/10 cursor-move shadow-2xl"
              style={{
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                width: `${crop.width}%`,
                height: `${crop.height}%`,
                touchAction: 'none',
              }}
              onPointerDown={(e) => handlePointerDown(e, 'box')}
            >
              {/* Rule of thirds grid lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                <div className="border-r border-b border-blue-300/50"></div>
                <div className="border-r border-b border-blue-300/50"></div>
                <div className="border-b border-blue-300/50"></div>
                <div className="border-r border-b border-blue-300/50"></div>
                <div className="border-r border-b border-blue-300/50"></div>
                <div className="border-b border-blue-300/50"></div>
                <div className="border-r border-blue-300/50"></div>
                <div className="border-r border-blue-300/50"></div>
                <div></div>
              </div>

              {/* Handles (Corners) */}
              <div 
                className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize shadow-md"
                onPointerDown={(e) => handlePointerDown(e, 'top-left')}
              />
              <div 
                className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nesw-resize shadow-md"
                onPointerDown={(e) => handlePointerDown(e, 'top-right')}
              />
              <div 
                className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nesw-resize shadow-md"
                onPointerDown={(e) => handlePointerDown(e, 'bottom-left')}
              />
              <div 
                className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize shadow-md"
                onPointerDown={(e) => handlePointerDown(e, 'bottom-right')}
              />
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-800 bg-gray-950/80">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRotate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg transition cursor-pointer"
              title="Girar imagen 90 grados"
            >
              <RotateCw className="w-3.5 h-3.5 text-blue-400" />
              Rotar 90°
            </button>

            <div className="flex items-center gap-1.5 bg-gray-800/90 border border-gray-700 rounded-lg px-2.5 py-1">
              <ZoomOut className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="range"
                min="0.8"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-20 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <ZoomIn className="w-3.5 h-3.5 text-gray-400" />
            </div>

            <button
              type="button"
              onClick={() => {
                setRotation(0);
                setZoom(1);
                setCrop({ x: 5, y: 5, width: 90, height: 90 });
              }}
              className="px-2.5 py-1.5 text-xs text-gray-400 hover:text-white transition cursor-pointer"
            >
              Reiniciar
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-800 rounded-lg border border-gray-700 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              id="confirm-crop-btn"
              onClick={handleApplyCrop}
              className="flex items-center gap-1.5 px-5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Recortar y Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
