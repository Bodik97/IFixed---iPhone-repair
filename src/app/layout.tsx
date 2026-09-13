import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Unbounded, Manrope } from "next/font/google";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { site } from "@/data/site";
import "./globals.css";

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "600"],
  variable: "--font-unbounded",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "iFix — ремонт iPhone у Львові та Новому Розділі",
    template: "%s · iFix",
  },
  description: site.tagline,
  openGraph: {
    type: "website",
    locale: "uk_UA",
    siteName: site.name,
  },
};

const localBusiness = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: site.name,
  description: site.tagline,
  url: site.url,
  telephone: site.phones.map((p) => p.href.replace("tel:", "")),
  areaServed: site.cities,
  address: site.cities.map((city) => ({
    "@type": "PostalAddress",
    addressLocality: city,
    addressCountry: "UA",
  })),
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    opens: "08:00",
    closes: "18:00",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" data-scroll-behavior="smooth" className={`${unbounded.variable} ${manrope.variable}`}>
      <body>
        <ClerkProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <BottomNav />
        </ClerkProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
        />
      </body>
    </html>
  );
}
