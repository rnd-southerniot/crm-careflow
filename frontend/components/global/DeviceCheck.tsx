"use client"

import { useEffect, useState } from "react";

// Client-side component for device detection
const DeviceCheck = ({ children }: { children: React.ReactNode }) => {
  const [isUnsupported, setIsUnsupported] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      // const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth < 600;
      setIsUnsupported(isSmallScreen);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  if (isUnsupported) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Device Not Supported</h2>
          <p className="text-gray-600">
            This web application can only be viewed on tablets, laptops, or PCs with a screen width of 600px or greater.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default DeviceCheck