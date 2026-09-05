"use client";

import { QRCodeSVG } from "qrcode.react";

type CardQRCodeProps = {
  value: string;
  size?: number;
  label?: string;
};

export default function CardQRCode({
  value,
  size = 144,
  label = "Your loyalty card QR code",
}: CardQRCodeProps) {
  return (
    <div
      className="flex justify-center rounded-md bg-canvas p-md"
      role="img"
      aria-label={label}
    >
      <QRCodeSVG value={value} size={size} fgColor="#0a0a0a" bgColor="#fffaf0" />
    </div>
  );
}
