import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateRecipePDF = (recipe) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const filename = `recipe-${recipe._id || 'external'}-${Date.now()}.pdf`;
      const filepath = path.join(__dirname, '../../uploads', filename);
      
      const writeStream = fs.createWriteStream(filepath);
      doc.pipe(writeStream);
      
      // Header branding
      const logoPath = path.join(__dirname, '../logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 40, { width: 36 });
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#ea580c').text('FlavourHub', 95, 42);
        doc.fontSize(9).font('Helvetica').fillColor('#6b7280').text('Your Recipe Community Platform', 95, 62);
        
        // Horizontal separator line
        doc.moveTo(50, 85).lineTo(562, 85).strokeColor('#e5e7eb').lineWidth(1).stroke();
        doc.y = 105;
      } else {
        doc.y = 50;
      }
      
      // Fetch or locate recipe image if available
      let imageBuffer = null;
      let localImagePath = null;
      
      if (recipe.images && recipe.images.length > 0) {
        const imgPath = recipe.images[0];
        if (imgPath) {
          if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
            try {
              const res = await fetch(imgPath);
              if (res.ok) {
                const ab = await res.arrayBuffer();
                imageBuffer = Buffer.from(ab);
              }
            } catch (err) {
              console.error('Failed to fetch external recipe image for PDF', err);
            }
          } else {
            const fullLocalPath = path.join(__dirname, '../../uploads', imgPath);
            if (fs.existsSync(fullLocalPath)) {
              localImagePath = fullLocalPath;
            }
          }
        }
      }
      
      const hasImage = !!(imageBuffer || localImagePath);
      const textWidth = hasImage ? 300 : 512;
      const startY = doc.y;
      
      // Title
      doc.fontSize(22).font('Helvetica-Bold').fillColor('#111827').text(recipe.title, 50, startY, { width: textWidth });
      
      // Description
      if (recipe.description) {
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica-Oblique').fillColor('#4b5563').text(recipe.description, { width: textWidth });
      }
      
      // Metadata
      doc.moveDown(0.8);
      doc.fontSize(10).font('Helvetica').fillColor('#6b7280');
      let metadata = [];
      if (recipe.prepTime) metadata.push(`Prep: ${recipe.prepTime} min`);
      if (recipe.cookTime) metadata.push(`Cook: ${recipe.cookTime} min`);
      if (recipe.servings) metadata.push(`Serves: ${recipe.servings}`);
      if (recipe.cuisine) metadata.push(`Cuisine: ${recipe.cuisine}`);
      doc.text(metadata.join('  •  '), { width: textWidth });
      
      // Render recipe image on the right if available
      if (hasImage) {
        try {
          doc.image(imageBuffer || localImagePath, 370, startY, { fit: [192, 130], align: 'center', valign: 'center' });
          // Draw image border
          doc.rect(370, startY, 192, 130).strokeColor('#e5e7eb').lineWidth(1).stroke();
        } catch (err) {
          console.error('Failed to render recipe image in PDF', err);
        }
      }
      
      // Determine bottom coordinate of the intro section
      const textEndY = doc.y;
      const imageEndY = hasImage ? (startY + 130) : 0;
      doc.y = Math.max(textEndY, imageEndY) + 25;
      
      // Divider line
      doc.moveTo(50, doc.y - 12).lineTo(562, doc.y - 12).strokeColor('#f3f4f6').lineWidth(1).stroke();
      
      // Ingredients
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#ea580c').text('Ingredients');
      doc.moveDown(0.4);
      doc.fillColor('#374151');
      recipe.ingredients.forEach(ing => {
        const qtyStr = ing.qty ? `${ing.qty} ` : '';
        const unitStr = ing.unit && ing.unit !== 'unit' ? `${ing.unit} ` : '';
        doc.fontSize(10).font('Helvetica').text(`•  ${qtyStr}${unitStr}${ing.name}`);
      });
      doc.moveDown(1.2);
      
      // Instructions
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#ea580c').text('Instructions');
      doc.moveDown(0.4);
      doc.fillColor('#374151');
      recipe.steps.forEach((step, index) => {
        doc.fontSize(10).font('Helvetica').text(`${index + 1}.  ${step}`, { indent: 15 });
        doc.moveDown(0.3);
      });
      
      // Nutrition (if available)
      if (recipe.nutrition) {
        doc.moveDown(1.0);
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#ea580c').text('Nutrition (per serving)');
        doc.moveDown(0.4);
        doc.fillColor('#374151');
        const nut = recipe.nutrition;
        doc.fontSize(10).font('Helvetica').text(`Calories: ${nut.calories || 'N/A'}`);
        doc.text(`Protein: ${nut.protein || 'N/A'}g`);
        doc.text(`Carbs: ${nut.carbs || 'N/A'}g`);
        doc.text(`Fat: ${nut.fat || 'N/A'}g`);
      }
      
      doc.end();
      
      writeStream.on('finish', () => {
        resolve({ filepath, filename });
      });
      
      writeStream.on('error', reject);
      doc.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
};

