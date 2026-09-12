import "./globals.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: "OpsBridge",
  description: "Business management platform — requests, contractors, and approvals in one place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
