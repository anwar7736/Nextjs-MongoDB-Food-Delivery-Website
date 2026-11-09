"use client";

import { useEffect, useRef } from "react";

const formattingOptions = [
  { command: "bold", label: "Bold", icon: <strong>B</strong> },
  { command: "italic", label: "Italic", icon: <em>I</em> },
  { command: "underline", label: "Underline", icon: <u>U</u> },
  { command: "insertUnorderedList", label: "Bulleted list", icon: "• List" },
  { command: "insertOrderedList", label: "Numbered list", icon: "1. List" },
];

export default function RichTextEditor({ value = "", onChange, id = "description" }) {
  const editorRef = useRef(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value) editor.innerHTML = value;
  }, [value]);

  const format = (command) => {
    editorRef.current?.focus();
    if (command === "createLink") {
      const url = window.prompt("Enter a link URL");
      if (!url) return;
      document.execCommand(command, false, url);
    } else {
      document.execCommand(command, false);
    }
    onChange(editorRef.current?.innerHTML || "");
  };

  return (
    <div className="rich-text-editor">
      <div className="rich-text-toolbar" role="toolbar" aria-label="Description formatting">
        {formattingOptions.map(({ command, label, icon }) => (
          <button
            key={command}
            type="button"
            aria-label={label}
            title={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => format(command)}
          >
            {icon}
          </button>
        ))}
        <button
          type="button"
          aria-label="Insert link"
          title="Insert link"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => format("createLink")}
        >
          Link
        </button>
      </div>
      <div
        ref={editorRef}
        id={id}
        className="rich-text-content"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Food description"
        data-placeholder="Describe the ingredients, flavor, or serving size"
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
      />
      <span className="rich-text-hint">Use the toolbar to format your description.</span>
    </div>
  );
}
