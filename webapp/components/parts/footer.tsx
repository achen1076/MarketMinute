import React from "react";
import Label from "../atoms/label.tsx";

export default function Footer() {
  return (
    <React.Fragment>
      <div className="w-full h-[10vh] flex items-center justify-center">
        <Label size="xl">
          &copy; 2025 Andrew Chen. All rights reserved. Made with React and
          Tailwind CSS.
        </Label>
      </div>
    </React.Fragment>
  );
}
