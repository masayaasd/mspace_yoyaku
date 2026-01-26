
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LIFFProvider } from "./providers/LIFFProvider";
import { Layout } from "./components/Layout";
import { FloorMapPage } from "./pages/FloorMapPage";
import { BookingPage } from "./pages/BookingPage";
import { MyReservationsPage } from "./pages/MyReservationsPage";
import "./index.css";

function App() {
  return (
    <LIFFProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<FloorMapPage />} />
            <Route path="/new" element={<BookingPage />} />
            <Route path="/my" element={<MyReservationsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LIFFProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
