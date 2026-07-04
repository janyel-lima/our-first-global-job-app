import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // API Route: Secure Certificate SVG Generator (Ensures students do not forge certificates)
  app.post("/api/certificates/generate", (req, res) => {
    try {
      const { studentName, courseTitle, certifiedAt, certificateId, primaryColor, iconUrl } = req.body;

      if (!studentName || !courseTitle) {
        return res.status(400).json({ error: "Nome do estudante e título do curso são obrigatórios." });
      }

      // We output an aesthetic SVG representation of the English Certification symbol
      const dateString = certifiedAt || new Date().toLocaleDateString("pt-BR");
      const idString = certificateId || `CERT-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      
      const themeColor = primaryColor || "#1e3a8a"; // Default beautiful navy

      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
          <!-- Premium Background Pattern -->
          <rect width="800" height="600" fill="#fafaf9" rx="16"/>
          
          <!-- Subtle professional background watermark/accent lines -->
          <circle cx="400" cy="300" r="280" fill="none" stroke="${themeColor}" stroke-opacity="0.03" stroke-width="6"/>
          <circle cx="400" cy="300" r="270" fill="none" stroke="${themeColor}" stroke-opacity="0.02" stroke-width="1.5" stroke-dasharray="10 5"/>
          
          <!-- Outer border -->
          <rect x="25" y="25" width="750" height="550" fill="none" stroke="#e7e5e4" stroke-width="1.5" rx="12"/>
          <!-- Inner border in brand theme color -->
          <rect x="35" y="35" width="730" height="530" fill="none" stroke="${themeColor}" stroke-opacity="0.7" stroke-width="2.5" rx="10" stroke-dasharray="15 5"/>
          
          <!-- Exquisite Corner Motifs -->
          <g stroke="${themeColor}" stroke-opacity="0.8" stroke-width="2" fill="none">
            <!-- Top Left -->
            <path d="M 45 75 L 45 45 L 75 45" />
            <path d="M 52 75 L 52 52 L 75 52" />
            <!-- Top Right -->
            <path d="M 755 75 L 755 45 L 725 45" />
            <path d="M 748 75 L 748 52 L 725 52" />
            <!-- Bottom Left -->
            <path d="M 45 525 L 45 555 L 75 555" />
            <path d="M 52 525 L 52 548 L 75 548" />
            <!-- Bottom Right -->
            <path d="M 755 525 L 755 555 L 725 555" />
            <path d="M 748 525 L 748 548 L 725 548" />
          </g>
          
          <!-- Title Section -->
          <g transform="translate(400, 115)" text-anchor="middle">
            <text font-family="'Inter', 'Helvetica Neue', sans-serif" font-weight="800" font-size="34" fill="${themeColor}" letter-spacing="3">CERTIFICADO DE CONCLUSÃO</text>
            <text font-family="'Inter', sans-serif" font-weight="600" font-size="11" fill="#78716c" y="30" letter-spacing="5">ENSINO VOLUNTÁRIO DE LÍNGUA INGLESA</text>
            <line x1="-120" y1="42" x2="120" y2="42" stroke="#e7e5e4" stroke-width="1.5"/>
          </g>

          <!-- Text Section -->
          <g transform="translate(400, 220)" text-anchor="middle">
            <text font-family="'Inter', sans-serif" font-size="14" fill="#78716c" font-style="italic">Este certificado comprova de forma simbólica e por mérito acadêmico que</text>
            <text font-family="'Space Grotesk', 'Inter', sans-serif" font-weight="805" font-size="28" fill="#1c1917" y="48">${studentName}</text>
            <line x1="-150" y1="65" x2="150" y2="65" stroke="${themeColor}" stroke-opacity="0.3" stroke-width="1.5"/>
          </g>

          <g transform="translate(400, 335)" text-anchor="middle">
            <text font-family="'Inter', sans-serif" font-size="14" fill="#78716c">concluiu com aproveitamento e dedicação todas as lições do mini-curso:</text>
            <text font-family="'Inter', sans-serif" font-weight="bold" font-size="22" fill="${themeColor}" y="32">${courseTitle}</text>
            <text font-family="'Inter', sans-serif" font-size="11" fill="#a8a29e" y="60">Programa de Aprendizado Autônomo e Solidário</text>
          </g>

          <!-- Seal Icon / Seal Design Below Name -->
          <g transform="translate(400, 465)" text-anchor="middle">
            ${iconUrl ? `
              <!-- Frame for custom image -->
              <circle r="40" fill="#ffffff" stroke="${themeColor}" stroke-width="1.5"/>
              <image href="${iconUrl}" x="-30" y="-30" height="60" width="60" />
            ` : `
              <!-- Professional Default Geometric Seal -->
              <g>
                <!-- Left Ribbon Tail -->
                <path d="M -18 15 L -26 48 L -14 41 L -6 46 L -10 15 Z" fill="${themeColor}" opacity="0.85"/>
                <!-- Right Ribbon Tail (Symmetric) -->
                <path d="M 18 15 L 26 48 L 14 41 L 6 46 L 10 15 Z" fill="${themeColor}" opacity="0.85"/>
                
                <!-- Circular Gold Badge (drawn over Ribbons for seamless connection) -->
                <circle r="32" fill="#fafaf9" stroke="#d97706" stroke-width="3"/>
                <polygon points="0,-16 4,-6 14,-6 6,1 9,11 0,5 -9,11 -6,1 -14,-6 -4,-6" fill="#f59e0b" stroke="#b45309" stroke-width="1" />
                <circle r="25" fill="none" stroke="#f59e0b" stroke-width="1" stroke-dasharray="4 2"/>
              </g>
            `}
            <text font-family="'JetBrains Mono', monospace" font-size="9.5" font-weight="bold" fill="#78716c" y="60">CÓD: ${idString}</text>
          </g>

          <!-- Footer signatures & Metadata -->
          <g transform="translate(150, 485)" text-anchor="middle">
            <path d="M -60 -10 C -40 -20, -20 0, 0 -15 C 20 -30, 40 5, 60 -10" fill="none" stroke="${themeColor}" stroke-width="1.2" stroke-opacity="0.4"/>
            <line x1="-80" y1="0" x2="80" y2="0" stroke="#d6d3d1" stroke-width="1"/>
            <text font-family="'Inter', sans-serif" font-size="11" fill="#1c1917" y="16">Instrutor Voluntário</text>
            <text font-family="'Inter', sans-serif" font-size="9" fill="#a8a29e" y="28">English Volunteer Network</text>
          </g>

          <g transform="translate(650, 485)" text-anchor="middle">
            <text font-family="'Inter', sans-serif" font-weight="bold" font-size="11" fill="#1c1917" y="-10">${dateString}</text>
            <line x1="-80" y1="0" x2="80" y2="0" stroke="#d6d3d1" stroke-width="1"/>
            <text font-family="'Inter', sans-serif" font-size="11" fill="#1c1917" y="16">Data de Conclusão</text>
            <text font-family="'Inter', sans-serif" font-size="9" fill="#a8a29e" y="28">Validação Eletrônica</text>
          </g>
        </svg>
      `;

      res.setHeader("Content-Type", "image/svg+xml");
      res.send(svg);
    } catch (error: any) {
      console.error("Erro na geração do certificado:", error);
      res.status(500).json({ error: error?.message || "Erro ao gerar o SVG do certificado." });
    }
  });

  let viteServer: any = null;

  // Vite middleware setup for Development, otherwise serve final build static folder
  if (process.env.NODE_ENV !== "production") {
    viteServer = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(viteServer.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FULL-STACK] Server operational at http://localhost:${PORT}`);
  });

  // Repassa upgrades de protocolo do WebSocket (HMR) ao servidor Vite de desenvolvimento
  if (process.env.NODE_ENV !== "production" && viteServer) {
    server.on("upgrade", (request, socket, head) => {
      viteServer.handleUpgrade(request, socket, head);
    });
  }
}

startServer();
