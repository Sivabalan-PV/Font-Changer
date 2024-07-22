import React, { useState, useEffect } from "react";
import axios from "axios";
import "./TextEditor.css";

interface FontData {
  [key: string]: {
    [weight: string]: string;
  };
}

const TextEditor: React.FC = () => {
  const [fonts, setFonts] = useState<FontData>({});
  const [selectFon, selectFont] = useState<string>("ABeeZee");
  const [selectVar, selectVarient] = useState<string>("400");
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [text, setText] = useState<string>(
    localStorage.getItem("text") || "Type the contents"
  );

  useEffect(() => {
    axios.get("/fonts.json").then((response) => {
      setFonts(response.data);

      const savedFont = localStorage.getItem("fontFamily") || "ABeeZee";
      const savedVariant = localStorage.getItem("fontVariant") || "400";
      const savedItalic = localStorage.getItem("isItalic") === "true";

      // Validating font
      if (!response.data[savedFont]) {
        selectFont("ABeeZee");
      } else {
        selectFont(savedFont);
      }

      // Validating Variant
      const validVariants = Object.keys(response.data[savedFont] || {});
      const isVariantValid = validVariants.includes(savedVariant);
      if (!isVariantValid) {
        selectVarient("400");
      } else {
        selectVarient(savedVariant);
      }

      setIsItalic(savedItalic);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem("text", text);
    localStorage.setItem("fontFamily", selectFon);
    localStorage.setItem("fontVariant", selectVar);
    localStorage.setItem("isItalic", isItalic.toString());
  }, [text, selectFon, selectVar, isItalic]);

  const handleFontChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newFont = event.target.value;
    const currentWeight = parseInt(selectVar.replace("italic", ""));
    const closestVariant = findClosestVariant(newFont, currentWeight, isItalic);

    // Validating font family
    if (fonts[newFont]) {
      selectFont(newFont);
      selectVarient(closestVariant);
    } else {
      // Revert to default if invalid
      selectFont("ABeeZee");
      selectVarient("400");
    }
  };

  const handleVariantChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newVariant = event.target.value;

    // Validate and set new variant
    if (fonts[selectFon] && fonts[selectFon][newVariant]) {
      selectVarient(newVariant);
    } else {
      // Revert to default if invalid
      selectVarient("400");
    }
  };

  const handleItalicToggle = () => {
    setIsItalic(!isItalic);
  };

  const handleReset = () => {
    setText("Type the contents");
    selectFont("ABeeZee");
    selectVarient("400");
    setIsItalic(false);
  };

  const handleSave = () => {
    localStorage.setItem("text", text);
    localStorage.setItem("fontFamily", selectFon);
    localStorage.setItem("fontVariant", selectVar);
    localStorage.setItem("isItalic", isItalic.toString());
  };

  const findClosestVariant = (
    font: string,
    weight: number,
    isItalic: boolean
  ) => {
    const variants = Object.keys(fonts[font]);
    let closestVariant = variants[0];
    let closestDifference = Infinity;

    for (const variant of variants) {
      const variantWeight = parseInt(variant.replace("italic", ""));
      const difference = Math.abs(variantWeight - weight);

      if (isItalic && variant.includes("italic")) {
        if (difference < closestDifference) {
          closestVariant = variant;
          closestDifference = difference;
        }
      } else if (!isItalic && !variant.includes("italic")) {
        if (difference < closestDifference) {
          closestVariant = variant;
          closestDifference = difference;
        }
      }
    }

    return closestVariant;
  };

  const fontUrl = fonts[selectFon]?.[selectVar];
  if (fontUrl) {
    const fontFace = new FontFace(selectFon, `url(${fontUrl})`);
    fontFace.load().then((loadedFont) => {
      document.fonts.add(loadedFont);
    });
  }

  return (
    <div className="editor-container">
      <div className="controls">
        <label htmlFor="font-family-selector">Font Family</label>
        <select
          id="font-family-selector"
          value={selectFon}
          onChange={handleFontChange}
        >
          {Object.keys(fonts).map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
        <label htmlFor="font-variant-selector">Variant</label>
        <select
          id="font-variant-selector"
          value={selectVar}
          onChange={handleVariantChange}
        >
          {fonts[selectFon] &&
            Object.keys(fonts[selectFon]).map((variant) => (
              <option key={variant} value={variant}>
                {variant}
              </option>
            ))}
        </select>
        <button
          id="italic-toggle"
          onClick={handleItalicToggle}
          disabled={!fonts[selectFon]?.[selectVar + "italic"]}
        >
          Italic
        </button>
      </div>
      <textarea
        style={{
          fontFamily: selectFon,
          fontWeight: selectVar.includes("italic")
            ? selectVar.replace("italic", "")
            : selectVar,
          fontStyle: isItalic ? "italic" : "normal",
        }}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="buttons">
        <button id="reset-button" onClick={handleReset}>
          Reset
        </button>
        <button id="save-button" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
};

export default TextEditor;
