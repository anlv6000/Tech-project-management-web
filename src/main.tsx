import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { Toaster } from "./app/components/ui/sonner";

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Toaster />
  </>
);
