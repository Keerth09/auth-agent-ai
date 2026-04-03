"use client";
import { useEffect } from "react";

// Legacy route — redirect to new dashboard
export default function ClientRedirect() {
  useEffect(() => {
    window.location.replace("/dashboard");
  }, []);
  return null;
}
