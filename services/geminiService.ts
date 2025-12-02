import { GoogleGenAI } from "@google/genai";
import { ReportConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLabReport = async (config: ReportConfig): Promise<string> => {
  const { template, guide, images } = config;

  // Prepare data image parts
  const imageParts = images.map((img) => ({
    inlineData: {
      mimeType: img.mimeType || 'image/jpeg',
      data: img.content,
    },
  }));

  // Prepare guide part (could be Text or PDF)
  let guidePart;
  if (guide?.type === 'pdf') {
     guidePart = {
       inlineData: {
         mimeType: 'application/pdf',
         data: guide.content
       }
     };
  } else {
    // Treat as text
    guidePart = {
      text: `Experiment Guide Content:\n${guide?.content || ''}`
    };
  }

  // Generate explicit list of images for the prompt to ensure the model attends to them
  const imageCount = images.length;
  const imageNames = images.map((img, i) => `Image ${i + 1}: ${img.name}`).join(", ");

  // Construct the prompt with stronger instructions for multiple images and TikZ
  const textPrompt = `
    You are an expert academic laboratory assistant. Your task is to write a complete, high-quality laboratory report in LaTeX format.
    
    **Inputs Provided:**
    1. **LaTeX Template**: A .tex file skeleton.
    2. **Experiment Guide**: The lab manual (PDF or Text). It contains the theory, procedure, and diagrams.
    3. **Data Images**: I have attached **${imageCount}** image(s) containing handwritten data. Files: [${imageNames}].

    **Instructions:**
    
    1.  **Latex Formatting & Packages**:
        -   Use the provided template.
        -   **CRITICAL**: Check if the template includes \`tikz\`, \`pgfplots\`, \`float\`, and \`booktabs\`. If not, add these to the preamble if you can, or ensure the code works with standard packages.
        -   Ensure strict tabular syntax. Use \`booktabs\` commands (\`\\toprule\`, \`\\midrule\`, \`\\bottomrule\`) for professional tables if the package is available.
        -   Output **ONLY** the raw LaTeX code. Do not use Markdown code blocks.
    
    2.  **Content Paraphrasing**:
        -   **Rewrite** the Theory and Procedure. Do not copy verbatim.
        -   Use passive voice, past tense for the Procedure (e.g., "The circuit was connected..." instead of "Connect the circuit").
    
    3.  **Data Processing (CRITICAL - MULTI-IMAGE SUPPORT)**:
        -   **You must extract data from ALL ${imageCount} provided images.** 
        -   Do not stop after the first image. The data tables often continue from one page to the next.
        -   If Image 1 has Table 1 and Image 2 has Table 2 (or more rows for Table 1), combine them intelligently.
        -   Consolidate all values into the report's data tables.
        -   Perform all calculations (averages, uncertainties, slopes) and populate the Analysis section.
    
    4.  **Handling Guide Images (TikZ vs Placeholders)**:
        -   **Schematics/Diagrams**: If the guide contains circuit diagrams, optical setups, or simple geometric figures, **redraw them using TikZ** within the LaTeX code. This is preferred over placeholders.
        -   **Complex Photos**: If the guide contains complex photos (e.g., equipment screenshots) that cannot be drawn with TikZ, insert a clear placeholder:
            \`\\begin{figure}[H] \\centering \\fbox{\\parbox{0.8\\textwidth}{\\centering \\vspace{2cm} [IMAGE PLACEHOLDER: Please insert the '${guide?.name || 'guide'}' screenshot here] \\vspace{2cm}}} \\caption{Experimental Setup} \\end{figure}\`
    
    **Template to Fill:**
    ${template}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          guidePart,     // Pass the guide
          ...imageParts, // Pass ALL data images
          { text: textPrompt }
        ]
      },
      config: {
        systemInstruction: "You are a professional academic writer. You specialize in LaTeX, TikZ, and data analysis. You are meticulous about reading all provided data pages.",
        temperature: 0.2, 
      }
    });

    return response.text || "Error: No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate report. Please check your API key and file formats.");
  }
};