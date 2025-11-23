import * as React from "react";
import Slider from "@mui/material/Slider";

export default function PriceSlider({ min, max, value, onChange }) {
    const safeValue = [
        Number(value[0]) || min,
        Number(value[1]) || max,
    ];

    return (
        <div style={{ width: "100%", padding: "10px 0" }}>
            <Slider
                value={safeValue}
                min={min}
                max={max}
                onChange={(e, newVal) => onChange(newVal)}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `₹${v}`}
                sx={{
                    color: "#16a34a", // Green-600
                    height: 6,
                    "& .MuiSlider-thumb": {
                        height: 18,
                        width: 18,
                        backgroundColor: "#fff",
                        border: "2px solid #16a34a", // Green-600
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    },
                    "& .MuiSlider-track": {
                        border: "none",
                    },
                    "& .MuiSlider-rail": {
                        opacity: 0.5,
                        backgroundColor: "#e2e8f0",
                    },
                }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                <span className="text-xs font-bold text-slate-500">₹{safeValue[0]}</span>
                <span className="text-xs font-bold text-slate-500">₹{safeValue[1]}</span>
            </div>
        </div>
    );
}