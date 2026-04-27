/**
 * LogoUpload — Composant d'upload d'image réutilisable
 * Usage :
 *   <LogoUpload value={logoUrl} onChange={url => setLogoUrl(url)} />
 *
 * Props :
 *   value    — URL actuelle du logo (string)
 *   onChange — callback(url: string) appelé après upload réussi
 *   label    — label affiché (défaut : "Logo")
 *   size     — taille de la preview en px (défaut : 96)
 */
import { useState, useRef } from "react";
import { C } from "../styles/tokens";
import { Spinner } from "./ui";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

export default function LogoUpload({ value, onChange, label = "Logo", size = 96 }) {
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");
  const inputRef = useRef(null);

  const upload = async (file) => {
    if (!file) return;

    // Validation client
    const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!ALLOWED.includes(file.type)) {
      setError("Format non supporté. Utilisez PNG, JPG ou WEBP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Fichier trop lourd (max 2 Mo)");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("logo", file);

      // Récupérer le token JWT s'il existe
      const token = localStorage.getItem("oresto_token");
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/upload/logo/`, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Erreur lors de l'upload");
        return;
      }

      onChange(data.url);
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, letterSpacing: .3, display: "block", marginBottom: 8 }}>
          {label}
        </label>
      )}

      {/* Zone d'upload */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "14px 18px",
          borderRadius: 12,
          border: `2px dashed ${dragging ? C.gold : error ? C.danger : value ? C.gold + "60" : C.border}`,
          background: dragging ? C.gold + "08" : value ? C.gold + "05" : C.bg1,
          cursor: uploading ? "wait" : "pointer",
          transition: "all .2s",
          userSelect: "none",
        }}
      >
        {/* Preview */}
        <div style={{
          width: size, height: size, borderRadius: 12,
          border: `1.5px solid ${value ? C.gold + "40" : C.border}`,
          background: C.bg0,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", flexShrink: 0, position: "relative",
        }}>
          {uploading ? (
            <Spinner size={24} />
          ) : value ? (
            <>
              <img
                src={value}
                alt="Logo"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                onError={e => { e.target.style.display = "none"; }}
              />
              {/* Bouton supprimer */}
              <button
                onClick={handleRemove}
                style={{
                  position: "absolute", top: 4, right: 4,
                  width: 20, height: 20, borderRadius: "50%",
                  background: C.danger, border: "none",
                  color: "#fff", fontSize: 11, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  lineHeight: 1,
                }}
              >✕</button>
            </>
          ) : (
            <div style={{ textAlign: "center", color: C.muted }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>🖼</div>
            </div>
          )}
        </div>

        {/* Texte guide */}
        <div style={{ flex: 1 }}>
          {value ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.gold, marginBottom: 4 }}>
                ✓ Logo chargé
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>
                Cliquez ou déposez un nouveau fichier pour le remplacer
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                {dragging ? "Déposez votre logo ici" : "Cliquez ou glissez votre logo"}
              </div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
                PNG, JPG ou WEBP — max 2 Mo<br />
                Recommandé : 512×512 px, fond transparent
              </div>
            </>
          )}
          {error && (
            <div style={{ fontSize: 11, color: C.danger, marginTop: 6 }}>
              ⚠ {error}
            </div>
          )}
        </div>
      </div>

      {/* Input caché */}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleChange}
        style={{ display: "none" }}
      />
    </div>
  );
}