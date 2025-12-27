import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { UserRole } from "../types";

const LoginScreen = () => {
  const { setUser, fetchLatestData } = useAppContext();
  const [pin, setPin] = useState("");

  const press = (value: string) => {
    if (pin.length < 3) setPin(pin + value);
  };

  const clear = () => setPin("");

  const login = async () => {
    if (pin === "555") {
      setUser({
        id: "admin-1",
        name: "Admin",
        role: UserRole.Admin,
      });
      // Fetch latest data after successful login
      await fetchLatestData();
    } else if (pin === "111") {
      setUser({
        id: "tech-1",
        name: "Technician",
        role: UserRole.Technician,
      });
      // Fetch latest data after successful login
      await fetchLatestData();
    } else {
      alert("Invalid PIN");
      clear();
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f2f4f7",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: 320,
          padding: 20,
          borderRadius: 12,
          background: "#ffffff",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        {/* LOGO */}
        <div style={{ textAlign: "center", marginBottom: 15 }}>
          <img
            src="/logo.png"
            alt="Glen Service"
            style={{ height: 40 }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <h3 style={{ margin: "10px 0 0", color: "#333" }}>
            Glen Service Panel
          </h3>
        </div>

        {/* PIN DISPLAY */}
        <input
          type="password"
          value={pin}
          readOnly
          placeholder="● ● ●"
          style={{
            width: "100%",
            height: 45,
            fontSize: 22,
            textAlign: "center",
            letterSpacing: 6,
            borderRadius: 8,
            border: "1px solid #ccc",
            marginBottom: 15,
          }}
        />

        {/* CALCULATOR KEYPAD */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
          }}
        >
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
            <button
              key={n}
              onClick={() => press(n)}
              style={{
                height: 50,
                fontSize: 18,
                borderRadius: 8,
                border: "1px solid #ddd",
                background: "#f9f9f9",
                cursor: "pointer",
              }}
            >
              {n}
            </button>
          ))}
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", marginTop: 15, gap: 10 }}>
          <button
            onClick={clear}
            style={{
              flex: 1,
              height: 45,
              borderRadius: 8,
              border: "none",
              background: "#e5e7eb",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
          <button
            onClick={login}
            style={{
              flex: 1,
              height: 45,
              borderRadius: 8,
              border: "none",
              background: "#2563eb",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </div>

        {/* HINT */}
        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            textAlign: "center",
            color: "#666",
          }}
        >
          Admin: 555 &nbsp; | &nbsp; Technician: 111
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
