import { useState, useEffect } from "react";
import { C } from "../styles/tokens";
import { Modal, Btn, Spinner } from "./ui";
import { api } from "../api/client";

export default function QRCodeModal({ open, onClose, table, toast }) {
  const [qrUrl,   setQrUrl]   = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !table?.id) return;
    setLoading(true);
    setQrUrl(null);

    api.get(`/tables/${table.id}/qr_info/`)
      .then(info => setQrUrl(info.qr_url))
      .catch(() => toast?.error("Erreur", "Impossible de charger le QR code."))
      .finally(() => setLoading(false));
  }, [open, table?.id]);

  // URL de l'image QR via service public (fiable, pas de CORS)
  const qrImgSrc = qrUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrUrl)}&bgcolor=ffffff&color=1a1a1a&margin=2`
    : null;

  const handleDownload = () => {
    if (!qrImgSrc) return;
    const a = document.createElement("a");
    a.href = qrImgSrc;
    a.download = `qr-table-${table?.numero || table?.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast?.success("Téléchargé", `QR code table ${table?.numero}`);
  };

  const handlePrint = () => {
    if (!qrImgSrc) return;
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>QR Table ${table?.numero}</title>
      <style>
        body { display:flex; flex-direction:column; align-items:center;
               justify-content:center; min-height:100vh; margin:0;
               font-family:sans-serif; background:#fff; }
        img  { width:260px; height:260px; }
        h2   { font-size:22px; margin:16px 0 4px; }
        p    { color:#666; font-size:13px; margin:4px 0; }
      </style></head>
      <body>
        <img src="${qrImgSrc}" />
        <h2>Table ${table?.numero}</h2>
        ${table?.description ? `<p>${table.description}</p>` : ""}
        ${table?.capacite    ? `<p>${table.capacite} couverts</p>` : ""}
        <p style="margin-top:14px;font-size:11px;color:#aaa">Scannez pour commander</p>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  const handleCopyUrl = () => {
    if (!qrUrl) return;
    navigator.clipboard.writeText(qrUrl)
      .then(() => toast?.success("Copié", "Lien QR copié dans le presse-papier."))
      .catch(() => toast?.warning("Erreur", "Impossible de copier."));
  };

  return (
    <Modal open={open} onClose={onClose} title={`QR Code — Table ${table?.numero || ""}`} width={320}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>

        {/* Image QR */}
        <div style={{
          width: 220, height: 220,
          background: "#fff",
          border: `2px solid ${C.border}`,
          borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        }}>
          {loading ? (
            <Spinner size={32} />
          ) : qrImgSrc ? (
            <img
              src={qrImgSrc}
              alt={`QR Table ${table?.numero}`}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              onError={() => toast?.error("Erreur", "Image QR inaccessible (vérifiez votre connexion).")}
            />
          ) : (
            <div style={{ textAlign: "center", color: C.muted, fontSize: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⬜</div>
              QR indisponible
            </div>
          )}
        </div>

        {/* Infos table */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
            Table {table?.numero}
          </div>
          {table?.description && (
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{table.description}</div>
          )}
          {table?.capacite && (
            <div style={{ fontSize: 11, color: C.muted }}>{table.capacite} couverts</div>
          )}
        </div>

        {/* URL encodée */}
        {qrUrl && (
          <div style={{
            width: "100%",
            padding: "8px 12px",
            background: C.bg1,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            fontSize: 10,
            color: C.muted,
            wordBreak: "break-all",
            fontFamily: "monospace",
            textAlign: "center",
          }}>
            {qrUrl}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, width: "100%", flexWrap: "wrap" }}>
          <Btn
            variant="ghost"
            style={{ flex: 1, justifyContent: "center", fontSize: 12 }}
            onClick={handleCopyUrl}
            disabled={!qrUrl}
          >
            📋 Copier lien
          </Btn>
          <Btn
            variant="ghost"
            style={{ flex: 1, justifyContent: "center", fontSize: 12 }}
            onClick={handlePrint}
            disabled={!qrImgSrc || loading}
          >
            🖨 Imprimer
          </Btn>
          <Btn
            style={{ flex: 1, justifyContent: "center", fontSize: 12 }}
            onClick={handleDownload}
            disabled={!qrImgSrc || loading}
          >
            ↓ Télécharger
          </Btn>
        </div>
      </div>
    </Modal>
  );
}