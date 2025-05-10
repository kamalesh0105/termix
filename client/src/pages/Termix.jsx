// Terminal.js
import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

const Termix = () => {
  const terminalContainerRef = useRef(null);

  useEffect(() => {
    const term = new Terminal({
      rows: 20,
      cols: 80,
      cursorBlink: true,
    });

    // Attach xterm to the DOM
    term.open(terminalContainerRef.current);

    // Add the fit addon
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Fit the terminal to the container size
    fitAddon.fit();

    // Resize when the window is resized
    window.addEventListener("resize", () => fitAddon.fit());

    // Optional: you can write something to the terminal
    term.writeln("Welcome to xterm.js in React!");

    return () => {
      term.dispose();
      window.removeEventListener("resize", () => fitAddon.fit());
    };
  }, []);

  return (
    <div
      ref={terminalContainerRef}
      style={{ width: "100%", height: "400px" }}
    />
  );
};

export default Termix;
