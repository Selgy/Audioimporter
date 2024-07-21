import React from "react";
import ReactDOM from "react-dom/client";
import Main from "./main";

console.log("Rendering Main component...");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Main />
);
