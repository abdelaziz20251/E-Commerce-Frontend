import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

export const metadata = {
  title: "Dokkan",
  description:
    "Dokkan is a platform that connects businesses with top-tier freelance talent for their projects.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white min-h-screen">
        <ClientLayout children={children} />
      </body>
    </html>
  );
}
