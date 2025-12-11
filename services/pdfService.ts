
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { Asset } from '../types';

export const generatePDF = async (assets: Asset[], filename: string) => {
  const doc = new jsPDF();
  
  // 1. Načtení fontu podporujícího češtinu (Roboto) z CDN
  try {
      const fontUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf";
      const fontResponse = await fetch(fontUrl);
      const fontBlob = await fontResponse.blob();
      
      const reader = new FileReader();
      reader.readAsDataURL(fontBlob);
      
      await new Promise<void>((resolve) => {
          reader.onloadend = () => {
              const base64data = reader.result as string;
              // Odstranění prefixu "data:font/ttf;base64,"
              const base64clean = base64data.split(',')[1];
              
              doc.addFileToVFS("Roboto-Regular.ttf", base64clean);
              // PŘIDÁNO: "Identity-H" pro správné kódování češtiny
              doc.addFont("Roboto-Regular.ttf", "Roboto", "normal", "Identity-H");
              doc.setFont("Roboto");
              resolve();
          };
      });
  } catch (e) {
      console.error("Nepodařilo se načíst font pro češtinu:", e);
  }

  const dateStr = new Date().toLocaleDateString('cs-CZ');
  const totalValue = assets.reduce((sum, a) => sum + a.price, 0);

  // 1. Titulní strana - Seznam
  
  doc.setFontSize(22);
  doc.text("SDH Nezdenice - Evidence majetku", 14, 20);
  doc.setFontSize(12);
  doc.text(`Datum vyhotovení: ${dateStr}`, 14, 30);
  
  if (assets.length > 1) {
      doc.text(`Celková hodnota: ${totalValue.toLocaleString('cs-CZ')} Kč`, 14, 38);
      doc.text(`Počet položek: ${assets.length}`, 14, 44);

      const tableData = assets.map(a => [
        a.inventoryNumber,
        a.name,
        a.category,
        a.location,
        a.condition,
        `${a.price.toLocaleString('cs-CZ')} Kč`
      ]);

      autoTable(doc, {
        startY: 50,
        head: [[
          "Ev. Číslo", 
          "Název", 
          "Kategorie", 
          "Umístění", 
          "Stav", 
          "Cena"
        ]],
        body: tableData,
        styles: { font: "Roboto", fontStyle: "normal" },
        headStyles: { font: "Roboto", fontStyle: "normal" }
      });
  } else {
      // Pro jednu položku jen stručné info
      doc.text(`Položka: ${assets[0].name}`, 14, 38);
  }

  // 2. Jednotlivé karty
  assets.forEach((asset) => {
    doc.addPage();
    
    // Hlavička karty
    doc.setFillColor(190, 18, 60); // fire-700 color
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text(asset.name, 14, 20);
    doc.setFontSize(12);
    doc.text(`Ev. Číslo: ${asset.inventoryNumber}`, 140, 20, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);

    let yPos = 45;
    let leftMargin = 14;
    
    // Vložení obrázku, pokud existuje
    if (asset.imageUrl) {
      try {
        // x=14, y=40, w=50, h=50
        doc.addImage(asset.imageUrl, 'JPEG', 14, 40, 50, 50);
        leftMargin = 70; // Posun textu doprava
      } catch (err) {
        console.warn("Chyba při vkládání obrázku do PDF:", err);
        leftMargin = 14;
      }
    }

    // Tabulka detailů
    const details = [
      ["Kategorie", asset.category],
      ["Umístění", asset.location],
      ["Stav", asset.condition],
      ["Správce", asset.manager],
      ["Datum pořízení", new Date(asset.purchaseDate).toLocaleDateString('cs-CZ')],
      ["Cena", `${asset.price.toLocaleString('cs-CZ')} Kč`]
    ];

    details.forEach(([label, value]) => {
      doc.setFont("Roboto", "normal");
      doc.text(label + ":", leftMargin, yPos);
      doc.text(String(value), leftMargin + 40, yPos);
      yPos += 10;
    });
    
    // Posun yPos pod obrázek
    if (asset.imageUrl) {
       yPos = Math.max(yPos, 100); 
    } else {
       yPos += 10;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(14, yPos, 196, yPos);
    yPos += 15;

    // Popis
    doc.setFont("Roboto", "normal");
    doc.text("Technický popis:", 14, yPos);
    yPos += 10;
    
    const splitDescription = doc.splitTextToSize(asset.description || "Bez popisu", 180);
    doc.text(splitDescription, 14, yPos);
    
    yPos += (splitDescription.length * 7) + 15;

    // Údržba
    if (asset.nextServiceDate || asset.maintenanceNotes) {
       doc.setFillColor(240, 240, 240);
       doc.rect(14, yPos, 182, 30, 'F');
       doc.setTextColor(0, 0, 0);
       doc.setFont("Roboto", "normal");
       doc.text("Údržba a servis", 20, yPos + 10);
       doc.text(`Příští termín: ${asset.nextServiceDate || '-'}`, 20, yPos + 20);
       doc.text(`Poznámka: ${asset.maintenanceNotes || '-'}`, 100, yPos + 20);
    }
  });

  doc.save(filename);
};
