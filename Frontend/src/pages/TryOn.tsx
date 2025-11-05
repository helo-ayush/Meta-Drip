// TryOn.tsx
import { useRef, useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Camera, Video, VideoOff, ArrowLeft, Maximize, Minimize, Download, RotateCcw, Info, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { API_ENDPOINTS } from "@/config/api";

declare global {
  interface Window {
    FaceMesh: any;
    Camera: any;
  }
}

interface FaceRotation {
  pitch: number;
  yaw: number;
  roll: number;
}

export default function TryOn() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glassesContainerRef = useRef<HTMLDivElement>(null);
  const glassesImgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale] = useState([100]);
  const [alpha] = useState([100]);
  const [cameraOn, setCameraOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [rotation, setRotation] = useState<FaceRotation>({ pitch: 0, yaw: 0, roll: 0 });
  const [glassesPosition, setGlassesPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const faceMeshRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const videoFrameBufferRef = useRef<{ frame: ImageData; timestamp: number }[]>([]);
  const [product, setProduct] = useState<any>(null);
  
  // Video delay in milliseconds (adjust this to find optimal sync)
  const VIDEO_DELAY_MS = 50;
  const [loading, setLoading] = useState(true);
  const [reviewStats, setReviewStats] = useState<{ averageRating: number; totalReviews: number }>({ averageRating: 0, totalReviews: 0 });

  const glassesImg = useRef(new Image());
  
  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.products}/${id}`);
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
          // Set the overlay image from product
          glassesImg.current.src = data.overlayImage;
          // Fetch rating stats
          const statsRes = await fetch(`${API_ENDPOINTS.reviews}/product/${id}/stats`);
          if (statsRes.ok) {
            const stats = await statsRes.json();
            setReviewStats(stats);
          }
        } else {
          toast({
            title: "Error",
            description: "Product not found",
            variant: "destructive",
          });
          navigate("/store");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load product",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id, navigate, toast]);


  // Load MediaPipe scripts
  useEffect(() => {
    const loadScripts = async () => {
      if (window.FaceMesh && window.Camera) {
        setIsLoaded(true);
        return;
      }

      const loadScript = (src: string) => {
        return new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = src;
          script.onload = resolve;
          script.onerror = reject;
          script.crossOrigin = "anonymous";
          document.head.appendChild(script);
        });
      };

      try {
        // Load FaceMesh instead of Holistic (lighter and more stable)
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js");
        
        // Wait for scripts to fully initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (window.FaceMesh && window.Camera) {
          setIsLoaded(true);
        } else {
          throw new Error("MediaPipe FaceMesh failed to initialize");
        }
      } catch (err) {
        console.error("Failed to load MediaPipe", err);
      }
    };

    loadScripts();
  }, []);


  const startCamera = async () => {
    if (!isLoaded || !videoRef.current || !canvasRef.current) return;

    const faceMesh = new window.FaceMesh({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    // Optimized settings for better performance with GPU acceleration
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    // CPU-based rendering - render directly on each detection
    faceMesh.onResults((results: any) => {
      if (!canvasRef.current || !videoRef.current) return;
      
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Capture current video frame with timestamp
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
        const currentTime = performance.now();
        
        // Add frame with timestamp to buffer
        videoFrameBufferRef.current.push({ frame: frameData, timestamp: currentTime });
        
        // Remove frames older than needed delay
        const cutoffTime = currentTime - VIDEO_DELAY_MS * 2; // Keep 2x delay worth of frames
        videoFrameBufferRef.current = videoFrameBufferRef.current.filter(
          f => f.timestamp > cutoffTime
        );
      }

      // Draw delayed video frame from buffer
      const currentTime = performance.now();
      const targetTime = currentTime - VIDEO_DELAY_MS;
      
      // Find frame closest to target delay time
      let frameToDisplay = videoFrameBufferRef.current[0];
      for (const bufferedFrame of videoFrameBufferRef.current) {
        if (bufferedFrame.timestamp <= targetTime) {
          frameToDisplay = bufferedFrame;
        } else {
          break;
        }
      }
      
      if (frameToDisplay) {
        ctx.putImageData(frameToDisplay.frame, 0, 0);
      } else {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      // Draw glasses overlay if face detected
      if (results.multiFaceLandmarks && results.multiFaceLandmarks[0]) {
        const landmarks = results.multiFaceLandmarks[0];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const w = canvas.width;
        const h = canvas.height;

        const leX = leftEye.x * w;
        const leY = leftEye.y * h;
        const reX = rightEye.x * w;
        const reY = rightEye.y * h;

        const eyeDist = Math.hypot(reX - leX, reY - leY);
        const glassWidth = eyeDist * 2.2 * (scale[0] / 100);
        const glassHeight = glassWidth * (glassesImg.current.height / glassesImg.current.width);

        const centerX = (leX + reX) / 2;
        const centerY = (leY + reY) / 2;

        // Simple 2D rotation based on eye angle
        const angle = Math.atan2(reY - leY, reX - leX);

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);

        ctx.globalAlpha = alpha[0] / 100;
        ctx.drawImage(
          glassesImg.current,
          -glassWidth / 2,
          -glassHeight / 2,
          glassWidth,
          glassHeight
        );

        ctx.restore();
      }
    });
    faceMeshRef.current = faceMesh;

    const camera = new window.Camera(videoRef.current, {
      onFrame: async () => {
        if (faceMeshRef.current && videoRef.current) {
          await faceMeshRef.current.send({ image: videoRef.current });
        }
      },
      width: 480,
      height: 360,
    });

    cameraRef.current = camera;
    camera.start();
    setCameraOn(true);
  };

  const stopCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.stop();
    }
    if (faceMeshRef.current) {
      faceMeshRef.current.close();
    }
    setCameraOn(false);
  };



  const capture = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.href = canvasRef.current.toDataURL("image/png");
    link.download = `${product?.name || 'tryon'}-${Date.now()}.png`;
    link.click();
    toast({
      title: "Photo Captured!",
      description: "Your try-on photo has been saved",
    });
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  const restartCamera = () => {
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 500);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-pink-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background flex flex-col">
      {/* Compact Header */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/store")} className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">
                <span className="gradient-text">{product.name}</span>
              </h1>
              <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowInfo(!showInfo)}
            className="h-8 w-8"
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Info Panel */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 border-b border-border/50"
          >
            <div className="glass rounded-xl p-3 my-2">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Info className="w-3 h-3" />
                How to use
              </h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Allow camera access</li>
                <li>• Position face in center</li>
                <li>• Glasses auto-adjust to your face</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - No Scroll */}
      <div className="flex-1 px-4 py-4 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Camera View - Smaller */}
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 flex items-center justify-center"
          >
            <div className="glass rounded-2xl overflow-hidden shadow-2xl relative w-full max-w-2xl">
              <video ref={videoRef} className="hidden" />
              <canvas
                ref={canvasRef}
                width={480}
                height={360}
                className="w-full rounded-2xl"
              />

              {/* Loading State */}
              {!cameraOn && !isLoaded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                >
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-lg font-semibold">Loading AR Technology...</p>
                    <p className="text-sm text-white/70 mt-2">Initializing face detection</p>
                  </div>
                </motion.div>
              )}

              {/* Start Camera State */}
              {!cameraOn && isLoaded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm"
                >
                  <Camera className="w-20 h-20 mb-6 text-white" />
                  <h3 className="text-2xl font-bold text-white mb-2">Ready to Try On</h3>
                  <p className="text-white/80 mb-6">See how {product.name} looks on you</p>
                  <Button size="lg" variant="accent" onClick={startCamera}>
                    <Video className="w-5 h-5 mr-2" /> Start Camera
                  </Button>
                </motion.div>
              )}

              {/* Camera Controls */}
              {cameraOn && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2"
                >
                  <div className="glass-strong rounded-full flex items-center gap-2 p-2 shadow-lg">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={capture}
                      className="rounded-full hover:bg-accent hover:text-accent-foreground"
                      title="Capture Photo"
                    >
                      <Camera className="w-5 h-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={restartCamera}
                      className="rounded-full hover:bg-accent hover:text-accent-foreground"
                      title="Restart Camera"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={stopCamera}
                      className="rounded-full hover:bg-destructive hover:text-destructive-foreground"
                      title="Stop Camera"
                    >
                      <VideoOff className="w-5 h-5" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Status Indicator */}
              {cameraOn && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute top-4 left-4"
                >
                  <div className="glass-strong rounded-full px-3 py-1.5 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold">LIVE</span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Product Info Sidebar - Compact */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-3 overflow-y-auto scrollbar-hide"
          >
            {/* Product Card - Compact */}
            <div className="glass rounded-xl overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-muted to-background p-4">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-4 space-y-2">
                <div>
                  <h3 className="text-lg font-bold">{product.name}</h3>
                  {product.badge && (
                    <span className="inline-block mt-1 bg-accent/20 text-accent text-xs font-semibold px-2 py-0.5 rounded-full">
                      {product.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">${product.price}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  {reviewStats.totalReviews > 0 ? (
                    <>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.round(reviewStats.averageRating)
                                ? "fill-accent text-accent"
                                : "fill-muted text-muted"
                            }`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">({reviewStats.totalReviews})</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">No reviews yet</span>
                  )}
                </div>
              </div>
            </div>

            {/* Purchase Options - Compact */}
            <div className="glass rounded-xl p-4 space-y-2">
              <h3 className="font-semibold text-sm mb-2">Buy Now</h3>
              <div className="grid grid-cols-2 gap-2">
                {product.links.amazon && (
                  <a href={product.links.amazon} target="_blank" rel="noopener noreferrer">
                    <Button variant="default" className="w-full h-9" size="sm">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Amazon
                    </Button>
                  </a>
                )}
                {product.links.flipkart && (
                  <a href={product.links.flipkart} target="_blank" rel="noopener noreferrer">
                    <Button variant="default" className="w-full h-9" size="sm">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Flipkart
                    </Button>
                  </a>
                )}
                {product.links.myntra && (
                  <a href={product.links.myntra} target="_blank" rel="noopener noreferrer">
                    <Button variant="default" className="w-full h-9" size="sm">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Myntra
                    </Button>
                  </a>
                )}
                {product.links.ajio && (
                  <a href={product.links.ajio} target="_blank" rel="noopener noreferrer">
                    <Button variant="default" className="w-full h-9" size="sm">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Ajio
                    </Button>
                  </a>
                )}
                {product.links.other && (
                  <a href={product.links.other} target="_blank" rel="noopener noreferrer">
                    <Button variant="default" className="w-full h-9 col-span-2" size="sm">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Buy Now
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Tips - Compact */}
            <div className="glass-strong rounded-xl p-3">
              <h4 className="font-semibold text-xs mb-2">💡 Tips</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Good lighting improves accuracy</li>
                <li>• Remove existing glasses</li>
                <li>• Try different angles</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}