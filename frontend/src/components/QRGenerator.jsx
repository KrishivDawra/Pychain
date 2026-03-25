import { QRCodeCanvas } from "qrcode.react";

export default function QRGenerator({ value }) {
  return (
    <div className="bg-white p-4 rounded-xl">
      <QRCodeCanvas value={value} size={150} />
    </div>
  );
}