import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Genetic Universe → Offspring Universe | Mechanistic Attributions",
  description:
    "Tracing offspring phenotypic novelty to recombination-generated genomic configurations and epistatic interactions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-[#030712]">
      <body className="bg-[#030712] text-slate-100 min-h-screen overflow-x-hidden antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
