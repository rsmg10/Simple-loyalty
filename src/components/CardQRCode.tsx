"use client";

import { QRCodeSVG } from "qrcode.react";

type CardQRCodeProps = {
  value: string;
};

export default function CardQRCode({ value }: CardQRCodeProps) {
  return (
    <div
      className="flex justify-center rounded-md bg-canvas p-md"
      role="img"
      aria-label="Your loyalty card QR code"
    >
      <QRCodeSVG value={value} size={144} fgColor="#0a0a0a" bgColor="#fffaf0" />
    </div>
  );
}
