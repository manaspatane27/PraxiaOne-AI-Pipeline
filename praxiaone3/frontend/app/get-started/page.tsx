"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = "http://127.0.0.1:8000/api";

const OPTIONS = [
  { key: "weight", label: "Weight Management" },
  { key: "fitness", label: "Fitness & Activity" },
  { key: "nutrition", label: "Nutrition" },
  { key: "sleep", label: "Sleep Improvement" },
  { key: "stress", label: "Stress & Mental Wellness" },
];

export default function GetStartedPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔐 Auth guard
  useEffect(() => {
    if (!localStorage.getItem("access")) {
      router.push("/signup");
    }
  }, []);

  const toggle = (key: string) => {
    setSelected((prev) =>
      prev.includes(key)
        ? prev.filter((i) => i !== key)
        : [...prev, key]
    );
  };

  const saveAndContinue = async () => {
    if (selected.length === 0) {
      alert("Please select at least one focus area.");
      return;
    }

    setLoading(true);

    await fetch(`${API}/profile/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access")}`,
      },
      body: JSON.stringify({
        wellness_interests: selected,
      }),
    });

    setLoading(false);
    router.push("/profile");
  };

  return (
    <main style={{ padding: 40, maxWidth: 900, margin: "auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>
        What would you like to focus on?
      </h1>
      <p style={{ opacity: 0.7, marginBottom: 30 }}>
        Choose one or more wellness goals. You can change these anytime.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 40,
        }}
      >
        {OPTIONS.map((opt) => (
          <div
            key={opt.key}
            onClick={() => toggle(opt.key)}
            style={{
              padding: 20,
              borderRadius: 0,
              cursor: "pointer",
              border: selected.includes(opt.key)
                ? "2px solid #22c55e"
                : "1px solid #334155",
              background: selected.includes(opt.key)
                ? "rgba(34,197,94,0.1)"
                : "transparent",
            }}
          >
            <strong>{opt.label}</strong>
          </div>
        ))}
      </div>

      <button
        onClick={saveAndContinue}
        disabled={loading}
        style={{
          padding: "14px 28px",
          fontSize: 16,
          borderRadius: 0,
          background: "#22c55e",
          color: "#000",
          border: "none",
          cursor: "pointer",
        }}
      >
        {loading ? "Saving..." : "Continue"}
      </button>
    </main>
  );
}
