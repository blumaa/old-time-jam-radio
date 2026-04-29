"use client";

import { useState } from "react";
import PasswordGate from "./components/PasswordGate";
import AdminPanel from "./AdminPanel";
import "@/styles/admin.css";

export default function AdminPage() {
  const [isAuthed, setIsAuthed] = useState(false);

  if (!isAuthed) {
    return <PasswordGate onSuccess={() => setIsAuthed(true)} />;
  }

  return <AdminPanel />;
}
