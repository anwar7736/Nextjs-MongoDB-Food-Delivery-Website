import localFont from "next/font/local";
import "./css/globals.css";
import 'react-toastify/dist/ReactToastify.css';
import Header from "./_components/layouts/Header";
import Footer from "./_components/layouts/Footer";
import AuthContextProvider from "./contexts/AuthContext";
import CartContextProvider from "./contexts/CartContext";
import UserAuthContextProvider from "./contexts/UserAuthContext";
import DeliveryAuthContextProvider from "./contexts/DeliveryAuthContext";
import PWARegister from "./_components/PWARegister";
import { ToastContainer } from "react-toastify";
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "FoodFlow AI | Local food, delivered",
  description: "Discover local restaurants and order your favorite food with FoodDash.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icons/icon-192.png",
  },
};

export const viewport = {
  themeColor: "#166534",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CartContextProvider>
          <UserAuthContextProvider>
            <AuthContextProvider>
              <DeliveryAuthContextProvider>
                <PWARegister />
                <Header />
                {children}
                <ToastContainer />
                <Footer />
              </DeliveryAuthContextProvider>
            </AuthContextProvider>
          </UserAuthContextProvider>
        </CartContextProvider>
      </body>
    </html>
  );
}
