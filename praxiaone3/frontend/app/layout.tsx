import "./globals.css";
import Providers from "./providers";
import AppShell from "@/components/AppShell";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";

export const metadata = {
  title: "PraxiaOne — AI-Driven Personalized Wellness",
  description: "Your Health, Your Data, Your Way",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* ✅ Fixes MUI + Emotion SSR hydration mismatch in Next.js App Router */}
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
