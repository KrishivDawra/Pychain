import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function QRScanner({ onScan }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear();
      },
      (error) => {
        console.warn(error);
      }
    );

    return () => scanner.clear().catch(() => {});
  }, []);

  return <div id="reader" className="w-full" />;
}